function initSettings() {
    const toggles = {
        toggleGeo: { key: 'geo', default: false },
        toggleSound: { key: 'sound', default: true },
        toggleMirror: { key: 'mirror', default: true },
        toggleAI: { key: 'ai', default: true },
        toggleBeauty: { key: 'beauty', default: false },
    };
    const saved = JSON.parse(localStorage.getItem('lens_settings') || '{}');

    Object.entries(toggles).forEach(([id, { key, default: def }]) => {
        const el = document.getElementById(id);
        if (!el) return;
        const val = saved[key] !== undefined ? saved[key] : def;
        el.classList.toggle('on', val);
        el.addEventListener('click', () => {
            el.classList.toggle('on');
            saved[key] = el.classList.contains('on');
            localStorage.setItem('lens_settings', JSON.stringify(saved));
            if (key === 'mirror' && window.app?.camera) {
                window.app.camera.settings.mirror = saved[key];
            }
        });
    });
}
