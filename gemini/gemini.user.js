// ==UserScript==
// @name         Gemini Styles - Animation Templates + Quote + Color System
// @namespace    http://tampermonkey.net/
// @version      2026.05.17.0008
// @description  Animated wallpaper templates, settings panel, greeting blur-in, quote replacement, and palette-driven theming
// @author       Kovinda
// @match        *://gemini.google.com/*
// @require      https://cdn.jsdelivr.net/npm/node-vibrant@latest/dist/vibrant.min.js
// @require      https://cdn.jsdelivr.net/gh/Kovinda/Userscripts@main/common/color-utils.js
// @require      https://cdn.jsdelivr.net/gh/Kovinda/Userscripts@main/common/vibrant-loader.js
// @require      https://cdn.jsdelivr.net/gh/Kovinda/Userscripts@main/common/animations.js
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      127.0.0.1
// @connect      localhost
// @connect      api.quotable.io
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const BACKGROUND_IMAGE_URL = `http://127.0.0.1:8190/ActiveBackground.jpg?rand=${Math.random()}`;
    const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.4)';
    const TARGET_PROMPT_TEXT = 'Where should we start?';
    const PREHIDE_STYLE_ID = 'tm-prehide-style';

    const DEFAULT_SETTINGS = {
        animation: 'sweepDown',
        duration: '1.5',
        easing: 'ease-out',
        accentMode: true
    };

    function safeGetValue(key, fallback) {
        try {
            return typeof GM_getValue === 'function' ? GM_getValue(key, fallback) : fallback;
        } catch (_err) {
            return fallback;
        }
    }

    function safeSetValue(key, value) {
        try {
            if (typeof GM_setValue === 'function') GM_setValue(key, value);
        } catch (_err) {
            // Ignore storage failures to keep runtime behavior functional.
        }
    }

    let settings = Object.assign({}, DEFAULT_SETTINGS, safeGetValue('bgSettings', {}));

    const ANIMATION_OPTIONS = SharedUI.ANIMATION_OPTIONS;
    const EASING_OPTIONS = SharedUI.EASING_OPTIONS;
    const animationPresets = SharedUI.animationPresets;
    const getTextColor = SharedUI.getTextColor;
    const parseCssRgb = SharedUI.parseCssRgb;

    let glassMode = null;

    const setGlassVars = (mode) => {
        if (glassMode === mode) return;
        glassMode = mode;
        const root = document.documentElement;

        if (mode === 'dark') {
            root.style.setProperty('--tm-glass-bg', 'rgba(10, 10, 10, 0.5)');
            root.style.setProperty('--tm-glass-strong-bg', 'rgba(0, 0, 0, 0.6)');
            root.style.setProperty('--tm-glass-header-bg', 'rgba(10, 10, 10, 0.45)');
            root.style.setProperty('--tm-glass-border', 'rgba(255, 255, 255, 0.08)');
            root.style.setProperty('--tm-glass-shadow', '0 10px 22px rgba(0, 0, 0, 0.35)');
            root.style.setProperty('--tm-glass-filter', 'blur(16px) saturate(120%)');
        } else {
            root.style.setProperty('--tm-glass-bg', 'rgba(255, 255, 255, 0.35)');
            root.style.setProperty('--tm-glass-strong-bg', 'rgba(255, 255, 255, 0.6)');
            root.style.setProperty('--tm-glass-header-bg', 'rgba(255, 255, 255, 0.45)');
            root.style.setProperty('--tm-glass-border', 'rgba(255, 255, 255, 0.35)');
            root.style.setProperty('--tm-glass-shadow', '0 10px 22px rgba(0, 0, 0, 0.14)');
            root.style.setProperty('--tm-glass-filter', 'blur(16px) saturate(140%)');
        }
    };

    const updateGlassTone = () => {
        const sample = document.querySelector('body') || document.documentElement;
        if (!sample) return;
        const color = window.getComputedStyle(sample).color;
        const rgb = parseCssRgb(color);
        if (!rgb) return;

        const luminance = (rgb[0] * 0.299) + (rgb[1] * 0.587) + (rgb[2] * 0.114);
        const isLightText = luminance >= 170;
        setGlassVars(isLightText ? 'dark' : 'light');
    };

    let glassUpdateHandle = null;
    const scheduleGlassToneUpdate = () => {
        if (glassUpdateHandle) return;
        glassUpdateHandle = window.setTimeout(() => {
            glassUpdateHandle = null;
            updateGlassTone();
        }, 250);
    };

    function saveSettings() {
        safeSetValue('bgSettings', settings);
    }

    // =================================================================
    // ACCENT STYLES & PALETTE EXTRACTION
    // =================================================================

    let accentStyleElement = null;

    function applyAccentStyles(p, hex1, hex2, hex3, hex4, hex5, textColor1, textColor2) {
        if (accentStyleElement) {
            accentStyleElement.remove();
        }

        const accentRgb = p.colors[0].join(', ');
        const soft = p.rgba(p.colors[0], 0.18);
        const softHover = p.rgba(p.colors[0], 0.26);
        const softActive = p.rgba(p.colors[0], 0.32);
        const softAlpha = p.rgba(p.colors[0], 0.14);
        const softAlphaHover = p.rgba(p.colors[0], 0.22);
        const softAlphaActive = p.rgba(p.colors[0], 0.3);
        const outline = p.rgba(p.colors[0], 0.45);
        const outlineHover = p.rgba(p.colors[0], 0.6);
        const ghostHover = p.rgba(p.colors[0], 0.12);
        const ghostActive = p.rgba(p.colors[0], 0.2);
        const selection = p.rgba(p.colors[0], 0.35);

        const accentCSS = `
            :root {
                --tm-accent-1: ${hex1};
                --tm-accent-2: ${hex2};
                --tm-accent-3: ${hex3};
                --tm-accent-4: ${hex4};
                --tm-accent-5: ${hex5};
                --tm-accent-text: ${textColor1};
                --tm-accent-text-secondary: ${textColor2};
                --tm-accent-rgb: ${accentRgb};
                --link: ${hex1};
                --link-hover: ${hex2};
                --link-primary-text-color: ${hex1};
                --link-primary-text-color-hover: ${hex2};
                --selection: ${selection};
            }

            :root,
            [data-chat-theme] {
                --theme-submit-btn-bg: ${hex1};
                --theme-submit-btn-text: ${textColor1};
                --theme-user-selection-bg: ${selection};
                --theme-user-msg-bg: ${selection};
                --theme-user-msg-text: ${textColor1};
                --theme-entity-accent: ${hex2};
            }

            :root,
            body,
            .dark,
            .theme-host {
                --color-ring: ${hex2};
                --color-ring-primary: ${hex2};
                --color-ring-primary-soft: ${hex2};
                --color-ring-primary-solid: ${hex2};
                --color-ring-primary-outline: ${hex2};
                --color-ring-primary-ghost: ${hex2};
                --color-background-primary-solid: ${hex1};
                --color-background-primary-solid-hover: ${hex2};
                --color-background-primary-solid-active: ${hex3};
                --color-text-primary-solid: ${textColor1};
                --color-background-primary-soft: ${soft};
                --color-background-primary-soft-hover: ${softHover};
                --color-background-primary-soft-active: ${softActive};
                --color-background-primary-soft-alpha: ${softAlpha};
                --color-background-primary-soft-alpha-hover: ${softAlphaHover};
                --color-background-primary-soft-alpha-active: ${softAlphaActive};
                --color-background-primary-outline-hover: ${ghostHover};
                --color-background-primary-outline-active: ${ghostActive};
                --color-border-primary-outline: ${outline};
                --color-border-primary-outline-hover: ${outlineHover};
                --color-text-primary-outline: ${hex1};
                --color-text-primary-outline-hover: ${hex2};
                --color-background-primary-ghost-hover: ${ghostHover};
                --color-background-primary-ghost-active: ${ghostActive};
                --color-text-primary-ghost: ${hex1};
                --color-text-primary-ghost-hover: ${hex2};

                /* Global Text & Accent Colors */
                --text-primary: color-mix(in oklab, ${hex1} 20%, ${textColor1}) !important;
                --text-secondary: color-mix(in oklab, ${hex2} 35%, ${textColor1}) !important;
                --text-tertiary: color-mix(in oklab, ${hex2} 50%, ${textColor1}) !important;
                --color-text: color-mix(in oklab, ${hex1} 20%, ${textColor1}) !important;
                --color-text-primary: color-mix(in oklab, ${hex1} 20%, ${textColor1}) !important;
                --color-text-secondary: color-mix(in oklab, ${hex2} 35%, ${textColor1}) !important;
                --color-text-tertiary: color-mix(in oklab, ${hex2} 50%, ${textColor1}) !important;
                --color-text-emphasis: color-mix(in oklab, ${hex1} 30%, ${textColor1}) !important;
                --color-text-prose: color-mix(in oklab, ${hex1} 20%, ${textColor1}) !important;
                --user-message-text-color: ${textColor1} !important;
            }

            /* ===== UI TRANSPARENCY & STRIP WRAPPER BACKGROUNDS ===== */
            html, body, chat-app, modular-zero-state, .modular-zero-state-container, .blur-bg, zero-state-block-picker, .zero-state-block-container, .top-section-container, .bottom-section-container, intent-chips-block, intent-card-bar, .card-container, .scroll-container, .mat-app-background, .theme-host, [class*="theme"], intent-card {
                background: transparent !important;
                background-color: transparent !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                border: none !important;
                box-shadow: none !important;
            }

            /* Top Bar / Header */
            header[class*="gb_"] {
                background-color: var(--tm-glass-header-bg, rgba(10, 10, 10, 0.45)) !important;
                backdrop-filter: var(--tm-glass-filter, blur(16px) saturate(120%)) !important;
                -webkit-backdrop-filter: var(--tm-glass-filter, blur(16px) saturate(120%)) !important;
                border-bottom: 1px solid var(--tm-glass-border, rgba(255, 255, 255, 0.15)) !important;
                box-shadow: var(--tm-glass-shadow, 0 8px 20px rgba(0, 0, 0, 0.3)) !important;
            }
            .boqOnegoogleliteOgbOneGoogleBar, #gb, .gb_e, .gb_d,
            header[class*="gb_"] a, header[class*="gb_"] div:not([role="menu"]):not(.gb_menu),
            #gb a, #gb div:not([role="menu"]):not(.gb_menu),
            .boqOnegoogleliteOgbOneGoogleBar a, .boqOnegoogleliteOgbOneGoogleBar div:not([role="menu"]):not(.gb_menu),
            user-profile-picture {
                background: transparent !important;
                background-color: transparent !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                border: none !important;
                box-shadow: none !important;
            }

            /* Sidenav / Sidebar */
            mat-sidenav, .project-sidenav-container, .gds-sidenav-list, mat-nav-list, mat-action-list.gds-sidenav-list {
                background-color: var(--tm-glass-bg, rgba(10, 10, 10, 0.35)) !important;
                backdrop-filter: blur(16px) saturate(140%) !important;
                -webkit-backdrop-filter: blur(16px) saturate(140%) !important;
                border-right: 1px solid var(--tm-glass-border, rgba(255, 255, 255, 0.08)) !important;
            }

            /* Inner Input Wrappers Transparency */
            input-container, input-area-v2, .input-area, .text-input-field, .text-input-field-main-area, .text-input-field_textarea-wrapper, rich-textarea, rich-textarea > div, .rich-textarea-container, .ql-container, .ql-editor, .bottom-container, .input-form, .center-input-container {
                background: transparent !important;
                background-color: transparent !important;
                box-shadow: none !important;
                border: none !important;
            }

            /* Precise Single Glass Layer for the Input Composer Bar */
            fieldset.input-area-container, .input-area-container, .initial-input-area-container, .chat-input-container, [data-test-id="chat-input-container"] {
                background-color: var(--tm-glass-input-bg, rgba(20, 20, 20, 0.45)) !important;
                backdrop-filter: blur(20px) saturate(140%) !important;
                -webkit-backdrop-filter: blur(20px) saturate(140%) !important;
                border: 1px solid var(--tm-glass-border, rgba(255, 255, 255, 0.2)) !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
                border-radius: 28px !important;
            }

            /* Greeting & Zero State Typography Glow */
            greeting .greeting-title,
            assistant-messages-primary h1,
            [data-test-id="greeting-title"],
            [data-test-id="message"] {
                background: linear-gradient(135deg, ${hex1}, ${hex2}) !important;
                -webkit-background-clip: text !important;
                -webkit-text-fill-color: transparent !important;
                text-shadow: 0 0 30px ${soft} !important;
                font-weight: 700 !important;
            }

            /* ===== GEMINI USER MESSAGES ===== */
            user-query,
            [data-test-id="user-query"],
            [data-test-id="user-message"],
            .user-message-bubble,
            [data-message-author-role="user"],
            message-content[author="user"] {
                background-color: var(--tm-glass-strong-bg, rgba(20, 20, 20, 0.85)) !important;
                backdrop-filter: blur(16px) saturate(140%) !important;
                -webkit-backdrop-filter: blur(16px) saturate(140%) !important;
                color: ${textColor1} !important;
                border: 1px solid ${p.rgba(p.colors[0], 0.3)} !important;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25) !important;
                border-radius: 24px !important;
                padding: 16px 22px !important;
            }

            /* ===== GEMINI MODEL RESPONSES ===== */
            model-response,
            [data-test-id="model-response"],
            message-content[author="model"],
            [data-message-author-role="model"],
            .bot-row-container {
                background-color: var(--tm-glass-strong-bg, rgba(15, 15, 15, 0.8)) !important;
                backdrop-filter: blur(16px) saturate(120%) !important;
                -webkit-backdrop-filter: blur(16px) saturate(120%) !important;
                border: 1px solid rgba(255, 255, 255, 0.08) !important;
                border-radius: 20px !important;
                padding: 18px 24px !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4) !important;
            }

            /* Code Blocks */
            pre, code, .markdown pre, .enable-lr26-markdown-styling pre {
                background-color: var(--tm-glass-strong-bg, rgba(0, 0, 0, 0.5)) !important;
                -webkit-backdrop-filter: blur(12px) !important;
                backdrop-filter: blur(12px) !important;
                border: 1px solid var(--tm-glass-border, rgba(255, 255, 255, 0.08)) !important;
                border-radius: 20px !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
            }

            /* ===== SCROLLBARS & SCROLLER OVERLAYS ===== */
            .top-gradient-container, .top-gradient,
            .bottom-gradient-container, .bottom-gradient {
                display: none !important;
                opacity: 0 !important;
                background: transparent !important;
            }
            ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            ::-webkit-scrollbar-track {
                background: var(--tm-glass-bg, rgba(10, 10, 10, 0.2)) !important;
                border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
                background: var(--tm-glass-border, rgba(255, 255, 255, 0.25)) !important;
                backdrop-filter: blur(8px) !important;
                -webkit-backdrop-filter: blur(8px) !important;
                border-radius: 10px !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.1) !important;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: var(--tm-selection, rgba(255, 255, 255, 0.45)) !important;
            }

            /* ===== SUBMIT BUTTON ===== */
            button:has(.send-icon):not([disabled]),
            button[aria-label*="Send" i]:not([disabled]),
            button[data-test-id*="send" i]:not([disabled]),
            send-button button:not([disabled]),
            [data-test-id="send-button"]:not([disabled]),
            .send-icon {
                background: linear-gradient(135deg, ${hex1}, ${hex2}) !important;
                color: ${textColor1} !important;
                border: none !important;
                transition: all 0.3s ease;
                border-radius: 50% !important;
                box-shadow: 0 0 15px ${p.rgba(p.colors[0], 0.4)} !important;
            }
            button:has(.send-icon):not([disabled]):hover,
            button[aria-label*="Send" i]:not([disabled]):hover,
            button[data-test-id*="send" i]:not([disabled]):hover,
            send-button button:not([disabled]):hover,
            [data-test-id="send-button"]:not([disabled]):hover,
            .send-icon:hover {
                box-shadow: 0 0 20px ${p.rgba(p.colors[0], 0.6)}, 0 0 40px ${p.rgba(p.colors[1] || p.colors[0], 0.3)} !important;
                filter: brightness(1.15);
                transform: scale(1.08);
            }
            button[aria-label*="Send" i]:not([disabled]) svg,
            button[data-test-id*="send" i]:not([disabled]) svg,
            send-button button:not([disabled]) svg,
            [data-test-id="send-button"]:not([disabled]) svg,
            .send-icon svg {
                color: ${textColor1} !important;
                fill: ${textColor1} !important;
            }

            /* ===== USER PROMPT & INTENT CHIPS ===== */
            intent-card, intent-card:hover, intent-card:focus, intent-card:focus-within,
            intent-card::before, intent-card::after,
            intent-card button::before, intent-card button::after,
            button.card-zero-state::before, button.card-zero-state::after,
            .mat-mdc-focus-indicator, .mdc-elevation-overlay {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                outline: none !important;
                opacity: 0 !important;
            }
            intent-card button,
            button.card-zero-state,
            user-prompt-chip,
            .user-prompt-chip,
            .mat-mdc-standard-chip,
            intent-chip button,
            [data-test-id="intent-chip"] {
                background-color: var(--tm-glass-bg, rgba(255, 255, 255, 0.1)) !important;
                backdrop-filter: blur(16px) saturate(140%) !important;
                -webkit-backdrop-filter: blur(16px) saturate(140%) !important;
                border: 1px solid var(--tm-glass-border, rgba(255, 255, 255, 0.15)) !important;
                color: var(--text-primary, inherit) !important;
                border-radius: 100px !important;
                transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
                outline: none !important;
            }
            intent-card button:hover,
            button.card-zero-state:hover,
            user-prompt-chip:hover,
            .user-prompt-chip:hover,
            .mat-mdc-standard-chip:hover,
            intent-chip button:hover,
            [data-test-id="intent-chip"]:hover {
                border-color: ${hex1} !important;
                background-color: ${selection} !important;
                box-shadow: 0 8px 25px ${selection}, 0 0 15px ${hex1} !important;
                transform: translateY(-3px) scale(1.02) !important;
                color: var(--tm-accent-text, #fff) !important;
                outline: none !important;
                border-radius: 100px !important;
            }

            /* ===== MENUS, DIALOGS, CARDS & MODALS ===== */
            .cdk-overlay-pane .mat-mdc-menu-panel,
            .mat-mdc-menu-panel,
            .mat-mdc-card,
            .goog-modalpopup,
            .modal-dialog,
            .mat-mdc-dialog-surface,
            .cdk-dialog-container,
            .mat-bottom-sheet-container {
                background: var(--tm-glass-strong-bg, rgba(20, 20, 20, 0.85)) !important;
                background-color: var(--tm-glass-strong-bg, rgba(20, 20, 20, 0.85)) !important;
                backdrop-filter: blur(28px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
                border: 1px solid var(--tm-glass-border, rgba(255, 255, 255, 0.2)) !important;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.05) !important;
                border-radius: 24px !important;
                padding: 8px !important;
            }
            .mat-mdc-menu-content {
                background: transparent !important;
                padding: 0 !important;
            }
            a.mat-mdc-menu-item,
            button.mat-mdc-menu-item,
            div.mat-mdc-menu-item,
            .mat-mdc-menu-item,
            .mat-mdc-list-item {
                background: transparent !important;
                border-radius: 14px !important;
                margin: 4px 6px !important;
                padding: 12px 18px !important;
                transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
                display: flex !important;
                align-items: center !important;
                width: auto !important;
                box-sizing: border-box !important;
            }
            a.mat-mdc-menu-item:hover, button.mat-mdc-menu-item:hover, div.mat-mdc-menu-item:hover,
            .mat-mdc-menu-item:hover, .mat-mdc-list-item:hover,
            a.mat-mdc-menu-item:focus, button.mat-mdc-menu-item:focus, div.mat-mdc-menu-item:focus,
            .mat-mdc-menu-item:focus, .mat-mdc-list-item:focus {
                background-color: ${selection} !important;
                color: ${textColor1} !important;
                box-shadow: 0 4px 15px ${selection} !important;
                transform: translateX(4px) !important;
                border-radius: 14px !important;
            }
            .mat-mdc-menu-item .mat-ripple,
            .mat-mdc-menu-ripple,
            .mat-mdc-menu-item::before,
            .mat-mdc-menu-item::after,
            .mat-mdc-menu-item .mat-mdc-menu-item-text::before,
            .mat-mdc-menu-item .mat-mdc-menu-item-text::after {
                display: none !important;
                opacity: 0 !important;
            }

            /* ===== SELECTION & LINKS ===== */
            ::selection {
                background-color: ${selection} !important;
                color: ${textColor1} !important;
            }
            a {
                color: ${hex1} !important;
            }
            a:hover {
                color: ${hex2} !important;
                text-shadow: 0 0 8px ${soft} !important;
            }
        `;

        accentStyleElement = document.createElement('style');
        accentStyleElement.id = 'tm-accent-styles';
        accentStyleElement.textContent = accentCSS;
        document.head.appendChild(accentStyleElement);
    }

    function removeAccentStyles() {
        if (accentStyleElement) {
            accentStyleElement.remove();
            accentStyleElement = null;
        }
        const existing = document.getElementById('tm-accent-styles');
        if (existing) existing.remove();
        scheduleGlassToneUpdate();
    }

    function applyAccentFromPalette(p) {
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

        applyAccentStyles(p, hex1, hex2, hex3, hex4, hex5, textColor1, textColor2);
        scheduleGlassToneUpdate();
    }

    function extractPaletteFromDataUrl(dataUrl) {
        SharedUI.extractPalette(dataUrl).then((paletteObj) => {
            window.tmPalette = paletteObj;
            if (settings.accentMode) {
                applyAccentFromPalette(paletteObj);
            }
            if (window.tmUpdatePalettePreview) {
                window.tmUpdatePalettePreview();
            }
        }).catch((err) => {
            console.error('[Gemini Styles] node-vibrant processing failed:', err);
        });
    }

    let fetchedQuoteHtml = null;
    let quoteFetchStarted = false;
    let quoteResolved = false;
    let quoteFallbackTimer = null;
    let cachedImageDataUrl = null;
    let runtimeObserver = null;
    let fixScheduled = false;
    let backgroundApplied = false;
    let prehideReleaseTimer = null;

    function escapeHtml(value) {
        return value.replace(/[&<>"']/g, (char) => {
            if (char === '&') return '&amp;';
            if (char === '<') return '&lt;';
            if (char === '>') return '&gt;';
            if (char === '"') return '&quot;';
            return '&#39;';
        });
    }

    function formatQuoteText(text) {
        if (!text || typeof text !== 'string') return '';
        const trimmed = text.trim();
        if (!trimmed) return '';

        if (/[.?!]/.test(trimmed)) {
            return trimmed.replace(/([.?!])\s+/g, '$1<br/>');
        }

        return trimmed;
    }

    function tryApplyQuoteToPrompt() {
        if (!fetchedQuoteHtml) {
            if (!quoteResolved) {
                const pendingNodes = document.querySelectorAll('.message-text');
                pendingNodes.forEach((node) => {
                    if (node.dataset.tmQuoteInjected === '1') return;
                    const text = (node.textContent || '').trim();
                    if (text === TARGET_PROMPT_TEXT) {
                        node.classList.add('tm-quote-pending');
                    }
                });
            }
            return;
        }

        const promptNodes = document.querySelectorAll('.message-text');
        promptNodes.forEach((node) => {
            if (node.dataset.tmQuoteInjected === '1') return;

            const text = (node.textContent || '').trim();
            if (text !== TARGET_PROMPT_TEXT) return;

            node.dataset.tmQuoteInjected = '1';
            node.classList.remove('tm-quote-pending');
            node.classList.add('tm-custom-quote');
            node.innerHTML = fetchedQuoteHtml;
        });
    }

    function revealPendingPromptText() {
        const pendingNodes = document.querySelectorAll('.message-text.tm-quote-pending');
        pendingNodes.forEach((node) => node.classList.remove('tm-quote-pending'));
    }

    function fetchRandomQuote() {
        if (quoteFetchStarted) return;
        quoteFetchStarted = true;

        quoteFallbackTimer = window.setTimeout(() => {
            if (!quoteResolved) {
                quoteResolved = true;
                revealPendingPromptText();
            }
        }, 2500);

        GM_xmlhttpRequest({
            method: 'GET',
            url: 'http://api.quotable.io/random',
            onload: function(response) {
                try {
                    if (response.status !== 200 || !response.responseText) {
                        quoteResolved = true;
                        revealPendingPromptText();
                        console.log('[Gemini Styles] Quote fetch failed; keeping original prompt text.');
                        return;
                    }

                    const data = JSON.parse(response.responseText);
                    if (!data || typeof data.content !== 'string' || typeof data.author !== 'string') {
                        quoteResolved = true;
                        revealPendingPromptText();
                        console.log('[Gemini Styles] Quote payload invalid; keeping original prompt text.');
                        return;
                    }

                    const formattedContent = formatQuoteText(escapeHtml(data.content));
                    const safeAuthor = escapeHtml(data.author);

                    fetchedQuoteHtml =
                        '<span class="tm-custom-quote-text">"' + formattedContent + '"</span>' +
                        '<span class="tm-custom-quote-author">- ' + safeAuthor + '</span>';

                    quoteResolved = true;
                    if (quoteFallbackTimer) {
                        window.clearTimeout(quoteFallbackTimer);
                        quoteFallbackTimer = null;
                    }
                    tryApplyQuoteToPrompt();
                } catch (error) {
                    quoteResolved = true;
                    revealPendingPromptText();
                    console.log('[Gemini Styles] Quote parsing error; keeping original prompt text.', error);
                }
            },
            onerror: function() {
                quoteResolved = true;
                revealPendingPromptText();
                console.log('[Gemini Styles] Quote request failed; keeping original prompt text.');
            }
        });
    }

    function fetchImageAsBase64(url, callback) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            responseType: 'blob',
            onload: function(response) {
                if (response.status === 200) {
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        callback(reader.result);
                    };
                    reader.readAsDataURL(response.response);
                } else {
                    console.log('[Gemini Styles] Using existing background (wallpaper fetch failed).');
                    ensurePrehideReleased();
                }
            },
            onerror: function() {
                console.log('[Gemini Styles] Wallpaper request failed.');
                ensurePrehideReleased();
            }
        });
    }

    function injectOrUpdateStyle(styleId, css) {
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = css;
    }

    function injectPrehideStyle() {
        injectOrUpdateStyle(PREHIDE_STYLE_ID, `
            [data-test-id="greeting-title"],
            [data-test-id="message"],
            fieldset.input-area-container.is-zero-state,
            intent-chips-block intent-card-bar {
                opacity: 0 !important;
                visibility: hidden !important;
            }
        `);
    }

    function releasePrehideStyle() {
        const styleEl = document.getElementById(PREHIDE_STYLE_ID);
        if (styleEl) styleEl.remove();
    }

    function ensurePrehideReleased() {
        if (backgroundApplied) return;
        releasePrehideStyle();
    }

    function buildBackgroundCss(imageDataUrl) {
        const preset = animationPresets[settings.animation] || animationPresets.sweepDown;
        const durationSeconds = Number.parseFloat(settings.duration || DEFAULT_SETTINGS.duration) || 1.5;
        const duration = `${durationSeconds}s`;
        const easing = settings.easing || DEFAULT_SETTINGS.easing;
        const greetingDelay = (durationSeconds + 0.08).toFixed(2);
        const quoteDelay = (durationSeconds + 0.18).toFixed(2);
        const chatboxDelay = (durationSeconds + 0.48).toFixed(2);
        const chipsDelay = (durationSeconds + 0.66).toFixed(2);

        return `
            ${preset.keyframes}

            @keyframes textGlitch {
                0%, 92% { text-shadow: none; transform: translate(0); }
                93% { text-shadow: 4px 0 #ff00c1, -4px 0 #00fff9; transform: translate(2px, 0); }
                94% { text-shadow: -4px 0 #ff00c1, 4px 0 #00fff9; transform: translate(-2px, 0); }
                95% { text-shadow: none; transform: translate(0); }
                96% { text-shadow: 1px 0 #ff00c1, -1px 0 #00fff9; transform: translate(-1px, 0); }
                97% { text-shadow: -1px 0 #ff00c1, 1px 0 #00fff9; transform: translate(1px, 0); }
                100% { text-shadow: none; transform: translate(0); }
            }

            @keyframes greetingBlurIn {
                0% {
                    opacity: 0;
                    filter: blur(14px);
                    transform: translateY(10px) scale(0.985);
                }
                100% {
                    opacity: 1;
                    filter: blur(0);
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes uiFadeIn {
                0% {
                    opacity: 0;
                    transform: translateY(4px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes quoteFadeIn {
                0% {
                    opacity: 0;
                    transform: translateY(6px);
                    filter: blur(4px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                    filter: blur(0);
                }
            }

            #gemini-custom-bg {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: -1;
                pointer-events: none;
                overflow: hidden;
            }

            #gemini-bg-image {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                background-image: linear-gradient(${OVERLAY_COLOR}, ${OVERLAY_COLOR}), url('${imageDataUrl}');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                ${preset.initial}
                will-change: clip-path, transform, opacity, filter;
                backface-visibility: hidden;
                animation: bgReveal ${duration} ${easing} forwards;
            }

            [data-test-id="bard-text"].bard-text {
                position: relative;
                animation: textGlitch 2s infinite linear;
                color: #e3e3e3 !important;
            }

            .tm-custom-quote {
                display: flex !important;
                flex-direction: column;
                gap: 4px;
                width: 100%;
                max-width: min(90vw, 48rem);
                margin: 0 auto;
                padding: 0 10px;
                box-sizing: border-box;
                text-align: center;
                animation: quoteFadeIn 320ms ease-out both;
            }

            .tm-quote-pending {
                visibility: hidden !important;
            }

            .tm-custom-quote-text {
                display: block;
                font-style: italic;
                font-size: clamp(1rem, 2.2vw, 2.2rem);
                line-height: 1.25;
                white-space: normal;
                overflow-wrap: anywhere;
                color: #f3f5f8;
            }

            .tm-custom-quote-author {
                align-self: flex-end;
                font-size: clamp(0.7rem, 1.1vw, 0.95rem);
                opacity: 0.85;
                text-align: right;
            }

            [data-test-id="greeting-title"] {
                opacity: 0;
                animation: greetingBlurIn 900ms cubic-bezier(0.2, 0.75, 0.2, 1) both;
                animation-delay: ${greetingDelay}s;
                will-change: filter, transform, opacity;
            }

            [data-test-id="message"] {
                opacity: 0;
                animation: quoteFadeIn 360ms ease-out both;
                animation-delay: ${quoteDelay}s;
            }

            html { background-color: #131314 !important; }
            body { background: transparent !important; background-color: transparent !important; }

            bard-sidenav-container > bard-sidenav,
            bard-sidenav-container bard-sidenav,
            input-area-v2,
            conversation-actions > button,
            chat-window > immersive-panel {
                background-color: var(--tm-glass-bg, rgba(10, 10, 10, 0.5)) !important;
                backdrop-filter: var(--tm-glass-filter, blur(16px) saturate(120%)) !important;
                -webkit-backdrop-filter: var(--tm-glass-filter, blur(16px) saturate(120%)) !important;
                border: 1px solid var(--tm-glass-border, rgba(255, 255, 255, 0.08)) !important;
                box-shadow: var(--tm-glass-shadow, 0 10px 22px rgba(0, 0, 0, 0.35)) !important;
            }

            [data-test-id="scroll-container"] response-container,
            response-container .response-container,
            response-container .response-container-with-gpi,
            response-container .presented-response-container,
            response-container .response-container-content {
                background-color: transparent !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                border: none !important;
                box-shadow: none !important;
            }

            [data-test-id="scroll-container"].container response-container,
            [data-test-id="scroll-container"].container response-container .response-container,
            [data-test-id="scroll-container"].container response-container .response-container-with-gpi,
            [data-test-id="scroll-container"].container response-container .presented-response-container,
            [data-test-id="scroll-container"].container response-container .response-container-content,
            [data-test-id="scroll-container"].container response-container .response-container-content > .container,
            [data-test-id="scroll-container"].container response-container [class*="container"],
            [data-test-id="scroll-container"].container response-container [class*="content"],
            [data-test-id="scroll-container"].container #extended-response-markdown-content,
            [data-test-id="scroll-container"].container .markdown.markdown-main-panel {
                width: 100% !important;
                max-width: 100% !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                box-sizing: border-box !important;
            }

            [data-test-id="scroll-container"].container response-container,
            [data-test-id="scroll-container"].container #extended-response-markdown-content,
            [data-test-id="scroll-container"].container .markdown.markdown-main-panel {
                padding-left: 0 !important;
                padding-right: 0 !important;
            }

            .bottom-gradient-container,
            .top-gradient-container {
                display: none !important;
            }

            chat-window.immersives-mode,
            .content-container chat-window input-container::before {
                background: none !important;
            }

            /* Rebalance zero-state vertical layout so greeting/quote are fully visible. */
            modular-zero-state .top-section-container {
                --top-section-container-height: 292px !important;
                padding-top: 24px !important;
                box-sizing: border-box;
            }

            [data-test-id="greeting-title"] {
                margin-top: 8px !important;
            }

            [data-test-id="message"] {
                margin-top: 10px !important;
            }

            /* Keep chips slightly lower, but avoid forcing overlap with the input box. */
            modular-zero-state .bottom-section-container {
                margin-top: 10px !important;
            }

            intent-chips-block intent-card-bar {
                opacity: 0;
                transform: none !important;
                animation: uiFadeIn 260ms ease-out both;
                animation-delay: ${chipsDelay}s;
            }

            intent-chips-block .card-container {
                margin-top: 0 !important;
            }

            fieldset.input-area-container.is-zero-state {
                bottom: 39vh !important;
                transform: translateY(50%) !important;
                opacity: 0;
                animation: uiFadeIn 280ms ease-out both;
                animation-delay: ${chatboxDelay}s;
            }
        `;
    }

    function settingsPanelCss() {
        return `
            .tm-settings-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: var(--tm-glass-bg, rgba(30, 30, 30, 0.85));
                border: 1px solid var(--tm-glass-border, rgba(255,255,255,0.15));
                color: #fff;
                cursor: pointer;
                z-index: 2147483647 !important;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: var(--tm-glass-filter, blur(10px));
                transition: all 0.3s ease;
                font-size: 20px;
                transform: translateZ(0);
            }
            .tm-settings-btn:hover {
                background: var(--tm-glass-strong-bg, rgba(50, 50, 50, 0.95));
                transform: scale(1.1) rotate(30deg);
                box-shadow: 0 0 15px rgba(var(--tm-accent-rgb, 0, 255, 65), 0.3);
            }
            .tm-settings-panel {
                position: fixed;
                bottom: 75px;
                right: 20px;
                width: 300px;
                background: var(--tm-glass-bg, rgba(20, 20, 20, 0.95));
                border: 1px solid var(--tm-glass-border, rgba(255,255,255,0.1));
                border-radius: 16px;
                padding: 20px;
                z-index: 2147483647 !important;
                backdrop-filter: var(--tm-glass-filter, blur(20px));
                box-shadow: var(--tm-glass-shadow, 0 10px 40px rgba(0,0,0,0.5));
                transform: translateY(20px);
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            .tm-settings-panel.open {
                transform: translateY(0);
                opacity: 1;
                visibility: visible;
            }
            .tm-settings-panel h3 {
                margin: 0 0 16px 0;
                color: var(--tm-accent-1, #00ff41);
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .tm-settings-group {
                margin-bottom: 16px;
            }
            .tm-settings-group label {
                display: block;
                color: rgba(255,255,255,0.7);
                font-size: 12px;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .tm-settings-group select,
            .tm-settings-group input[type="range"] {
                width: 100%;
                padding: 10px 12px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                color: #fff;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .tm-settings-group select:hover,
            .tm-settings-group select:focus {
                border-color: var(--tm-accent-1, #00ff41);
                outline: none;
                background: rgba(var(--tm-accent-rgb, 0, 255, 65), 0.08);
            }
            .tm-settings-group select option {
                background: #1a1a1a;
                color: #fff;
                padding: 8px;
            }
            .tm-settings-group input[type="range"] {
                padding: 0;
                height: 6px;
                -webkit-appearance: none;
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
            }
            .tm-settings-group input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: var(--tm-accent-1, #00ff41);
                cursor: pointer;
                box-shadow: 0 0 10px rgba(var(--tm-accent-rgb, 0, 255, 65), 0.5);
            }
            .tm-range-value {
                text-align: right;
                color: var(--tm-accent-1, #00ff41);
                font-size: 12px;
                margin-top: 4px;
                font-family: monospace;
            }
            .tm-preview-btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, var(--tm-accent-1, #00ff41) 0%, var(--tm-accent-2, #00cc33) 100%);
                border: none;
                border-radius: 8px;
                color: var(--tm-accent-text, #000);
                font-weight: 600;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .tm-preview-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(var(--tm-accent-rgb, 0, 255, 65), 0.4);
            }
            .tm-settings-note {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid rgba(255,255,255,0.1);
                color: rgba(255,255,255,0.4);
                font-size: 11px;
                text-align: center;
            }
            /* Toggle Switch */
            .tm-toggle {
                position: relative;
                display: inline-block;
                width: 44px;
                height: 24px;
            }
            .tm-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .tm-toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0; left: 0; right: 0; bottom: 0;
                background-color: rgba(255,255,255,0.1);
                transition: 0.3s;
                border-radius: 24px;
            }
            .tm-toggle-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: #fff;
                transition: 0.3s;
                border-radius: 50%;
            }
            .tm-toggle input:checked + .tm-toggle-slider {
                background: linear-gradient(135deg, var(--tm-accent-1, #00ff41), var(--tm-accent-2, #00cc33));
            }
            .tm-toggle input:checked + .tm-toggle-slider:before {
                transform: translateX(20px);
            }
        `;
    }

    function applyRuntimeFixes() {
        const setImportant = (el, prop, value) => el.style.setProperty(prop, value, 'important');

        const nestedBlurLayers = document.querySelectorAll(
            '[data-test-id="scroll-container"] response-container, ' +
            'response-container .response-container, ' +
            'response-container .response-container-with-gpi, ' +
            'response-container .presented-response-container, ' +
            'response-container .response-container-content'
        );

        nestedBlurLayers.forEach((el) => {
            setImportant(el, 'background-color', 'transparent');
            setImportant(el, 'backdrop-filter', 'none');
            setImportant(el, '-webkit-backdrop-filter', 'none');
            setImportant(el, 'border', 'none');
            setImportant(el, 'box-shadow', 'none');
        });

        const widthTargets = document.querySelectorAll(
            '[data-test-id="scroll-container"].container response-container, ' +
            '[data-test-id="scroll-container"].container response-container .response-container, ' +
            '[data-test-id="scroll-container"].container response-container .response-container-with-gpi, ' +
            '[data-test-id="scroll-container"].container response-container .presented-response-container, ' +
            '[data-test-id="scroll-container"].container response-container .response-container-content, ' +
            '[data-test-id="scroll-container"].container response-container .response-container-content > .container, ' +
            '[data-test-id="scroll-container"].container response-container [class*="container"], ' +
            '[data-test-id="scroll-container"].container response-container [class*="content"], ' +
            '[data-test-id="scroll-container"].container #extended-response-markdown-content, ' +
            '[data-test-id="scroll-container"].container .markdown.markdown-main-panel'
        );

        widthTargets.forEach((el) => {
            setImportant(el, 'width', '100%');
            setImportant(el, 'max-width', '100%');
            setImportant(el, 'margin-left', '0');
            setImportant(el, 'margin-right', '0');
            setImportant(el, 'box-sizing', 'border-box');
        });

        const noPadTargets = document.querySelectorAll(
            '[data-test-id="scroll-container"].container response-container, ' +
            '[data-test-id="scroll-container"].container #extended-response-markdown-content, ' +
            '[data-test-id="scroll-container"].container .markdown.markdown-main-panel'
        );

        noPadTargets.forEach((el) => {
            setImportant(el, 'padding-left', '0');
            setImportant(el, 'padding-right', '0');
        });
    }

    function ensureRuntimeObserver() {
        if (runtimeObserver || !document.body) return;

        runtimeObserver = new MutationObserver(() => {
            if (fixScheduled) return;
            fixScheduled = true;
            requestAnimationFrame(() => {
                applyRuntimeFixes();
                tryApplyQuoteToPrompt();
                scheduleGlassToneUpdate();
                fixScheduled = false;
            });
        });

        runtimeObserver.observe(document.body, { childList: true, subtree: true });
    }

    function applyBackground(imageDataUrl) {
        if (!imageDataUrl) return;

        backgroundApplied = true;
        if (prehideReleaseTimer) {
            window.clearTimeout(prehideReleaseTimer);
            prehideReleaseTimer = null;
        }

        cachedImageDataUrl = imageDataUrl;

        injectOrUpdateStyle('custom-bg-style', buildBackgroundCss(imageDataUrl));
        releasePrehideStyle();

        const oldContainer = document.getElementById('gemini-custom-bg');
        if (oldContainer) oldContainer.remove();

        const container = document.createElement('div');
        container.id = 'gemini-custom-bg';
        container.innerHTML = '<div id="gemini-bg-image"></div>';
        document.body.appendChild(container);

        applyRuntimeFixes();
        tryApplyQuoteToPrompt();
        ensureRuntimeObserver();
        extractPaletteFromDataUrl(imageDataUrl);

        console.log(`[Gemini Styles] Applied animation template: ${settings.animation}`);
    }

    function createSettingsUI() {
        if (!document.body || document.getElementById('tm-settings-btn')) return;

        injectOrUpdateStyle('tm-settings-style', settingsPanelCss());

        const btn = document.createElement('button');
        btn.id = 'tm-settings-btn';
        btn.className = 'tm-settings-btn';
        btn.innerHTML = '⚙';
        btn.title = 'Background Settings';

        const panel = document.createElement('div');
        panel.className = 'tm-settings-panel';
        panel.innerHTML = `
            <h3>Background Animation</h3>
            <div class="tm-settings-group">
                <label>Animation Style</label>
                <select id="tm-anim-select">
                    ${ANIMATION_OPTIONS.map((opt) =>
                        `<option value="${opt.value}" ${settings.animation === opt.value ? 'selected' : ''}>${opt.label}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="tm-settings-group">
                <label>Duration</label>
                <input type="range" id="tm-duration-slider" min="0.3" max="5" step="0.1" value="${settings.duration}">
                <div class="tm-range-value" id="tm-duration-value">${settings.duration}s</div>
            </div>
            <div class="tm-settings-group">
                <label>Easing</label>
                <select id="tm-easing-select">
                    ${EASING_OPTIONS.map((opt) =>
                        `<option value="${opt.value}" ${settings.easing === opt.value ? 'selected' : ''}>${opt.label}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="tm-settings-group">
                <label>Accent Colors</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <label class="tm-toggle">
                        <input type="checkbox" id="tm-accent-toggle" ${settings.accentMode ? 'checked' : ''}>
                        <span class="tm-toggle-slider"></span>
                    </label>
                    <span style="color: rgba(255,255,255,0.6); font-size: 12px;" id="tm-accent-label">
                        ${settings.accentMode ? 'Wallpaper Palette' : 'Original Colors'}
                    </span>
                </div>
                <div id="tm-palette-preview" style="display: flex; gap: 4px; margin-top: 8px; height: 20px;"></div>
            </div>
            <button class="tm-preview-btn" id="tm-preview-btn">Preview & Apply</button>
            <div class="tm-settings-note">Settings are saved automatically</div>
        `;

        document.body.appendChild(btn);
        document.body.appendChild(panel);

        btn.addEventListener('click', () => {
            panel.classList.toggle('open');
        });

        document.addEventListener('click', (event) => {
            if (!panel.contains(event.target) && !btn.contains(event.target)) {
                panel.classList.remove('open');
            }
        });

        const animSelect = panel.querySelector('#tm-anim-select');
        const durationSlider = panel.querySelector('#tm-duration-slider');
        const durationValue = panel.querySelector('#tm-duration-value');
        const easingSelect = panel.querySelector('#tm-easing-select');
        const previewBtn = panel.querySelector('#tm-preview-btn');
        const accentToggle = panel.querySelector('#tm-accent-toggle');
        const accentLabel = panel.querySelector('#tm-accent-label');
        const palettePreview = panel.querySelector('#tm-palette-preview');

        function updatePalettePreview() {
            if (window.tmPalette && window.tmPalette.hex) {
                palettePreview.innerHTML = window.tmPalette.hex.map((color, i) =>
                    `<div style="flex:1; background:${color}; border-radius:4px; transition: transform 0.2s;" 
                         title="Color ${i+1}: ${color}"
                         onmouseover="this.style.transform='scaleY(1.5)'"
                         onmouseout="this.style.transform='scaleY(1)'"></div>`
                ).join('');
            } else {
                palettePreview.innerHTML = '<span style="color:rgba(255,255,255,0.3);font-size:11px;">No wallpaper palette detected</span>';
            }
        }
        window.tmUpdatePalettePreview = updatePalettePreview;
        updatePalettePreview();

        animSelect.addEventListener('change', (event) => {
            settings.animation = event.target.value;
            saveSettings();
        });

        durationSlider.addEventListener('input', (event) => {
            settings.duration = event.target.value;
            durationValue.textContent = `${event.target.value}s`;
            saveSettings();
        });

        easingSelect.addEventListener('change', (event) => {
            settings.easing = event.target.value;
            saveSettings();
        });

        accentToggle.addEventListener('change', (e) => {
            settings.accentMode = e.target.checked;
            accentLabel.textContent = e.target.checked ? 'Wallpaper Palette' : 'Original Colors';
            saveSettings();

            if (e.target.checked && window.tmPalette) {
                applyAccentFromPalette(window.tmPalette);
            } else {
                removeAccentStyles();
            }
        });

        previewBtn.addEventListener('click', () => {
            if (cachedImageDataUrl) {
                applyBackground(cachedImageDataUrl);
            } else {
                fetchImageAsBase64(BACKGROUND_IMAGE_URL, applyBackground);
            }
            panel.classList.remove('open');
        });
    }

    function bootstrapUi() {
        injectPrehideStyle();

        prehideReleaseTimer = window.setTimeout(() => {
            ensurePrehideReleased();
        }, 7000);

        createSettingsUI();
        ensureRuntimeObserver();
        tryApplyQuoteToPrompt();
        scheduleGlassToneUpdate();
    }

    fetchRandomQuote();
    fetchImageAsBase64(BACKGROUND_IMAGE_URL, applyBackground);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrapUi);
    } else {
        bootstrapUi();
    }
})();
