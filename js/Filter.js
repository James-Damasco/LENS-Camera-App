const FILTERS = [
    { id: 'normal', name: 'Normal', css: 'none', class: '' },
    { id: 'vivid', name: 'Vivid', css: 'saturate(1.9) contrast(1.1)', class: 'vivid' },
    { id: 'vintage', name: 'Vintage', css: 'sepia(0.55) contrast(1.1) brightness(0.9) saturate(0.8)', class: 'vintage' },
    { id: 'bw', name: 'B&W', css: 'grayscale(1) contrast(1.15)', class: 'bw' },
    { id: 'sepia', name: 'Sepia', css: 'sepia(1)', class: 'sepia' },
    { id: 'neon', name: 'Neon', css: 'saturate(2.2) brightness(1.2) hue-rotate(30deg) contrast(1.3)', class: 'neon' },
    { id: 'cyberpunk', name: 'Cyber', css: 'hue-rotate(180deg) saturate(2) contrast(1.4) brightness(0.9)', class: 'cyberpunk' },
    { id: 'vhs', name: 'VHS', css: 'contrast(1.3) saturate(0.8) brightness(0.95) sepia(0.2)', class: 'vhs' },
    { id: 'cinematic', name: 'Cinema', css: 'contrast(1.2) saturate(0.85) brightness(0.85)', class: 'cinematic' },
    { id: 'cold', name: 'Cold', css: 'hue-rotate(200deg) saturate(1.1) brightness(1.05)', class: 'cold' },
    { id: 'warm', name: 'Warm', css: 'hue-rotate(-20deg) saturate(1.4) brightness(1.05)', class: 'warm' },
    { id: 'fade', name: 'Fade', css: 'contrast(0.8) brightness(1.1) saturate(0.7)', class: 'fade' },
    { id: 'chrome', name: 'Chrome', css: 'contrast(1.4) saturate(0.1) brightness(1.1)', class: 'chrome' },
    { id: 'glitch', name: 'Glitch', css: 'contrast(1.5) saturate(2) hue-rotate(90deg) brightness(1.1)', class: 'glitch' },
];

const STICKERS = ['😍', '🔥', '✨', '💎', '👑', '🎬', '🎵', '🌈', '⚡', '🦋', '🌸', '💫', '🎭', '🏆', '🎯'];