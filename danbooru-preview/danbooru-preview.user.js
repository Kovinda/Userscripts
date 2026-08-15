// ==UserScript==
// @name         Danbooru Post Preview
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Alt+Click on any post link to preview images/videos inline without navigating away.
// @author       You
// @match        *://danbooru.donmai.us/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // --- Constants ---
    const STORAGE_KEY_QUALITY = 'dbpreview_quality_mode';
    const VIDEO_EXTS = new Set(['webm', 'mp4', 'zip']); // zip = ugoira (animated)
    const POST_LINK_RE = /\/posts\/(\d+)/;

    // Quality modes: 'large' | 'original' | 'progressive'
    const getQualityMode = () => localStorage.getItem(STORAGE_KEY_QUALITY) || 'large';
    const setQualityMode = (mode) => localStorage.setItem(STORAGE_KEY_QUALITY, mode);

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
            background: rgba(0, 0, 0, 0.72);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            opacity: 0;
            transition: opacity 0.2s ease;
            cursor: pointer;
        }
        .dbpreview-overlay.is-visible {
            opacity: 1;
        }

        /* ===== Modal ===== */
        .dbpreview-modal {
            position: relative;
            display: flex;
            flex-direction: column;
            max-width: min(92vw, 1200px);
            max-height: 92vh;
            background: #1a1a2e;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.04);
            overflow: hidden;
            cursor: default;
            transform: scale(0.92) translateY(12px);
            transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;
            opacity: 0;
        }
        .dbpreview-overlay.is-visible .dbpreview-modal {
            transform: scale(1) translateY(0);
            opacity: 1;
        }

        /* ===== Close Button ===== */
        .dbpreview-close {
            position: absolute;
            top: 8px;
            right: 8px;
            z-index: 10;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.55);
            color: #fff;
            font-size: 18px;
            cursor: pointer;
            transition: background 0.15s ease, transform 0.15s ease;
            line-height: 1;
            backdrop-filter: blur(4px);
        }
        .dbpreview-close:hover {
            background: rgba(220, 50, 50, 0.7);
            transform: scale(1.1);
        }

        /* ===== Media Container ===== */
        .dbpreview-media-wrap {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            min-width: 280px;
            background: #111;
            overflow: hidden;
        }
        .dbpreview-media-wrap img,
        .dbpreview-media-wrap video {
            display: block;
            max-width: min(90vw, 1198px);
            max-height: calc(92vh - 64px);
            object-fit: contain;
            border-radius: 0;
        }

        /* ===== Loading Spinner ===== */
        .dbpreview-spinner {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .dbpreview-spinner.is-hidden {
            opacity: 0;
        }
        .dbpreview-spinner::after {
            content: '';
            width: 36px;
            height: 36px;
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
            gap: 12px;
            padding: 8px 14px;
            background: rgba(255, 255, 255, 0.04);
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            color: #b0b8c8;
            flex-wrap: wrap;
            min-height: 40px;
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
            background: rgba(74, 222, 128, 0.1);
        }
        .dbpreview-rating[data-rating="s"] {
            color: #facc15;
            background: rgba(250, 204, 21, 0.1);
        }
        .dbpreview-rating[data-rating="q"] {
            color: #fb923c;
            background: rgba(251, 146, 60, 0.1);
        }
        .dbpreview-rating[data-rating="e"] {
            color: #f87171;
            background: rgba(248, 113, 113, 0.1);
        }

        .dbpreview-spacer {
            flex: 1;
        }

        /* ===== Quality Switcher ===== */
        .dbpreview-quality-group {
            display: inline-flex;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.1);
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
            background: rgba(255,255,255,0.06);
        }
        .dbpreview-quality-btn.is-active {
            background: rgba(110, 142, 251, 0.2);
            color: #93abff;
            font-weight: 600;
        }

        /* ===== Open Link ===== */
        .dbpreview-open-link {
            font-weight: 500;
        }

        /* ===== Error State ===== */
        .dbpreview-error {
            padding: 40px 32px;
            text-align: center;
            color: #f87171;
            font-size: 14px;
        }
    `;

    // Inject styles once
    const styleEl = document.createElement('style');
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);

    // --- State ---
    let currentOverlay = null;
    let currentPostId = null;

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
        // 'large' or 'progressive' start with large
        return post.large_file_url || post.file_url;
    }

    function isVideo(post) {
        return VIDEO_EXTS.has(post.file_ext);
    }

    // --- Build Modal ---
    function buildModal(post) {
        const mode = getQualityMode();
        const mediaUrl = getMediaUrl(post, mode);
        const isVid = isVideo(post);

        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'dbpreview-overlay';

        // Modal
        const modal = document.createElement('div');
        modal.className = 'dbpreview-modal';
        overlay.appendChild(modal);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'dbpreview-close';
        closeBtn.innerHTML = '✕';
        closeBtn.title = 'Close (Esc)';
        modal.appendChild(closeBtn);

        // Media wrap
        const mediaWrap = document.createElement('div');
        mediaWrap.className = 'dbpreview-media-wrap';
        modal.appendChild(mediaWrap);

        // Spinner
        const spinner = document.createElement('div');
        spinner.className = 'dbpreview-spinner';
        mediaWrap.appendChild(spinner);

        // Create media element
        let mediaEl;
        if (isVid) {
            mediaEl = document.createElement('video');
            mediaEl.controls = true;
            mediaEl.autoplay = true;
            mediaEl.loop = true;
            mediaEl.muted = true; // start muted so autoplay works
            mediaEl.playsInline = true;
            mediaEl.preload = 'auto';
            mediaEl.src = mediaUrl;
            mediaEl.addEventListener('loadeddata', () => spinner.classList.add('is-hidden'), { once: true });
            mediaEl.addEventListener('error', () => {
                spinner.classList.add('is-hidden');
                mediaWrap.innerHTML = '<div class="dbpreview-error">Failed to load video.</div>';
            }, { once: true });
        } else {
            mediaEl = document.createElement('img');
            mediaEl.alt = `Post #${post.id}`;
            mediaEl.src = mediaUrl;
            mediaEl.addEventListener('load', () => {
                spinner.classList.add('is-hidden');
                // Progressive: swap to original once large is showing
                if (mode === 'progressive' && post.large_file_url !== post.file_url) {
                    const fullImg = new Image();
                    fullImg.onload = () => { mediaEl.src = post.file_url; };
                    fullImg.src = post.file_url;
                }
            }, { once: true });
            mediaEl.addEventListener('error', () => {
                spinner.classList.add('is-hidden');
                mediaWrap.innerHTML = '<div class="dbpreview-error">Failed to load image.</div>';
            }, { once: true });
        }
        mediaWrap.appendChild(mediaEl);

        // Info bar
        const info = document.createElement('div');
        info.className = 'dbpreview-info';

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
                // Reload media with new quality
                closePreview();
                fetchAndShowPreview(post.id);
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

        modal.appendChild(info);

        // --- Event Wiring ---
        // Close on overlay click (not modal)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closePreview();
        });
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closePreview();
        });
        // Prevent modal clicks from closing
        modal.addEventListener('click', (e) => e.stopPropagation());

        return overlay;
    }

    // --- Show / Close ---
    function showPreview(overlay) {
        if (currentOverlay) closePreview();
        currentOverlay = overlay;
        document.body.appendChild(overlay);
        // Force reflow then animate in
        overlay.offsetHeight; // eslint-disable-line no-unused-expressions
        overlay.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
    }

    function closePreview() {
        if (!currentOverlay) return;
        const ol = currentOverlay;
        currentOverlay = null;
        currentPostId = null;
        ol.classList.remove('is-visible');
        document.body.style.overflow = '';
        // Remove after transition
        setTimeout(() => ol.remove(), 250);
    }

    // --- Fetch & Show ---
    async function fetchAndShowPreview(postId) {
        if (currentPostId === postId && currentOverlay) return; // already showing
        currentPostId = postId;

        // Show a loading overlay immediately
        const loadOverlay = document.createElement('div');
        loadOverlay.className = 'dbpreview-overlay';
        const loadModal = document.createElement('div');
        loadModal.className = 'dbpreview-modal';
        loadModal.innerHTML = '<div class="dbpreview-media-wrap"><div class="dbpreview-spinner"></div></div>';
        loadOverlay.appendChild(loadModal);
        loadOverlay.addEventListener('click', (e) => {
            if (e.target === loadOverlay) closePreview();
        });
        showPreview(loadOverlay);

        try {
            const resp = await fetch(`/posts/${postId}.json`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const post = await resp.json();

            // Check if we were cancelled while fetching
            if (currentPostId !== postId) return;

            // Replace loading overlay with real content
            const realOverlay = buildModal(post);
            closePreview();
            showPreview(realOverlay);
        } catch (err) {
            console.error('[Danbooru Preview]', err);
            if (currentPostId !== postId) return;

            // Show error state
            loadModal.querySelector('.dbpreview-media-wrap').innerHTML =
                `<div class="dbpreview-error">Failed to load post #${postId}<br><small>${escapeHtml(err.message)}</small></div>`;
        }
    }

    // --- Event Listeners ---

    // Alt+Click interception (uses event delegation on document)
    document.addEventListener('click', (e) => {
        if (!e.altKey) return;

        // Walk up from target to find a link
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href') || '';
        const match = href.match(POST_LINK_RE);
        if (!match) return;

        // It's a post link with Alt held — intercept!
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const postId = parseInt(match[1], 10);
        fetchAndShowPreview(postId);
    }, true); // capture phase to beat other handlers

    // Escape to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentOverlay) {
            e.preventDefault();
            closePreview();
        }
    });

    console.log('[Danbooru Preview] Loaded — Alt+Click any post link to preview.');
})();
