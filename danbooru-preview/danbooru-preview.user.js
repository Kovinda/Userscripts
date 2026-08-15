// ==UserScript==
// @name         Danbooru Post Preview
// @namespace    http://tampermonkey.net/
// @version      1.2.5
// @description  Alt+Click or thumbnail overlay button to preview posts inline with side navigation arrows and thumbnail rail.
// @author       You
// @match        *://danbooru.donmai.us/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // --- Constants ---
    const STORAGE_KEY_QUALITY = 'dbpreview_quality_mode';
    const STORAGE_KEY_BTN_POS = 'dbpreview_btn_position';
    const VIDEO_EXTS = new Set(['webm', 'mp4', 'zip']); // zip = ugoira (animated)
    const POST_LINK_RE = /\/posts\/(\d+)/;
    const PROCESSED_ATTR = 'data-dbpreview-btn';

    // In-memory cache for post JSON responses
    const postDataCache = new Map();

    // Button position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
    const getBtnPosition = () => GM_getValue(STORAGE_KEY_BTN_POS, 'top-right');
    const setBtnPosition = (pos) => GM_setValue(STORAGE_KEY_BTN_POS, pos);

    // Quality modes: 'large' | 'original' | 'progressive'
    const getQualityMode = () => localStorage.getItem(STORAGE_KEY_QUALITY) || 'large';
    const setQualityMode = (mode) => localStorage.setItem(STORAGE_KEY_QUALITY, mode);

    // --- Tampermonkey Menu Commands ---
    const POSITIONS = [
        { key: 'top-right', label: 'Top Right' },
        { key: 'top-left', label: 'Top Left' },
        { key: 'bottom-right', label: 'Bottom Right' },
        { key: 'bottom-left', label: 'Bottom Left' },
    ];

    function registerMenuCommands() {
        POSITIONS.forEach(({ key, label }) => {
            GM_registerMenuCommand(`Preview Button: ${label}`, () => {
                setBtnPosition(key);
                applyBtnPosition(key);
                showToast(`Preview button moved to ${label}`);
            });
        });
    }
    registerMenuCommands();

    // --- Styles ---
    const STYLES = `
        /* ===== Overlay ===== */
        .dbpreview-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.78);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            opacity: 0;
            transition: opacity 0.2s ease;
            cursor: pointer;
            user-select: none;
        }
        .dbpreview-overlay.is-visible {
            opacity: 1;
        }

        /* ===== Modal ===== */
        .dbpreview-modal {
            position: relative;
            display: flex;
            flex-direction: column;
            width: fit-content;
            max-width: min(94vw, 1280px);
            max-height: 94vh;
            background: #141424;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 14px;
            box-shadow: 0 28px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05);
            overflow: hidden;
            cursor: default;
            user-select: auto;
            transform-origin: center center;
            opacity: 0;
            transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;
        }
        .dbpreview-overlay.is-visible .dbpreview-modal {
            opacity: 1;
        }

        /* ===== Close Button ===== */
        .dbpreview-close {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 20;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.6);
            color: #fff;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.15s ease, transform 0.15s ease;
            line-height: 1;
            backdrop-filter: blur(4px);
        }
        .dbpreview-close:hover {
            background: rgba(220, 50, 50, 0.85);
            transform: scale(1.1);
        }

        /* ===== Navigation Arrows ===== */
        .dbpreview-nav-btn {
            position: absolute;
            top: calc(50% - 40px);
            transform: translateY(-50%);
            z-index: 18;
            width: 44px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: 10px;
            background: rgba(10, 10, 20, 0.55);
            color: rgba(255, 255, 255, 0.85);
            font-size: 26px;
            font-weight: 300;
            cursor: pointer;
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
            padding: 0;
            line-height: 1;
        }
        .dbpreview-nav-btn.dbpreview-prev {
            left: 10px;
        }
        .dbpreview-nav-btn.dbpreview-next {
            right: 10px;
        }
        .dbpreview-nav-btn:hover:not(.is-disabled) {
            background: rgba(110, 142, 251, 0.8);
            color: #fff;
            transform: translateY(-50%) scale(1.08);
        }
        .dbpreview-nav-btn:active:not(.is-disabled) {
            transform: translateY(-50%) scale(0.96);
        }
        .dbpreview-nav-btn.is-disabled {
            opacity: 0.18;
            cursor: not-allowed;
            pointer-events: none;
        }

        /* ===== Media Container ===== */
        .dbpreview-media-wrap {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0d0d16;
            overflow: hidden;
            max-width: min(92vw, 1278px);
            max-height: calc(94vh - 145px);
            transition: width 0.22s cubic-bezier(0.22, 1, 0.36, 1), height 0.22s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* Enlarged Thumbnail Placeholder */
        .dbpreview-placeholder {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            opacity: 1;
            transition: opacity 0.3s ease;
            pointer-events: none;
            z-index: 1;
            display: block;
        }
        .dbpreview-placeholder.is-hidden {
            opacity: 0;
        }

        /* Actual Media (video or image) */
        .dbpreview-media {
            display: none;
            width: 100%;
            height: 100%;
            max-width: min(92vw, 1278px);
            max-height: calc(94vh - 145px);
            object-fit: contain;
            border-radius: 0;
            position: relative;
            z-index: 2;
            opacity: 0;
            transition: opacity 0.25s ease;
        }
        .dbpreview-media.is-ready {
            display: block;
            opacity: 1;
        }

        /* ===== Loading Spinner ===== */
        .dbpreview-spinner {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            background: rgba(13, 13, 22, 0.45);
            backdrop-filter: blur(2px);
            transition: opacity 0.25s ease;
            z-index: 10;
        }
        .dbpreview-spinner.is-hidden {
            opacity: 0;
            pointer-events: none;
        }
        .dbpreview-spinner::after {
            content: '';
            width: 38px;
            height: 38px;
            border: 3px solid rgba(255, 255, 255, 0.15);
            border-top-color: #6e8efb;
            border-radius: 50%;
            animation: dbpreview-spin 0.7s linear infinite;
        }
        @keyframes dbpreview-spin {
            to { transform: rotate(360deg); }
        }

        /* ===== Info Bar ===== */
        .dbpreview-info {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 14px;
            background: rgba(255, 255, 255, 0.03);
            border-top: 1px solid rgba(255, 255, 255, 0.07);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            color: #b0b8c8;
            flex-wrap: wrap;
            min-height: 38px;
        }
        .dbpreview-info a {
            color: #6e8efb;
            text-decoration: none;
            transition: color 0.15s;
        }
        .dbpreview-info a:hover {
            color: #93abff;
            text-decoration: underline;
        }

        /* ===== Metadata Pills ===== */
        .dbpreview-pill {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.07);
            font-size: 12px;
            white-space: nowrap;
        }
        .dbpreview-pill-icon {
            font-size: 13px;
        }
        .dbpreview-rating {
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .dbpreview-rating[data-rating="g"] {
            color: #4ade80;
            background: rgba(74, 222, 128, 0.12);
        }
        .dbpreview-rating[data-rating="s"] {
            color: #facc15;
            background: rgba(250, 204, 21, 0.12);
        }
        .dbpreview-rating[data-rating="q"] {
            color: #fb923c;
            background: rgba(251, 146, 60, 0.12);
        }
        .dbpreview-rating[data-rating="e"] {
            color: #f87171;
            background: rgba(248, 113, 113, 0.12);
        }

        .dbpreview-spacer {
            flex: 1;
        }

        /* ===== Quality Switcher ===== */
        .dbpreview-quality-group {
            display: inline-flex;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.12);
        }
        .dbpreview-quality-btn {
            padding: 2px 8px;
            border: none;
            background: transparent;
            color: #8090a8;
            font-size: 11px;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
            font-family: inherit;
        }
        .dbpreview-quality-btn:hover {
            background: rgba(255,255,255,0.08);
        }
        .dbpreview-quality-btn.is-active {
            background: rgba(110, 142, 251, 0.25);
            color: #93abff;
            font-weight: 600;
        }

        /* ===== Open Link ===== */
        .dbpreview-open-link {
            font-weight: 500;
        }

        /* ===== Thumbnail Rail ===== */
        .dbpreview-rail {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px;
            background: rgba(0, 0, 0, 0.45);
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            overflow-x: auto;
            overflow-y: hidden;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
            min-height: 66px;
            max-height: 66px;
        }
        .dbpreview-rail::-webkit-scrollbar {
            height: 5px;
        }
        .dbpreview-rail::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
        }
        .dbpreview-rail::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.35);
        }

        .dbpreview-rail-item {
            flex: 0 0 52px;
            height: 52px;
            border-radius: 6px;
            overflow: hidden;
            cursor: pointer;
            border: 2px solid transparent;
            opacity: 0.55;
            background: #1e1e30;
            transition: opacity 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
            position: relative;
        }
        .dbpreview-rail-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
        .dbpreview-rail-item:hover {
            opacity: 0.9;
            transform: translateY(-2px);
        }
        .dbpreview-rail-item.is-active {
            opacity: 1;
            border-color: #6e8efb;
            box-shadow: 0 0 10px rgba(110, 142, 251, 0.6);
            transform: scale(1.05);
        }

        /* ===== Error State ===== */
        .dbpreview-error {
            padding: 50px 32px;
            text-align: center;
            color: #f87171;
            font-size: 14px;
        }

        /* ===== Thumbnail Preview Button on Page Grid ===== */
        article.post-preview .post-preview-link {
            position: relative !important;
            display: inline-block !important;
        }
        article.post-preview .post-preview-link > picture,
        article.post-preview .post-preview-link > img {
            display: block !important;
        }

        .dbpreview-thumb-btn {
            position: absolute;
            z-index: 10;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: 5px;
            background: rgba(0, 0, 0, 0.7);
            color: rgba(255, 255, 255, 0.95);
            font-size: 13px;
            line-height: 1;
            cursor: pointer;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.15s ease, background 0.15s ease, transform 0.1s ease;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            padding: 0;
            margin: 0;
            top: 4px;
            right: 4px;
            bottom: auto;
            left: auto;
        }
        article.post-preview:hover .dbpreview-thumb-btn,
        article.post-preview:focus-within .dbpreview-thumb-btn {
            opacity: 1;
            pointer-events: auto;
        }
        .dbpreview-thumb-btn:hover {
            background: rgba(110, 142, 251, 0.9);
            color: #fff;
            transform: scale(1.1);
        }
        .dbpreview-thumb-btn:active {
            transform: scale(0.95);
        }

        /* Position variants */
        :root[data-dbpreview-pos="top-right"] .dbpreview-thumb-btn {
            top: 4px; right: 4px; bottom: auto; left: auto;
        }
        :root[data-dbpreview-pos="top-left"] .dbpreview-thumb-btn {
            top: 4px; left: 4px; bottom: auto; right: auto;
        }
        :root[data-dbpreview-pos="bottom-right"] .dbpreview-thumb-btn {
            bottom: 4px; right: 4px; top: auto; left: auto;
        }
        :root[data-dbpreview-pos="bottom-left"] .dbpreview-thumb-btn {
            bottom: 4px; left: 4px; top: auto; right: auto;
        }

        /* ===== Toast ===== */
        .dbpreview-toast {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(12px);
            z-index: 100000;
            padding: 8px 20px;
            border-radius: 8px;
            background: rgba(25, 25, 45, 0.95);
            border: 1px solid rgba(255,255,255,0.12);
            color: #d0d8e8;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            backdrop-filter: blur(8px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            opacity: 0;
            transition: opacity 0.25s ease, transform 0.25s ease;
            pointer-events: none;
        }
        .dbpreview-toast.is-visible {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    `;

    // Inject styles once
    const styleEl = document.createElement('style');
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);

    // Apply button position
    function applyBtnPosition(pos) {
        document.documentElement.setAttribute('data-dbpreview-pos', pos);
    }
    applyBtnPosition(getBtnPosition());

    // --- Toast Notification ---
    let toastTimeout = null;
    function showToast(msg) {
        const existing = document.querySelector('.dbpreview-toast');
        if (existing) existing.remove();
        clearTimeout(toastTimeout);

        const toast = document.createElement('div');
        toast.className = 'dbpreview-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        toast.offsetHeight; // reflow
        toast.classList.add('is-visible');

        toastTimeout = setTimeout(() => {
            toast.classList.remove('is-visible');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // --- Global State ---
    let currentOverlay = null;
    let currentModal = null;
    let currentPostId = null;
    let activeFetchAbort = null;

    // --- Helpers ---
    const RATING_LABELS = { g: 'General', s: 'Sensitive', q: 'Questionable', e: 'Explicit' };

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatArtist(artistStr) {
        if (!artistStr || !artistStr.trim()) return null;
        return artistStr.split(' ').map(a =>
            `<a href="/posts?tags=${encodeURIComponent(a)}" target="_blank" title="Search posts by ${escapeHtml(a)}">${escapeHtml(a.replace(/_/g, ' '))}</a>`
        ).join(', ');
    }

    function getMediaUrl(post, mode) {
        if (mode === 'original') return post.file_url;
        return post.large_file_url || post.file_url;
    }

    function isVideo(post) {
        return VIDEO_EXTS.has(post.file_ext);
    }

    /** Extract all post items present in the current DOM gallery */
    function getPagePosts() {
        const articles = document.querySelectorAll('article.post-preview[data-id]');
        const posts = [];
        articles.forEach(art => {
            const id = parseInt(art.dataset.id, 10);
            if (!id || isNaN(id)) return;
            const img = art.querySelector('img.post-preview-image') || art.querySelector('img');
            let thumbUrl = '';
            if (img) {
                thumbUrl = img.src || img.getAttribute('data-src') || '';
            }
            posts.push({ id, thumbUrl, element: art });
        });
        return posts;
    }

    // --- Fetch Post Data with In-Memory Cache ---
    async function fetchPostData(postId) {
        if (postDataCache.has(postId)) {
            return postDataCache.get(postId);
        }
        const resp = await fetch(`/posts/${postId}.json`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        postDataCache.set(postId, data);
        return data;
    }

    // --- Relative Navigation (Next / Prev) ---
    function navigateRelative(delta) {
        if (!currentPostId) return;
        const pagePosts = getPagePosts();
        if (pagePosts.length === 0) return;

        const currentIndex = pagePosts.findIndex(p => p.id === currentPostId);
        if (currentIndex === -1) {
            // Not found in current page list, load first or last
            if (delta > 0 && pagePosts.length > 0) {
                fetchAndShowPreview(pagePosts[0].id);
            }
            return;
        }

        const targetIndex = currentIndex + delta;
        if (targetIndex >= 0 && targetIndex < pagePosts.length) {
            fetchAndShowPreview(pagePosts[targetIndex].id);
        }
    }

    // --- Update / Render Thumbnail Rail ---
    function renderThumbnailRail(railEl, targetPostId) {
        const pagePosts = getPagePosts();
        railEl.innerHTML = '';

        if (pagePosts.length === 0) {
            railEl.style.display = 'none';
            return;
        }
        railEl.style.display = 'flex';

        pagePosts.forEach(postItem => {
            const itemEl = document.createElement('div');
            itemEl.className = 'dbpreview-rail-item' + (postItem.id === targetPostId ? ' is-active' : '');
            itemEl.dataset.postId = postItem.id;
            itemEl.title = `Post #${postItem.id}`;

            if (postItem.thumbUrl) {
                const img = document.createElement('img');
                img.src = postItem.thumbUrl;
                img.alt = `#${postItem.id}`;
                img.loading = 'lazy';
                itemEl.appendChild(img);
            }

            itemEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentPostId !== postItem.id) {
                    fetchAndShowPreview(postItem.id);
                }
            });

            railEl.appendChild(itemEl);

            if (postItem.id === targetPostId) {
                setTimeout(() => {
                    itemEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }, 50);
            }
        });
    }

    // --- Update Rail Active State in place ---
    function updateRailActive(targetPostId) {
        if (!currentModal) return;
        const rail = currentModal.querySelector('.dbpreview-rail');
        if (!rail) return;

        const items = rail.querySelectorAll('.dbpreview-rail-item');
        items.forEach(item => {
            const id = parseInt(item.dataset.postId, 10);
            const isActive = id === targetPostId;
            item.classList.toggle('is-active', isActive);
            if (isActive) {
                item.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        });
    }

    // --- Update Navigation Buttons in place ---
    function updateNavButtons(targetPostId) {
        if (!currentModal) return;
        const prevBtn = currentModal.querySelector('.dbpreview-prev');
        const nextBtn = currentModal.querySelector('.dbpreview-next');
        if (!prevBtn || !nextBtn) return;

        const pagePosts = getPagePosts();
        const index = pagePosts.findIndex(p => p.id === targetPostId);

        if (index === -1) {
            prevBtn.classList.add('is-disabled');
            nextBtn.classList.add('is-disabled');
        } else {
            prevBtn.classList.toggle('is-disabled', index <= 0);
            nextBtn.classList.toggle('is-disabled', index >= pagePosts.length - 1);
        }
    }

    // --- Build Full Modal Shell ---
    function createModalShell() {
        const overlay = document.createElement('div');
        overlay.className = 'dbpreview-overlay';

        const modal = document.createElement('div');
        modal.className = 'dbpreview-modal';
        overlay.appendChild(modal);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'dbpreview-close';
        closeBtn.innerHTML = '✕';
        closeBtn.title = 'Close (Esc)';
        closeBtn.type = 'button';
        modal.appendChild(closeBtn);

        // Navigation Arrows
        const prevBtn = document.createElement('button');
        prevBtn.className = 'dbpreview-nav-btn dbpreview-prev';
        prevBtn.innerHTML = '‹';
        prevBtn.title = 'Previous Post (Left Arrow / ‹)';
        prevBtn.type = 'button';
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateRelative(-1);
        });
        modal.appendChild(prevBtn);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'dbpreview-nav-btn dbpreview-next';
        nextBtn.innerHTML = '›';
        nextBtn.title = 'Next Post (Right Arrow / ›)';
        nextBtn.type = 'button';
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateRelative(1);
        });
        modal.appendChild(nextBtn);

        // Media Wrap
        const mediaWrap = document.createElement('div');
        mediaWrap.className = 'dbpreview-media-wrap';
        modal.appendChild(mediaWrap);

        // Spinner
        const spinner = document.createElement('div');
        spinner.className = 'dbpreview-spinner';
        mediaWrap.appendChild(spinner);

        // Info Bar
        const info = document.createElement('div');
        info.className = 'dbpreview-info';
        modal.appendChild(info);

        // Thumbnail Rail
        const rail = document.createElement('div');
        rail.className = 'dbpreview-rail';
        modal.appendChild(rail);

        // Event wiring
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closePreview();
        });
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closePreview();
        });
        modal.addEventListener('click', (e) => e.stopPropagation());

        return { overlay, modal };
    }

    /** Calculate target width and height fitting within the viewport preserving aspect ratio */
    function calculateFittedSize(origW, origH) {
        if (!origW || !origH) return { width: 480, height: 360 };
        const maxW = Math.min(window.innerWidth * 0.92, 1278);
        const maxH = Math.max(200, window.innerHeight * 0.94 - 145);
        const fitRatio = Math.min(maxW / origW, maxH / origH);
        return {
            width: Math.max(160, Math.round(origW * fitRatio)),
            height: Math.max(160, Math.round(origH * fitRatio))
        };
    }

    // --- Update Modal Content for a given post ---
    function fillModalContent(modal, post, fallbackThumb) {
        const mode = getQualityMode();
        const mediaUrl = getMediaUrl(post, mode);
        const isVid = isVideo(post);

        const mediaWrap = modal.querySelector('.dbpreview-media-wrap');
        const spinner = modal.querySelector('.dbpreview-spinner');
        const info = modal.querySelector('.dbpreview-info');

        // Pre-size mediaWrap to exact aspect ratio and dimensions
        const rawW = post.image_width || post.media_asset?.image_width || 480;
        const rawH = post.image_height || post.media_asset?.image_height || 360;
        const { width: targetW, height: targetH } = calculateFittedSize(rawW, rawH);

        mediaWrap.style.width = targetW + 'px';
        mediaWrap.style.height = targetH + 'px';

        // Clear existing media and placeholders, keep spinner
        const oldMedia = mediaWrap.querySelectorAll('.dbpreview-media, .dbpreview-placeholder, .dbpreview-error');
        oldMedia.forEach(el => el.remove());

        // Thumbnail placeholder for instant visual preview
        const thumbUrl = post.preview_file_url || fallbackThumb || '';
        let placeholder = null;
        if (thumbUrl) {
            placeholder = document.createElement('img');
            placeholder.className = 'dbpreview-placeholder';
            placeholder.src = thumbUrl;
            placeholder.alt = '';
            mediaWrap.appendChild(placeholder);
        }

        spinner.classList.remove('is-hidden');

        // Create new media element
        let mediaEl;
        if (isVid) {
            mediaEl = document.createElement('video');
            mediaEl.className = 'dbpreview-media';
            mediaEl.style.display = 'none'; // Keep hidden until loaded to prevent native black box & double spinner
            mediaEl.autoplay = true;
            mediaEl.loop = true;
            mediaEl.muted = true; // muted allows autoplay
            mediaEl.playsInline = true;
            mediaEl.preload = 'auto';
            mediaEl.src = mediaUrl;

            let readyFired = false;
            const onReady = () => {
                if (readyFired) return;
                readyFired = true;
                mediaEl.controls = true; // Show native video controls only once buffered
                mediaEl.style.display = 'block';
                mediaEl.offsetHeight; // reflow
                mediaEl.classList.add('is-ready');
                spinner.classList.add('is-hidden');
                if (placeholder) {
                    setTimeout(() => placeholder.classList.add('is-hidden'), 250);
                }
                mediaEl.play().catch(() => {});
            };

            mediaEl.addEventListener('loadeddata', onReady, { once: true });
            mediaEl.addEventListener('canplay', onReady, { once: true });
            mediaEl.addEventListener('error', () => {
                spinner.classList.add('is-hidden');
                mediaWrap.innerHTML = '<div class="dbpreview-error">Failed to load video.</div>';
            }, { once: true });
        } else {
            mediaEl = document.createElement('img');
            mediaEl.className = 'dbpreview-media';
            mediaEl.style.display = 'none';
            mediaEl.alt = `Post #${post.id}`;
            mediaEl.src = mediaUrl;

            mediaEl.addEventListener('load', () => {
                mediaEl.style.display = 'block';
                mediaEl.offsetHeight; // reflow
                mediaEl.classList.add('is-ready');
                spinner.classList.add('is-hidden');
                if (placeholder) {
                    setTimeout(() => placeholder.classList.add('is-hidden'), 250);
                }
                if (mode === 'progressive' && post.large_file_url && post.large_file_url !== post.file_url) {
                    const fullImg = new Image();
                    fullImg.onload = () => {
                        if (currentPostId === post.id) mediaEl.src = post.file_url;
                    };
                    fullImg.src = post.file_url;
                }
            }, { once: true });
            mediaEl.addEventListener('error', () => {
                spinner.classList.add('is-hidden');
                mediaWrap.innerHTML = '<div class="dbpreview-error">Failed to load image.</div>';
            }, { once: true });
        }
        mediaWrap.appendChild(mediaEl);

        // Populate Info Bar
        info.innerHTML = '';

        // Rating pill
        const ratingPill = document.createElement('span');
        ratingPill.className = 'dbpreview-pill dbpreview-rating';
        ratingPill.dataset.rating = post.rating;
        ratingPill.textContent = RATING_LABELS[post.rating] || post.rating;
        info.appendChild(ratingPill);

        // Artist
        const artistHtml = formatArtist(post.tag_string_artist);
        if (artistHtml) {
            const artistPill = document.createElement('span');
            artistPill.className = 'dbpreview-pill';
            artistPill.innerHTML = `<span class="dbpreview-pill-icon">🎨</span> ${artistHtml}`;
            info.appendChild(artistPill);
        }

        // Score
        const scorePill = document.createElement('span');
        scorePill.className = 'dbpreview-pill';
        scorePill.innerHTML = `<span class="dbpreview-pill-icon">▲</span> ${post.score}`;
        scorePill.title = `↑${post.up_score} ↓${post.down_score}`;
        info.appendChild(scorePill);

        // Fav count
        const favPill = document.createElement('span');
        favPill.className = 'dbpreview-pill';
        favPill.innerHTML = `<span class="dbpreview-pill-icon">♥</span> ${post.fav_count}`;
        info.appendChild(favPill);

        // Spacer
        const spacer = document.createElement('span');
        spacer.className = 'dbpreview-spacer';
        info.appendChild(spacer);

        // Quality switcher
        const qualGroup = document.createElement('span');
        qualGroup.className = 'dbpreview-quality-group';
        ['large', 'original', 'progressive'].forEach(qm => {
            const btn = document.createElement('button');
            btn.className = 'dbpreview-quality-btn' + (qm === mode ? ' is-active' : '');
            btn.textContent = qm === 'progressive' ? 'prog' : qm;
            btn.title = qm === 'large' ? 'Load large version (~720p)'
                : qm === 'original' ? 'Load original full quality'
                : 'Load large first, then swap to original';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                setQualityMode(qm);
                fillModalContent(modal, post, fallbackThumb);
            });
            qualGroup.appendChild(btn);
        });
        info.appendChild(qualGroup);

        // Open link
        const openLink = document.createElement('a');
        openLink.className = 'dbpreview-open-link';
        openLink.href = `/posts/${post.id}`;
        openLink.target = '_blank';
        openLink.textContent = `Open #${post.id} →`;
        info.appendChild(openLink);
    }

    // --- Show / Close Modal ---
    function openOverlay(startRect) {
        if (currentOverlay) return;
        const { overlay, modal } = createModalShell();
        currentOverlay = overlay;
        currentModal = modal;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        // Perform FLIP zoom animation from the clicked thumbnail position
        if (startRect && startRect.width > 0 && startRect.height > 0) {
            modal.style.transition = 'none';
            overlay.offsetHeight; // Force layout to compute modal dimensions
            const targetRect = modal.getBoundingClientRect();

            if (targetRect.width > 0 && targetRect.height > 0) {
                const scaleX = startRect.width / targetRect.width;
                const scaleY = startRect.height / targetRect.height;
                const scale = Math.max(scaleX, scaleY);
                const deltaX = (startRect.left + startRect.width / 2) - (targetRect.left + targetRect.width / 2);
                const deltaY = (startRect.top + startRect.height / 2) - (targetRect.top + targetRect.height / 2);

                modal.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
                modal.style.opacity = '1';
                modal.offsetHeight; // Force layout

                requestAnimationFrame(() => {
                    modal.style.transition = 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease';
                    modal.style.transform = 'translate(0, 0) scale(1)';
                });
            }
        } else {
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        }

        overlay.classList.add('is-visible');

        // Initial rail populate
        const rail = modal.querySelector('.dbpreview-rail');
        renderThumbnailRail(rail, currentPostId);
    }

    function closePreview() {
        if (!currentOverlay) return;
        const ol = currentOverlay;
        currentOverlay = null;
        currentModal = null;
        currentPostId = null;
        ol.classList.remove('is-visible');
        document.body.style.overflow = '';
        setTimeout(() => ol.remove(), 250);
    }

    // --- Main Fetch & Show Handler ---
    async function fetchAndShowPreview(postId, triggerRect) {
        currentPostId = postId;

        const article = document.querySelector(`article.post-preview[data-id="${postId}"]`);
        const domImg = article?.querySelector('img.post-preview-image') || article?.querySelector('img');
        const fallbackThumb = domImg?.src || '';
        const startRect = triggerRect || (domImg ? domImg.getBoundingClientRect() : null);

        // Open shell if not already open
        if (!currentOverlay) {
            openOverlay(startRect);
        }

        updateNavButtons(postId);
        updateRailActive(postId);

        const mediaWrap = currentModal.querySelector('.dbpreview-media-wrap');
        const spinner = currentModal.querySelector('.dbpreview-spinner');

        // If we don't have cached data yet, show instant preliminary placeholder
        if (!postDataCache.has(postId) && fallbackThumb) {
            const oldMedia = mediaWrap.querySelectorAll('.dbpreview-media, .dbpreview-placeholder, .dbpreview-error');
            oldMedia.forEach(el => el.remove());

            const domW = domImg.naturalWidth || domImg.width || 480;
            const domH = domImg.naturalHeight || domImg.height || 360;
            const { width: initW, height: initH } = calculateFittedSize(domW, domH);
            mediaWrap.style.width = initW + 'px';
            mediaWrap.style.height = initH + 'px';

            const initPlaceholder = document.createElement('img');
            initPlaceholder.className = 'dbpreview-placeholder';
            initPlaceholder.src = fallbackThumb;
            mediaWrap.appendChild(initPlaceholder);
        }

        spinner.classList.remove('is-hidden');

        try {
            const post = await fetchPostData(postId);
            if (currentPostId !== postId) return; // Stale request check

            fillModalContent(currentModal, post, fallbackThumb);
            updateNavButtons(postId);
            updateRailActive(postId);
        } catch (err) {
            console.error('[Danbooru Preview]', err);
            if (currentPostId !== postId) return;

            spinner.classList.add('is-hidden');
            mediaWrap.innerHTML = `
                <div class="dbpreview-error">
                    Failed to load post #${postId}<br>
                    <small>${escapeHtml(err.message)}</small>
                </div>
            `;
        }
    }

    // --- Thumbnail Preview Button Injection on Grid ---
    function injectPreviewButton(article) {
        if (article.hasAttribute(PROCESSED_ATTR)) return;
        article.setAttribute(PROCESSED_ATTR, '1');

        const postId = article.dataset.id;
        if (!postId) return;

        const link = article.querySelector('a.post-preview-link') || article.querySelector('.post-preview-container') || article;
        if (!link) return;

        const btn = document.createElement('button');
        btn.className = 'dbpreview-thumb-btn';
        btn.innerHTML = '👁';
        btn.title = 'Preview (Alt+Click also works)';
        btn.type = 'button';

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const targetImg = article.querySelector('img.post-preview-image') || article.querySelector('img') || btn;
            fetchAndShowPreview(parseInt(postId, 10), targetImg.getBoundingClientRect());
        });

        btn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        link.appendChild(btn);
    }

    function scanAndInjectButtons() {
        const articles = document.querySelectorAll('article.post-preview:not([' + PROCESSED_ATTR + '])');
        articles.forEach(injectPreviewButton);
    }

    // Initial scan
    scanAndInjectButtons();

    // Observe dynamically loaded posts (infinite scroll / AJAX)
    const observer = new MutationObserver((mutations) => {
        let needsScan = false;
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches?.('article.post-preview') || node.querySelector?.('article.post-preview')) {
                        needsScan = true;
                        break;
                    }
                }
            }
            if (needsScan) break;
        }
        if (needsScan) {
            scanAndInjectButtons();
            // If modal is open, refresh the thumbnail rail
            if (currentModal && currentPostId) {
                const rail = currentModal.querySelector('.dbpreview-rail');
                if (rail) renderThumbnailRail(rail, currentPostId);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // --- Event Listeners ---

    // Alt+Click interception
    document.addEventListener('click', (e) => {
        if (!e.altKey) return;

        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href') || '';
        const match = href.match(POST_LINK_RE);
        if (!match) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const postId = parseInt(match[1], 10);
        const targetImg = link.querySelector('img.post-preview-image') || link.querySelector('img') || link;
        fetchAndShowPreview(postId, targetImg.getBoundingClientRect());
    }, true);

    // Keyboard Shortcuts: Escape, Left Arrow, Right Arrow
    // Intercepted on window during capture phase to completely block background pagination
    function handleKeyDown(e) {
        if (!currentOverlay) return;

        // Ignore if user is typing in an input/textarea/contentEditable
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            closePreview();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            navigateRelative(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            navigateRelative(1);
        }
    }

    function handleKeyUp(e) {
        if (!currentOverlay) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    console.log('[Danbooru Preview] Loaded — Alt+Click, 👁 button, Left/Right arrow keys, or Thumbnail Rail to preview.');
})();
