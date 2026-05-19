// ==UserScript==
// @name         GOOGLE Theme
// @namespace    http://tampermonkey.net/
// @version      2026.05.20.0009
// @description  Background image, transparent UI, dynamic color extraction, and palette-driven theming matching CHATGPT Theme
// @author       Kovinda
// @match        *://*.google.com/search*
// @match        *://*.google.lk/search*
// @match        *://*.google.com.sg/search*
// @match        *://*.google.co.uk/search*
// @match        *://*.google.co.in/search*
// @match        *://*.google.com.au/search*
// @match        *://*.google.co.jp/search*
// @match        *://*.google.ca/search*
// @match        *://*.google.de/search*
// @match        *://*.google.fr/search*
// @match        *://*.google.com.br/search*
// @include      *://*.google.*/search*
// @require      https://cdn.jsdelivr.net/npm/node-vibrant@latest/dist/vibrant.min.js
// @require      https://raw.githubusercontent.com/Kovinda/Userscripts/main/common/color-utils.js
// @require      https://raw.githubusercontent.com/Kovinda/Userscripts/main/common/vibrant-loader.js
// @require      https://raw.githubusercontent.com/Kovinda/Userscripts/main/common/animations.js
// @require      https://raw.githubusercontent.com/Kovinda/Userscripts/main/common/wallpaper.js
// @require      https://cdn.jsdelivr.net/npm/motion@latest/dist/motion.js
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      127.0.0.1
// @run-at       document-start
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

    const ANIMATION_OPTIONS = SharedUI.MOTION_OPTIONS || SharedUI.ANIMATION_OPTIONS;
    const EASING_OPTIONS = SharedUI.EASING_OPTIONS;

    // Load saved settings or use defaults
    let settings = Object.assign({}, DEFAULT_SETTINGS, GM_getValue('bgSettings', {}));

    const getTextColor = SharedUI.getTextColor;
    const parseCssRgb = SharedUI.parseCssRgb;

    // =================================================================
    // GLASSMORPHISM & BLUR CONFIGURATION
    // =================================================================

    const GLASS_CONFIG = {
        blurs: {
            subtle: '1px',
            button: '10px',
            sidebar: '6px',
            code: '1px',
            default: '2px',
            panel: '8px',
            dialog: '8px',
            deep: '8px',
        },
        saturate: {
            low: '120%',
            medium: '140%',
            high: '160%',
        },
        dark: {
            bg: 'rgba(10, 10, 10, 0.5)',
            strongBg: 'rgba(0, 0, 0, 0.6)',
            headerBg: 'rgba(10, 10, 10, 0.45)',
            border: 'rgba(255, 255, 255, 0.08)',
            shadow: '0 10px 22px rgba(0, 0, 0, 0.35)',
        },
        light: {
            bg: 'rgba(255, 255, 255, 0.35)',
            strongBg: 'rgba(255, 255, 255, 0.6)',
            headerBg: 'rgba(255, 255, 255, 0.45)',
            border: 'rgba(255, 255, 255, 0.35)',
            shadow: '0 10px 22px rgba(0, 0, 0, 0.14)',
        }
    };

    let glassMode = null;

    const setGlassVars = (mode) => {
        if (glassMode === mode) return;
        glassMode = mode;
        const root = document.documentElement;
        const theme = mode === 'dark' ? GLASS_CONFIG.dark : GLASS_CONFIG.light;
        const sat = mode === 'dark' ? GLASS_CONFIG.saturate.low : GLASS_CONFIG.saturate.medium;

        root.style.setProperty('--tm-glass-bg', theme.bg);
        root.style.setProperty('--tm-glass-strong-bg', theme.strongBg);
        root.style.setProperty('--tm-glass-header-bg', theme.headerBg);
        root.style.setProperty('--tm-glass-border', theme.border);
        root.style.setProperty('--tm-glass-shadow', theme.shadow);
        root.style.setProperty('--tm-glass-filter', `blur(${GLASS_CONFIG.blurs.default}) saturate(${sat})`);

        root.style.setProperty('--tm-blur-subtle', `blur(${GLASS_CONFIG.blurs.subtle})`);
        root.style.setProperty('--tm-blur-button', `blur(${GLASS_CONFIG.blurs.button})`);
        root.style.setProperty('--tm-blur-sidebar', `blur(${GLASS_CONFIG.blurs.sidebar})`);
        root.style.setProperty('--tm-blur-code', `blur(${GLASS_CONFIG.blurs.code})`);
        root.style.setProperty('--tm-blur-default', `blur(${GLASS_CONFIG.blurs.default})`);
        root.style.setProperty('--tm-blur-panel', `blur(${GLASS_CONFIG.blurs.panel})`);
        root.style.setProperty('--tm-blur-dialog', `blur(${GLASS_CONFIG.blurs.dialog})`);
        root.style.setProperty('--tm-blur-deep', `blur(${GLASS_CONFIG.blurs.deep})`);

        root.style.setProperty('--tm-filter-user-msg', `blur(${GLASS_CONFIG.blurs.default}) saturate(${GLASS_CONFIG.saturate.medium})`);
        root.style.setProperty('--tm-filter-asst-msg', `blur(${GLASS_CONFIG.blurs.default}) saturate(${GLASS_CONFIG.saturate.low})`);
        root.style.setProperty('--tm-filter-dialog', `blur(${GLASS_CONFIG.blurs.dialog}) saturate(${GLASS_CONFIG.saturate.high})`);
    };

    setGlassVars('dark');

    const updateGlassTone = () => {
        // Detect text color to determine dark/light mode for glass components automatically
        const sample = document.querySelector('#center_col') || document.body;
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
        GM_setValue('bgSettings', settings);
    }

    // Active configuration (derived from settings)
    const BACKGROUND_ANIMATION = settings.animation;
    const ANIMATION_DURATION = settings.duration + "s";
    const ANIMATION_EASING = settings.easing;

    // =================================================================
    // PART 1: Background, Sweep & Dynamic Color Extraction
    // =================================================================

    function transitionToNewWallpaper(dataUrl) {
        const bgContainer = document.getElementById('google-custom-bg');
        if (!bgContainer) return;

        const oldBg = bgContainer.querySelector('#google-bg-image');
        
        // Create new background element
        const newBg = document.createElement('div');
        newBg.id = 'google-bg-image';
        newBg.style.cssText = `position: absolute; inset: 0; width: 100%; height: 100%; background-image: url('${dataUrl}'); background-size: cover; background-position: center; filter: brightness(50%); will-change: clip-path, transform, opacity, filter; opacity: 0;`;
        
        bgContainer.appendChild(newBg);
        
        if (SharedUI.animateWithMotion) {
            newBg.style.opacity = '1';
            SharedUI.animateWithMotion(newBg, settings.animation, {
                duration: Number.parseFloat(settings.duration) || 1.5,
                ease: settings.easing
            });
        } else {
            newBg.style.opacity = '1';
        }
        
        extractPaletteFromDataUrl(dataUrl);

        const durationMs = (Number.parseFloat(settings.duration) || 1.5) * 1000;
        setTimeout(() => {
            if (oldBg) oldBg.remove();
        }, durationMs + 100);
    }

    const imageUrl = `http://127.0.0.1:8190/ActiveBackground.jpg?rand=${Math.random()}`;

    GM_xmlhttpRequest({
        method: 'GET',
        url: imageUrl,
        responseType: 'blob',
        onload: function(response) {
            if (SharedUI.Wallpaper) {
                SharedUI.Wallpaper.setInitialFingerprint(response.responseHeaders);
            }
            const reader = new FileReader();
            reader.onloadend = function() {
                const dataUrl = reader.result;

                const bgContainer = document.createElement('div');
                bgContainer.id = 'google-custom-bg';
                bgContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -9999; pointer-events: none; overflow: hidden;';
                bgContainer.innerHTML = `<div id="google-bg-image" style="position: absolute; inset: 0; width: 100%; height: 100%; background-image: url('${dataUrl}'); background-size: cover; background-position: center; filter: brightness(50%); will-change: clip-path, transform, opacity, filter;"></div>`;
                document.body.appendChild(bgContainer);

                const bgElem = bgContainer.querySelector('#google-bg-image');
                if (bgElem && SharedUI.animateWithMotion) {
                    SharedUI.animateWithMotion(bgElem, BACKGROUND_ANIMATION, {
                        duration: Number.parseFloat(ANIMATION_DURATION) || 1.5,
                        ease: ANIMATION_EASING
                    });
                }

                extractPaletteFromDataUrl(dataUrl);
                
                if (SharedUI.Wallpaper) {
                    SharedUI.Wallpaper.startPoller('http://127.0.0.1:8190/ActiveBackground.jpg', transitionToNewWallpaper, 10000);
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
        
        const accentRgb = p.colors[0].join(', ');
        const selection = p.rgba(p.colors[0], 0.35);

        // Derive high-end tinted card colors using the shared SharedUI color utilities
        const darkenedVibrant = SharedUI.darkenRgb(p.colors[0], 0.5);
        const cardBg = p.rgba(darkenedVibrant, 0.35);
        const cardBorder = p.rgba(p.colors[0], 0.15);

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
                --selection: ${selection};
                
                /* Dynamic Premium Card Glass Colors */
                --tm-glass-card-bg: ${cardBg} !important;
                --tm-glass-card-border: ${cardBorder} !important;
                
                /* Dynamic Premium Text Contrast Tinting */
                --tm-text-primary: color-mix(in oklab, ${hex1} 15%, ${textColor1}) !important;
                --tm-text-secondary: color-mix(in oklab, ${hex2} 30%, ${textColor1}) !important;
            }

            /* Google search titles colors mapping dynamically */
            .g h3, .g h3 *, .g a h3, .g a h3 *, .g a:link h3, .g a:visited h3,
            .tF23xf h3, .hlcw0c h3, .MjjYbeb h3 {
                color: ${hex1} !important;
            }
            .g a:hover h3, .g a:hover h3 *, .tF23xf a:hover h3, .hlcw0c a:hover h3 {
                color: ${hex2} !important;
                text-decoration: underline !important;
            }

            /* Google Search links colors */
            a, a:link, a * {
                color: ${hex1} !important;
            }
            a:hover, a:hover * {
                color: ${hex2} !important;
            }
            a:visited, a:visited * {
                color: ${hex3} !important;
            }

            /* Bold search terms highlight matches */
            em, b {
                color: ${hex2} !important;
            }

            /* Search input bar focus styling */
            .RNNXgb:focus-within {
                border-color: ${hex1} !important;
                box-shadow: 0 0 12px ${p.rgba(p.colors[0], 0.3)} !important;
            }

            /* Active Search Tab pill selector & dynamic theme color matching */
            .hdtb-msb .hdtb-mitem.hdtb-msel, .q8sa8b, .crJ18e .KTZ27c {
                border-bottom: 3px solid ${hex1} !important;
                color: ${hex1} !important;
            }
            
            /* Refined active chip design with restrained accent fill */
            html body .mXwfNd[selected=""],
            html body .mXwfNd[aria-current="page"],
            html body [selected=""] .mXwfNd,
            html body [aria-current="page"] .mXwfNd,
            html body a.NQyKp[selected=""],
            html body a.NQyKp[aria-current="page"],
            html body a.NQyKp.Maj6Tc {
                background: linear-gradient(135deg, rgba(var(--tm-accent-rgb), 0.22) 0%, rgba(var(--tm-accent-rgb), 0.08) 100%), rgba(8, 8, 8, 0.55) !important;
                color: var(--tm-accent-text, #ffffff) !important;
                border-color: rgba(var(--tm-accent-rgb), 0.5) !important;
                box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35), 0 0 12px rgba(var(--tm-accent-rgb), 0.25) !important;
            }
            
            html body .mXwfNd[selected=""] *,
            html body .mXwfNd[aria-current="page"] *,
            html body [selected=""] .mXwfNd *,
            html body [aria-current="page"] .mXwfNd *,
            html body a.NQyKp[selected=""] *,
            html body a.NQyKp[aria-current="page"] *,
            html body a.NQyKp.Maj6Tc * {
                color: #ffffff !important;
            }

            /* Inactive chip subtle dynamic accent border tinting & deep backing */
            html body .mXwfNd:not([selected]):not([aria-current="page"]),
            html body a.NQyKp:not([selected]):not([aria-current="page"]):not(.Maj6Tc) {
                border-color: rgba(var(--tm-accent-rgb), 0.18) !important;
                background-color: rgba(10, 10, 10, 0.55) !important;
                color: var(--tm-text-secondary, rgba(255, 255, 255, 0.7)) !important;
            }

            /* Dynamic colors for page results text contrast */
            body, #cnt, #rcnt, .g, .kp-blk, .vk_c, .WwMm6e, .MjjYbeb, .VjDLd {
                color: var(--tm-text-primary, #e8eaed) !important;
            }

            /* Secondary search snippets and metadata styling */
            .VwiC3b, .VwiC3b *, .N15eKc, .N15eKc *, .MUxGbd, .MUxGbd *, .fG8Fp, .fG8Fp *, .sub-text, .metadata, .lEB1S, .lEB1S * {
                color: var(--tm-text-secondary, rgba(255, 255, 255, 0.7)) !important;
            }

            /* custom selection highlights */
            ::selection {
                background: ${selection} !important;
                color: ${textColor1} !important;
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
            console.error('[Tampermonkey] node-vibrant processing failed:', err);
        });
    }

    // =================================================================
    // PART 2: UI Transparency & Glassmorphism
    // =================================================================

    GM_addStyle(`
        * {
            /* Override Google OSRP Dynamic Theme Background Variables to be fully transparent */
            --vZe0jb: transparent !important;
            --nwXobb: transparent !important;
            --ZEpPmd: transparent !important;
            --QWaaaf: transparent !important;
            --DEeStf: transparent !important;
            --TSWZIb: transparent !important;
            --BRLwE: transparent !important;
            --Aqn7xd: transparent !important;
            --gS5jXb: transparent !important;
            --JclFj: transparent !important;
            --mXZkqc: transparent !important;
            --XKMDxc: transparent !important;
            --aYn2S: transparent !important;
            --Lm570b: transparent !important;
            --KIZPne: transparent !important;
            --EpFNW: transparent !important;
            --Xqboce: transparent !important;
            
            /* Override Google OSRP Dynamic Theme Text Variables to use our premium tinted text system */
            --VuZXBd: var(--tm-text-primary, #e8eaed) !important;
            --uLz37c: var(--tm-text-secondary, rgba(255, 255, 255, 0.7)) !important;
            --jINu6c: var(--tm-text-primary, #e8eaed) !important;
            --YLNNHc: var(--tm-text-primary, #e8eaed) !important;
            --bbQxAb: var(--tm-text-primary, #e8eaed) !important;
            --xPpiM: var(--tm-text-primary, #e8eaed) !important;
            --IXoxUe: var(--tm-text-secondary, rgba(255, 255, 255, 0.7)) !important;

            /* Override Google OSRP Dynamic Theme Link & Accent Variables to use our dynamic wallpaper vibrant colors */
            --TyVYld: var(--tm-accent-1, #e8eaed) !important;
            --TMYS9: var(--tm-accent-1, #e8eaed) !important;
            --JKqx2: var(--tm-accent-1, #e8eaed) !important;
            --rrJJUc: var(--tm-accent-1, #e8eaed) !important;
            --Nsm0ce: var(--tm-accent-1, #e8eaed) !important;
            --ywz01c: var(--tm-accent-1, #e8eaed) !important;
            --Ehh4mf: var(--tm-accent-1, #e8eaed) !important;
            --vdwxpe: var(--tm-accent-2, #e8eaed) !important;
        }

        html, body {
            background-color: transparent !important;
            background: transparent !important;
        }

        /* Clean all opaque background blocks from Google structures */
        #cnt, #rcnt, .main, #center_col, #rhs, #searchform, .sfbg, #foot, #fbar, 
        #gb, .gb_Sd, .gb_Td, .gb_Vd, .gb_Ud, .gb_Wd, .gb_Xd, .gb_Yd {
            background: transparent !important;
            background-color: transparent !important;
        }

        /* Set premium Google Search cards transparent with customizable glass settings */
        /* Targets only outermost container blocks with extremely high specificity to override inline theme styles */
        html body .g, 
        html body .kp-blk, 
        html body .vk_c, 
        html body .vtSz8d,
        html body div.ZHugbd,
        html body div.UivI7b,
        html body #jOAHU > .A6K0A,
        html body .MjjYud > div:not(:has(.g)):not(:has(.kp-blk)):not(:has(.vtSz8d)):has(a) {
            background-color: var(--tm-glass-strong-bg, rgba(20, 20, 20, 0.6)) !important;
            backdrop-filter: blur(24px) saturate(140%) !important;
            -webkit-backdrop-filter: blur(24px) saturate(140%) !important;
            border: 1px solid var(--tm-glass-border, rgba(255, 255, 255, 0.15)) !important;
            border-radius: 16px !important;
            padding: 20px !important;
            margin-bottom: 20px !important;
            box-shadow: var(--tm-glass-shadow, 0 8px 32px 0 rgba(0, 0, 0, 0.2)) !important;
            transition: all 0.3s ease !important;
        }

        /* Special dynamic vibrant color styling for visual digest cards inside .VNzqVe */
        html body .VNzqVe .CYJS5e,
        html body .VNzqVe .D7ethf,
        html body .VNzqVe .ZHugbd,
        html body .VNzqVe .UivI7b {
            background-color: var(--tm-glass-strong-bg, rgba(20, 20, 20, 0.6)) !important;
            border: 1px solid var(--tm-glass-border, rgba(255, 255, 255, 0.15)) !important;
            box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.25) !important;
            transition: all 0.3s ease !important;
        }

        html body .VNzqVe .CYJS5e:hover,
        html body .VNzqVe .D7ethf:hover,
        html body .VNzqVe .ZHugbd:hover,
        html body .VNzqVe .UivI7b:hover {
            background-color: rgba(255, 255, 255, 0.1) !important;
            border-color: rgba(255, 255, 255, 0.25) !important;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4) !important;
            transform: translateY(-2px) !important;
        }

        /* Strip backgrounds on inner child containers of .VNzqVe cards */
        .VNzqVe .CYJS5e div,
        .VNzqVe .D7ethf div,
        .VNzqVe .ZHugbd div,
        .VNzqVe .UivI7b div {
            background: transparent !important;
            background-color: transparent !important;
            box-shadow: none !important;
            border: none !important;
        }

        /* Strip background and reset styles on all wrapper divs of the top category navigation bar to avoid double borders/styling */
        html body .Fgyi2e,
        html body .rZj61,
        html body .YNk70c,
        html body .GG4mbd,
        html body .P3mIxe,
        html body .Gcxb4e,
        html body .HTOhZ,
        html body .rAdPSe,
        html body .EDblX,
        html body .JpOecb,
        html body .h5JSWd,
        html body .rQTE8b,
        html body .beZ0tf,
        html body .olrp5b,
        html body .C6AK7c,
        html body .XVMlrc,
        html body [role="listitem"],
        html body [role="listitem"] > div,
        html body [role="listitem"] a,
        html body .yeKjxb,
        html body .mOKdDc,
        html body .mTpL7c,
        html body .Enb9pe,
        html body #JTPWx {
            background: transparent !important;
            background-color: transparent !important;
            box-shadow: none !important;
            border: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            text-decoration: none !important;
        }

        /* Category navigation list flex layouts reset */
        html body .beZ0tf {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 4px 0 !important; /* Elegant vertical padding */
            margin: 0 !important;
        }

        /* High-end Navigation chips container base styling */
        html body .mXwfNd {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 38px !important; /* Elevated height for spacious premium feel */
            box-sizing: border-box !important;
            padding: 0 18px !important; /* Perfect luxury horizontal spacing */
            border-radius: 100px !important; /* Ultra-smooth modern pill curvature matching premium cards */
            background-color: rgba(10, 10, 10, 0.55) !important; /* Deep dark frosted glass for high legibility */
            backdrop-filter: blur(20px) saturate(140%) !important;
            -webkit-backdrop-filter: blur(20px) saturate(140%) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            box-shadow: var(--tm-glass-shadow, 0 4px 15px rgba(0, 0, 0, 0.2)) !important;
            color: var(--tm-text-secondary, rgba(255, 255, 255, 0.75)) !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            text-decoration: none !important;
            cursor: pointer !important;
            transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }

        /* Ensure text and inner elements are styled beautifully, legibly, and completely override Google flat lines */
        html body .mXwfNd .R1QWuf,
        html body [role="listitem"] .R1QWuf,
        html body .mXwfNd .mVH5Fc,
        html body .mXwfNd span {
            color: inherit !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            text-decoration: none !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            background: transparent !important;
            border: none !important;
            border-bottom: none !important;
            padding: 0 !important;
            padding-bottom: 0 !important;
            margin: 0 !important;
        }

        /* Interactive premium hover transitions - adds smooth lift and gorgeous matching glow */
        html body .mXwfNd:hover,
        html body [role="listitem"] a:hover .mXwfNd,
        html body [role="listitem"] div:hover > .mXwfNd,
        html body .C6AK7c:hover .mXwfNd,
        html body .XVMlrc:hover .mXwfNd,
        html body .mOKdDc:hover .mXwfNd,
        html body .mTpL7c:hover .mXwfNd {
            background-color: rgba(255, 255, 255, 0.12) !important;
            color: var(--tm-accent-1, #ffffff) !important;
            transform: translateY(-2px) !important;
            border-color: rgba(var(--tm-accent-rgb, 255, 255, 255), 0.35) !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 0 0 10px rgba(var(--tm-accent-rgb, 255, 255, 255), 0.25) !important;
        }

        /* Default fallback Selected/Active Navigation Chip style when wallpaper accent is disabled */
        html body .mXwfNd[selected=""],
        html body .mXwfNd[aria-current="page"],
        html body [selected=""] .mXwfNd,
        html body [aria-current="page"] .mXwfNd,
        html body a.NQyKp[selected=""],
        html body a.NQyKp[aria-current="page"],
        html body a.NQyKp.Maj6Tc {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%), rgba(8, 8, 8, 0.55) !important;
            border-color: rgba(255, 255, 255, 0.22) !important;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.32), inset 0 1px 1px rgba(255, 255, 255, 0.15) !important;
        }

        html body .mXwfNd[selected=""] *,
        html body .mXwfNd[aria-current="page"] *,
        html body a.NQyKp[selected=""] *,
        html body a.NQyKp[aria-current="page"] *,
        html body a.NQyKp.Maj6Tc * {
            color: #ffffff !important;
        }

        /* Clean up any residual category styling from Google default theme */
        html body .mXwfNd::after,
        html body .C6AK7c::after,
        html body [role="listitem"]::after,
        html body a.NQyKp::after {
            display: none !important;
            content: none !important;
            border-bottom: none !important;
        }

        /* High-end Navigation chips styling for knowledge panel tabs */
        html body a.NQyKp {
            background-color: rgba(10, 10, 10, 0.55) !important; /* Deep dark frosted glass for high legibility */
            backdrop-filter: blur(20px) saturate(140%) !important;
            -webkit-backdrop-filter: blur(20px) saturate(140%) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            box-shadow: var(--tm-glass-shadow, 0 4px 15px rgba(0, 0, 0, 0.2)) !important;
            cursor: pointer !important;
            transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }

        /* Ensure text and inner elements of knowledge panel chips are styled beautifully and legibly */
        html body a.NQyKp,
        html body a.NQyKp *,
        html body a.NQyKp span.b0Xfjd {
            color: var(--tm-text-secondary, rgba(255, 255, 255, 0.75)) !important;
            text-decoration: none !important;
            font-weight: 500 !important;
        }

        /* Interactive premium hover transitions */
        html body a.NQyKp:hover {
            background-color: rgba(255, 255, 255, 0.12) !important;
            border-color: rgba(var(--tm-accent-rgb, 255, 255, 255), 0.35) !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 0 0 10px rgba(var(--tm-accent-rgb, 255, 255, 255), 0.25) !important;
        }
        
        html body a.NQyKp:hover *,
        html body a.NQyKp:hover span.b0Xfjd {
            color: var(--tm-accent-1, #ffffff) !important;
        }

        /* Strip backgrounds on dynamic Google OSRP wholepage panel structures */
        html body .kp-wholepage-osrp,
        html body .kp-wholepage-osrp > div,
        html body .kp-wholepage-osrp .xfX4Ac,
        html body .kp-wholepage-osrp .YB4h9,
        html body .kp-wholepage-osrp .ky4hfd,
        html body .kp-wholepage-osrp .q7XNbb,
        html body .kp-wholepage-osrp .dNS45b,
        html body #rhs .kp-wholepage-osrp,
        html body #rhs .kp-wholepage-osrp > div,
        html body #rhs .kp-wholepage-osrp .xfX4Ac,
        html body #rhs .tsRboc,
        html body #rhs .pCnXsf {
            background: transparent !important;
            background-color: transparent !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            border: none !important;
            padding: 0 !important;
            margin-bottom: 0 !important;
        }

        /* Strip backgrounds and blurs on ALL descendant layout elements inside cards to allow our custom glass to show through */
        #jOAHU > .A6K0A div,
        #jOAHU > .A6K0A span,
        .g .tF23xf, .g .hlcw0c, .g .ifM9O, .g .eqAnXb, .g .cUnQKe, .g .Uo81ke, .g .WwMm6e, .g .VjDLd, .g .xpd, .g .g-card, .g .card-section,
        .kp-blk .tF23xf, .kp-blk .hlcw0c, .kp-blk .ifM9O, .kp-blk .eqAnXb, .kp-blk .cUnQKe, .kp-blk .Uo81ke, .kp-blk .WwMm6e, .kp-blk .VjDLd, .kp-blk .xpd, .kp-blk .g-card, .kp-blk .card-section, .kp-blk .tsRboc,
        .vtSz8d .tF23xf, .vtSz8d .hlcw0c, .vtSz8d .ifM9O, .vtSz8d .eqAnXb, .vtSz8d .cUnQKe, .vtSz8d .Uo81ke, .vtSz8d .WwMm6e, .vtSz8d .VjDLd, .vtSz8d .xpd, .vtSz8d .g-card, .vtSz8d .card-section,
        .MjjYud > div .tF23xf, .MjjYud > div .hlcw0c, .MjjYud > div .ifM9O, .MjjYud > div .eqAnXb, .MjjYud > div .cUnQKe, .MjjYud > div .Uo81ke, .MjjYud > div .WwMm6e, .MjjYud > div .VjDLd, .MjjYud > div .xpd, .MjjYud > div .g-card, .MjjYud > div .card-section,
        .ULSxyf .tF23xf, .ULSxyf .hlcw0c, .ULSxyf .ifM9O, .ULSxyf .eqAnXb, .ULSxyf .cUnQKe, .ULSxyf .Uo81ke, .ULSxyf .WwMm6e, .ULSxyf .VjDLd, .ULSxyf .xpd, .ULSxyf .g-card, .ULSxyf .card-section,
        div.ZHugbd .tF23xf, div.ZHugbd .hlcw0c, div.ZHugbd .ifM9O, div.ZHugbd .eqAnXb, div.ZHugbd .cUnQKe, div.ZHugbd .Uo81ke, div.ZHugbd .WwMm6e, div.ZHugbd .VjDLd, div.ZHugbd .xpd, div.ZHugbd .g-card, div.ZHugbd .card-section, div.ZHugbd .MfFufe, div.ZHugbd .ro1ntb,
        div.UivI7b .tF23xf, div.UivI7b .hlcw0c, div.UivI7b .ifM9O, div.UivI7b .eqAnXb, div.UivI7b .cUnQKe, div.UivI7b .Uo81ke, div.UivI7b .WwMm6e, div.UivI7b .VjDLd, div.UivI7b .xpd, div.UivI7b .g-card, div.UivI7b .card-section, div.UivI7b .MfFufe, div.UivI7b .ro1ntb {
            background: transparent !important;
            background-color: transparent !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            border: none !important;
        }

        /* Sleek Glass Search Box overrides */
        .RNNXgb, .sbtc, .UUbT9 {
            background: var(--tm-glass-strong-bg, rgba(20, 20, 20, 0.6)) !important;
            backdrop-filter: var(--tm-blur-sidebar, blur(12px)) !important;
            -webkit-backdrop-filter: var(--tm-blur-sidebar, blur(12px)) !important;
            border: 1px solid var(--tm-glass-border, rgba(255, 255, 255, 0.15)) !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
            border-radius: 28px !important;
        }
        .UUbT9 {
            border-radius: 0 0 24px 24px !important;
        }
    `);

    // =================================================================
    // PART 3: Settings UI Panel
    // =================================================================

    GM_addStyle(`
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
            backdrop-filter: var(--tm-blur-button, blur(10px));
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
            backdrop-filter: var(--tm-blur-panel, blur(20px));
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
    `);

    function createSettingsUI() {
        if (document.querySelector('.tm-settings-btn')) return;

        // Settings toggle button
        const btn = document.createElement('button');
        btn.className = 'tm-settings-btn';
        btn.innerHTML = '⚙';
        btn.title = 'Background Settings';

        // Settings panel
        const panel = document.createElement('div');
        panel.className = 'tm-settings-panel';
        panel.innerHTML = `
            <h3>⚡ Google Theme Settings</h3>
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
        window.tmUpdatePalettePreview = updatePalettePreview;
        updatePalettePreview();
        
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

        // Preview button - reloads to show new animation
        const previewBtn = panel.querySelector('#tm-preview-btn');
        previewBtn.addEventListener('click', () => {
            location.reload();
        });
    }

    // =================================================================
    // PART 4: Main Observer & Tone Tracker
    // =================================================================

    const observer = new MutationObserver((mutations) => {
        createSettingsUI();
        scheduleGlassToneUpdate();
    });

    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    scheduleGlassToneUpdate();

    // Initialize settings UI when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createSettingsUI);
    } else {
        createSettingsUI();
    }

})();
