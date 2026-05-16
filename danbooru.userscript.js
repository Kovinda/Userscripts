// ==UserScript==
// @name         Danbooru Enhancer & Animated Backgrounds
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Auto rating:safe, limit slider, and animated wallpapers with a DaisyUI settings panel. Individual transparent UI elements for manual theming.
// @author       You
// @match        *://danbooru.donmai.us/*
// @require      https://cdn.jsdelivr.net/npm/node-vibrant@latest/dist/vibrant.min.js
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      localhost
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- 0. Constants & State Management ---
    const STORAGE_KEY_SAFE = 'danbooru_auto_safe_enabled';
    const STORAGE_KEY_LIMIT = 'danbooru_posts_limit';
    const STORAGE_KEY_ANIM = 'danbooru_bg_anim';
    const STORAGE_KEY_DUR = 'danbooru_bg_dur';
    const STORAGE_KEY_EASE = 'danbooru_bg_ease';
    const STORAGE_KEY_ACCENT = 'danbooru_accent_mode';

    const BACKGROUND_IMAGE_URL = `http://127.0.0.1:8190/ActiveBackground.jpg?rand=${Math.random()}`;
    const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.5)';

    // Initialize state
    const safeGet = (key, fallback) => localStorage.getItem(key) !== null ? localStorage.getItem(key) : fallback;
    const isSafeEnabled = safeGet(STORAGE_KEY_SAFE, 'true') === 'true';
    const postLimit = parseInt(safeGet(STORAGE_KEY_LIMIT, '20'), 10);
    const bgAnimation = safeGet(STORAGE_KEY_ANIM, 'sweepDown');
    const bgDuration = safeGet(STORAGE_KEY_DUR, '1.5');
    const bgEasing = safeGet(STORAGE_KEY_EASE, 'ease-out');
    let accentEnabled = safeGet(STORAGE_KEY_ACCENT, 'true') === 'true';

    const rgbToHex = (rgb) => "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
    const getTextColor = (rgb) => {
        const yiq = ((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000;
        return yiq >= 128 ? 'black' : 'white';
    };
    const darkenRgb = (rgb, amount) => rgb.map((c) => Math.max(0, Math.min(255, Math.round(c * (1 - amount)))));

    // --- 1. Background Animation Presets ---
    const ANIMATION_OPTIONS = [
        { value: 'sweepDown', label: 'Sweep Down' }, { value: 'sweepUp', label: 'Sweep Up' },
        { value: 'sweepLeft', label: 'Sweep Left' }, { value: 'sweepRight', label: 'Sweep Right' },
        { value: 'fadeIn', label: 'Fade In' }, { value: 'zoomIn', label: 'Zoom In' },
        { value: 'zoomOut', label: 'Zoom Out' }, { value: 'blur', label: 'Blur' },
        { value: 'diagonalTL', label: 'Diagonal TL' }, { value: 'diagonalBR', label: 'Diagonal BR' },
        { value: 'circleOut', label: 'Circle Out' }, { value: 'blinds', label: 'Blinds' },
        { value: 'rhombusReveal', label: 'Rhombus' }, { value: 'hexagonOut', label: 'Hexagon' },
        { value: 'starBurst', label: 'Star Burst' }, { value: 'pentagonOut', label: 'Pentagon' },
        { value: 'octagonOut', label: 'Octagon' }, { value: 'iris', label: 'Iris' },
        { value: 'splitHorizontal', label: 'Split H' }, { value: 'splitVertical', label: 'Split V' },
        { value: 'crossExpand', label: 'Cross' }, { value: 'spiralIn', label: 'Spiral' },
        { value: 'waveReveal', label: 'Wave' }, { value: 'triangleSweep', label: 'Triangle' },
        { value: 'lightning', label: 'Lightning' }, { value: 'shatter', label: 'Shatter' },
        { value: 'morphBlob', label: 'Morph Blob' }, { value: 'pixelate', label: 'Pixelate' },
        { value: 'vortex', label: 'Vortex' }, { value: 'glitchReveal', label: 'Glitch' },
        { value: 'curtainDrop', label: 'Curtain' }, { value: 'diamondGrid', label: 'Diamond Grid' }
    ];

    const EASING_OPTIONS = [
        { value: 'ease', label: 'Ease' }, { value: 'ease-in', label: 'Ease In' },
        { value: 'ease-out', label: 'Ease Out' }, { value: 'ease-in-out', label: 'Ease In-Out' },
        { value: 'linear', label: 'Linear' }
    ];

    const animationPresets = {
        sweepDown: { keyframes: `@keyframes bgReveal { 0% { clip-path: inset(0 0 100% 0); } 100% { clip-path: inset(0 0 0 0); } }`, initial: '' },
        sweepUp: { keyframes: `@keyframes bgReveal { 0% { clip-path: inset(100% 0 0 0); } 100% { clip-path: inset(0 0 0 0); } }`, initial: '' },
        sweepLeft: { keyframes: `@keyframes bgReveal { 0% { clip-path: inset(0 0 0 100%); } 100% { clip-path: inset(0 0 0 0); } }`, initial: '' },
        sweepRight: { keyframes: `@keyframes bgReveal { 0% { clip-path: inset(0 100% 0 0); } 100% { clip-path: inset(0 0 0 0); } }`, initial: '' },
        fadeIn: { keyframes: `@keyframes bgReveal { 0% { opacity: 0; } 100% { opacity: 1; } }`, initial: '' },
        zoomIn: { keyframes: `@keyframes bgReveal { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`, initial: '' },
        zoomOut: { keyframes: `@keyframes bgReveal { 0% { transform: scale(1.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`, initial: '' },
        blur: { keyframes: `@keyframes bgReveal { 0% { filter: blur(30px) brightness(50%); opacity: 0; } 100% { filter: blur(0px) brightness(50%); opacity: 1; } }`, initial: 'filter: blur(0px) brightness(50%);' },
        diagonalTL: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(0 0, 0 0, 0 0); } 100% { clip-path: polygon(0 0, 200% 0, 0 200%); } }`, initial: '' },
        diagonalBR: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(100% 100%, 100% 100%, 100% 100%); } 100% { clip-path: polygon(100% 100%, -100% 100%, 100% -100%); } }`, initial: '' },
        circleOut: { keyframes: `@keyframes bgReveal { 0% { clip-path: circle(0% at 50% 50%); } 100% { clip-path: circle(150% at 50% 50%); } }`, initial: '' },
        blinds: { keyframes: `@keyframes bgReveal { 0% { clip-path: inset(0 0 0 0 round 0); opacity: 0; background-size: 100% 10%; } 50% { opacity: 0.5; } 100% { clip-path: inset(0 0 0 0 round 0); opacity: 1; background-size: cover; } }`, initial: '' },
        rhombusReveal: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; } 100% { clip-path: polygon(50% -50%, 150% 50%, 50% 150%, -50% 50%); opacity: 1; } }`, initial: '' },
        hexagonOut: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; } 100% { clip-path: polygon(25% -50%, 75% -50%, 125% 50%, 75% 150%, 25% 150%, -25% 50%); opacity: 1; } }`, initial: '' },
        starBurst: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; transform: rotate(-36deg) scale(0.5); } 100% { clip-path: polygon(50% -50%, 61% 35%, 120% 35%, 72% 66%, 90% 130%, 50% 85%, 10% 130%, 28% 66%, -20% 35%, 39% 35%); opacity: 1; transform: rotate(0deg) scale(1); } }`, initial: '' },
        pentagonOut: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; } 100% { clip-path: polygon(50% -50%, 130% 38%, 100% 140%, 0% 140%, -30% 38%); opacity: 1; } }`, initial: '' },
        octagonOut: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; } 100% { clip-path: polygon(30% -20%, 70% -20%, 120% 30%, 120% 70%, 70% 120%, 30% 120%, -20% 70%, -20% 30%); opacity: 1; } }`, initial: '' },
        iris: { keyframes: `@keyframes bgReveal { 0% { clip-path: circle(0% at 50% 50%); opacity: 0; filter: brightness(50%) saturate(0); } 50% { filter: brightness(50%) saturate(0.5); } 100% { clip-path: circle(100% at 50% 50%); opacity: 1; filter: brightness(50%) saturate(1); } }`, initial: 'filter: brightness(50%);' },
        splitHorizontal: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(0 50%, 100% 50%, 100% 50%, 0 50%); opacity: 0; } 100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); opacity: 1; } }`, initial: '' },
        splitVertical: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(50% 0, 50% 100%, 50% 100%, 50% 0); opacity: 0; } 100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); opacity: 1; } }`, initial: '' },
        crossExpand: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(45% 0, 55% 0, 55% 45%, 100% 45%, 100% 55%, 55% 55%, 55% 100%, 45% 100%, 45% 55%, 0 55%, 0 45%, 45% 45%); opacity: 0; transform: scale(0.3) rotate(45deg); } 50% { transform: scale(0.8) rotate(22.5deg); } 100% { clip-path: polygon(0 0, 100% 0, 100% 0, 100% 0, 100% 100%, 100% 100%, 100% 100%, 0 100%, 0 100%, 0 100%, 0 0, 0 0); opacity: 1; transform: scale(1) rotate(0deg); } }`, initial: '' },
        spiralIn: { keyframes: `@keyframes bgReveal { 0% { transform: scale(0) rotate(-540deg); opacity: 0; filter: brightness(50%) blur(10px); } 60% { filter: brightness(50%) blur(2px); } 100% { transform: scale(1) rotate(0deg); opacity: 1; filter: brightness(50%) blur(0px); } }`, initial: 'filter: brightness(50%);' },
        waveReveal: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(0 0, 0 0, 0 25%, 0 25%, 0 50%, 0 50%, 0 75%, 0 75%, 0 100%, 0 100%); opacity: 0; } 25% { clip-path: polygon(0 0, 30% 0, 20% 25%, 35% 25%, 25% 50%, 40% 50%, 30% 75%, 45% 75%, 35% 100%, 0 100%); } 50% { clip-path: polygon(0 0, 60% 0, 50% 25%, 70% 25%, 55% 50%, 75% 50%, 60% 75%, 80% 75%, 65% 100%, 0 100%); } 100% { clip-path: polygon(0 0, 100% 0, 100% 25%, 100% 25%, 100% 50%, 100% 50%, 100% 75%, 100% 75%, 100% 100%, 0 100%); opacity: 1; } }`, initial: '' },
        triangleSweep: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(0 0, 0 0, 0 0); opacity: 0; } 100% { clip-path: polygon(-20% -20%, 140% -20%, 140% 140%); opacity: 1; } }`, initial: '' },
        lightning: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(45% 0, 55% 0, 55% 0, 45% 0); opacity: 0; } 20% { clip-path: polygon(45% 0, 55% 0, 60% 25%, 40% 30%); opacity: 0.3; } 40% { clip-path: polygon(45% 0, 55% 0, 65% 25%, 55% 50%, 35% 45%, 40% 30%); opacity: 0.5; } 60% { clip-path: polygon(40% 0, 60% 0, 70% 25%, 60% 50%, 75% 75%, 25% 70%, 35% 45%, 30% 25%); opacity: 0.7; } 100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); opacity: 1; } }`, initial: '' },
        shatter: { keyframes: `@keyframes bgReveal { 0% { opacity: 0; transform: scale(1.2); filter: brightness(50%) contrast(150%) saturate(0); } 15% { opacity: 0.3; filter: brightness(50%) contrast(130%) saturate(0.3); } 30% { opacity: 0.5; transform: scale(1.1); filter: brightness(50%) contrast(120%) saturate(0.5); } 50% { transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); filter: brightness(50%) contrast(100%) saturate(1); } }`, initial: 'filter: brightness(50%);' },
        morphBlob: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; } 25% { clip-path: polygon(40% 10%, 70% 5%, 90% 40%, 85% 70%, 60% 95%, 30% 90%, 5% 60%, 15% 30%); opacity: 0.4; } 50% { clip-path: polygon(20% 0%, 85% 5%, 100% 35%, 95% 80%, 70% 100%, 15% 95%, -5% 65%, 5% 20%); opacity: 0.7; } 75% { clip-path: polygon(5% -10%, 95% 0%, 105% 45%, 100% 90%, 80% 105%, 10% 100%, -10% 70%, 0% 15%); opacity: 0.9; } 100% { clip-path: polygon(0% 0%, 100% 0%, 100% 50%, 100% 100%, 50% 100%, 0% 100%, 0% 50%, 0% 0%); opacity: 1; } }`, initial: '' },
        pixelate: { keyframes: `@keyframes bgReveal { 0% { opacity: 0; filter: brightness(50%) blur(15px); transform: scale(1.1); } 25% { opacity: 0.3; filter: brightness(50%) blur(10px); } 50% { opacity: 0.6; filter: brightness(50%) blur(5px); transform: scale(1.05); } 75% { opacity: 0.85; filter: brightness(50%) blur(2px); } 100% { opacity: 1; filter: brightness(50%) blur(0); transform: scale(1); } }`, initial: 'filter: brightness(50%);' },
        vortex: { keyframes: `@keyframes bgReveal { 0% { clip-path: circle(0% at 50% 50%); transform: scale(0.3) rotate(-720deg); opacity: 0; filter: brightness(50%) hue-rotate(-30deg); } 50% { clip-path: circle(50% at 50% 50%); transform: scale(0.8) rotate(-180deg); filter: brightness(50%) hue-rotate(-15deg); } 100% { clip-path: circle(150% at 50% 50%); transform: scale(1) rotate(0deg); opacity: 1; filter: brightness(50%) hue-rotate(0deg); } }`, initial: 'filter: brightness(50%);' },
        glitchReveal: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); opacity: 0; } 10% { clip-path: polygon(0 0, 15% 0, 15% 100%, 0 100%); opacity: 0.3; } 15% { clip-path: polygon(0 0, 15% 0, 15% 30%, 25% 30%, 25% 70%, 15% 70%, 15% 100%, 0 100%); } 25% { clip-path: polygon(0 0, 35% 0, 35% 45%, 50% 45%, 50% 55%, 35% 55%, 35% 100%, 0 100%); opacity: 0.5; } 35% { clip-path: polygon(0 0, 50% 0, 50% 20%, 65% 20%, 65% 80%, 50% 80%, 50% 100%, 0 100%); } 50% { clip-path: polygon(0 0, 70% 0, 70% 35%, 85% 35%, 85% 65%, 70% 65%, 70% 100%, 0 100%); opacity: 0.7; } 65% { clip-path: polygon(0 0, 85% 0, 85% 25%, 95% 25%, 95% 75%, 85% 75%, 85% 100%, 0 100%); } 80% { clip-path: polygon(0 0, 95% 0, 95% 10%, 100% 10%, 100% 90%, 95% 90%, 95% 100%, 0 100%); opacity: 0.9; } 100% { clip-path: polygon(0 0, 100% 0, 100% 0, 100% 0, 100% 100%, 100% 100%, 100% 100%, 0 100%); opacity: 1; } }`, initial: '' },
        curtainDrop: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(0 0, 100% 0, 100% 0, 90% 0, 80% 0, 70% 0, 60% 0, 50% 0, 40% 0, 30% 0, 20% 0, 10% 0, 0 0); opacity: 0; transform: scaleY(0.1); transform-origin: top; } 50% { clip-path: polygon(0 0, 100% 0, 100% 60%, 90% 55%, 80% 65%, 70% 50%, 60% 60%, 50% 55%, 40% 65%, 30% 50%, 20% 60%, 10% 55%, 0 65%); opacity: 0.7; transform: scaleY(0.8); } 100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 90% 100%, 80% 100%, 70% 100%, 60% 100%, 50% 100%, 40% 100%, 30% 100%, 20% 100%, 10% 100%, 0 100%); opacity: 1; transform: scaleY(1); } }`, initial: '' },
        diamondGrid: { keyframes: `@keyframes bgReveal { 0% { clip-path: polygon(50% 45%, 55% 50%, 50% 55%, 45% 50%); opacity: 0; transform: scale(0.5); } 30% { clip-path: polygon(25% 20%, 50% 0%, 75% 20%, 100% 50%, 75% 80%, 50% 100%, 25% 80%, 0% 50%); opacity: 0.5; transform: scale(0.8); } 60% { clip-path: polygon(10% 0%, 50% -25%, 90% 0%, 115% 50%, 90% 100%, 50% 125%, 10% 100%, -15% 50%); opacity: 0.8; } 100% { clip-path: polygon(0% 0%, 50% -50%, 100% 0%, 150% 50%, 100% 100%, 50% 150%, 0% 100%, -50% 50%); opacity: 1; transform: scale(1); } }`, initial: '' }
    };

    // --- 2. URL Redirection Logic (Runs instantly) ---
    const url = new URL(window.location.href);
    let modified = false;

    if (url.pathname === '/') {
        if (isSafeEnabled) {
            window.location.replace(`/posts?tags=rating:safe&z=5&limit=${postLimit}`);
            return;
        }
    }

    const appendSafeRating = (paramName) => {
        let val = url.searchParams.get(paramName) || "";
        if (!/rating:/i.test(val)) {
            val = val.trim();
            url.searchParams.set(paramName, val ? val + ' rating:safe' : 'rating:safe');
            modified = true;
        }
    };

    if (url.pathname === '/posts') {
        if (isSafeEnabled) {
            if (url.searchParams.has('tags')) appendSafeRating('tags');
            else { url.searchParams.set('tags', 'rating:safe'); modified = true; }
        }
        if (url.searchParams.get('limit') !== String(postLimit)) {
            url.searchParams.set('limit', postLimit);
            modified = true;
        }
    } else if (url.pathname.startsWith('/posts/')) {
        if (isSafeEnabled && url.searchParams.has('q')) {
            appendSafeRating('q');
        }
    }

    if (modified) {
        window.location.replace(url.toString());
        return;
    }

    // --- 3. Background Logic & Dynamic CSS ---
    const buildBackgroundCss = (imageDataUrl) => {
        const preset = animationPresets[bgAnimation] || animationPresets.sweepDown;
        return `
            ${preset.keyframes}

            /* Make default danbooru body transparent to show background underneath */
            body {
                background: transparent !important;
            }

            /* =========================================================
               MANUAL THEMING SECTION
               Customize the backgrounds/borders/backdrop-filters below
               ========================================================= */

            #page {
                background: transparent !important;
                min-height: 100vh;
            }

            #top {
                background: rgba(255, 255, 255, 0.28) !important;
                border: 1px solid rgba(255, 255, 255, 0.35);
                border-radius: 16px;
                padding: 10px 14px;
                box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
                backdrop-filter: blur(16px) saturate(140%);
                -webkit-backdrop-filter: blur(16px) saturate(140%);
            }

            #main-menu > .current {
                background: rgba(255, 255, 255, 0.28) !important;
                border: 1px solid rgba(255, 255, 255, 0.35);
                border-bottom: none;
                border-radius: 14px 14px 0 0;
                padding: 6px 12px;
                margin-bottom: 0;
                box-shadow: 0 10px 22px rgba(0, 0, 0, 0.14);
                backdrop-filter: blur(12px) saturate(140%);
                -webkit-backdrop-filter: blur(12px) saturate(140%);
                position: relative;
                z-index: 2;
            }

            #subnav-menu {
                background: rgba(255, 255, 255, 0.28) !important;
                border: 1px solid rgba(255, 255, 255, 0.35);
                border-top: none;
                border-radius: 0 0 14px 14px;
                padding: 8px 12px;
                margin-top: 0;
                box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
                backdrop-filter: blur(12px) saturate(140%);
                -webkit-backdrop-filter: blur(12px) saturate(140%);
            }

            #page-footer {
            display:none
            }
            
            #app-name-header {
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                width: 100%;
                margin: 0 auto;
                flex: 0 0 100%;
            }
            
            #content {
                background: rgba(10, 10, 10, 0.35);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 18px;
                padding: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
                backdrop-filter: blur(12px) saturate(120%);
                -webkit-backdrop-filter: blur(12px) saturate(120%);
            }

            #sidebar {
                background: transparent !important;
            }

            #sidebar > * {
                background: rgba(10, 10, 10, 0.35);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 18px;
                padding: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
                backdrop-filter: blur(12px) saturate(120%);
                -webkit-backdrop-filter: blur(12px) saturate(120%);
            }

            /* ========================================================= */

            /* Apply custom background to body::before so it animates without clipping Danbooru's UI */
            body::before {
                content: "";
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                z-index: -9999;
                background-image: linear-gradient(${OVERLAY_COLOR}, ${OVERLAY_COLOR}), url('${imageDataUrl}');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                ${preset.initial}
                will-change: clip-path, transform, opacity, filter;
                animation: bgReveal ${bgDuration}s ${bgEasing} forwards;
            }
        `;
    };

    const fetchImageAsBase64 = (fetchUrl, callback) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: fetchUrl,
            responseType: 'blob',
            onload: function(response) {
                if (response.status === 200) {
                    const reader = new FileReader();
                    reader.onloadend = () => callback(reader.result);
                    reader.readAsDataURL(response.response);
                } else {
                    console.log('[Danbooru Enhancer] Wallpaper fetch failed (Status non-200)');
                }
            },
            onerror: function() {
                console.log('[Danbooru Enhancer] Wallpaper request failed (Network error/CORS)');
            }
        });
    };

    let accentStyleElement = null;

    const applyAccentStyles = (p, hex1, hex2, hex3, hex4, hex5, textColor1, textColor2, darkTextHex) => {
        if (accentStyleElement) {
            accentStyleElement.remove();
        }

        const accentCss = `
            body,
            body[data-current-user-theme],
            body[data-current-user-theme="light"],
            body[data-current-user-theme="dark"] {
                --link-color: ${hex1};
                --link-hover-color: ${hex2};
                --focus-ring-color: ${hex2};
                --checkbox-selected-color: ${hex1};
                --toggle-switch-selected-color: ${hex1};
                --button-primary-background-color: ${hex1};
                --button-primary-hover-background-color: ${hex2};
                --button-outline-primary-color: ${hex1};
                --subnav-menu-background-color: ${p.rgba(p.colors[0], 0.18)};
                --responsive-menu-background-color: ${p.rgba(p.colors[0], 0.22)};
                --card-background-color: ${p.rgba(p.colors[0], 0.14)};
                --chip-primary-background-color: ${p.rgba(p.colors[0], 0.18)};
                --selection-background-color: ${hex2};
                --target-text-background-color: ${hex3};
                --post-upvote-color: ${hex1};
                --post-mode-menu-active-post-outline-color: ${hex1};
                --notice-info-background: ${p.rgba(p.colors[1] || p.colors[0], 0.18)};
                --notice-info-border-color: ${hex2};
                --form-input-border-color: ${p.rgba(p.colors[0], 0.35)};
            }

            #db-settings-panel {
                border: 1px solid ${p.rgba(p.colors[0], 0.35)};
                box-shadow: 0 10px 25px ${p.rgba(p.colors[0], 0.3)};
            }
            #db-settings-panel .db-header {
                color: ${hex1};
            }
            #db-settings-panel .db-select:focus,
            #db-settings-panel .db-select:hover {
                border-color: ${hex1};
            }
            #db-settings-panel .db-range::-webkit-slider-thumb {
                background: ${hex1};
            }
            #db-settings-panel .db-btn {
                background: linear-gradient(135deg, ${hex1}, ${hex2});
                color: ${textColor1};
            }
            #db-fab {
                border: 1px solid ${p.rgba(p.colors[0], 0.4)};
                box-shadow: 0 4px 10px ${p.rgba(p.colors[0], 0.25)};
            }
            #db-fab:hover {
                box-shadow: 0 0 14px ${p.rgba(p.colors[0], 0.4)};
            }

            #main-menu > .current,
            #main-menu > .current a,
            #main-menu > .current span {
                color: ${hex1};
            }

            #subnav-menu,
            #subnav-menu a,
            #subnav-menu span {
                color: ${darkTextHex};
            }
        `;

        accentStyleElement = document.createElement('style');
        accentStyleElement.id = 'db-accent-styles';
        accentStyleElement.textContent = accentCss;
        document.head.appendChild(accentStyleElement);
    };

    const removeAccentStyles = () => {
        if (accentStyleElement) {
            accentStyleElement.remove();
            accentStyleElement = null;
        }
        const existing = document.getElementById('db-accent-styles');
        if (existing) existing.remove();
    };

    const applyAccentFromPalette = (p) => {
        if (!p || !p.colors || !p.colors.length) return;

        const swatches = p.swatches || {};
        const primarySwatch = swatches.Vibrant || swatches.LightVibrant || swatches.DarkVibrant || swatches.Muted || swatches.LightMuted || swatches.DarkMuted || null;
        const secondarySwatch = swatches.Muted || swatches.LightMuted || swatches.DarkMuted || primarySwatch;

        const hex1 = p.hex[0];
        const hex2 = p.hex[1] || p.hex[0];
        const hex3 = p.hex[2] || p.hex[0];
        const hex4 = p.hex[3] || p.hex[1] || p.hex[0];
        const hex5 = p.hex[4] || p.hex[2] || p.hex[0];
        const textColor1 = primarySwatch?.titleTextColor || primarySwatch?.bodyTextColor || getTextColor(p.colors[0]);
        const textColor2 = secondarySwatch?.titleTextColor || secondarySwatch?.bodyTextColor || getTextColor(p.colors[1] || p.colors[0]);
        const darkTextHex = rgbToHex(darkenRgb(p.colors[0], 0.6));

        applyAccentStyles(p, hex1, hex2, hex3, hex4, hex5, textColor1, textColor2, darkTextHex);
    };

    const ensureVibrant = () => {
        const existing = window.Vibrant || (typeof Vibrant !== 'undefined' ? Vibrant : null);
        if (existing) return Promise.resolve(existing);

        const sources = [
            'https://unpkg.com/node-vibrant@latest/dist/vibrant.min.js',
            'https://cdn.jsdelivr.net/npm/node-vibrant@latest/dist/vibrant.min.js'
        ];

        return new Promise((resolve, reject) => {
            const loadNext = (index) => {
                if (index >= sources.length) {
                    reject(new Error('node-vibrant failed to load from all sources'));
                    return;
                }

                const script = document.createElement('script');
                script.src = sources[index];
                script.async = true;
                script.onload = () => {
                    const loaded = window.Vibrant || (typeof Vibrant !== 'undefined' ? Vibrant : null);
                    if (loaded) resolve(loaded);
                    else loadNext(index + 1);
                };
                script.onerror = () => loadNext(index + 1);
                (document.head || document.documentElement).appendChild(script);
            };

            loadNext(0);
        });
    };

    const extractPaletteFromDataUrl = (dataUrl) => {
        ensureVibrant().then((VibrantLib) => {
            return VibrantLib.from(dataUrl).getPalette();
        }).then((palette) => {
            const swatchOrder = ['Vibrant', 'LightVibrant', 'DarkVibrant', 'Muted', 'LightMuted', 'DarkMuted'];
            const swatchList = swatchOrder.map((name) => palette[name]).filter(Boolean);

            if (!swatchList.length) {
                console.warn('[Danbooru Enhancer] node-vibrant returned no swatches.');
                return;
            }

            const primarySwatch = palette.Vibrant || swatchList[0];
            const paletteObj = {
                primary: primarySwatch.rgb,
                colors: swatchList.map((swatch) => swatch.rgb),
                hex: swatchList.map((swatch) => swatch.hex),
                rgba: (rgb, alpha) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`,
                swatches: palette
            };

            window.dbPalette = paletteObj;
            console.log('[Danbooru Enhancer] Palette extracted:', paletteObj);

            if (accentEnabled) {
                applyAccentFromPalette(paletteObj);
            }

            if (window.dbUpdatePalettePreview) {
                window.dbUpdatePalettePreview();
            }
        }).catch((err) => {
            console.error('[Danbooru Enhancer] node-vibrant processing failed:', err);
        });
    };

    // --- 4. Settings Panel UI (DaisyUI style) ---
    const injectUI = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            #db-enhancer-container { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; z-index: 999999; position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; align-items: flex-end; }
            #db-settings-panel { background: #1d232a; color: #a6adbb; width: 330px; border-radius: 16px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); margin-bottom: 15px; display: none; flex-direction: column; gap: 16px; transform-origin: bottom right; transition: opacity 0.2s, transform 0.2s; max-height: 80vh; overflow-y: auto; }
            #db-settings-panel.open { display: flex; animation: popIn 0.2s ease-out forwards; }
            @keyframes popIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
            .db-header { font-size: 1.125rem; font-weight: 700; color: #fff; border-bottom: 1px solid #383f47; padding-bottom: 8px; margin: 0; }
            .db-row { display: flex; flex-direction: column; gap: 6px; }
            .db-row-header { display: flex; justify-content: space-between; align-items: center; color: #fff; font-size: 0.875rem; font-weight: 600;}

            /* Inputs */
            .db-toggle { appearance: none; width: 3rem; height: 1.5rem; background-color: #383f47; border-radius: 9999px; position: relative; cursor: pointer; transition: background-color 0.3s; }
            .db-toggle::after { content: ''; position: absolute; top: 0.125rem; left: 0.125rem; width: 1.25rem; height: 1.25rem; background-color: #fff; border-radius: 50%; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
            .db-toggle:checked { background-color: #36d399; }
            .db-toggle:checked::after { transform: translateX(1.5rem); }
            .db-range { -webkit-appearance: none; width: 100%; height: 1.5rem; background: transparent; cursor: pointer; }
            .db-range::-webkit-slider-runnable-track { width: 100%; height: 0.5rem; background: #383f47; border-radius: 9999px; }
            .db-range::-webkit-slider-thumb { -webkit-appearance: none; height: 1.25rem; width: 1.25rem; background: #fff; border-radius: 50%; margin-top: -0.375rem; box-shadow: 0 0 5px rgba(0,0,0,0.3); }
            .db-range:focus { outline: none; }
            .db-range::-webkit-slider-thumb:hover { background: #36d399; }
            .db-range-steps { display: flex; justify-content: space-between; padding: 0 0.4rem; font-size: 0.7rem; color: #a6adbb; }
            .db-select { width: 100%; padding: 8px; background: #2a323c; color: #fff; border: 1px solid #383f47; border-radius: 6px; font-size: 0.875rem; outline: none; cursor: pointer; transition: border-color 0.2s; }
            .db-select:focus, .db-select:hover { border-color: #3b82f6; }
            .db-btn { background-color: #3b82f6; color: #fff; font-weight: 600; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer; text-align: center; transition: background-color 0.2s; font-size: 0.875rem; margin-top: 5px; }
            .db-btn:hover { background-color: #2563eb; }
            .db-palette-preview { display: flex; gap: 4px; margin-top: 6px; height: 16px; }
            .db-palette-preview div { flex: 1; border-radius: 4px; border: 1px solid rgba(255,255,255,0.15); }
            .db-palette-empty { color: #a6adbb; font-size: 0.7rem; opacity: 0.8; }

            /* FAB */
            #db-fab { width: 55px; height: 55px; border-radius: 50%; background-color: #2a323c; color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); cursor: pointer; font-size: 26px; user-select: none; transition: transform 0.2s, background-color 0.2s; }
            #db-fab:hover { transform: scale(1.05); background-color: #383f47; }
        `;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.id = 'db-enhancer-container';

        const panel = document.createElement('div');
        panel.id = 'db-settings-panel';
        panel.innerHTML = `
            <h3 class="db-header">Danbooru Settings</h3>

            <div class="db-row">
                <div class="db-row-header">
                    <span>Auto Safe Rating</span>
                    <input type="checkbox" class="db-toggle" id="ui-safe-toggle" ${isSafeEnabled ? 'checked' : ''}>
                </div>
            </div>

            <div class="db-row">
                <div class="db-row-header">
                    <span>Posts per page</span>
                    <span id="ui-limit-display">${postLimit}</span>
                </div>
                <input type="range" min="20" max="200" step="20" value="${postLimit}" class="db-range" id="ui-limit-slider">
                <div class="db-range-steps">
                    <span>20</span><span>|</span><span>60</span><span>|</span><span>100</span><span>|</span><span>140</span><span>|</span><span>180</span><span>200</span>
                </div>
            </div>

            <h3 class="db-header" style="margin-top: 10px;">Background Theme</h3>

            <div class="db-row">
                <label class="db-row-header">Animation Style</label>
                <select id="ui-bg-anim" class="db-select">
                    ${ANIMATION_OPTIONS.map(o => `<option value="${o.value}" ${bgAnimation === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>
            </div>

            <div class="db-row">
                <div class="db-row-header">
                    <span>Duration</span>
                    <span id="ui-dur-display">${bgDuration}s</span>
                </div>
                <input type="range" min="0.3" max="5.0" step="0.1" value="${bgDuration}" class="db-range" id="ui-dur-slider">
            </div>

            <div class="db-row">
                <label class="db-row-header">Easing</label>
                <select id="ui-bg-ease" class="db-select">
                    ${EASING_OPTIONS.map(o => `<option value="${o.value}" ${bgEasing === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>
            </div>

            <h3 class="db-header" style="margin-top: 10px;">Color Palette</h3>
            <div class="db-row">
                <div class="db-row-header">
                    <span>Wallpaper Palette</span>
                    <input type="checkbox" class="db-toggle" id="ui-accent-toggle" ${accentEnabled ? 'checked' : ''}>
                </div>
                <div id="ui-palette-preview" class="db-palette-preview"></div>
            </div>

            <button class="db-btn" id="ui-apply-btn">Apply & Reload</button>
        `;

        const fab = document.createElement('div');
        fab.id = 'db-fab';
        fab.innerHTML = '⚙️';
        fab.title = 'Danbooru Enhancer Settings';

        container.appendChild(panel);
        container.appendChild(fab);
        document.body.appendChild(container);

        // --- Interaction Logic ---
        const uiToggle = document.getElementById('ui-safe-toggle');
        const uiLimitSlider = document.getElementById('ui-limit-slider');
        const uiLimitDisplay = document.getElementById('ui-limit-display');
        const uiAnimSelect = document.getElementById('ui-bg-anim');
        const uiDurSlider = document.getElementById('ui-dur-slider');
        const uiDurDisplay = document.getElementById('ui-dur-display');
        const uiEaseSelect = document.getElementById('ui-bg-ease');
        const uiAccentToggle = document.getElementById('ui-accent-toggle');
        const uiPalettePreview = document.getElementById('ui-palette-preview');
        const applyBtn = document.getElementById('ui-apply-btn');

        uiLimitSlider.addEventListener('input', e => uiLimitDisplay.textContent = e.target.value);
        uiDurSlider.addEventListener('input', e => uiDurDisplay.textContent = `${e.target.value}s`);
        fab.addEventListener('click', () => panel.classList.toggle('open'));

        const updatePalettePreview = () => {
            if (window.dbPalette && window.dbPalette.hex) {
                uiPalettePreview.innerHTML = window.dbPalette.hex.map((color, i) =>
                    `<div title="Color ${i + 1}: ${color}" style="background:${color};"></div>`
                ).join('');
            } else {
                uiPalettePreview.innerHTML = '<span class="db-palette-empty">Palette not ready</span>';
            }
        };
        window.dbUpdatePalettePreview = updatePalettePreview;
        updatePalettePreview();

        uiAccentToggle.addEventListener('change', e => {
            accentEnabled = e.target.checked;
            localStorage.setItem(STORAGE_KEY_ACCENT, accentEnabled.toString());

            if (accentEnabled && window.dbPalette) {
                applyAccentFromPalette(window.dbPalette);
            } else {
                removeAccentStyles();
            }
        });

        applyBtn.addEventListener('click', () => {
            const newSafeState = uiToggle.checked;
            const newLimitValue = uiLimitSlider.value;

            // Save state
            localStorage.setItem(STORAGE_KEY_SAFE, newSafeState.toString());
            localStorage.setItem(STORAGE_KEY_LIMIT, newLimitValue.toString());
            localStorage.setItem(STORAGE_KEY_ANIM, uiAnimSelect.value);
            localStorage.setItem(STORAGE_KEY_DUR, uiDurSlider.value);
            localStorage.setItem(STORAGE_KEY_EASE, uiEaseSelect.value);
            localStorage.setItem(STORAGE_KEY_ACCENT, accentEnabled.toString());

            if (newSafeState && window.location.pathname === '/') {
                window.location.href = `/posts?tags=rating:safe&z=5&limit=${newLimitValue}`;
            } else {
                window.location.reload();
            }
        });
    };

    // --- 5. Bootstrapper ---
    const initialize = () => {
        injectUI();
        // Fetch and apply animated wallpaper
        fetchImageAsBase64(BACKGROUND_IMAGE_URL, (dataUrl) => {
            const style = document.createElement('style');
            style.id = 'danbooru-bg-style';
            style.textContent = buildBackgroundCss(dataUrl);
            document.head.appendChild(style);
            extractPaletteFromDataUrl(dataUrl);
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();