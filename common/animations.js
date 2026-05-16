window.SharedUI = window.SharedUI || {};

window.SharedUI.ANIMATION_OPTIONS = [
    { value: "sweepDown", label: "Sweep Down", desc: "Reveals from top to bottom" },
    { value: "sweepUp", label: "Sweep Up", desc: "Reveals from bottom to top" },
    { value: "sweepLeft", label: "Sweep Left", desc: "Reveals from right to left" },
    { value: "sweepRight", label: "Sweep Right", desc: "Reveals from left to right" },
    { value: "fadeIn", label: "Fade In", desc: "Simple fade in" },
    { value: "zoomIn", label: "Zoom In", desc: "Zooms in from center" },
    { value: "zoomOut", label: "Zoom Out", desc: "Zooms out to normal size" },
    { value: "blur", label: "Blur", desc: "Starts blurry, becomes clear" },
    { value: "diagonalTL", label: "Diagonal TL", desc: "Diagonal reveal from top-left" },
    { value: "diagonalBR", label: "Diagonal BR", desc: "Diagonal reveal from bottom-right" },
    { value: "circleOut", label: "Circle Out", desc: "Circle expanding from center" },
    { value: "blinds", label: "Blinds", desc: "Venetian blinds effect" },
    { value: "rhombusReveal", label: "Rhombus", desc: "Diamond shape expanding from center" },
    { value: "hexagonOut", label: "Hexagon", desc: "Hexagonal reveal from center" },
    { value: "starBurst", label: "Star Burst", desc: "5-point star expanding outward" },
    { value: "pentagonOut", label: "Pentagon", desc: "Pentagon shape reveal" },
    { value: "octagonOut", label: "Octagon", desc: "Octagon expanding from center" },
    { value: "iris", label: "Iris", desc: "Camera iris/aperture opening effect" },
    { value: "splitHorizontal", label: "Split H", desc: "Splits open horizontally from center" },
    { value: "splitVertical", label: "Split V", desc: "Splits open vertically from center" },
    { value: "crossExpand", label: "Cross", desc: "Cross shape expanding to full" },
    { value: "spiralIn", label: "Spiral", desc: "Rotating zoom spiral effect" },
    { value: "waveReveal", label: "Wave", desc: "Wavy edge reveal from left" },
    { value: "triangleSweep", label: "Triangle", desc: "Triangular diagonal sweep" },
    { value: "lightning", label: "Lightning", desc: "Zigzag lightning bolt reveal" },
    { value: "shatter", label: "Shatter", desc: "Glass shatter effect with fade" },
    { value: "morphBlob", label: "Morph Blob", desc: "Organic blob morphing reveal" },
    { value: "pixelate", label: "Pixelate", desc: "Pixelated grid reveal effect" },
    { value: "vortex", label: "Vortex", desc: "Swirling vortex zoom effect" },
    { value: "glitchReveal", label: "Glitch", desc: "Glitchy slice reveal" },
    { value: "curtainDrop", label: "Curtain", desc: "Theater curtain drop effect" },
    { value: "diamondGrid", label: "Diamond Grid", desc: "Multiple diamonds expanding" }
];

window.SharedUI.EASING_OPTIONS = [
    { value: "ease", label: "Ease" },
    { value: "ease-in", label: "Ease In" },
    { value: "ease-out", label: "Ease Out" },
    { value: "ease-in-out", label: "Ease In-Out" },
    { value: "linear", label: "Linear" }
];

window.SharedUI.animationPresets = {
    sweepDown: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: inset(0 0 100% 0); }
                100% { clip-path: inset(0 0 0 0); }
            }`,
        initial: ""
    },
    sweepUp: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: inset(100% 0 0 0); }
                100% { clip-path: inset(0 0 0 0); }
            }`,
        initial: ""
    },
    sweepLeft: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: inset(0 0 0 100%); }
                100% { clip-path: inset(0 0 0 0); }
            }`,
        initial: ""
    },
    sweepRight: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: inset(0 100% 0 0); }
                100% { clip-path: inset(0 0 0 0); }
            }`,
        initial: ""
    },
    fadeIn: {
        keyframes: `
            @keyframes bgReveal {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }`,
        initial: ""
    },
    zoomIn: {
        keyframes: `
            @keyframes bgReveal {
                0% { transform: scale(0.5); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }`,
        initial: ""
    },
    zoomOut: {
        keyframes: `
            @keyframes bgReveal {
                0% { transform: scale(1.5); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }`,
        initial: ""
    },
    blur: {
        keyframes: `
            @keyframes bgReveal {
                0% { filter: blur(30px) brightness(50%); opacity: 0; }
                100% { filter: blur(0px) brightness(50%); opacity: 1; }
            }`,
        initial: "filter: blur(0px) brightness(50%);"
    },
    diagonalTL: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(0 0, 0 0, 0 0); }
                100% { clip-path: polygon(0 0, 200% 0, 0 200%); }
            }`,
        initial: ""
    },
    diagonalBR: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(100% 100%, 100% 100%, 100% 100%); }
                100% { clip-path: polygon(100% 100%, -100% 100%, 100% -100%); }
            }`,
        initial: ""
    },
    circleOut: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: circle(0% at 50% 50%); }
                100% { clip-path: circle(150% at 50% 50%); }
            }`,
        initial: ""
    },
    blinds: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: inset(0 0 0 0 round 0); opacity: 0;
                     background-size: 100% 10%; }
                50% { opacity: 0.5; }
                100% { clip-path: inset(0 0 0 0 round 0); opacity: 1;
                       background-size: cover; }
            }`,
        initial: ""
    },
    rhombusReveal: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; }
                100% { clip-path: polygon(50% -50%, 150% 50%, 50% 150%, -50% 50%); opacity: 1; }
            }`,
        initial: ""
    },
    hexagonOut: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; }
                100% { clip-path: polygon(25% -50%, 75% -50%, 125% 50%, 75% 150%, 25% 150%, -25% 50%); opacity: 1; }
            }`,
        initial: ""
    },
    starBurst: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%);
                    opacity: 0;
                    transform: rotate(-36deg) scale(0.5);
                }
                100% { 
                    clip-path: polygon(50% -50%, 61% 35%, 120% 35%, 72% 66%, 90% 130%, 50% 85%, 10% 130%, 28% 66%, -20% 35%, 39% 35%);
                    opacity: 1;
                    transform: rotate(0deg) scale(1);
                }
            }`,
        initial: ""
    },
    pentagonOut: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; }
                100% { clip-path: polygon(50% -50%, 130% 38%, 100% 140%, 0% 140%, -30% 38%); opacity: 1; }
            }`,
        initial: ""
    },
    octagonOut: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%);
                    opacity: 0;
                }
                100% { 
                    clip-path: polygon(30% -20%, 70% -20%, 120% 30%, 120% 70%, 70% 120%, 30% 120%, -20% 70%, -20% 30%);
                    opacity: 1;
                }
            }`,
        initial: ""
    },
    iris: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: circle(0% at 50% 50%);
                    opacity: 0;
                    filter: brightness(50%) saturate(0);
                }
                50% {
                    filter: brightness(50%) saturate(0.5);
                }
                100% { 
                    clip-path: circle(100% at 50% 50%);
                    opacity: 1;
                    filter: brightness(50%) saturate(1);
                }
            }`,
        initial: "filter: brightness(50%);"
    },
    splitHorizontal: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(0 50%, 100% 50%, 100% 50%, 0 50%); opacity: 0; }
                100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); opacity: 1; }
            }`,
        initial: ""
    },
    splitVertical: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(50% 0, 50% 100%, 50% 100%, 50% 0); opacity: 0; }
                100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); opacity: 1; }
            }`,
        initial: ""
    },
    crossExpand: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(45% 0, 55% 0, 55% 45%, 100% 45%, 100% 55%, 55% 55%, 55% 100%, 45% 100%, 45% 55%, 0 55%, 0 45%, 45% 45%);
                    opacity: 0;
                    transform: scale(0.3) rotate(45deg);
                }
                50% {
                    transform: scale(0.8) rotate(22.5deg);
                }
                100% { 
                    clip-path: polygon(0 0, 100% 0, 100% 0, 100% 0, 100% 100%, 100% 100%, 100% 100%, 0 100%, 0 100%, 0 100%, 0 0, 0 0);
                    opacity: 1;
                    transform: scale(1) rotate(0deg);
                }
            }`,
        initial: ""
    },
    spiralIn: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    transform: scale(0) rotate(-540deg);
                    opacity: 0;
                    filter: brightness(50%) blur(10px);
                }
                60% {
                    filter: brightness(50%) blur(2px);
                }
                100% { 
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                    filter: brightness(50%) blur(0px);
                }
            }`,
        initial: "filter: brightness(50%);"
    },
    waveReveal: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(0 0, 0 0, 0 25%, 0 25%, 0 50%, 0 50%, 0 75%, 0 75%, 0 100%, 0 100%);
                    opacity: 0;
                }
                25% {
                    clip-path: polygon(0 0, 30% 0, 20% 25%, 35% 25%, 25% 50%, 40% 50%, 30% 75%, 45% 75%, 35% 100%, 0 100%);
                }
                50% {
                    clip-path: polygon(0 0, 60% 0, 50% 25%, 70% 25%, 55% 50%, 75% 50%, 60% 75%, 80% 75%, 65% 100%, 0 100%);
                }
                100% { 
                    clip-path: polygon(0 0, 100% 0, 100% 25%, 100% 25%, 100% 50%, 100% 50%, 100% 75%, 100% 75%, 100% 100%, 0 100%);
                    opacity: 1;
                }
            }`,
        initial: ""
    },
    triangleSweep: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(0 0, 0 0, 0 0);
                    opacity: 0;
                }
                100% { 
                    clip-path: polygon(-20% -20%, 140% -20%, 140% 140%);
                    opacity: 1;
                }
            }`,
        initial: ""
    },
    lightning: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(45% 0, 55% 0, 55% 0, 45% 0);
                    opacity: 0;
                }
                20% {
                    clip-path: polygon(45% 0, 55% 0, 60% 25%, 40% 30%);
                    opacity: 0.3;
                }
                40% {
                    clip-path: polygon(45% 0, 55% 0, 65% 25%, 55% 50%, 35% 45%, 40% 30%);
                    opacity: 0.5;
                }
                60% {
                    clip-path: polygon(40% 0, 60% 0, 70% 25%, 60% 50%, 75% 75%, 25% 70%, 35% 45%, 30% 25%);
                    opacity: 0.7;
                }
                100% { 
                    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
                    opacity: 1;
                }
            }`,
        initial: ""
    },
    shatter: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    opacity: 0;
                    transform: scale(1.2);
                    filter: brightness(50%) contrast(150%) saturate(0);
                }
                15% {
                    opacity: 0.3;
                    filter: brightness(50%) contrast(130%) saturate(0.3);
                }
                30% {
                    opacity: 0.5;
                    transform: scale(1.1);
                    filter: brightness(50%) contrast(120%) saturate(0.5);
                }
                50% {
                    transform: scale(1.05);
                }
                100% { 
                    opacity: 1;
                    transform: scale(1);
                    filter: brightness(50%) contrast(100%) saturate(1);
                }
            }`,
        initial: "filter: brightness(50%);"
    },
    morphBlob: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%);
                    opacity: 0;
                }
                25% {
                    clip-path: polygon(40% 10%, 70% 5%, 90% 40%, 85% 70%, 60% 95%, 30% 90%, 5% 60%, 15% 30%);
                    opacity: 0.4;
                }
                50% {
                    clip-path: polygon(20% 0%, 85% 5%, 100% 35%, 95% 80%, 70% 100%, 15% 95%, -5% 65%, 5% 20%);
                    opacity: 0.7;
                }
                75% {
                    clip-path: polygon(5% -10%, 95% 0%, 105% 45%, 100% 90%, 80% 105%, 10% 100%, -10% 70%, 0% 15%);
                    opacity: 0.9;
                }
                100% { 
                    clip-path: polygon(0% 0%, 100% 0%, 100% 50%, 100% 100%, 50% 100%, 0% 100%, 0% 50%, 0% 0%);
                    opacity: 1;
                }
            }`,
        initial: ""
    },
    pixelate: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    opacity: 0;
                    filter: brightness(50%) blur(15px);
                    transform: scale(1.1);
                }
                25% {
                    opacity: 0.3;
                    filter: brightness(50%) blur(10px);
                }
                50% {
                    opacity: 0.6;
                    filter: brightness(50%) blur(5px);
                    transform: scale(1.05);
                }
                75% {
                    opacity: 0.85;
                    filter: brightness(50%) blur(2px);
                }
                100% { 
                    opacity: 1;
                    filter: brightness(50%) blur(0);
                    transform: scale(1);
                }
            }`,
        initial: "filter: brightness(50%);"
    },
    vortex: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: circle(0% at 50% 50%);
                    transform: scale(0.3) rotate(-720deg);
                    opacity: 0;
                    filter: brightness(50%) hue-rotate(-30deg);
                }
                50% {
                    clip-path: circle(50% at 50% 50%);
                    transform: scale(0.8) rotate(-180deg);
                    filter: brightness(50%) hue-rotate(-15deg);
                }
                100% { 
                    clip-path: circle(150% at 50% 50%);
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                    filter: brightness(50%) hue-rotate(0deg);
                }
            }`,
        initial: "filter: brightness(50%);"
    },
    glitchReveal: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
                    opacity: 0;
                }
                10% {
                    clip-path: polygon(0 0, 15% 0, 15% 100%, 0 100%);
                    opacity: 0.3;
                }
                15% {
                    clip-path: polygon(0 0, 15% 0, 15% 30%, 25% 30%, 25% 70%, 15% 70%, 15% 100%, 0 100%);
                }
                25% {
                    clip-path: polygon(0 0, 35% 0, 35% 45%, 50% 45%, 50% 55%, 35% 55%, 35% 100%, 0 100%);
                    opacity: 0.5;
                }
                35% {
                    clip-path: polygon(0 0, 50% 0, 50% 20%, 65% 20%, 65% 80%, 50% 80%, 50% 100%, 0 100%);
                }
                50% {
                    clip-path: polygon(0 0, 70% 0, 70% 35%, 85% 35%, 85% 65%, 70% 65%, 70% 100%, 0 100%);
                    opacity: 0.7;
                }
                65% {
                    clip-path: polygon(0 0, 85% 0, 85% 25%, 95% 25%, 95% 75%, 85% 75%, 85% 100%, 0 100%);
                }
                80% {
                    clip-path: polygon(0 0, 95% 0, 95% 10%, 100% 10%, 100% 90%, 95% 90%, 95% 100%, 0 100%);
                    opacity: 0.9;
                }
                100% { 
                    clip-path: polygon(0 0, 100% 0, 100% 0, 100% 0, 100% 100%, 100% 100%, 100% 100%, 0 100%);
                    opacity: 1;
                }
            }`,
        initial: ""
    },
    curtainDrop: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(0 0, 100% 0, 100% 0, 90% 0, 80% 0, 70% 0, 60% 0, 50% 0, 40% 0, 30% 0, 20% 0, 10% 0, 0 0);
                    opacity: 0;
                    transform: scaleY(0.1);
                    transform-origin: top;
                }
                50% {
                    clip-path: polygon(0 0, 100% 0, 100% 60%, 90% 55%, 80% 65%, 70% 50%, 60% 60%, 50% 55%, 40% 65%, 30% 50%, 20% 60%, 10% 55%, 0 65%);
                    opacity: 0.7;
                    transform: scaleY(0.8);
                }
                100% { 
                    clip-path: polygon(0 0, 100% 0, 100% 100%, 90% 100%, 80% 100%, 70% 100%, 60% 100%, 50% 100%, 40% 100%, 30% 100%, 20% 100%, 10% 100%, 0 100%);
                    opacity: 1;
                    transform: scaleY(1);
                }
            }`,
        initial: ""
    },
    diamondGrid: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(50% 45%, 55% 50%, 50% 55%, 45% 50%);
                    opacity: 0;
                    transform: scale(0.5);
                }
                30% {
                    clip-path: polygon(25% 20%, 50% 0%, 75% 20%, 100% 50%, 75% 80%, 50% 100%, 25% 80%, 0% 50%);
                    opacity: 0.5;
                    transform: scale(0.8);
                }
                60% {
                    clip-path: polygon(10% 0%, 50% -25%, 90% 0%, 115% 50%, 90% 100%, 50% 125%, 10% 100%, -15% 50%);
                    opacity: 0.8;
                }
                100% { 
                    clip-path: polygon(0% 0%, 50% -50%, 100% 0%, 150% 50%, 100% 100%, 50% 150%, 0% 100%, -50% 50%);
                    opacity: 1;
                    transform: scale(1);
                }
            }`,
        initial: ""
    }
};
