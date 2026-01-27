// ==UserScript==
// @name         ChatGPT Background Dimmer - Sweep + Glitch + Quote + ColorThief UI
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Background image, transparent UI, glitch loop, smart formatted quotes, and dynamic button coloring
// @author       Your Name
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// @match        https://chatgpt.com/c/*
// @match        https://auth.openai.com/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.2/color-thief.umd.js
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      api.quotable.io
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // =================================================================
    // PART 1: Background, Sweep & Dynamic Color Extraction
    // =================================================================

    const imageUrl = `http://127.0.0.1:8190/ActiveBackground.jpg?rand=${Math.random()}`;

    GM_xmlhttpRequest({
        method: 'GET',
        url: imageUrl,
        responseType: 'blob',
        onload: function(response) {
            const reader = new FileReader();
            reader.onloadend = function() {
                const dataUrl = reader.result;

                GM_addStyle(`
                    @keyframes sweepDown {
                        0% { clip-path: inset(0 0 100% 0); }
                        100% { clip-path: inset(0 0 0 0); }
                    }
                    body::before {
                        content: "";
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        z-index: -1;
                        display: block;
                        background-image: url('${dataUrl}');
                        background-size: cover;
                        background-position: center;
                        width: 100%; height: 100%;
                        filter: brightness(50%);
                        animation: sweepDown 1.5s ease-out forwards;
                        pointer-events: none;
                    }
                `);

                if (typeof ColorThief !== 'undefined') {
                    const img = document.createElement('img');
                    img.onload = function() {
                        try {
                            const colorThief = new ColorThief();
                            const rgb = colorThief.getColor(img);
                            if (rgb) {
                                const hex = "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
                                const yiq = ((rgb[0]*299)+(rgb[1]*587)+(rgb[2]*114))/1000;
                                const textColor = (yiq >= 128) ? 'black' : 'white';

                                GM_addStyle(`
                                    .composer-submit-button-color {
                                        background-color: ${hex} !important;
                                        color: ${textColor} !important;
                                        border: 1px solid ${hex} !important;
                                        transition: background-color 0.5s ease;
                                    }
                                    .composer-submit-button-color:hover {
                                        box-shadow: 0 0 10px ${hex};
                                        filter: brightness(1.2);
                                    }
                                    .composer-submit-button-color svg {
                                        color: ${textColor} !important;
                                    }
                                `);
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
    // PART 5: Main Observer
    // =================================================================

    const observer = new MutationObserver((mutations) => {
        const versionElement = document.querySelector(versionSelector);
        if (versionElement && versionElement.innerText.trim().length > 0 && !versionElement.dataset.glitchProcessed) {
            startGlitchLoop(versionElement, versionElement.innerText);
        }
        tryApplyQuote();
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();