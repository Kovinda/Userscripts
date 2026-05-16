window.SharedUI = window.SharedUI || {};

window.SharedUI.getTextColor = function(rgb) {
    const yiq = ((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000;
    return yiq >= 128 ? 'black' : 'white';
};

window.SharedUI.parseCssRgb = function(value) {
    if (!value) return null;
    const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return null;
    return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
};

window.SharedUI.rgbToHex = function(rgb) {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
};

window.SharedUI.darkenRgb = function(rgb, amount) {
    return rgb.map((c) => Math.max(0, Math.min(255, Math.round(c * (1 - amount)))));
};
