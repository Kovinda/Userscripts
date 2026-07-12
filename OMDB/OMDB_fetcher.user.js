// ==UserScript==
// @name         IMDb Rating Fetcher
// @namespace    http://tampermonkey.net/
// @version      2025-03-21
// @description  try to take over the world!
// @author       You
// @match        https://dramaday.me/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dramaday.me
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==


(function() {
    'use strict';

    // Inject custom styles for the IMDb rating badge
    const style = document.createElement('style');
    style.textContent = `
        .imdb-rating-badge {
            display: inline-flex !important;
            align-items: center !important;
            font-family: 'Lato', sans-serif !important;
            font-size: 11px !important;
            height: 20px !important;
            background-color: rgba(26, 25, 25, 0.9) !important;
            color: #ffffff !important;
            border-radius: 4px !important;
            overflow: hidden !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12) !important;
            margin: 6px 0 8px 0 !important;
            text-decoration: none !important;
            vertical-align: middle !important;
            width: fit-content !important;
            transition: all 0.2s ease-in-out !important;
            line-height: 1 !important;
        }

        .imdb-rating-badge:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
            border-color: #f5c518 !important;
            background-color: #1a1919 !important;
            color: #ffffff !important;
        }

        .imdb-rating-badge .imdb-label {
            background-color: #f5c518 !important;
            color: #000000 !important;
            font-weight: 850 !important;
            padding: 0 6px !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            letter-spacing: -0.2px !important;
            font-size: 10px !important;
            text-transform: uppercase !important;
        }

        .imdb-rating-badge .imdb-stars {
            padding: 0 6px !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            gap: 4px !important;
        }

        .imdb-rating-badge .imdb-score {
            color: #ffffff !important;
            font-weight: 700 !important;
            font-size: 11px !important;
        }

        .imdb-rating-badge .imdb-star-icon {
            display: inline-block !important;
            flex-shrink: 0 !important;
        }
    `;
    document.head.appendChild(style);

    const API_KEY = '73041d6a'; // Replace with your OMDb API key if needed
    const titleElements = document.querySelectorAll('.article__title.entry-title');
    if (!titleElements.length) return;

    // Helper to clean title strings from year/OST/soundtrack tags to improve search match accuracy
    function cleanTitle(title) {
        let cleaned = title.trim();
        // Remove trailing year in parentheses, e.g., (2026) or (2025)
        cleaned = cleaned.replace(/\s*\(\d{4}\)/g, '');
        // Remove common suffixes like OST, SoundTrack, Part 1, etc.
        cleaned = cleaned.replace(/\s*-\s*Part\s*\d+/gi, '');
        cleaned = cleaned.replace(/\s*OST\s*.*/gi, '');
        cleaned = cleaned.replace(/\s*Soundtrack\s*.*/gi, '');
        return cleaned.trim();
    }

    titleElements.forEach(titleElement => {
        const rawTitle = titleElement.textContent.trim();
        const cleanedTitle = cleanTitle(rawTitle);
        
        // Create and insert a fallback/loading badge immediately to prevent layout shift (CLS)
        const badge = document.createElement('a');
        badge.className = 'imdb-rating-badge';
        badge.target = '_blank';
        badge.rel = 'noopener noreferrer';
        // Fallback search link directly to IMDb's smart search engine
        badge.href = `https://www.imdb.com/find?q=${encodeURIComponent(cleanedTitle)}`;
        badge.innerHTML = `
            <span class="imdb-label">IMDb</span>
            <span class="imdb-stars">
                <span class="imdb-score">N/A</span>
            </span>
        `;
        titleElement.parentNode.insertBefore(badge, titleElement.nextSibling);

        const searchUrl = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(cleanedTitle)}`;

        GM_xmlhttpRequest({
            method: "GET",
            url: searchUrl,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.Response === "True" && data.Search.length > 0) {
                        // Find the best match from the search results
                        let bestMatch = data.Search.find(item => item.Title.toLowerCase() === cleanedTitle.toLowerCase());
                        if (!bestMatch) {
                            // Secondary fallback matching stripping non-alphanumeric chars
                            const cleanQuery = cleanedTitle.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().trim();
                            bestMatch = data.Search.find(item => item.Title.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().trim() === cleanQuery);
                        }
                        
                        const chosenItem = bestMatch || data.Search[0];
                        fetchIMDbRating(chosenItem.imdbID, badge);
                    } else {
                        console.warn("No IMDb search results found for:", cleanedTitle);
                    }
                } catch (e) {
                    console.error("Error parsing IMDb search response:", e);
                }
            },
            onerror: function() {
                console.error("Failed to perform IMDb search query.");
            }
        });
    });

    function fetchIMDbRating(imdbID, badgeElement) {
        const ratingUrl = `https://www.omdbapi.com/?i=${imdbID}&apikey=${API_KEY}`;
        GM_xmlhttpRequest({
            method: "GET",
            url: ratingUrl,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.Response === "True") {
                        // Update the badge link to point directly to the title page
                        badgeElement.href = `https://www.imdb.com/title/${imdbID}/`;
                        
                        // Update rating display if a valid rating exists (and is not N/A)
                        if (data.imdbRating && data.imdbRating !== "N/A") {
                            badgeElement.innerHTML = `
                                <span class="imdb-label">IMDb</span>
                                <span class="imdb-stars">
                                    <svg class="imdb-star-icon" viewBox="0 0 24 24" fill="#f5c518" width="12" height="12">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                                    </svg>
                                    <span class="imdb-score">${data.imdbRating}</span>
                                </span>
                            `;
                        }
                    }
                } catch (e) {
                    console.error("Error parsing rating payload:", e);
                }
            },
            onerror: function() {
                console.error("Failed to retrieve rating for IMDb ID:", imdbID);
            }
        });
    }
})();

