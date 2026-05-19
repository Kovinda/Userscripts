window.SharedUI = window.SharedUI || {};

(function() {
    'use strict';

    let lastWallpaperIdentifier = null;

    /**
     * Extracts a unique fingerprint from response headers using standard ETag, Last-Modified, or Content-Length.
     */
    function getFingerprint(responseHeaders) {
        if (!responseHeaders) return null;
        const lastModified = responseHeaders.match(/last-modified:\s*(.+)/i)?.[1];
        const contentLength = responseHeaders.match(/content-length:\s*(.+)/i)?.[1];
        const etag = responseHeaders.match(/etag:\s*(.+)/i)?.[1];
        return etag || (lastModified ? `${lastModified}-${contentLength || ''}` : contentLength);
    }

    /**
     * Periodically check for wallpaper updates and trigger a callback with the new dataUrl when a change is detected.
     * @param {string} wallpaperUrl - The active wallpaper endpoint URL.
     * @param {function} onUpdateCallback - The function to call when a new image is successfully fetched. Pass the base64 dataUrl as the first argument.
     * @param {number} intervalMs - Frequency in milliseconds (default 60000).
     */
    function startWallpaperPoller(wallpaperUrl, onUpdateCallback, intervalMs = 60000) {
        setInterval(() => {
            const checkUrl = `${wallpaperUrl.split('?')[0]}?rand=${Math.random()}`;
            GM_xmlhttpRequest({
                method: 'HEAD',
                url: checkUrl,
                onload: function(response) {
                    if (response.status === 200) {
                        const currentFingerprint = getFingerprint(response.responseHeaders);
                        if (currentFingerprint && lastWallpaperIdentifier && lastWallpaperIdentifier !== currentFingerprint) {
                            console.log('[Wallpaper Service] Wallpaper update detected! Fetching new source...');
                            lastWallpaperIdentifier = currentFingerprint;
                            
                            // Fetch full new image
                            GM_xmlhttpRequest({
                                method: 'GET',
                                url: checkUrl,
                                responseType: 'blob',
                                onload: function(getResponse) {
                                    if (getResponse.status === 200) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => onUpdateCallback(reader.result);
                                        reader.readAsDataURL(getResponse.response);
                                    }
                                }
                            });
                        } else if (currentFingerprint && !lastWallpaperIdentifier) {
                            lastWallpaperIdentifier = currentFingerprint;
                        }
                    }
                }
            });
        }, intervalMs);
    }

    // Attach to SharedUI namespace
    window.SharedUI.Wallpaper = {
        getFingerprint: getFingerprint,
        startPoller: startWallpaperPoller,
        setInitialFingerprint: function(responseHeaders) {
            lastWallpaperIdentifier = getFingerprint(responseHeaders);
        }
    };
})();
