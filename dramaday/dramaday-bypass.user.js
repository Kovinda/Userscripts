// ==UserScript==
// @name         Dramaday & Riviwi Link Bypass
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Bypasses the countdown timers and intermediate verification buttons on Riviwi / Dramaday redirect links to take you directly to the destination link.
// @author       Antigravity
// @match        https://riviwi.com/*
// @match        https://*.riviwi.com/*
// @grant        none
// @run-at       document-start
// ==UserScript==

(function () {
    'use strict';

    // Fast-forward setTimeouts for Soralink countdowns
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function (callback, delay, ...args) {
        // If the delay is the 5-second countdown or verification timer, trigger immediately
        if (delay === 5000 || delay === 1000) {
            return originalSetTimeout(callback, 0, ...args);
        }
        return originalSetTimeout(callback, delay, ...args);
    };

    function autoClickVerification() {
        // 1. Check if the verification button exists and click it immediately
        const verifBtn = document.querySelector('#lite-human-verif-button, #soradodo, a[id*="verif"], button[id*="verif"]');
        if (verifBtn) {
            verifBtn.style.display = 'block';
            verifBtn.click();
            return;
        }

        // 2. Alternatively, check if soralinklite data exists in localStorage
        try {
            const soralinkData = localStorage.getItem('soralinklite');
            if (soralinkData) {
                const parsed = JSON.parse(soralinkData);
                for (const key in parsed) {
                    if (parsed[key] && parsed[key].url && typeof parsed[key].url === 'string') {
                        window.location.href = parsed[key].url;
                        return;
                    }
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    }

    // Run as early as possible and observe DOM additions
    document.addEventListener('DOMContentLoaded', () => {
        autoClickVerification();

        const observer = new MutationObserver(() => {
            autoClickVerification();
        });

        observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true
        });
    });
})();
