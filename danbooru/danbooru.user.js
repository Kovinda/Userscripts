// ==UserScript==
// @name         Danbooru Enhancer & Animated Backgrounds
// @namespace    http://tampermonkey.net/
// @version      2026.05.16.0002
// @description  Auto rating:safe, limit slider, and animated wallpapers with a DaisyUI settings panel. Individual transparent UI elements for manual theming.
// @author       You
// @match        *://danbooru.donmai.us/*
// @require      https://cdn.jsdelivr.net/npm/node-vibrant@latest/dist/vibrant.min.js
// @require      https://cdn.jsdelivr.net/gh/Kovinda/Userscripts@main/common/color-utils.js
// @require      https://cdn.jsdelivr.net/gh/Kovinda/Userscripts@main/common/vibrant-loader.js
// @require      https://cdn.jsdelivr.net/gh/Kovinda/Userscripts@main/common/animations.js
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

    const rgbToHex = SharedUI.rgbToHex;
    const getTextColor = SharedUI.getTextColor;
    const darkenRgb = SharedUI.darkenRgb;
    let menuGlassMode = null;

    const parseCssRgb = SharedUI.parseCssRgb;

    const setMenuGlassVars = (mode) => {
        if (menuGlassMode === mode) return;
        menuGlassMode = mode;
        const root = document.documentElement;

        if (mode === 'dark') {
            root.style.setProperty('--db-menu-glass-bg', 'rgba(10, 10, 10, 0.5)');
            root.style.setProperty('--db-menu-glass-border', 'rgba(255, 255, 255, 0.08)');
            root.style.setProperty('--db-menu-glass-shadow', '0 10px 22px rgba(0, 0, 0, 0.35)');
            root.style.setProperty('--db-subnav-glass-shadow', '0 12px 24px rgba(0, 0, 0, 0.32)');
            root.style.setProperty('--db-menu-glass-filter', 'blur(12px) saturate(120%)');
        } else {
            root.style.setProperty('--db-menu-glass-bg', 'rgba(255, 255, 255, 0.28)');
            root.style.setProperty('--db-menu-glass-border', 'rgba(255, 255, 255, 0.35)');
            root.style.setProperty('--db-menu-glass-shadow', '0 10px 22px rgba(0, 0, 0, 0.14)');
            root.style.setProperty('--db-subnav-glass-shadow', '0 12px 24px rgba(0, 0, 0, 0.12)');
            root.style.setProperty('--db-menu-glass-filter', 'blur(12px) saturate(140%)');
        }
    };

    const updateMenuGlassTone = () => {
        const menu = document.querySelector('#main-menu');
        if (!menu) return;
        const textEl = menu.querySelector('.current, a, span') || menu;
        const color = window.getComputedStyle(textEl).color;
        const rgb = parseCssRgb(color);
        if (!rgb) return;

        const luminance = (rgb[0] * 0.299) + (rgb[1] * 0.587) + (rgb[2] * 0.114);
        const isLightText = luminance >= 170;
        setMenuGlassVars(isLightText ? 'dark' : 'light');
    };

    // --- 1. Background Animation Presets ---
    const ANIMATION_OPTIONS = SharedUI.ANIMATION_OPTIONS;
    const EASING_OPTIONS = SharedUI.EASING_OPTIONS;
    const animationPresets = SharedUI.animationPresets;

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

            :root {
                --db-menu-glass-bg: rgba(255, 255, 255, 0.28);
                --db-menu-glass-border: rgba(255, 255, 255, 0.35);
                --db-menu-glass-shadow: 0 10px 22px rgba(0, 0, 0, 0.14);
                --db-subnav-glass-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
                --db-menu-glass-filter: blur(12px) saturate(140%);
            }

            #top {
                background: rgba(10, 10, 10, 0.45) !important;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                padding: 10px 14px;
                box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
                backdrop-filter: blur(16px) saturate(120%);
                -webkit-backdrop-filter: blur(16px) saturate(120%);
            }

            #main-menu > .current {
                background: var(--db-menu-glass-bg) !important;
                border: 1px solid var(--db-menu-glass-border);
                border-bottom: none;
                border-radius: 14px 14px 0 0;
                padding: 6px 12px;
                margin-bottom: 0;
                box-shadow: var(--db-menu-glass-shadow);
                backdrop-filter: var(--db-menu-glass-filter);
                -webkit-backdrop-filter: var(--db-menu-glass-filter);
                position: relative;
                z-index: 2;
            }

            #subnav-menu {
                background: var(--db-menu-glass-bg) !important;
                border: 1px solid var(--db-menu-glass-border);
                border-top: none;
                border-radius: 0 0 14px 14px;
                padding: 8px 12px;
                margin-top: 0;
                box-shadow: var(--db-subnav-glass-shadow);
                backdrop-filter: var(--db-menu-glass-filter);
                -webkit-backdrop-filter: var(--db-menu-glass-filter);
            }

            #search-box-form {
                display: flex;
                align-items: stretch;
                width: 100%;
                max-width: 100%;
                border-radius: 999px;
                overflow: hidden;
                background: rgba(255, 255, 255, 0.28) !important;
                border: 1px solid rgba(255, 255, 255, 0.35);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
                backdrop-filter: blur(12px) saturate(140%);
                -webkit-backdrop-filter: blur(12px) saturate(140%);
                box-sizing: border-box;
            }

            #search-box-form input,
            #search-box-form input[type="text"],
            #search-box-form input[type="search"] {
                flex: 1 1 auto;
                min-width: 0;
                border: none;
                background: transparent !important;
                border-radius: 0;
                padding: 8px 12px;
                color: #111;
                box-shadow: none;
                margin: 0;
            }

            #search-box-form input::placeholder {
                color: rgba(17, 17, 17, 0.6);
            }

            #search-box-submit {
                border: none;
                border-left: 1px solid rgba(255, 255, 255, 0.35);
                background: transparent !important;
                padding: 8px 12px;
                color: #111;
                box-shadow: none;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            #search-box-submit .search-icon,
            #search-box-submit svg {
                color: #111;
            }

            #ui-id-2.ui-autocomplete,
            .ui-autocomplete.ui-menu {
                background: rgba(255, 255, 255, 0.32) !important;
                border: 1px solid rgba(255, 255, 255, 0.35);
                border-radius: 14px;
                padding: 6px;
                box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
                backdrop-filter: blur(14px) saturate(140%);
                -webkit-backdrop-filter: blur(14px) saturate(140%);
                overflow: hidden;
            }

            .ui-autocomplete .ui-menu-item {
                border-radius: 10px;
                margin: 2px 0;
                overflow: hidden;
            }

            .ui-autocomplete .ui-menu-item-wrapper {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 10px;
                color: #111;
            }

            .ui-autocomplete .ui-menu-item-wrapper:hover,
            .ui-autocomplete .ui-menu-item-wrapper.ui-state-active,
            .ui-autocomplete .ui-menu-item-wrapper.ui-state-focus {
                background: rgba(255, 255, 255, 0.45);
            }

            .ui-autocomplete .ui-menu-item-wrapper .post-count {
                color: rgba(17, 17, 17, 0.7);
                font-weight: 600;
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
        setTimeout(updateMenuGlassTone, 0);
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
        setTimeout(updateMenuGlassTone, 0);
    };

    const extractPaletteFromDataUrl = (dataUrl) => {
        SharedUI.extractPalette(dataUrl).then((paletteObj) => {
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
        setTimeout(updateMenuGlassTone, 0);
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