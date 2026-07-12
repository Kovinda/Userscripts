// ==UserScript==
// @name         IMDb Rating Fetcher
// @namespace    http://tampermonkey.net/
// @version      2025-03-21.011
// @description  try to take over the world!
// @author       You
// @match        https://dramaday.me/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dramaday.me
// @grant        GM_xmlhttpRequest
// @connect      omdbapi.com
// @connect      media-imdb.com
// @connect      imdb.com
// @connect      rottentomatoes.com
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
            flex-wrap: wrap !important;
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

        .rt-rating-badge.rt-critics:hover {
            border-color: #fa320a !important;
            background-color: #1a1919 !important;
        }

        .rt-rating-badge.rt-audience:hover {
            border-color: #2c6cb0 !important;
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

        .rt-rating-badge .rt-audience-label {
            background-color: #2c6cb0 !important;
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

    const CACHE_KEY = 'imdb_rating_fetcher_cache_v2';
    const CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    function getCachedData(title) {
        try {
            const cacheRaw = localStorage.getItem(CACHE_KEY);
            if (!cacheRaw) return null;
            const cache = JSON.parse(cacheRaw);
            const entry = cache[title];
            if (entry) {
                const now = Date.now();
                if (now - entry.timestamp < CACHE_EXPIRY) {
                    return entry.data;
                } else {
                    delete cache[title];
                    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
                }
            }
        } catch (e) {
            console.error('[IMDb Fetcher] Error reading cache:', e);
        }
        return null;
    }

    function setCachedData(title, data) {
        try {
            const cacheRaw = localStorage.getItem(CACHE_KEY);
            const cache = cacheRaw ? JSON.parse(cacheRaw) : {};
            cache[title] = {
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch (e) {
            console.error('[IMDb Fetcher] Error writing cache:', e);
        }
    }

    function cacheFailure(title) {
        setCachedData(title, {
            imdbID: '',
            imdbRating: null,
            rtCriticsScore: null,
            rtCriticsCertified: false,
            rtCriticsSentiment: 'POSITIVE',
            rtAudienceScore: null,
            rtAudienceSentiment: 'POSITIVE'
        });
    }

    // Helper to clean title strings from year/OST/soundtrack tags to improve search match accuracy
    function cleanTitle(title) {
        // Collapse all whitespace sequences (newlines, tabs, multiple spaces) into a single space
        let cleaned = title.replace(/\s+/g, ' ').trim();
        // Remove trailing year in parentheses, e.g., (2026) or (2025)
        cleaned = cleaned.replace(/\s*\(\d{4}\)/g, '');
        // Remove common suffixes like OST, SoundTrack, Part 1, etc.
        cleaned = cleaned.replace(/\s*-\s*Part\s*\d+/gi, '');
        cleaned = cleaned.replace(/\bOST\b.*/gi, '');
        cleaned = cleaned.replace(/\bSoundtrack\b.*/gi, '');
        return cleaned.trim();
    }

    async function processTitlesInChunks() {
        const titleElements = Array.from(document.querySelectorAll('.article__title.entry-title'));
        console.log('[IMDb Fetcher] Found ' + titleElements.length + ' title elements on the page.');
        if (!titleElements.length) return;

        const chunkSize = 4;
        for (let i = 0; i < titleElements.length; i += chunkSize) {
            const chunk = titleElements.slice(i, i + chunkSize);
            console.log(`[IMDb Fetcher] Processing batch of titles ${i + 1} to ${Math.min(i + chunkSize, titleElements.length)}...`);
            
            // Run all tasks in the current batch in parallel and wait for them to finish
            await Promise.all(chunk.map(titleElement => processSingleTitleCard(titleElement)));
        }
    }

    async function processSingleTitleCard(titleElement) {
        const rawTitle = titleElement.textContent.trim();
        const cleanedTitle = cleanTitle(rawTitle);
        
        // Skip empty or extremely short titles (e.g. category fragments or widgets)
        if (!cleanedTitle || cleanedTitle.length < 3) {
            console.log('[IMDb Fetcher] Skipped title (too short): "' + rawTitle + '"');
            return;
        }

        // Create a wrapper container for the rating badges
        const container = document.createElement('span');
        container.className = 'rating-badges-container';

        // Check cache first
        const cached = getCachedData(cleanedTitle);
        if (cached) {
            console.log('[IMDb Fetcher] Cache HIT for: "' + cleanedTitle + '"');
            
            // If it is a cached failure (no IMDb ID), do not render any badges at all
            if (!cached.imdbID) {
                console.log('[IMDb Fetcher] Cached title has no IMDb entry. Skipping badge rendering.');
                return;
            }
            
            // Re-create the main IMDb badge
            const badge = document.createElement('a');
            badge.className = 'imdb-rating-badge';
            badge.target = '_blank';
            badge.rel = 'noopener noreferrer';
            badge.href = `https://www.imdb.com/title/${cached.imdbID}/`;
            badge.innerHTML = `
                <span class="imdb-label">IMDb</span>
            `;
            container.appendChild(badge);
            titleElement.parentNode.insertBefore(container, titleElement.nextSibling);

            // Display cached ratings
            displayRatings(
                cached.imdbRating,
                cached.rtCriticsScore,
                cached.rtCriticsCertified,
                cached.rtCriticsSentiment,
                cached.rtAudienceScore,
                cached.rtAudienceSentiment,
                cached.imdbID,
                badge,
                container,
                cleanedTitle
            );
            return;
        }

        // Cache MISS: Proceed with standard resolution
        console.log('[IMDb Fetcher] Cache MISS. Starting resolution for title: "' + rawTitle + '" (Cleaned: "' + cleanedTitle + '")');

        // Create and insert a fallback/loading IMDb badge immediately to prevent layout shift (CLS)
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

        // Perform the resolution promise
        await new Promise((resolve) => {
            // Phase 1: Try OMDb Search first
            const searchUrl = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(cleanedTitle)}`;
            console.log('[IMDb Fetcher] Phase 1 - Querying OMDb Search for: "' + cleanedTitle + '"');
            GM_xmlhttpRequest({
                method: "GET",
                url: searchUrl,
                timeout: 5000,
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
                            console.log('[IMDb Fetcher] OMDb Search success for: "' + cleanedTitle + '" -> Found ID: ' + chosenItem.imdbID + ' ("' + chosenItem.Title + '")');
                            badge.href = `https://www.imdb.com/title/${chosenItem.imdbID}/`;
                            fetchRatings(chosenItem.imdbID, badge, container, cleanedTitle, resolve);
                        } else {
                            console.log('[IMDb Fetcher] OMDb Search failed/empty for: "' + cleanedTitle + '". Trying IMDb suggestions fallback.');
                            // Phase 2 Fallback: Try IMDb Suggestion API if OMDb search failed
                            fetchIMDbSuggestionFallback(cleanedTitle, badge, container, resolve);
                        }
                    } catch (e) {
                        console.error('[IMDb Fetcher] Error parsing IMDb search response for: "' + cleanedTitle + '"', e);
                        fetchIMDbSuggestionFallback(cleanedTitle, badge, container, resolve);
                    }
                },
                onerror: function(err) {
                    console.error('[IMDb Fetcher] Failed to perform IMDb search query for: "' + cleanedTitle + '"', err);
                    fetchIMDbSuggestionFallback(cleanedTitle, badge, container, resolve);
                },
                ontimeout: function() {
                    console.warn('[IMDb Fetcher] IMDb search query timed out for: "' + cleanedTitle + '"');
                    fetchIMDbSuggestionFallback(cleanedTitle, badge, container, resolve);
                }
            });
        });
    }

    function fetchIMDbSuggestionFallback(cleanedTitle, badge, container, resolve) {
        // Generate path-friendly search term for IMDb's autocomplete API
        const pathQuery = cleanedTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '_');
        if (!pathQuery) {
            console.log('[IMDb Fetcher] Autocomplete fallback skipped (empty pathQuery) for: "' + cleanedTitle + '"');
            cacheFailure(cleanedTitle);
            resolve();
            return;
        }
        const firstChar = pathQuery.charAt(0);
        // Skip suggestion lookup if it doesn't start with standard alphanumeric English character
        if (!/^[a-z0-9]$/.test(firstChar)) {
            console.log('[IMDb Fetcher] Autocomplete fallback skipped (starts with non-alphanumeric: "' + firstChar + '") for: "' + cleanedTitle + '"');
            cacheFailure(cleanedTitle);
            resolve();
            return;
        }
        
        const searchUrl = `https://sg.media-imdb.com/suggests/${firstChar}/${encodeURIComponent(pathQuery)}.json`;
        console.log('[IMDb Fetcher] Phase 2 - Querying IMDb Suggestions fallback for: "' + cleanedTitle + '"');
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
                            console.log('[IMDb Fetcher] IMDb Autocomplete fallback success for: "' + cleanedTitle + '" -> Found ID: ' + imdbID + ' ("' + chosenItem.l + '")');
                            
                            // Update direct page link immediately since we found the ID
                            badge.href = `https://www.imdb.com/title/${imdbID}/`;
                            
                            // Query OMDb rating by resolved ID
                            fetchRatings(imdbID, badge, container, cleanedTitle, resolve);
                            return;
                        }
                    }
                    console.warn('[IMDb Fetcher] No IMDb suggestions found in fallback for: "' + cleanedTitle + '"');
                    cacheFailure(cleanedTitle);
                    resolve();
                } catch (e) {
                    console.error('[IMDb Fetcher] Error parsing IMDb suggestion response in fallback for: "' + cleanedTitle + '"', e);
                    resolve();
                }
            },
            onerror: function(err) {
                console.error('[IMDb Fetcher] Failed to query IMDb suggestions fallback for: "' + cleanedTitle + '"', err);
                resolve();
            },
            ontimeout: function() {
                console.warn('[IMDb Fetcher] IMDb suggestions query timed out in fallback for: "' + cleanedTitle + '"');
                resolve();
            }
        });
    }

    function fetchRatings(imdbID, imdbBadgeElement, containerElement, titleQuery, onComplete) {
        const ratingUrl = `https://www.omdbapi.com/?i=${imdbID}&apikey=${API_KEY}`;
        console.log('[IMDb Fetcher] Phase 3 - Querying OMDb details rating for ID: ' + imdbID);
        GM_xmlhttpRequest({
            method: "GET",
            url: ratingUrl,
            timeout: 5000,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.Response === "True") {
                        const rtRating = data.Ratings ? data.Ratings.find(r => r.Source === "Rotten Tomatoes") : null;
                        const rtValue = rtRating ? rtRating.Value : null;
                        
                        // Always route through resolveIncompleteRatings to fetch live RT details (Tomatometer + Popcornmeter)
                        console.log('[IMDb Fetcher] OMDb details lookup succeeded. Resolving live fallbacks...');
                        resolveIncompleteRatings(imdbID, data.imdbRating, rtValue, imdbBadgeElement, containerElement, titleQuery, onComplete);
                    } else {
                        console.warn('[IMDb Fetcher] OMDb API returned false response for details: ID: ' + imdbID + ' - ' + (data.Error || 'Unknown Error'));
                        resolveIncompleteRatings(imdbID, null, null, imdbBadgeElement, containerElement, titleQuery, onComplete);
                    }
                } catch (e) {
                    console.error('[IMDb Fetcher] Error parsing rating payload for ID: ' + imdbID, e);
                    resolveIncompleteRatings(imdbID, null, null, imdbBadgeElement, containerElement, titleQuery, onComplete);
                }
            },
            onerror: function(err) {
                console.error('[IMDb Fetcher] Failed to retrieve rating details for ID: ' + imdbID, err);
                resolveIncompleteRatings(imdbID, null, null, imdbBadgeElement, containerElement, titleQuery, onComplete);
            },
            ontimeout: function() {
                console.warn('[IMDb Fetcher] IMDb rating query details timed out for ID: ' + imdbID);
                resolveIncompleteRatings(imdbID, null, null, imdbBadgeElement, containerElement, titleQuery, onComplete);
            }
        });
    }

    const rtCertifiedIcon = `
        <svg class="rt-tomato-icon" viewBox="0 0 24 24" width="12" height="12" style="display: inline-block; vertical-align: middle;">
            <path fill="#f5c518" d="M12,2L14,5L17.5,4L17,7.5L20,8L18.5,11L21,13L18,14.5L18,18L14.5,17.5L13,20L10,18.5L7,20L7.5,16.5L4,16L5.5,13L3,11L6,9.5L5.5,6L9,6.5L10.5,3.5L12,2Z"/>
            <path fill="#fa320a" d="M12,7C10.3,7 9,8.3 9,10C9,11.7 10.3,13 12,13C13.7,13 15,11.7 15,10C15,8.3 13.7,7 12,7Z"/>
        </svg>
    `;

    const rtFreshIcon = `
        <svg class="rt-tomato-icon" viewBox="0 0 24 24" fill="#fa320a" width="12" height="12" style="display: inline-block; vertical-align: middle;">
            <path d="M12,2C11.5,2 10.9,2.2 10.5,2.6C10,2.1 9.3,1.9 8.6,2.1C8,2.3 7.5,2.8 7.3,3.4C6.9,3.3 6.4,3.4 6.1,3.7C5.7,4 5.5,4.5 5.6,5C3.5,6.3 2,8.7 2,11.5C2,16.2 5.8,20 10.5,20.5C11,20.6 11.5,20.7 12,20.7C12.5,20.7 13,20.6 13.5,20.5C18.2,20 22,16.2 22,11.5C22,8.7 20.5,6.3 18.4,5C18.5,4.5 18.3,4 17.9,3.7C17.6,3.4 17.1,3.3 16.7,3.4C16.5,2.8 16,2.3 15.4,2.1C14.7,1.9 14,2.1 13.5,2.6C13.1,2.2 12.5,2 12,2Z"/>
        </svg>
    `;

    const rtRottenIcon = `
        <svg class="rt-tomato-icon" viewBox="0 0 24 24" fill="#7B9440" width="12" height="12" style="display: inline-block; vertical-align: middle;">
            <path d="M12,2C11,3 9,4 8,6C6.5,5 5,4.5 4,5.5C3,6.5 4,8.5 5,10C3.5,10.5 2,11.5 2.5,13C3,14.5 5.5,14 7,13.5C6.5,15.5 6.5,17.5 8,18.5C9.5,19.5 11,18 12.5,16.5C13.5,18 15.5,19.5 17,18.5C18.5,17.5 17.5,15.5 17,13.5C18.5,14 21,14.5 21.5,13C22,11.5 20.5,10.5 19,10C20,8.5 21,6.5 20,5.5C19,4.5 17.5,5 16,6C15,4 13,3 12,2Z"/>
        </svg>
    `;

    const audFreshIcon = `
        <svg class="rt-tomato-icon" viewBox="0 0 24 24" width="12" height="12" style="display: inline-block; vertical-align: middle;">
            <path fill="#f5c518" d="M6,7C5,7 4.5,6 5.5,5C6.5,4 8.5,4.5 9,5.5C9.5,4.5 11.5,4 12.5,5C13.5,6 13,7 13,7 Z M11,7C10.5,6 9.5,5 9,5 C8.5,5 7.5,6 7,7 Z M15,7C14.5,6 13.5,5 13,5 C12.5,5 11.5,6 11,7 Z M18,7C17.5,6 16.5,5 16,5 C15.5,5 14.5,6 14,7 Z"/>
            <path fill="#fa320a" d="M6,8L7.5,21C7.6,21.5 8,22 8.5,22L15.5,22C16,22 16.4,21.5 16.5,21L18,8 Z"/>
            <path fill="#ffffff" d="M9.3,8L10.2,22L11.8,22L10.9,8 Z M13.1,8L12.2,22L13.8,22L14.7,8 Z"/>
        </svg>
    `;

    const audSpilledIcon = `
        <svg class="rt-tomato-icon" viewBox="0 0 24 24" width="12" height="12" style="display: inline-block; vertical-align: middle;">
            <g transform="rotate(-45 12 12)">
                <path fill="#f5c518" d="M6,7C5,7 4.5,6 5.5,5C6.5,4 8.5,4.5 9,5.5C9.5,4.5 11.5,4 12.5,5C13.5,6 13,7 13,7 Z"/>
                <path fill="#7B9440" d="M6,8L7.5,21C7.6,21.5 8,22 8.5,22L15.5,22C16,22 16.4,21.5 16.5,21L18,8 Z"/>
                <path fill="#ffffff" d="M9.3,8L10.2,22L11.8,22L10.9,8 Z M13.1,8L12.2,22L13.8,22L14.7,8 Z"/>
            </g>
        </svg>
    `;

    async function resolveIncompleteRatings(imdbID, existingImdbRating, existingRtValue, imdbBadgeElement, containerElement, titleQuery, onComplete) {
        let finalImdbRating = (existingImdbRating && existingImdbRating !== "N/A") ? existingImdbRating : null;
        
        // RT ratings state
        let rtCriticsScore = existingRtValue;
        let rtCriticsCertified = false;
        let rtCriticsSentiment = 'POSITIVE';
        let rtAudienceScore = null;
        let rtAudienceSentiment = 'POSITIVE';

        const promises = [];

        // Fallback 1: IMDb rating is missing, scrape live IMDb title page
        if (!finalImdbRating) {
            promises.push(new Promise((resolve) => {
                const imdbUrl = `https://www.imdb.com/title/${imdbID}/`;
                console.log('[IMDb Fetcher] Fallback - Scraping live IMDb page: ' + imdbUrl);
                GM_xmlhttpRequest({
                    method: "GET",
                    url: imdbUrl,
                    timeout: 5000,
                    onload: function(response) {
                        try {
                            const htmlText = response.responseText;
                            const liveRating = extractIMDbRatingFromHTML(htmlText);
                            if (liveRating) {
                                console.log('[IMDb Fetcher] Live IMDb scrape success for ID: ' + imdbID + ' -> Rating: ' + liveRating);
                                finalImdbRating = liveRating;
                            }
                        } catch (e) {
                            console.error('[IMDb Fetcher] Error parsing scraped IMDb page:', e);
                        } finally {
                            resolve();
                        }
                    },
                    onerror: () => resolve(),
                    ontimeout: () => resolve()
                });
            }));
        }

        // Fallback 2: Query Rotten Tomatoes for BOTH Tomatometer and Popcornmeter
        promises.push(new Promise((resolve) => {
            const slug = titleQuery.toLowerCase()
                                   .replace(/&/g, 'and')
                                   .replace(/[^a-z0-9\s]/g, '')
                                   .trim()
                                   .replace(/\s+/g, '_');
            
            const rtTvUrl = `https://www.rottentomatoes.com/tv/${slug}`;
            console.log('[IMDb Fetcher] Fallback - Querying RT TV show: ' + rtTvUrl);
            GM_xmlhttpRequest({
                method: "GET",
                url: rtTvUrl,
                timeout: 5000,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            const rtData = parseRTPageHTML(response.responseText);
                            if (rtData && (rtData.criticsScore || rtData.audienceScore)) {
                                console.log('[IMDb Fetcher] Live RT TV scrape success for title: ' + titleQuery);
                                rtCriticsScore = rtData.criticsScore || rtCriticsScore;
                                rtCriticsCertified = rtData.criticsCertified;
                                rtCriticsSentiment = rtData.criticsSentiment;
                                rtAudienceScore = rtData.audienceScore;
                                rtAudienceSentiment = rtData.audienceSentiment;
                                resolve();
                                return;
                            }
                        } catch (e) {
                            console.error('[IMDb Fetcher] Error parsing scraped RT TV page:', e);
                        }
                    }
                    
                    // If TV page returned 404 or no rating, try Movie page
                    const rtMovieUrl = `https://www.rottentomatoes.com/m/${slug}`;
                    console.log('[IMDb Fetcher] Fallback - Querying RT Movie: ' + rtMovieUrl);
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: rtMovieUrl,
                        timeout: 5000,
                        onload: function(movieResponse) {
                            if (movieResponse.status === 200) {
                                try {
                                    const rtData = parseRTPageHTML(movieResponse.responseText);
                                    if (rtData && (rtData.criticsScore || rtData.audienceScore)) {
                                        console.log('[IMDb Fetcher] Live RT Movie scrape success for title: ' + titleQuery);
                                        rtCriticsScore = rtData.criticsScore || rtCriticsScore;
                                        rtCriticsCertified = rtData.criticsCertified;
                                        rtCriticsSentiment = rtData.criticsSentiment;
                                        rtAudienceScore = rtData.audienceScore;
                                        rtAudienceSentiment = rtData.audienceSentiment;
                                    }
                                } catch (e) {
                                    console.error('[IMDb Fetcher] Error parsing scraped RT Movie page:', e);
                                }
                            }
                            resolve();
                        },
                        onerror: () => resolve(),
                        ontimeout: () => resolve()
                    });
                },
                onerror: () => resolve(),
                ontimeout: () => resolve()
            });
        }));

        // Wait for all fallbacks to complete (or fail)
        await Promise.all(promises);

        // Save resolved data to cache
        setCachedData(titleQuery, {
            imdbID: imdbID,
            imdbRating: finalImdbRating,
            rtCriticsScore: rtCriticsScore,
            rtCriticsCertified: rtCriticsCertified,
            rtCriticsSentiment: rtCriticsSentiment,
            rtAudienceScore: rtAudienceScore,
            rtAudienceSentiment: rtAudienceSentiment
        });

        // Display whatever ratings we found/resolved
        displayRatings(finalImdbRating, rtCriticsScore, rtCriticsCertified, rtCriticsSentiment, rtAudienceScore, rtAudienceSentiment, imdbID, imdbBadgeElement, containerElement, titleQuery);
        onComplete();
    }

    function extractIMDbRatingFromHTML(htmlText) {
        try {
            // Method 1: JSON-LD parse
            const matches = htmlText.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
            if (matches) {
                const data = JSON.parse(matches[1]);
                const objects = Array.isArray(data) ? data : [data];
                for (const obj of objects) {
                    if (obj.aggregateRating && obj.aggregateRating.ratingValue) {
                        return obj.aggregateRating.ratingValue;
                    }
                }
            }
        } catch (e) {
            // Silently fall back to regex
        }
        
        // Method 2: Regex pattern matching
        const ratingMatch = htmlText.match(/"ratingValue"\s*:\s*([\d.]+)/);
        if (ratingMatch) {
            return ratingMatch[1];
        }
        
        return null;
    }

    function parseRTPageHTML(htmlText) {
        try {
            // Extract Critics rating value (tomatometer)
            const criticsScoreMatch = htmlText.match(/slot="critics-score"[^>]*>([\d%]+)<\/rt-text>/);
            const criticsScore = criticsScoreMatch ? criticsScoreMatch[1] : null;

            // Extract Critics metadata (certified, sentiment)
            const criticsIconMatch = htmlText.match(/<score-icon-critics\s+([^>]*)/);
            const criticsAttrs = criticsIconMatch ? criticsIconMatch[1] : '';
            const criticsCertified = /certified="true"/i.test(criticsAttrs);
            const criticsSentiment = criticsAttrs.match(/sentiment="([^"]+)"/i)?.[1]?.toUpperCase() || 'POSITIVE';

            // Extract Audience rating value (popcornmeter)
            const audienceScoreMatch = htmlText.match(/slot="audience-score"[^>]*>([\d%]+)<\/rt-text>/);
            const audienceScore = audienceScoreMatch ? audienceScoreMatch[1] : null;

            // Extract Audience metadata (sentiment)
            const audienceIconMatch = htmlText.match(/<score-icon-audience\s+([^>]*)/);
            const audienceAttrs = audienceIconMatch ? audienceIconMatch[1] : '';
            const audienceSentiment = audienceAttrs.match(/sentiment="([^"]+)"/i)?.[1]?.toUpperCase() || 'POSITIVE';

            return {
                criticsScore,
                criticsCertified,
                criticsSentiment,
                audienceScore,
                audienceSentiment
            };
        } catch (e) {
            console.error('[IMDb Fetcher] Error parsing RT HTML elements:', e);
        }

        // Fallback to JSON-LD for Critics Tomatometer only
        try {
            const matches = htmlText.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
            if (matches) {
                const data = JSON.parse(matches[1]);
                const objects = Array.isArray(data) ? data : [data];
                for (const obj of objects) {
                    if (obj.aggregateRating) {
                        if (obj.aggregateRating.name === "Tomatometer" && obj.aggregateRating.ratingValue) {
                            return {
                                criticsScore: obj.aggregateRating.ratingValue + '%',
                                criticsCertified: false,
                                criticsSentiment: 'POSITIVE',
                                audienceScore: null,
                                audienceSentiment: 'POSITIVE'
                            };
                        }
                    }
                }
            }
        } catch (e) {
            // Silently fail
        }

        return null;
    }

    function displayRatings(imdbRating, rtCriticsScore, rtCriticsCertified, rtCriticsSentiment, rtAudienceScore, rtAudienceSentiment, imdbID, imdbBadgeElement, containerElement, titleQuery) {
        // Update the badge link to point directly to the title page
        imdbBadgeElement.href = `https://www.imdb.com/title/${imdbID}/`;
        
        // Display IMDb rating if valid
        if (imdbRating && imdbRating !== "N/A") {
            // Check if score is already displayed to prevent duplicates
            if (!imdbBadgeElement.querySelector('.imdb-stars')) {
                const scoreSpan = document.createElement('span');
                scoreSpan.className = 'imdb-stars imdb-score-fade-in';
                scoreSpan.innerHTML = `
                    <svg class="imdb-star-icon" viewBox="0 0 24 24" fill="#f5c518" width="12" height="12">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                    <span class="imdb-score">${imdbRating}</span>
                `;
                imdbBadgeElement.appendChild(scoreSpan);
            }
        }

        // Display Rotten Tomatoes Critics rating if available
        if (rtCriticsScore) {
            if (!containerElement.querySelector('.rt-rating-badge.rt-critics')) {
                const rtBadge = document.createElement('a');
                rtBadge.className = 'rt-rating-badge rt-critics rt-badge-fade-in';
                rtBadge.target = '_blank';
                rtBadge.rel = 'noopener noreferrer';
                rtBadge.href = `https://www.rottentomatoes.com/search?search=${encodeURIComponent(titleQuery)}`;
                
                let iconHtml = rtFreshIcon;
                if (rtCriticsSentiment === 'NEGATIVE') {
                    iconHtml = rtRottenIcon;
                } else if (rtCriticsCertified) {
                    iconHtml = rtCertifiedIcon;
                }

                rtBadge.innerHTML = `
                    <span class="rt-label">RT</span>
                    <span class="rt-score-section">
                        ${iconHtml}
                        <span class="rt-score">${rtCriticsScore}</span>
                    </span>
                `;
                containerElement.appendChild(rtBadge);
            }
        }

        // Display Rotten Tomatoes Audience rating if available
        if (rtAudienceScore) {
            if (!containerElement.querySelector('.rt-rating-badge.rt-audience')) {
                const audBadge = document.createElement('a');
                audBadge.className = 'rt-rating-badge rt-audience rt-badge-fade-in';
                audBadge.target = '_blank';
                audBadge.rel = 'noopener noreferrer';
                audBadge.href = `https://www.rottentomatoes.com/search?search=${encodeURIComponent(titleQuery)}`;
                
                let iconHtml = audFreshIcon;
                if (rtAudienceSentiment === 'NEGATIVE') {
                    iconHtml = audSpilledIcon;
                }

                audBadge.innerHTML = `
                    <span class="rt-label rt-audience-label">Aud</span>
                    <span class="rt-score-section">
                        ${iconHtml}
                        <span class="rt-score">${rtAudienceScore}</span>
                    </span>
                `;
                containerElement.appendChild(audBadge);
            }
        }
    }

    // Start processing
    processTitlesInChunks();
})();
