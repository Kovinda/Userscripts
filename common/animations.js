window.SharedUI = window.SharedUI || {};

window.SharedUI.ANIMATION_OPTIONS = [
    { value: "sweepDown", label: "Sweep Down", desc: "Smooth cinematic reveal from top to bottom" },
    { value: "sweepUp", label: "Sweep Up", desc: "Smooth cinematic reveal from bottom to top" },
    { value: "sweepLeft", label: "Sweep Left", desc: "Elegant horizontal sweep from right to left" },
    { value: "sweepRight", label: "Sweep Right", desc: "Elegant horizontal sweep from left to right" },
    { value: "fadeIn", label: "Fade In", desc: "Subtle alpha fade transition" },
    { value: "zoomIn", label: "Zoom In", desc: "Smooth scale expansion from center" },
    { value: "zoomOut", label: "Zoom Out", desc: "Cinematic scale pull-back to normal" },
    { value: "blur", label: "Focus Blur", desc: "Premium camera focus pull effect" },
    { value: "diagonalTL", label: "Diagonal TL", desc: "Modern diagonal wipe from top-left" },
    { value: "diagonalBR", label: "Diagonal BR", desc: "Modern diagonal wipe from bottom-right" },
    { value: "circleOut", label: "Circle Out", desc: "Expanding circular aperture reveal" },
    { value: "blinds", label: "Venetian Blinds", desc: "Multi-slat vertical cascade reveal" },
    { value: "rhombusReveal", label: "Diamond Reveal", desc: "Center diamond expanding outward" },
    { value: "hexagonOut", label: "Hexagon", desc: "Geometric hexagonal expansion" },
    { value: "starBurst", label: "Star Burst", desc: "Dynamic 10-point starburst reveal" },
    { value: "pentagonOut", label: "Pentagon", desc: "Geometric pentagonal reveal" },
    { value: "octagonOut", label: "Octagon", desc: "Symmetrical octagonal expansion" },
    { value: "iris", label: "Camera Iris", desc: "Dramatic camera lens aperture opening" },
    { value: "splitHorizontal", label: "Split Horizontal", desc: "Screen splits open horizontally" },
    { value: "splitVertical", label: "Split Vertical", desc: "Screen splits open vertically" },
    { value: "crossExpand", label: "Cross Expand", desc: "Symmetrical cross opening to full screen" },
    { value: "spiralIn", label: "Spiral Zoom", desc: "Elegant rotational zoom transition" },
    { value: "waveReveal", label: "Wave Sweep", desc: "Organic wavy edge reveal" },
    { value: "triangleSweep", label: "Triangle Rise", desc: "Dynamic triangular upward expansion" },
    { value: "lightning", label: "Lightning Split", desc: "Electric zigzag center split" },
    { value: "shatter", label: "Glass Shatter", desc: "Dramatic refractive glass assembly" },
    { value: "morphBlob", label: "Organic Morph", desc: "Smooth fluid shape morph reveal" },
    { value: "pixelate", label: "Step Quantize", desc: "Retro quantized step-blur reveal" },
    { value: "vortex", label: "Vortex Swirl", desc: "Cinematic swirling vortex reveal" },
    { value: "glitchReveal", label: "Cyber Glitch", desc: "Futuristic multi-stripe slice reveal" },
    { value: "curtainDrop", label: "Curtain Drop", desc: "Theatrical draped curtain reveal" },
    { value: "diamondGrid", label: "Diamond Grid", desc: "Multi-faceted geometric diamond grid" }
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
        initial: "clip-path: inset(0 0 100% 0);"
    },
    sweepUp: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: inset(100% 0 0 0); }
                100% { clip-path: inset(0 0 0 0); }
            }`,
        initial: "clip-path: inset(100% 0 0 0);"
    },
    sweepLeft: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: inset(0 0 0 100%); }
                100% { clip-path: inset(0 0 0 0); }
            }`,
        initial: "clip-path: inset(0 0 0 100%);"
    },
    sweepRight: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: inset(0 100% 0 0); }
                100% { clip-path: inset(0 0 0 0); }
            }`,
        initial: "clip-path: inset(0 100% 0 0);"
    },
    fadeIn: {
        keyframes: `
            @keyframes bgReveal {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }`,
        initial: "opacity: 0;"
    },
    zoomIn: {
        keyframes: `
            @keyframes bgReveal {
                0% { transform: scale(0.6); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }`,
        initial: "transform: scale(0.6); opacity: 0;"
    },
    zoomOut: {
        keyframes: `
            @keyframes bgReveal {
                0% { transform: scale(1.3); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }`,
        initial: "transform: scale(1.3); opacity: 0;"
    },
    blur: {
        keyframes: `
            @keyframes bgReveal {
                0% { filter: blur(30px); opacity: 0; transform: scale(1.05); }
                100% { filter: blur(0px); opacity: 1; transform: scale(1); }
            }`,
        initial: "filter: blur(30px); opacity: 0; transform: scale(1.05);"
    },
    diagonalTL: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(0 0, 0 0, 0 0); opacity: 0; }
                100% { clip-path: polygon(0 0, 300% 0, 0 300%); opacity: 1; }
            }`,
        initial: "clip-path: polygon(0 0, 0 0, 0 0); opacity: 0;"
    },
    diagonalBR: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(100% 100%, 100% 100%, 100% 100%); opacity: 0; }
                100% { clip-path: polygon(100% 100%, -200% 100%, 100% -200%); opacity: 1; }
            }`,
        initial: "clip-path: polygon(100% 100%, 100% 100%, 100% 100%); opacity: 0;"
    },
    circleOut: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: circle(0% at 50% 50%); opacity: 0; }
                100% { clip-path: circle(150% at 50% 50%); opacity: 1; }
            }`,
        initial: "clip-path: circle(0% at 50% 50%); opacity: 0;"
    },
    blinds: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(0 0, 100% 0, 100% 0, 0 0, 0 20%, 100% 20%, 100% 20%, 0 20%, 0 40%, 100% 40%, 100% 40%, 0 40%, 0 60%, 100% 60%, 100% 60%, 0 60%, 0 80%, 100% 80%, 100% 80%, 0 80%);
                    opacity: 0;
                }
                100% { 
                    clip-path: polygon(0 0, 100% 0, 100% 20%, 0 20%, 0 20%, 100% 20%, 100% 40%, 0 40%, 0 40%, 100% 40%, 100% 60%, 0 60%, 0 60%, 100% 60%, 100% 80%, 0 80%, 0 80%, 100% 80%, 100% 100%, 0 100%);
                    opacity: 1;
                }
            }`,
        initial: "clip-path: polygon(0 0, 100% 0, 100% 0, 0 0, 0 20%, 100% 20%, 100% 20%, 0 20%, 0 40%, 100% 40%, 100% 40%, 0 40%, 0 60%, 100% 60%, 100% 60%, 0 60%, 0 80%, 100% 80%, 100% 80%, 0 80%); opacity: 0;"
    },
    rhombusReveal: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; }
                100% { clip-path: polygon(50% -150%, 250% 50%, 50% 250%, -150% 50%); opacity: 1; }
            }`,
        initial: "clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0;"
    },
    hexagonOut: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; }
                100% { clip-path: polygon(50% -150%, 225% -50%, 225% 150%, 50% 250%, -125% 150%, -125% -50%); opacity: 1; }
            }`,
        initial: "clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0;"
    },
    starBurst: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%);
                    opacity: 0;
                    transform: rotate(-90deg) scale(0.5);
                }
                100% { 
                    clip-path: polygon(50% -350%, 167% -111%, 430% -73%, 240% 111%, 284% 373%, 50% 250%, -184% 373%, -140% 111%, -330% -73%, -67% -111%);
                    opacity: 1;
                    transform: rotate(0deg) scale(1);
                }
            }`,
        initial: "clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; transform: rotate(-90deg) scale(0.5);"
    },
    pentagonOut: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; }
                100% { clip-path: polygon(50% -200%, 300% 20%, 200% 300%, -100% 300%, -200% 20%); opacity: 1; }
            }`,
        initial: "clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0;"
    },
    octagonOut: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; }
                100% { clip-path: polygon(-100% -100%, 200% -100%, 300% -50%, 300% 150%, 200% 200%, -100% 200%, -200% 150%, -200% -50%); opacity: 1; }
            }`,
        initial: "clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0;"
    },
    iris: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: circle(0% at 50% 50%); opacity: 0; transform: scale(1.05); }
                100% { clip-path: circle(150% at 50% 50%); opacity: 1; transform: scale(1); }
            }`,
        initial: "clip-path: circle(0% at 50% 50%); opacity: 0; transform: scale(1.05);"
    },
    splitHorizontal: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(0 50%, 100% 50%, 100% 50%, 0 50%); opacity: 0; }
                100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); opacity: 1; }
            }`,
        initial: "clip-path: polygon(0 50%, 100% 50%, 100% 50%, 0 50%); opacity: 0;"
    },
    splitVertical: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(50% 0, 50% 100%, 50% 100%, 50% 0); opacity: 0; }
                100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); opacity: 1; }
            }`,
        initial: "clip-path: polygon(50% 0, 50% 100%, 50% 100%, 50% 0); opacity: 0;"
    },
    crossExpand: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(45% 45%, 55% 45%, 55% 45%, 55% 45%, 55% 55%, 55% 55%, 55% 55%, 45% 55%, 45% 55%, 45% 55%, 45% 45%, 45% 45%);
                    opacity: 0;
                    transform: scale(0.5);
                }
                50% {
                    clip-path: polygon(35% 0, 65% 0, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0 65%, 0 35%, 35% 35%);
                    opacity: 1;
                    transform: scale(0.9);
                }
                100% { 
                    clip-path: polygon(0 0, 100% 0, 100% 0, 100% 0, 100% 100%, 100% 100%, 100% 100%, 0 100%, 0 100%, 0 100%, 0 0, 0 0);
                    opacity: 1;
                    transform: scale(1);
                }
            }`,
        initial: "clip-path: polygon(45% 45%, 55% 45%, 55% 45%, 55% 45%, 55% 55%, 55% 55%, 55% 55%, 45% 55%, 45% 55%, 45% 55%, 45% 45%, 45% 45%); opacity: 0; transform: scale(0.5);"
    },
    spiralIn: {
        keyframes: `
            @keyframes bgReveal {
                0% { transform: scale(0.2) rotate(-180deg); opacity: 0; filter: blur(20px); }
                100% { transform: scale(1) rotate(0deg); opacity: 1; filter: blur(0px); }
            }`,
        initial: "transform: scale(0.2) rotate(-180deg); opacity: 0; filter: blur(20px);"
    },
    waveReveal: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(0 0, 0 0, 0 25%, 0 25%, 0 50%, 0 50%, 0 75%, 0 75%, 0 100%, 0 100%);
                    opacity: 0;
                }
                33% {
                    clip-path: polygon(0 0, 30% 0, 15% 25%, 40% 25%, 25% 50%, 50% 50%, 35% 75%, 60% 75%, 40% 100%, 0 100%);
                    opacity: 0.7;
                }
                66% {
                    clip-path: polygon(0 0, 70% 0, 55% 25%, 80% 25%, 65% 50%, 90% 50%, 75% 75%, 100% 75%, 80% 100%, 0 100%);
                }
                100% { 
                    clip-path: polygon(0 0, 100% 0, 100% 25%, 100% 25%, 100% 50%, 100% 50%, 100% 75%, 100% 75%, 100% 100%, 0 100%);
                    opacity: 1;
                }
            }`,
        initial: "clip-path: polygon(0 0, 0 0, 0 25%, 0 25%, 0 50%, 0 50%, 0 75%, 0 75%, 0 100%, 0 100%); opacity: 0;"
    },
    triangleSweep: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: polygon(50% 100%, 50% 100%, 50% 100%); opacity: 0; }
                100% { clip-path: polygon(50% -150%, 250% 100%, -150% 100%); opacity: 1; }
            }`,
        initial: "clip-path: polygon(50% 100%, 50% 100%, 50% 100%); opacity: 0;"
    },
    lightning: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(51% 0, 42% 25%, 58% 50%, 45% 75%, 53% 100%, 51% 100%, 43% 75%, 56% 50%, 40% 25%, 49% 0);
                    opacity: 0;
                }
                20% {
                    clip-path: polygon(52% 0, 44% 25%, 60% 50%, 48% 75%, 55% 100%, 48% 100%, 38% 75%, 52% 50%, 36% 25%, 46% 0);
                    opacity: 0.8;
                }
                50% {
                    clip-path: polygon(70% 0, 60% 25%, 80% 50%, 70% 75%, 85% 100%, 15% 100%, 25% 75%, 20% 50%, 30% 25%, 25% 0);
                    opacity: 0.9;
                }
                100% { 
                    clip-path: polygon(100% 0, 100% 25%, 100% 50%, 100% 75%, 100% 100%, 0 100%, 0 75%, 0 50%, 0 25%, 0 0);
                    opacity: 1;
                }
            }`,
        initial: "clip-path: polygon(51% 0, 42% 25%, 58% 50%, 45% 75%, 53% 100%, 51% 100%, 43% 75%, 56% 50%, 40% 25%, 49% 0); opacity: 0;"
    },
    shatter: {
        keyframes: `
            @keyframes bgReveal {
                0% { opacity: 0; transform: scale(1.15) rotate(2deg); filter: blur(6px) contrast(140%); }
                30% { opacity: 0.7; transform: scale(1.02) rotate(-1deg); filter: blur(2px) contrast(120%); }
                100% { opacity: 1; transform: scale(1) rotate(0deg); filter: blur(0px) contrast(100%); }
            }`,
        initial: "opacity: 0; transform: scale(1.15) rotate(2deg); filter: blur(6px) contrast(140%);"
    },
    morphBlob: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%);
                    opacity: 0;
                }
                30% {
                    clip-path: polygon(40% 10%, 70% 15%, 90% 40%, 80% 75%, 60% 90%, 30% 85%, 10% 60%, 15% 30%);
                    opacity: 0.6;
                }
                65% {
                    clip-path: polygon(15% 0%, 85% 5%, 95% 35%, 90% 85%, 70% 100%, 20% 95%, 0% 65%, 5% 20%);
                    opacity: 0.9;
                }
                100% { 
                    clip-path: polygon(0% 0%, 50% 0%, 100% 0%, 100% 100%, 50% 100%, 0% 100%, 0% 50%, 0% 0%);
                    opacity: 1;
                }
            }`,
        initial: "clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0;"
    },
    pixelate: {
        keyframes: `
            @keyframes bgReveal {
                0%, 19% { filter: blur(24px); opacity: 0; transform: scale(1.1); }
                20%, 39% { filter: blur(16px); opacity: 0.3; transform: scale(1.08); }
                40%, 59% { filter: blur(10px); opacity: 0.6; transform: scale(1.05); }
                60%, 79% { filter: blur(5px); opacity: 0.85; transform: scale(1.02); }
                80%, 100% { filter: blur(0px); opacity: 1; transform: scale(1); }
            }`,
        initial: "filter: blur(24px); opacity: 0; transform: scale(1.1);"
    },
    vortex: {
        keyframes: `
            @keyframes bgReveal {
                0% { clip-path: circle(0% at 50% 50%); transform: scale(0.5) rotate(-90deg); opacity: 0; }
                100% { clip-path: circle(150% at 50% 50%); transform: scale(1) rotate(0deg); opacity: 1; }
            }`,
        initial: "clip-path: circle(0% at 50% 50%); transform: scale(0.5) rotate(-90deg); opacity: 0;"
    },
    glitchReveal: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(0 0, 0 0, 0 33%, 0 33%, 100% 33%, 100% 33%, 100% 67%, 100% 67%, 0 67%, 0 67%, 0 100%, 0 100%);
                    opacity: 0;
                }
                30% {
                    clip-path: polygon(0 0, 35% 0, 35% 33%, 0 33%, 100% 33%, 65% 33%, 65% 67%, 100% 67%, 0 67%, 40% 67%, 40% 100%, 0 100%);
                    opacity: 0.6;
                }
                70% {
                    clip-path: polygon(0 0, 80% 0, 80% 33%, 0 33%, 100% 33%, 20% 33%, 20% 67%, 100% 67%, 0 67%, 85% 67%, 85% 100%, 0 100%);
                    opacity: 0.9;
                }
                100% { 
                    clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%, 100% 33%, 0 33%, 0 67%, 100% 67%, 0 67%, 100% 67%, 100% 100%, 0 100%);
                    opacity: 1;
                }
            }`,
        initial: "clip-path: polygon(0 0, 0 0, 0 33%, 0 33%, 100% 33%, 100% 33%, 100% 67%, 100% 67%, 0 67%, 0 67%, 0 100%, 0 100%); opacity: 0;"
    },
    curtainDrop: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(0 0, 100% 0, 100% 0, 80% 0, 60% 0, 50% 0, 40% 0, 20% 0, 0 0);
                    opacity: 0;
                }
                50% {
                    clip-path: polygon(0 0, 100% 0, 100% 60%, 80% 50%, 60% 58%, 50% 48%, 40% 58%, 20% 50%, 0 60%);
                    opacity: 0.8;
                }
                100% { 
                    clip-path: polygon(0 0, 100% 0, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 0 100%);
                    opacity: 1;
                }
            }`,
        initial: "clip-path: polygon(0 0, 100% 0, 100% 0, 80% 0, 60% 0, 50% 0, 40% 0, 20% 0, 0 0); opacity: 0;"
    },
    diamondGrid: {
        keyframes: `
            @keyframes bgReveal {
                0% { 
                    clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%);
                    opacity: 0;
                    transform: scale(0.5);
                }
                30% {
                    clip-path: polygon(50% 20%, 80% 50%, 50% 80%, 20% 50%, 35% 35%, 65% 35%, 65% 65%, 35% 65%);
                    opacity: 0.6;
                    transform: scale(0.8);
                }
                100% { 
                    clip-path: polygon(50% -100%, 200% 50%, 50% 200%, -100% 50%, 0% 0%, 100% 0%, 100% 100%, 0% 100%);
                    opacity: 1;
                    transform: scale(1);
                }
            }`,
        initial: "clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); opacity: 0; transform: scale(0.5);"
    }
};

// =================================================================
// MOTION JS (motion.dev / Motion One) MINI PRESETS & INTEGRATION
// =================================================================

window.SharedUI.MOTION_OPTIONS = [
    { value: "sweepDown", label: "Sweep Down", desc: "Smooth cinematic reveal from top to bottom" },
    { value: "fadeIn", label: "Fade In", desc: "Subtle alpha fade transition" },
    { value: "zoomIn", label: "Zoom In", desc: "Smooth scale expansion from center" },
    { value: "blur", label: "Focus Blur", desc: "Premium camera focus pull effect" },
    { value: "circleOut", label: "Circle Out", desc: "Expanding circular aperture reveal" },
    { value: "rhombusReveal", label: "Diamond Reveal", desc: "Center diamond expanding outward" },
    { value: "glitchReveal", label: "Cyber Glitch", desc: "Futuristic multi-stripe slice reveal" },
    { value: "starBurst", label: "Star Burst", desc: "Dynamic 10-point starburst reveal" }
];

window.SharedUI.motionPresets = {
    sweepDown: {
        initial: { clipPath: "inset(0px 0px 100% 0px)" },
        target: { clipPath: ["inset(0px 0px 100% 0px)", "inset(0px 0px 0px 0px)"] }
    },
    fadeIn: {
        initial: { opacity: "0" },
        target: { opacity: [0, 1] }
    },
    zoomIn: {
        initial: { opacity: "0", transform: "scale(0.6)" },
        target: { opacity: [0, 1], scale: [0.6, 1] }
    },
    blur: {
        initial: { opacity: "0", filter: "blur(30px)", transform: "scale(1.05)" },
        target: { opacity: [0, 1], filter: ["blur(30px)", "blur(0px)"], scale: [1.05, 1] }
    },
    circleOut: {
        initial: { clipPath: "circle(0% at 50% 50%)", opacity: "0" },
        target: { clipPath: ["circle(0% at 50% 50%)", "circle(150% at 50% 50%)"], opacity: [0, 1] }
    },
    rhombusReveal: {
        initial: { clipPath: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)", opacity: "0" },
        target: { clipPath: ["polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)", "polygon(50% -150%, 250% 50%, 50% 250%, -150% 50%)"], opacity: [0, 1] }
    },
    glitchReveal: {
        initial: { clipPath: "polygon(0 0, 0 0, 0 33%, 0 33%, 100% 33%, 100% 33%, 100% 67%, 100% 67%, 0 67%, 0 67%, 0 100%, 0 100%)", opacity: "0" },
        target: { 
            clipPath: [
                "polygon(0 0, 0 0, 0 33%, 0 33%, 100% 33%, 100% 33%, 100% 67%, 100% 67%, 0 67%, 0 67%, 0 100%, 0 100%)",
                "polygon(0 0, 35% 0, 35% 33%, 0 33%, 100% 33%, 65% 33%, 65% 67%, 100% 67%, 0 67%, 40% 67%, 40% 100%, 0 100%)",
                "polygon(0 0, 80% 0, 80% 33%, 0 33%, 100% 33%, 20% 33%, 20% 67%, 100% 67%, 0 67%, 85% 67%, 85% 100%, 0 100%)",
                "polygon(0 0, 100% 0, 100% 33%, 0 33%, 100% 33%, 0 33%, 0 67%, 100% 67%, 0 67%, 100% 67%, 100% 100%, 0 100%)"
            ], 
            opacity: [0, 0.6, 0.9, 1] 
        }
    },
    starBurst: {
        initial: { clipPath: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%)", opacity: "0", transform: "rotate(-90deg) scale(0.5)" },
        target: { 
            clipPath: [
                "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%)",
                "polygon(50% -350%, 167% -111%, 430% -73%, 240% 111%, 284% 373%, 50% 250%, -184% 373%, -140% 111%, -330% -73%, -67% -111%)"
            ], 
            opacity: [0, 1], 
            rotate: [-90, 0], 
            scale: [0.5, 1] 
        }
    }
};

window.SharedUI.animateWithMotion = async (element, animName, options = {}) => {
    if (!element) return;
    const preset = window.SharedUI.motionPresets[animName] || window.SharedUI.motionPresets.sweepDown;
    const duration = parseFloat(options.duration) || 1.5;
    const ease = options.ease || "ease-out";

    // Set initial resting state
    if (preset.initial) {
        Object.assign(element.style, preset.initial);
    }

    try {
        const { animate } = await import("https://cdn.jsdelivr.net/npm/motion@11.13.5/mini/+esm");
        return animate(element, preset.target, { duration, ease });
    } catch (err) {
        console.error("[SharedUI] Motion JS import/animation failed:", err);
    }
};

