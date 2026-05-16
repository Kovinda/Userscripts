window.SharedUI = window.SharedUI || {};

window.SharedUI.ensureVibrant = function() {
    const existing = window.Vibrant || (typeof Vibrant !== 'undefined' ? Vibrant : null);
    if (existing) return Promise.resolve(existing);

    const sources = [
        'https://unpkg.com/node-vibrant@latest/dist/vibrant.min.js',
        'https://cdn.jsdelivr.net/npm/node-vibrant@latest/dist/vibrant.min.js'
    ];

    return new Promise((resolve, reject) => {
        const loadNext = (index) => {
            if (index >= sources.length) {
                reject(new Error('node-vibrant failed to load from all sources'));
                return;
            }

            const script = document.createElement('script');
            script.src = sources[index];
            script.async = true;
            script.onload = () => {
                const loaded = window.Vibrant || (typeof Vibrant !== 'undefined' ? Vibrant : null);
                if (loaded) resolve(loaded);
                else loadNext(index + 1);
            };
            script.onerror = () => loadNext(index + 1);
            (document.head || document.documentElement).appendChild(script);
        };

        loadNext(0);
    });
};

window.SharedUI.extractPalette = function(dataUrl) {
    return window.SharedUI.ensureVibrant()
        .then((VibrantLib) => VibrantLib.from(dataUrl).getPalette())
        .then((palette) => {
            const swatchOrder = ['Vibrant', 'LightVibrant', 'DarkVibrant', 'Muted', 'LightMuted', 'DarkMuted'];
            const swatchList = swatchOrder.map((name) => palette[name]).filter(Boolean);

            if (!swatchList.length) {
                throw new Error('node-vibrant returned no swatches.');
            }

            const primarySwatch = palette.Vibrant || swatchList[0];
            return {
                primary: primarySwatch.rgb,
                colors: swatchList.map((swatch) => swatch.rgb),
                hex: swatchList.map((swatch) => swatch.hex),
                rgba: (rgb, alpha) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`,
                swatches: palette
            };
        });
};
