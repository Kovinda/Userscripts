// ==UserScript==
// @name         Google Search Background Changer & Customizer
// @namespace    http://tampermonkey.net/
// @version      2026.05.19.0001
// @description  Easily change and customize the background of Google Search pages with Unsplash presets, custom URLs, local file uploads, and full brightness/blur controls.
// @author       Antigravity
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
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 1. Simplified Stylesheet focusing only on Background Changer and FAB
    const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

    /* Full-screen Custom Background Overlay */
    #google-custom-bg-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: -99999 !important;
        background-image: var(--custom-bg-image, none) !important;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
        filter: blur(var(--custom-bg-blur, 0px)) brightness(var(--custom-bg-brightness, 1)) !important;
        opacity: var(--custom-bg-opacity, 1) !important;
        transition: background-image 0.5s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease, opacity 0.3s ease !important;
        pointer-events: none !important;
    }

    /* Core Google Background Transparency to make background visible */
    html, body {
        background: transparent !important;
        background-color: transparent !important;
    }

    /* Override Google's default solid background tokens */
    :root, [color-scheme="dark"], [color-scheme="light"], body {
        --xhUGwc: transparent !important;
        --cIehld: transparent !important;
        --center-col-background: transparent !important;
        --gb-bg: transparent !important;
    }

    /* Remove solid color bands from structural blocks */
    #cnt, #rcnt, .main, #center_col, #rhs, #searchform, .sfbg, #foot, #fbar, 
    #gb, .gb_Sd, .gb_Td, .gb_Vd, .gb_Ud, .gb_Wd, .gb_Xd, .gb_Yd {
        background: transparent !important;
        background-color: transparent !important;
    }

    /* Elegant Floating Background Changer Activator Button (FAB) */
    #custom-bg-fab {
        position: fixed !important;
        bottom: 24px !important;
        right: 24px !important;
        width: 56px !important;
        height: 56px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #a8c7fa, #76a2eb) !important;
        border: 1px solid rgba(255, 255, 255, 0.4) !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
        cursor: pointer !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease, background 0.3s ease !important;
    }
    #custom-bg-fab:hover {
        transform: scale(1.1) rotate(15deg) !important;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4) !important;
        background: linear-gradient(135deg, #c2dbff, #8ab4f8) !important;
    }
    #custom-bg-fab svg {
        width: 24px !important;
        height: 24px !important;
        fill: #041e49 !important;
    }

    /* Control Panel Side Drawer Panel */
    #custom-bg-panel {
        position: fixed !important;
        top: 0 !important;
        right: -380px !important;
        width: 360px !important;
        height: 100vh !important;
        background: rgba(20, 21, 25, 0.95) !important;
        border-left: 1px solid rgba(255, 255, 255, 0.12) !important;
        box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4) !important;
        z-index: 1000000 !important;
        display: flex !important;
        flex-direction: column !important;
        font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        color: #e8eaed !important;
        transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        box-sizing: border-box !important;
    }
    #custom-bg-panel.open {
        right: 0 !important;
    }

    .studio-header {
        padding: 20px 24px !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
    }
    .studio-title {
        margin: 0 !important;
        font-size: 20px !important;
        font-weight: 600 !important;
        letter-spacing: 0.5px !important;
        background: linear-gradient(120deg, #c2dbff, #8ab4f8) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
    }
    .studio-close-btn {
        background: transparent !important;
        border: none !important;
        color: #9aa0a6 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 32px !important;
        height: 32px !important;
        border-radius: 50% !important;
        transition: background 0.2s, color 0.2s !important;
    }
    .studio-close-btn:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #fff !important;
    }

    /* Tab Selection buttons */
    .studio-tabs {
        display: flex !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        padding: 0 16px !important;
    }
    .studio-tab-btn {
        flex: 1 !important;
        padding: 14px 0 !important;
        background: transparent !important;
        border: none !important;
        color: #9aa0a6 !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        text-align: center !important;
        border-bottom: 2px solid transparent !important;
        transition: color 0.2s, border-color 0.2s !important;
    }
    .studio-tab-btn:hover {
        color: #e8eaed !important;
    }
    .studio-tab-btn.active {
        color: #8ab4f8 !important;
        border-bottom-color: #8ab4f8 !important;
        font-weight: 600 !important;
    }

    /* Panel Content Areas */
    .studio-content {
        flex: 1 !important;
        overflow-y: auto !important;
        padding: 24px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 24px !important;
    }
    .studio-content::-webkit-scrollbar {
        width: 6px !important;
    }
    .studio-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15) !important;
        border-radius: 3px !important;
    }

    .studio-tab-panel {
        display: none !important;
    }
    .studio-tab-panel.active {
        display: flex !important;
        flex-direction: column !important;
        gap: 24px !important;
    }

    /* Presets Grid */
    .presets-grid {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 12px !important;
    }
    .preset-card {
        height: 80px !important;
        border-radius: 10px !important;
        border: 2px solid transparent !important;
        cursor: pointer !important;
        overflow: hidden !important;
        position: relative !important;
        box-sizing: border-box !important;
        transition: transform 0.2s, border-color 0.2s !important;
    }
    .preset-card:hover {
        transform: translateY(-2px) !important;
        border-color: rgba(255, 255, 255, 0.4) !important;
    }
    .preset-card.active {
        border-color: #8ab4f8 !important;
        box-shadow: 0 0 12px rgba(138, 180, 248, 0.4) !important;
    }
    .preset-card-img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
    }
    .preset-card-name {
        position: absolute !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        padding: 4px 8px !important;
        font-size: 11px !important;
        background: rgba(0, 0, 0, 0.6) !important;
        color: #fff !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
    }

    /* Form Fields and Sliders */
    .form-group {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
    }
    .form-label {
        font-size: 13px !important;
        font-weight: 500 !important;
        color: #9aa0a6 !important;
    }
    .input-text {
        padding: 10px 12px !important;
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        border-radius: 8px !important;
        color: #fff !important;
        font-size: 13px !important;
        outline: none !important;
        transition: border-color 0.2s, background 0.2s !important;
    }
    .input-text:focus {
        border-color: #8ab4f8 !important;
        background: rgba(255, 255, 255, 0.08) !important;
    }

    /* Drag & Drop Local Upload box */
    .upload-zone {
        border: 2px dashed rgba(255, 255, 255, 0.2) !important;
        border-radius: 12px !important;
        padding: 24px !important;
        text-align: center !important;
        cursor: pointer !important;
        transition: border-color 0.2s, background-color 0.2s !important;
    }
    .upload-zone:hover, .upload-zone.dragover {
        border-color: #8ab4f8 !important;
        background: rgba(138, 180, 248, 0.05) !important;
    }
    .upload-icon {
        font-size: 24px !important;
        margin-bottom: 8px !important;
        display: inline-block !important;
    }
    .upload-text {
        font-size: 13px !important;
        color: #9aa0a6 !important;
    }

    /* Tuning Sliders */
    .slider-container {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
    }
    .slider-header {
        display: flex !important;
        justify-content: space-between !important;
        font-size: 13px !important;
    }
    .slider-title {
        color: #9aa0a6 !important;
        font-weight: 500 !important;
    }
    .slider-value {
        color: #8ab4f8 !important;
        font-weight: 600 !important;
    }
    .slider-input {
        -webkit-appearance: none !important;
        width: 100% !important;
        height: 6px !important;
        border-radius: 3px !important;
        background: rgba(255, 255, 255, 0.15) !important;
        outline: none !important;
        margin: 8px 0 !important;
    }
    .slider-input::-webkit-slider-thumb {
        -webkit-appearance: none !important;
        appearance: none !important;
        width: 16px !important;
        height: 16px !important;
        border-radius: 50% !important;
        background: #8ab4f8 !important;
        cursor: pointer !important;
        box-shadow: 0 0 8px rgba(138, 180, 248, 0.4) !important;
        transition: transform 0.1s !important;
    }
    .slider-input::-webkit-slider-thumb:hover {
        transform: scale(1.2) !important;
    }

    /* Action Buttons */
    .studio-btn-primary {
        background: linear-gradient(135deg, #8ab4f8, #5c93e6) !important;
        border: none !important;
        color: #041e49 !important;
        padding: 12px 20px !important;
        border-radius: 8px !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: transform 0.2s, background 0.2s !important;
        width: 100% !important;
        text-align: center !important;
    }
    .studio-btn-primary:hover {
        transform: translateY(-1px) !important;
        background: linear-gradient(135deg, #c2dbff, #8ab4f8) !important;
    }

    .studio-btn-secondary {
        background: rgba(255, 255, 255, 0.06) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        color: #e8eaed !important;
        padding: 10px 20px !important;
        border-radius: 8px !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        transition: background 0.2s, border-color 0.2s !important;
        width: 100% !important;
        text-align: center !important;
    }
    .studio-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.12) !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
    }
    `;

    // 2. Control Panel drawer DOM structure
    const PANEL_HTML = `
        <div class="studio-header">
            <h3 class="studio-title">Aesthetics Studio</h3>
            <button class="studio-close-btn" id="studio-close-btn" title="Close Panel">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        </div>
        <div class="studio-tabs">
            <button class="studio-tab-btn active" data-tab="wallpapers">Wallpapers</button>
            <button class="studio-tab-btn" data-tab="custom">Custom</button>
            <button class="studio-tab-btn" data-tab="tuning">Tuning</button>
        </div>
        <div class="studio-content">
            <!-- Wallpapers Tab -->
            <div class="studio-tab-panel active" id="panel-wallpapers">
                <div class="form-group">
                    <span class="form-label">Curated Backgrounds</span>
                    <div class="presets-grid" id="image-presets-grid"></div>
                </div>
                <div class="form-group" style="margin-top: 8px;">
                    <span class="form-label">Animated Fluid Gradients</span>
                    <div class="presets-grid" id="gradient-presets-grid"></div>
                </div>
            </div>

            <!-- Custom Tab -->
            <div class="studio-tab-panel" id="panel-custom">
                <div class="form-group">
                    <label class="form-label" for="custom-url-input">Direct Image URL</label>
                    <input type="text" id="custom-url-input" class="input-text" placeholder="https://example.com/wallpaper.jpg">
                    <button class="studio-btn-primary" id="apply-url-btn" style="margin-top: 8px;">Apply URL</button>
                </div>
                <div style="border-top: 1px solid rgba(255,255,255,0.08); margin: 8px 0;"></div>
                <div class="form-group">
                    <span class="form-label">Local File Upload</span>
                    <div class="upload-zone" id="upload-zone">
                        <span class="upload-icon">📁</span>
                        <div class="upload-text">Drag & drop image here or click to upload</div>
                        <input type="file" id="local-file-input" accept="image/*" style="display: none;">
                    </div>
                </div>
                <div style="border-top: 1px solid rgba(255,255,255,0.08); margin: 8px 0;"></div>
                <button class="studio-btn-secondary" id="reset-bg-btn">Remove Custom Background</button>
            </div>

            <!-- Tuning Tab -->
            <div class="studio-tab-panel" id="panel-tuning">
                <!-- Background Blur -->
                <div class="slider-container">
                    <div class="slider-header">
                        <span class="slider-title">Background Blur</span>
                        <span class="slider-value" id="val-bgBlur">0px</span>
                    </div>
                    <input type="range" id="slider-bgBlur" class="slider-input" min="0" max="30" value="0">
                </div>

                <!-- Background Brightness -->
                <div class="slider-container">
                    <div class="slider-header">
                        <span class="slider-title">Background Brightness</span>
                        <span class="slider-value" id="val-bgBrightness">100%</span>
                    </div>
                    <input type="range" id="slider-bgBrightness" class="slider-input" min="10" max="150" value="100">
                </div>

                <!-- Background Opacity -->
                <div class="slider-container">
                    <div class="slider-header">
                        <span class="slider-title">Background Opacity</span>
                        <span class="slider-value" id="val-bgOpacity">100%</span>
                    </div>
                    <input type="range" id="slider-bgOpacity" class="slider-input" min="0" max="100" value="100">
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); margin: 8px 0;"></div>
                <button class="studio-btn-secondary" id="reset-all-btn">Reset Settings</button>
            </div>
        </div>
    `;

    // 3. Ultra-wide Curated Wallpapers & Gradients Presets
    const WALLPAPER_PRESETS = [
        {
            name: 'Minimal Mountain Night',
            url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
            thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80'
        },
        {
            name: 'Cozy Rain Forest',
            url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1920&q=80',
            thumb: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=200&q=80'
        },
        {
            name: 'Warm Cosmic Nebula',
            url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1920&q=80',
            thumb: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=200&q=80'
        },
        {
            name: 'Dark Cyberpunk Alley',
            url: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?auto=format&fit=crop&w=1920&q=80',
            thumb: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?auto=format&fit=crop&w=200&q=80'
        },
        {
            name: 'Abstract Pastel Waves',
            url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
            thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'
        },
        {
            name: 'Peaceful Anime Scenery',
            url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80',
            thumb: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=200&q=80'
        }
    ];

    const GRADIENT_PRESETS = [
        {
            name: 'Midnight Aura',
            style: 'linear-gradient(135deg, #1f1c2c, #928dab)',
            thumb: 'linear-gradient(135deg, #1f1c2c, #928dab)'
        },
        {
            name: 'Cyberpunk Aurora',
            style: 'linear-gradient(225deg, #23153c, #0c1b33, #092c3e)',
            thumb: 'linear-gradient(225deg, #23153c, #0c1b33, #092c3e)'
        },
        {
            name: 'Velvet Sunset',
            style: 'linear-gradient(45deg, #3a1c71, #d76d77, #ffaf7b)',
            thumb: 'linear-gradient(45deg, #3a1c71, #d76d77, #ffaf7b)'
        },
        {
            name: 'Ocean Deep',
            style: 'linear-gradient(to right, #0f2027, #203a43, #2c5364)',
            thumb: 'linear-gradient(to right, #0f2027, #203a43, #2c5364)'
        }
    ];

    // 4. Default configuration values
    const DEFAULT_CONFIG = {
        bgType: 'image', // 'image' | 'gradient' | 'none'
        bgVal: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80', // Mountain Night Preset
        bgBlur: 0,
        bgBrightness: 65, // slightly dimmed default for better readability
        bgOpacity: 100
    };

    // Load active configuration from local storage
    let config = { ...DEFAULT_CONFIG };
    try {
        const saved = localStorage.getItem('google_bg_changer_config');
        if (saved) {
            config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Failed to load custom background config:', e);
    }

    // 5. Inject core stylesheet to html tag immediately at document-start
    const styleEl = document.createElement('style');
    styleEl.id = 'google-bg-changer-styles';
    styleEl.textContent = STYLES;
    document.documentElement.appendChild(styleEl);

    // Apply configuration immediately to CSS variables on html element
    function applyConfigCSSVariables() {
        const root = document.documentElement;
        
        // Background Type & URL Selection
        if (config.bgType === 'none') {
            root.style.setProperty('--custom-bg-image', 'none');
        } else if (config.bgType === 'image') {
            root.style.setProperty('--custom-bg-image', `url("${config.bgVal}")`);
        } else if (config.bgType === 'gradient') {
            root.style.setProperty('--custom-bg-image', config.bgVal);
        }

        // Filters applied on background overlay
        root.style.setProperty('--custom-bg-blur', `${config.bgBlur}px`);
        root.style.setProperty('--custom-bg-brightness', `${config.bgBrightness / 100}`);
        root.style.setProperty('--custom-bg-opacity', `${config.bgOpacity / 100}`);
    }

    // Apply styles to HTML node immediately
    applyConfigCSSVariables();

    // 6. DOM Elements Initialization (FAB, Panel, Overlay) when body ready
    function initDOM() {
        if (document.getElementById('google-custom-bg-overlay')) return;

        // Append custom background overlay layer
        const overlay = document.createElement('div');
        overlay.id = 'google-custom-bg-overlay';
        document.body.appendChild(overlay);

        // Append beautiful floating paintbrush FAB button
        const fab = document.createElement('button');
        fab.id = 'custom-bg-fab';
        fab.title = 'Customize Google Background';
        fab.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.17 19.58 10.53 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.87 0-7-3.13-7-7 0-1.66.58-3.17 1.54-4.38l9.84 9.84C15.17 17.42 13.66 18 12 18zm5.46-2.62L7.62 5.54C8.83 4.58 10.34 4 12 4c3.87 0 7 3.13 7 7 0 1.66-.58 3.17-1.54 4.38z"/>
            </svg>
        `;
        document.body.appendChild(fab);

        // Append Aesthetics Studio Panel
        const panel = document.createElement('div');
        panel.id = 'custom-bg-panel';
        panel.innerHTML = PANEL_HTML;
        document.body.appendChild(panel);

        // Bind all interactive events for the studio control panel
        setupPanelEvents(fab, panel);
    }

    // Wait for DOM body using MutationObserver
    if (document.body) {
        initDOM();
    } else {
        const observer = new MutationObserver((mutations, obs) => {
            if (document.body) {
                initDOM();
                obs.disconnect();
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // 7. Interactive Controls & UI Bindings
    function setupPanelEvents(fab, panel) {
        // Toggle Panel view
        fab.addEventListener('click', () => {
            panel.classList.toggle('open');
        });

        // Close Panel button
        const closeBtn = document.getElementById('studio-close-btn');
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('open');
        });

        // Drawer Outside click closer helper
        document.addEventListener('mousedown', (e) => {
            if (panel.classList.contains('open') && 
                !panel.contains(e.target) && 
                !fab.contains(e.target)) {
                panel.classList.remove('open');
            }
        });

        // Tab Switching logic
        const tabs = panel.querySelectorAll('.studio-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                panel.querySelectorAll('.studio-tab-panel').forEach(p => p.classList.remove('active'));
                
                tab.classList.add('active');
                const panelId = `panel-${tab.dataset.tab}`;
                document.getElementById(panelId).classList.add('active');
            });
        });

        // Curated Image Presets Grid rendering
        const imageGrid = document.getElementById('image-presets-grid');
        WALLPAPER_PRESETS.forEach(preset => {
            const card = document.createElement('div');
            card.className = 'preset-card';
            if (config.bgType === 'image' && config.bgVal === preset.url) {
                card.classList.add('active');
            }
            card.innerHTML = `
                <img class="preset-card-img" src="${preset.thumb}" alt="${preset.name}" loading="lazy">
                <div class="preset-card-name">${preset.name}</div>
            `;
            card.addEventListener('click', () => {
                imageGrid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
                document.getElementById('gradient-presets-grid').querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                config.bgType = 'image';
                config.bgVal = preset.url;
                saveAndApply();
            });
            imageGrid.appendChild(card);
        });

        // Animated / CSS Gradient Presets rendering
        const gradientGrid = document.getElementById('gradient-presets-grid');
        GRADIENT_PRESETS.forEach(preset => {
            const card = document.createElement('div');
            card.className = 'preset-card';
            if (config.bgType === 'gradient' && config.bgVal === preset.style) {
                card.classList.add('active');
            }
            card.innerHTML = `
                <div style="width: 100%; height: 100%; background: ${preset.thumb}"></div>
                <div class="preset-card-name">${preset.name}</div>
            `;
            card.addEventListener('click', () => {
                imageGrid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
                gradientGrid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                config.bgType = 'gradient';
                config.bgVal = preset.style;
                saveAndApply();
            });
            gradientGrid.appendChild(card);
        });

        // Custom URL Input and Apply
        const urlInput = document.getElementById('custom-url-input');
        const applyUrlBtn = document.getElementById('apply-url-btn');
        if (config.bgType === 'image' && 
            !WALLPAPER_PRESETS.some(p => p.url === config.bgVal) && 
            !config.bgVal.startsWith('data:')) {
            urlInput.value = config.bgVal;
        }

        applyUrlBtn.addEventListener('click', () => {
            const val = urlInput.value.trim();
            if (val) {
                imageGrid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
                gradientGrid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
                
                config.bgType = 'image';
                config.bgVal = val;
                saveAndApply();
            }
        });

        // Local Upload & Drag-and-Drop handling
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('local-file-input');
        
        uploadZone.addEventListener('click', () => fileInput.click());
        
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });
        
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                handleFileUpload(fileInput.files[0]);
            }
        });
        
        function handleFileUpload(file) {
            if (!file.type.startsWith('image/')) {
                alert('Please upload a valid image file!');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                imageGrid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
                gradientGrid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
                
                config.bgType = 'image';
                config.bgVal = e.target.result; // Data Base64 String URL
                saveAndApply();
            };
            reader.readAsDataURL(file);
        }

        // Tuning Slider Binders
        function bindSlider(id, key, unit) {
            const slider = document.getElementById(`slider-${id}`);
            const valueDisplay = document.getElementById(`val-${id}`);
            
            slider.value = config[key];
            valueDisplay.textContent = `${config[key]}${unit}`;
            
            slider.addEventListener('input', () => {
                config[key] = parseInt(slider.value);
                valueDisplay.textContent = `${config[key]}${unit}`;
                saveAndApply();
            });
        }
        
        bindSlider('bgBlur', 'bgBlur', 'px');
        bindSlider('bgBrightness', 'bgBrightness', '%');
        bindSlider('bgOpacity', 'bgOpacity', '%');

        // Background remover button
        document.getElementById('reset-bg-btn').addEventListener('click', () => {
            config.bgType = 'none';
            config.bgVal = '';
            imageGrid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
            gradientGrid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
            saveAndApply();
        });

        // Reset Settings button
        document.getElementById('reset-all-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset background settings?')) {
                config = { ...DEFAULT_CONFIG };
                
                // Update control inputs
                urlInput.value = '';
                document.getElementById('slider-bgBlur').value = config.bgBlur;
                document.getElementById('val-bgBlur').textContent = `${config.bgBlur}px`;
                
                document.getElementById('slider-bgBrightness').value = config.bgBrightness;
                document.getElementById('val-bgBrightness').textContent = `${config.bgBrightness}%`;
                
                document.getElementById('slider-bgOpacity').value = config.bgOpacity;
                document.getElementById('val-bgOpacity').textContent = `${config.bgOpacity}%`;
                
                imageGrid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
                gradientGrid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
                
                // Reactivate first preset image
                const firstPreset = imageGrid.querySelector('.preset-card');
                if (firstPreset) firstPreset.classList.add('active');
                
                saveAndApply();
            }
        });

        function saveAndApply() {
            try {
                localStorage.setItem('google_bg_changer_config', JSON.stringify(config));
            } catch (e) {
                console.error('Failed to save custom background config:', e);
            }
            applyConfigCSSVariables();
        }
    }
})();
