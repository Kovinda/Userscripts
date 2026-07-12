// ==UserScript==
// @name         IMDb Rating Fetcher
// @namespace    http://tampermonkey.net/
// @version      2025-03-21.004
// @description  try to take over the world!
// @author       You
// @match        https://dramaday.me/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dramaday.me
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// @updateURL    https://github.com/Kovinda/Userscripts/raw/refs/heads/main/OMDB/OMDB_fetcher.user.js
// @downloadURL  https://github.com/Kovinda/Userscripts/raw/refs/heads/main/OMDB/OMDB_fetcher.user.js
// ==/UserScript==


(function() {
    'use strict';

    // Inject custom styles for the IMDb and Rotten Tomatoes rating badges
    const style = document.createElement('style');
    style.textContent = `
        @keyframes badgeFadeIn {
            from {
                opacity: 0;
                transform: translateX(-5px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .rating-badges-container {
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            margin: 6px 0 8px 0 !important;
            vertical-align: middle !important;
        }

        .imdb-rating-badge, .rt-rating-badge {
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
            text-decoration: none !important;
            width: fit-content !important;
            transition: all 0.2s ease-in-out !important;
            line-height: 1 !important;
        }

        .imdb-rating-badge:hover, .rt-rating-badge:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
            color: #ffffff !important;
        }

        .imdb-rating-badge:hover {
            border-color: #f5c518 !important;
        }

        .rt-rating-badge:hover {
            border-color: #fa320a !important;
            background-color: #1a1919 !important;
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

        .rt-rating-badge .rt-label {
            background-color: #fa320a !important;
            color: #ffffff !important;
            font-weight: 850 !important;
            padding: 0 6px !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            font-size: 10px !important;
            text-transform: uppercase !important;
        }

        .imdb-rating-badge .imdb-stars, .rt-rating-badge .rt-score-section {
            padding: 0 6px !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            gap: 4px !important;
        }

        .imdb-score-fade-in {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            animation: badgeFadeIn 0.4s ease-out forwards !important;
        }

        .rt-badge-fade-in {
            animation: badgeFadeIn 0.4s ease-out forwards !important;
        }

        .imdb-rating-badge .imdb-score, .rt-rating-badge .rt-score {
            color: #ffffff !important;
            font-weight: 700 !important;
            font-size: 11px !important;
        }

        .imdb-rating-badge .imdb-star-icon, .rt-rating-badge .rt-tomato-icon {
            display: inline-block !important;
            flex-shrink: 0 !important;
        }
    `;
    document.head.appendChild(style);

    const API_KEY = '73041d6a'; // Replace with your OMDb API key if needed

    // Helper to clean title strings from year/OST/soundtrack tags to improve search match accuracy
    function cleanTitle(title) {
        // Collapse all whitespace sequences (newlines, tabs, multiple spaces) into a single space
        let cleaned = title.replace(/\s+/g, ' ').trim();
        // Remove trailing year in parentheses, e.g., (2026) or (2025)
        cleaned = cleaned.replace(/\s*\(\d{4}\)/g, '');
        // Remove common suffixes like OST, SoundTrack, Part 1, etc.
        cleaned = cleaned.replace(/\s*-\s*Part\s*\d+/gi, '');
        cleaned = cleaned.replace(/\s*OST\s*.*/gi, '');
        cleaned = cleaned.replace(/\s*Soundtrack\s*.*/gi, '');
        return cleaned.trim();
    }

    async function processTitlesSequentially() {
        const titleElements = Array.from(document.querySelectorAll('.article__title.entry-title'));
        if (!titleElements.length) return;

        for (const titleElement of titleElements) {
            const rawTitle = titleElement.textContent.trim();
            const cleanedTitle = cleanTitle(rawTitle);
            
            // Skip empty or extremely short titles (e.g. category fragments or widgets)
            if (!cleanedTitle || cleanedTitle.length < 3) {
                continue;
            }
            
            // Create a wrapper container for the rating badges
            const container = document.createElement('span');
            container.className = 'rating-badges-container';

            // Create and insert a fallback/loading IMDb badge immediately to prevent layout shift (CLS)
            // It initially shows ONLY the yellow "IMDb" label without score or N/A
            const badge = document.createElement('a');
            badge.className = 'imdb-rating-badge';
            badge.target = '_blank';
            badge.rel = 'noopener noreferrer';
            // Default search link directly to IMDb's search page
            badge.href = `https://www.imdb.com/find?q=${encodeURIComponent(cleanedTitle)}`;
            badge.innerHTML = `
                <span class="imdb-label">IMDb</span>
            `;
            container.appendChild(badge);
            titleElement.parentNode.insertBefore(container, titleElement.nextSibling);

            // Execute the fetch for this specific card and wait for it to complete/timeout
            await new Promise((resolve) => {
                // Generate path-friendly search term for IMDb's autocomplete API
                const pathQuery = cleanedTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '_');
                if (!pathQuery) {
                    resolve();
                    return;
                }
                const firstChar = pathQuery.charAt(0);
                const searchUrl = `https://sg.media-imdb.com/suggests/${firstChar}/${encodeURIComponent(pathQuery)}.json`;

                GM_xmlhttpRequest({
                    method: "GET",
                    url: searchUrl,
                    timeout: 5000,
                    onload: function(response) {
                        try {
                            const text = response.responseText;
                            const start = text.indexOf('(') + 1;
                            const end = text.lastIndexOf(')');
                            if (start > 0 && end > start) {
                                const data = JSON.parse(text.substring(start, end));
                                if (data && data.d && data.d.length > 0) {
                                    // Find the best match from the suggestion results
                                    let bestMatch = data.d.find(item => item.l.toLowerCase() === cleanedTitle.toLowerCase());
                                    if (!bestMatch) {
                                        const cleanQuery = cleanedTitle.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().trim();
                                        bestMatch = data.d.find(item => item.l.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().trim() === cleanQuery);
                                    }
                                    
                                    const chosenItem = bestMatch || data.d[0];
                                    const imdbID = chosenItem.id;
                                    
                                    // Update the link to the direct IMDb page immediately since we have the ID resolved
                                    badge.href = `https://www.imdb.com/title/${imdbID}/`;
                                    
                                    // Fetch detailed rating data from OMDb API by ID
                                    fetchRatings(imdbID, badge, container, cleanedTitle, resolve);
                                    return;
                                }
                            }
                            console.warn("No IMDb suggestions found for:", cleanedTitle);
                            resolve();
                        } catch (e) {
                            console.error("Error parsing IMDb suggestion response:", e);
                            resolve();
                        }
                    },
                    onerror: function() {
                        console.error("Failed to query IMDb suggestions.");
                        resolve();
                    },
                    ontimeout: function() {
                        console.warn("IMDb suggestions query timed out for:", cleanedTitle);
                        resolve();
                    }
                });
            });
        }
    }

    function fetchRatings(imdbID, imdbBadgeElement, containerElement, titleQuery, onComplete) {
        const ratingUrl = `https://www.omdbapi.com/?i=${imdbID}&apikey=${API_KEY}`;
        GM_xmlhttpRequest({
            method: "GET",
            url: ratingUrl,
            timeout: 5000,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.Response === "True") {
                        // Update IMDb rating display if a valid rating exists (and is not N/A)
                        if (data.imdbRating && data.imdbRating !== "N/A") {
                            const scoreSpan = document.createElement('span');
                            scoreSpan.className = 'imdb-stars imdb-score-fade-in';
                            scoreSpan.innerHTML = `
                                <svg class="imdb-star-icon" viewBox="0 0 24 24" fill="#f5c518" width="12" height="12">
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                                </svg>
                                <span class="imdb-score">${data.imdbRating}</span>
                            `;
                            imdbBadgeElement.appendChild(scoreSpan);
                        }

                        // 2. Parse and display Rotten Tomatoes rating if available (fade it in)
                        const rtRating = data.Ratings ? data.Ratings.find(r => r.Source === "Rotten Tomatoes") : null;
                        if (rtRating && rtRating.Value) {
                            const rtBadge = document.createElement('a');
                            rtBadge.className = 'rt-rating-badge rt-badge-fade-in';
                            rtBadge.target = '_blank';
                            rtBadge.rel = 'noopener noreferrer';
                            // Link RT badge directly to RT search for that drama title
                            rtBadge.href = `https://www.rottentomatoes.com/search?search=${encodeURIComponent(titleQuery)}`;
                            rtBadge.innerHTML = `
                                <span class="rt-label">RT</span>
                                <span class="rt-score-section">
                                    <svg class="rt-tomato-icon" viewBox="0 0 24 24" fill="#fa320a" width="12" height="12">
                                        <path d="M12,2C11.5,2 10.9,2.2 10.5,2.6C10,2.1 9.3,1.9 8.6,2.1C8,2.3 7.5,2.8 7.3,3.4C6.9,3.3 6.4,3.4 6.1,3.7C5.7,4 5.5,4.5 5.6,5C3.5,6.3 2,8.7 2,11.5C2,16.2 5.8,20 10.5,20.5C11,20.6 11.5,20.7 12,20.7C12.5,20.7 13,20.6 13.5,20.5C18.2,20 22,16.2 22,11.5C22,8.7 20.5,6.3 18.4,5C18.5,4.5 18.3,4 17.9,3.7C17.6,3.4 17.1,3.3 16.7,3.4C16.5,2.8 16,2.3 15.4,2.1C14.7,1.9 14,2.1 13.5,2.6C13.1,2.2 12.5,2 12,2Z"/>
                                    </svg>
                                    <span class="rt-score">${rtRating.Value}</span>
                                </span>
                            `;
                            containerElement.appendChild(rtBadge);
                        }
                    }
                } catch (e) {
                    console.error("Error parsing rating payload:", e);
                } finally {
                    onComplete();
                }
            },
            onerror: function() {
                console.error("Failed to retrieve rating for IMDb ID:", imdbID);
                onComplete();
            },
            ontimeout: function() {
                console.warn("IMDb rating query timed out for ID:", imdbID);
                onComplete();
            }
        });
    }

    // Start processing
    processTitlesSequentially();
})();
