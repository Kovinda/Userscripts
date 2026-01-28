// ==UserScript==
// @name         ChatGPT Background Dimmer - Sweep + Glitch + Quote + ColorThief UI
// @namespace    http://tampermonkey.net/
// @version      2026.01.29.0038
// @description  Background image, transparent UI, glitch loop, smart formatted quotes, and dynamic button colorings
// @author       Kovinda
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// @match        https://chatgpt.com/c/*
// @match        https://auth.openai.com/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.2/color-thief.umd.js
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      127.0.0.1
// @connect      api.quotable.io
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/Kovinda/Userscripts/main/chatgpt.user.js
// @downloadURL  https://raw.githubusercontent.com/Kovinda/Userscripts/main/chatgpt.user.js
// ==/UserScript==

(function() {
    'use strict';

    // =================================================================
    // SETTINGS STORAGE & DEFAULTS
    // =================================================================

    const DEFAULT_SETTINGS = {
        animation: "sweepDown",
        duration: "1.5",
        easing: "ease-out",
        accentMode: true  // Toggle for accent colors from wallpaper
    };

    const ANIMATION_OPTIONS = [
        { value: "sweepDown", label: "Sweep Down", desc: "Reveals from top to bottom" },
        { value: "sweepUp", label: "Sweep Up", desc: "Reveals from bottom to top" },
        { value: "sweepLeft", label: "Sweep Left", desc: "Reveals from right to left" },
        { value: "sweepRight", label: "Sweep Right", desc: "Reveals from left to right" },
        { value: "fadeIn", label: "Fade In", desc: "Simple fade in" },
        { value: "zoomIn", label: "Zoom In", desc: "Zooms in from center" },
        { value: "zoomOut", label: "Zoom Out", desc: "Zooms out to normal size" },
        { value: "blur", label: "Blur", desc: "Starts blurry, becomes clear" },
        { value: "diagonalTL", label: "Diagonal TL", desc: "Diagonal reveal from top-left" },
        { value: "diagonalBR", label: "Diagonal BR", desc: "Diagonal reveal from bottom-right" },
        { value: "circleOut", label: "Circle Out", desc: "Circle expanding from center" },
        { value: "blinds", label: "Blinds", desc: "Venetian blinds effect" }
    ];

    const EASING_OPTIONS = [
        { value: "ease", label: "Ease" },
        { value: "ease-in", label: "Ease In" },
        { value: "ease-out", label: "Ease Out" },
        { value: "ease-in-out", label: "Ease In-Out" },
        { value: "linear", label: "Linear" }
    ];

    // Load saved settings or use defaults
    let settings = Object.assign({}, DEFAULT_SETTINGS, GM_getValue('bgSettings', {}));

    function saveSettings() {
        GM_setValue('bgSettings', settings);
    }

    // Active configuration (derived from settings)
    const BACKGROUND_ANIMATION = settings.animation;
    const ANIMATION_DURATION = settings.duration + "s";
    const ANIMATION_EASING = settings.easing;

    // =================================================================
    // PART 1: Background, Sweep & Dynamic Color Extraction
    // =================================================================

    const animationPresets = {
        sweepDown: {
            keyframes: `
                @keyframes bgReveal {
                    0% { clip-path: inset(0 0 100% 0); }
                    100% { clip-path: inset(0 0 0 0); }
                }`,
            initial: ""
        },
        sweepUp: {
            keyframes: `
                @keyframes bgReveal {
                    0% { clip-path: inset(100% 0 0 0); }
                    100% { clip-path: inset(0 0 0 0); }
                }`,
            initial: ""
        },
        sweepLeft: {
            keyframes: `
                @keyframes bgReveal {
                    0% { clip-path: inset(0 0 0 100%); }
                    100% { clip-path: inset(0 0 0 0); }
                }`,
            initial: ""
        },
        sweepRight: {
            keyframes: `
                @keyframes bgReveal {
                    0% { clip-path: inset(0 100% 0 0); }
                    100% { clip-path: inset(0 0 0 0); }
                }`,
            initial: ""
        },
        fadeIn: {
            keyframes: `
                @keyframes bgReveal {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }`,
            initial: ""
        },
        zoomIn: {
            keyframes: `
                @keyframes bgReveal {
                    0% { transform: scale(0.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }`,
            initial: ""
        },
        zoomOut: {
            keyframes: `
                @keyframes bgReveal {
                    0% { transform: scale(1.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }`,
            initial: ""
        },
        blur: {
            keyframes: `
                @keyframes bgReveal {
                    0% { filter: blur(30px) brightness(50%); opacity: 0; }
                    100% { filter: blur(0px) brightness(50%); opacity: 1; }
                }`,
            initial: "filter: blur(0px) brightness(50%);"
        },
        diagonalTL: {
            keyframes: `
                @keyframes bgReveal {
                    0% { clip-path: polygon(0 0, 0 0, 0 0); }
                    100% { clip-path: polygon(0 0, 200% 0, 0 200%); }
                }`,
            initial: ""
        },
        diagonalBR: {
            keyframes: `
                @keyframes bgReveal {
                    0% { clip-path: polygon(100% 100%, 100% 100%, 100% 100%); }
                    100% { clip-path: polygon(100% 100%, -100% 100%, 100% -100%); }
                }`,
            initial: ""
        },
        circleOut: {
            keyframes: `
                @keyframes bgReveal {
                    0% { clip-path: circle(0% at 50% 50%); }
                    100% { clip-path: circle(150% at 50% 50%); }
                }`,
            initial: ""
        },
        blinds: {
            keyframes: `
                @keyframes bgReveal {
                    0% { clip-path: inset(0 0 0 0 round 0); opacity: 0;
                         background-size: 100% 10%; }
                    50% { opacity: 0.5; }
                    100% { clip-path: inset(0 0 0 0 round 0); opacity: 1;
                           background-size: cover; }
                }`,
            initial: ""
        }
    };

    const imageUrl = `http://127.0.0.1:8190/ActiveBackground.jpg?rand=${Math.random()}`;

    GM_xmlhttpRequest({
        method: 'GET',
        url: imageUrl,
        responseType: 'blob',
        onload: function(response) {
            const reader = new FileReader();
            reader.onloadend = function() {
                const dataUrl = reader.result;
                const preset = animationPresets[BACKGROUND_ANIMATION] || animationPresets.sweepDown;

                GM_addStyle(`
                    ${preset.keyframes}
                    body::before {
                        content: "";
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        /* keep the background strictly behind UI */
                        z-index: -9999;
                        display: block;
                        background-image: url('${dataUrl}');
                        background-size: cover;
                        background-position: center;
                        width: 100%; height: 100%;
                        filter: brightness(50%);
                        ${preset.initial}
                        /* hint to browser to optimize clip-path animation */
                        will-change: clip-path, transform;
                        backface-visibility: hidden;
                        animation: bgReveal ${ANIMATION_DURATION} ${ANIMATION_EASING} forwards;
                        pointer-events: none;
                    }
                `);

                if (typeof ColorThief !== 'undefined') {
                    const img = document.createElement('img');
                    img.onload = function() {
                        try {
                            const colorThief = new ColorThief();
                            // Get full palette (up to 8 colors)
                            const palette = colorThief.getPalette(img, 6);
                            const primary = colorThief.getColor(img);
                            
                            if (palette && palette.length > 0) {
                                // Store palette globally for use elsewhere
                                window.tmPalette = {
                                    primary: primary,
                                    colors: palette,
                                    hex: palette.map(rgb => "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1)),
                                    rgba: (rgb, alpha) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
                                };
                                
                                const p = window.tmPalette;
                                const hex1 = p.hex[0]; // Primary
                                const hex2 = p.hex[1] || p.hex[0]; // Secondary
                                const hex3 = p.hex[2] || p.hex[0]; // Tertiary
                                const hex4 = p.hex[3] || p.hex[1] || p.hex[0]; // Accent 4
                                const hex5 = p.hex[4] || p.hex[2] || p.hex[0]; // Accent 5
                                
                                // Calculate text colors for each
                                const getTextColor = (rgb) => {
                                    const yiq = ((rgb[0]*299)+(rgb[1]*587)+(rgb[2]*114))/1000;
                                    return (yiq >= 128) ? 'black' : 'white';
                                };
                                const textColor1 = getTextColor(palette[0]);
                                const textColor2 = getTextColor(palette[1] || palette[0]);
                                
                                // Only apply accent styles if enabled
                                if (settings.accentMode) {
                                    applyAccentStyles(p, hex1, hex2, hex3, hex4, hex5, textColor1, textColor2);
                                }
                            }
                        } catch (e) {
                            console.error("[Tampermonkey] ColorThief processing failed:", e);
                        }
                    };
                    img.src = dataUrl;
                }
            };
            reader.readAsDataURL(response.response);
        },
        onerror: function(err) {
            console.log('Background image server not found (ignoring).');
        }
    });

    // =================================================================
    // ACCENT STYLES FUNCTION
    // =================================================================
    
    let accentStyleElement = null;
    
    function applyAccentStyles(p, hex1, hex2, hex3, hex4, hex5, textColor1, textColor2) {
        // Remove existing accent styles if any
        if (accentStyleElement) {
            accentStyleElement.remove();
        }
        
        const accentCSS = `
            /* ===== SCROLLBAR ===== */
            ::-webkit-scrollbar {
                width: 10px;
                height: 10px;
            }
            ::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 5px;
            }
            ::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, ${hex1}, ${hex2}) !important;
                border-radius: 5px;
                border: 2px solid transparent;
                background-clip: padding-box;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(180deg, ${hex2}, ${hex1}) !important;
            }
            
            /* ===== SUBMIT BUTTON ===== */
            .composer-submit-button-color,
            button[data-testid="send-button"],
            button[data-testid="composer-send-button"] {
                background: linear-gradient(135deg, ${hex1}, ${hex2}) !important;
                color: ${textColor1} !important;
                border: none !important;
                transition: all 0.3s ease;
            }
            .composer-submit-button-color:hover,
            button[data-testid="send-button"]:hover,
            button[data-testid="composer-send-button"]:hover {
                box-shadow: 0 0 20px ${p.rgba(p.colors[0], 0.6)}, 0 0 40px ${p.rgba(p.colors[1] || p.colors[0], 0.3)} !important;
                filter: brightness(1.1);
                transform: scale(1.05);
            }
            .composer-submit-button-color svg,
            button[data-testid="send-button"] svg,
            button[data-testid="composer-send-button"] svg {
                color: ${textColor1} !important;
            }
            
            /* ===== MODEL SELECTOR ===== */
            button[aria-label*="Model"] {
                border: 1px solid transparent !important;
                transition: all 0.3s ease;
            }
            button[aria-label*="Model"]:hover {
                border-color: ${hex1} !important;
                box-shadow: 0 0 15px ${p.rgba(p.colors[0], 0.3)} !important;
            }
            
            /* ===== SETTINGS PANEL ACCENT ===== */
            .tm-settings-panel h3 {
                color: ${hex1} !important;
            }
            .tm-settings-panel select:focus,
            .tm-settings-panel select:hover {
                border-color: ${hex1} !important;
                background: ${p.rgba(p.colors[0], 0.1)} !important;
            }
            .tm-settings-group input[type="range"]::-webkit-slider-thumb {
                background: ${hex1} !important;
                box-shadow: 0 0 10px ${p.rgba(p.colors[0], 0.5)} !important;
            }
            .tm-preview-btn {
                background: linear-gradient(135deg, ${hex1}, ${hex2}) !important;
                color: ${textColor1} !important;
            }
            .tm-preview-btn:hover {
                box-shadow: 0 5px 20px ${p.rgba(p.colors[0], 0.4)} !important;
            }
            .tm-settings-btn:hover {
                box-shadow: 0 0 15px ${p.rgba(p.colors[0], 0.5)} !important;
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
    }

    // =================================================================
    // PART 2: UI Transparency
    // =================================================================

    GM_addStyle(`
        .TyagGW_tableContainer { --thread-content-width: none !important; }
        [data-turn="assistant"] > div > div, [data-turn="user"] > div > div {
            --thread-content-max-width: 95% !important;
            max-width: 95% !important;
        }
        main[class*="--thread-content-max-width"] {
            --thread-content-max-width: 95% !important;
            max-width: 95% !important;
        }
        html, body { background-color: transparent !important; }
        .bg-token-main-surface-primary {
            background-color: transparent !important;
            -webkit-backdrop-filter: blur(1px);
            backdrop-filter: blur(1px);
        }
        div[data-message-author-role="user"].text-message > div > div {
            background-color: rgba(0,10,0, 0.5) !important;
            -webkit-backdrop-filter: blur(4px);
            backdrop-filter: blur(4px);
        }
        div[role="presentation"] .h-full article > div > div { max-width: 65rem; }
        div[data-message-author-role="assistant"].text-message pre > div {
            background-color: rgba(0,0,0, 0.5) !important;
            -webkit-backdrop-filter: blur(4px);
            backdrop-filter: blur(4px);
            margin-right: 1rem;
        }
        div[data-message-author-role="assistant"].text-message {
            background-color: rgba(0,0,0, 0.5) !important;
            -webkit-backdrop-filter: blur(4px);
            backdrop-filter: blur(4px);
            border-radius: 25px;
            padding-left: 1rem;
        }
        div[role="presentation"] div.group div.flex {
            background-color: rgba(10,10,10, 0) !important;
            -webkit-backdrop-filter: blur(25px);
            backdrop-filter: blur(25px);
        }
        nav:nth-of-type(1) > *:not(:nth-child(2)):nth-child(-n+7),
        #stage-slideover-sidebar > div > div:nth-of-type(2) {
            background: none !important;
        }
        nav:nth-of-type(1) > *:nth-child(10) {
            background-color: rgba(5,5,5,0.25) !important;
            -webkit-backdrop-filter: blur(25px) !important;
            backdrop-filter: blur(50px) !important;
        }
        #stage-slideover-sidebar {
            background-color: rgba(10,10,10, 0) !important;
            -webkit-backdrop-filter: blur(5px);
            backdrop-filter: blur(5px);
        }
        #thread-bottom .bg-token-bg-primary {
            background-color: rgba(0, 0, 0, 0.4) !important;
            -webkit-backdrop-filter: blur(10px);
            backdrop-filter: blur(10px);
            border-radius: 24px;
        }
        .content-fade.single-line:after {
            background: transparent !important;
            background-image: none !important;
        }
        main { padding-top: 60px !important; }
        main > div:first-child { margin-top: 0 !important; }
        [role="presentation"] { padding-top: 50px; }
    `);

    // =================================================================
    // PART 3: Loop Glitch Animation
    // =================================================================

    GM_addStyle(`
        .glitch-target {
            position: relative;
            color: #00ff41 !important;
            font-weight: bold;
            display: inline-block;
        }
        .glitch-target::before, .glitch-target::after {
            content: attr(data-text);
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: #202123;
        }
        .glitch-target::before {
            left: 2px; text-shadow: -1px 0 #ff00c1;
            clip: rect(44px, 450px, 56px, 0);
            animation: glitch-anim-1 2s infinite linear alternate-reverse;
        }
        .glitch-target::after {
            left: -2px; text-shadow: -1px 0 #00fff9;
            clip: rect(44px, 450px, 56px, 0);
            animation: glitch-anim-2 3s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim-1 {
            0% { clip: rect(20px, 9999px, 80px, 0); }
            20% { clip: rect(60px, 9999px, 10px, 0); }
            40% { clip: rect(10px, 9999px, 90px, 0); }
            60% { clip: rect(50px, 9999px, 30px, 0); }
            80% { clip: rect(90px, 9999px, 20px, 0); }
            100% { clip: rect(30px, 9999px, 60px, 0); }
        }
        @keyframes glitch-anim-2 {
            0% { clip: rect(90px, 9999px, 10px, 0); }
            20% { clip: rect(10px, 9999px, 50px, 0); }
            40% { clip: rect(80px, 9999px, 20px, 0); }
            60% { clip: rect(20px, 9999px, 90px, 0); }
            80% { clip: rect(60px, 9999px, 30px, 0); }
            100% { clip: rect(40px, 9999px, 70px, 0); }
        }
    `);

    const versionSelector = '#page-header > div > button > div > span';
    const SCRAMBLE_CHARS = "0123456789!@#$%^&*";
    const TARGET_VERSION = "K.K";
    const HOLD_TIME_MS = 5000;

    function startGlitchLoop(element, originalText) {
        if (element.dataset.glitchProcessed) return;
        element.dataset.glitchProcessed = "true";
        element.classList.add('glitch-target');
        element.setAttribute('data-text', originalText);

        function transitionText(targetStr, onComplete) {
            let iteration = 0;
            const maxIterations = 50;
            const interval = setInterval(() => {
                element.innerText = targetStr.split("").map((char, index) => {
                    if (index < iteration / 2) return targetStr[index];
                    return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
                }).join("");
                element.setAttribute('data-text', element.innerText);
                if (iteration >= maxIterations) {
                    clearInterval(interval);
                    element.innerText = targetStr;
                    element.setAttribute('data-text', targetStr);
                    if (onComplete) onComplete();
                }
                iteration += 1;
            }, 50);
        }

        function loopCycle() {
            setTimeout(() => {
                transitionText(TARGET_VERSION, () => {
                    setTimeout(() => {
                        transitionText(originalText, () => {
                            loopCycle();
                        });
                    }, HOLD_TIME_MS);
                });
            }, HOLD_TIME_MS);
        }
        loopCycle();
    }

    // =================================================================
    // PART 4: Smart Quote Injection (Formatted)
    // =================================================================

    GM_addStyle(`
        @keyframes quoteSlideIn {
            0% { opacity: 0; transform: translateY(-20px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .tm-custom-quote {
            display: flex;
            flex-direction: column;
            animation: quoteSlideIn 1.5s ease-out forwards;
            font-weight: 600;
            max-width: 750px;
            margin: 0 auto;
            text-align: center;
        }
    `);

    let fetchedQuoteHtml = null;
    const headerParentSelector = 'h1.text-page-header';
    const originalTextSelector = 'h1.text-page-header > div.text-pretty.whitespace-pre-wrap';

    // Helper: Logic to determine where to break lines
    function formatQuoteText(text) {
        // 1. Check if the text contains explicit sentence endings (. ? !)
        const hasSentenceEndings = /[.?!]/.test(text);

        if (hasSentenceEndings) {
            // STRATEGY A: If we have periods/question marks, split ONLY on those.
            // Do NOT split on commas (keep the sentence flowing).
            // Regex: Find (. ? !) followed by whitespace, replace with symbol + <br/>
            // We use a positive lookahead (?=) or just consume the space to keep it clean.
            return text.replace(/([.?!])\s+/g, '$1<br/><br/>'); // Double break for distinct sentences, or single <br/> if preferred.
        } else {
            // STRATEGY B: No periods found (e.g. a long clause or poetic fragment).
            // Split on commas to create vertical rhythm.
            return text.replace(/,\s+/g, ',<br/>');
        }
    }

    GM_xmlhttpRequest({
        method: "GET",
        url: "http://api.quotable.io/random",
        onload: function(response) {
            try {
                if(response.status === 200) {
                    const data = JSON.parse(response.responseText);
                    const formattedContent = formatQuoteText(data.content);

                    fetchedQuoteHtml = `
                        <span style="font-style: italic; line-height: 1.6;">"${formattedContent}"</span>
                        <span style="font-size: 0.75rem; margin-top: 10px; align-self: flex-end; text-align: right; opacity: 0.85;">— ${data.author}</span>
                    `;
                    tryApplyQuote();
                }
            } catch (e) {
                console.error("Error parsing quote JSON:", e);
            }
        }
    });

    function tryApplyQuote() {
        if (!fetchedQuoteHtml) return;

        const headerParent = document.querySelector(headerParentSelector);
        const originalTextDiv = document.querySelector(originalTextSelector);

        if (headerParent) {
            if (originalTextDiv && originalTextDiv.style.display !== 'none') {
                originalTextDiv.style.display = 'none';
            }

            let customQuoteDiv = headerParent.querySelector('.tm-custom-quote');

            if (!customQuoteDiv) {
                customQuoteDiv = document.createElement('div');
                customQuoteDiv.className = 'tm-custom-quote text-pretty whitespace-pre-wrap';
                customQuoteDiv.innerHTML = fetchedQuoteHtml;
                headerParent.appendChild(customQuoteDiv);
            }
        }
    }

    // =================================================================
    // PART 5: Settings UI Panel
    // =================================================================

    GM_addStyle(`
        .tm-settings-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(30, 30, 30, 0.85);
            border: 1px solid rgba(255,255,255,0.15);
            color: #fff;
            cursor: pointer;
            /* ensure this is always on top of animated background */
            z-index: 2147483647 !important;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            font-size: 20px;
            transform: translateZ(0);
        }
        .tm-settings-btn:hover {
            background: rgba(50, 50, 50, 0.95);
            transform: scale(1.1) rotate(30deg);
            box-shadow: 0 0 15px rgba(0,255,65,0.3);
        }
        .tm-settings-panel {
            position: fixed;
            bottom: 75px;
            right: 20px;
            width: 300px;
            background: rgba(20, 20, 20, 0.95);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 20px;
            /* ensure panel sits above animated background */
            z-index: 2147483647 !important;
            backdrop-filter: blur(20px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
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
            color: #00ff41;
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
            border-color: #00ff41;
            outline: none;
            background: rgba(0,255,65,0.05);
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
            background: #00ff41;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(0,255,65,0.5);
        }
        .tm-range-value {
            text-align: right;
            color: #00ff41;
            font-size: 12px;
            margin-top: 4px;
            font-family: monospace;
        }
        .tm-preview-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
            border: none;
            border-radius: 8px;
            color: #000;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .tm-preview-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0,255,65,0.4);
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
            background: linear-gradient(135deg, #00ff41, #00cc33);
        }
        .tm-toggle input:checked + .tm-toggle-slider:before {
            transform: translateX(20px);
        }
    `);

    function createSettingsUI() {
        // Settings toggle button
        const btn = document.createElement('button');
        btn.className = 'tm-settings-btn';
        btn.innerHTML = '⚙';
        btn.title = 'Background Settings';

        // Settings panel
        const panel = document.createElement('div');
        panel.className = 'tm-settings-panel';
        panel.innerHTML = `
            <h3>⚡ Background Animation</h3>
            <div class="tm-settings-group">
                <label>Animation Style</label>
                <select id="tm-anim-select">
                    ${ANIMATION_OPTIONS.map(opt => 
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
                    ${EASING_OPTIONS.map(opt => 
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
            <div class="tm-settings-note">Changes are saved automatically</div>
        `;

        document.body.appendChild(btn);
        document.body.appendChild(panel);

        // Toggle panel
        btn.addEventListener('click', () => {
            panel.classList.toggle('open');
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && !btn.contains(e.target)) {
                panel.classList.remove('open');
            }
        });

        // Animation select
        const animSelect = panel.querySelector('#tm-anim-select');
        animSelect.addEventListener('change', (e) => {
            settings.animation = e.target.value;
            saveSettings();
        });

        // Duration slider
        const durationSlider = panel.querySelector('#tm-duration-slider');
        const durationValue = panel.querySelector('#tm-duration-value');
        durationSlider.addEventListener('input', (e) => {
            settings.duration = e.target.value;
            durationValue.textContent = e.target.value + 's';
            saveSettings();
        });

        // Easing select
        const easingSelect = panel.querySelector('#tm-easing-select');
        easingSelect.addEventListener('change', (e) => {
            settings.easing = e.target.value;
            saveSettings();
        });

        // Accent toggle
        const accentToggle = panel.querySelector('#tm-accent-toggle');
        const accentLabel = panel.querySelector('#tm-accent-label');
        const palettePreview = panel.querySelector('#tm-palette-preview');
        
        // Show palette preview
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
        setTimeout(updatePalettePreview, 1000); // Wait for palette extraction
        
        accentToggle.addEventListener('change', (e) => {
            settings.accentMode = e.target.checked;
            accentLabel.textContent = e.target.checked ? 'Wallpaper Palette' : 'Original Colors';
            saveSettings();
            
            if (e.target.checked && window.tmPalette) {
                const p = window.tmPalette;
                const getTextColor = (rgb) => {
                    const yiq = ((rgb[0]*299)+(rgb[1]*587)+(rgb[2]*114))/1000;
                    return (yiq >= 128) ? 'black' : 'white';
                };
                applyAccentStyles(
                    p, p.hex[0], p.hex[1] || p.hex[0], p.hex[2] || p.hex[0],
                    p.hex[3] || p.hex[1] || p.hex[0], p.hex[4] || p.hex[2] || p.hex[0],
                    getTextColor(p.colors[0]), getTextColor(p.colors[1] || p.colors[0])
                );
            } else {
                removeAccentStyles();
            }
        });

        // Preview button - reloads to show new animation
        const previewBtn = panel.querySelector('#tm-preview-btn');
        previewBtn.addEventListener('click', () => {
            location.reload();
        });
    }

    // =================================================================
    // PART 6: Main Observer
    // =================================================================

    const observer = new MutationObserver((mutations) => {
        const versionElement = document.querySelector(versionSelector);
        if (versionElement && versionElement.innerText.trim().length > 0 && !versionElement.dataset.glitchProcessed) {
            startGlitchLoop(versionElement, versionElement.innerText);
        }
        tryApplyQuote();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initialize settings UI when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createSettingsUI);
    } else {
        createSettingsUI();
    }

})();