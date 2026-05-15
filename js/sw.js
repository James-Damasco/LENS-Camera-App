(function () {
    const manifest = {
        name: 'LENS AI Camera',
        short_name: 'LENS',
        description: 'AI-powered camera app',
        start_url: '.',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        orientation: 'portrait',
        icons: [{
            src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' fill='%23000'/%3E%3Ccircle cx='256' cy='256' r='100' stroke='%2300f0ff' stroke-width='20' fill='none'/%3E%3Ccircle cx='256' cy='256' r='40' fill='%2300f0ff'/%3E%3C/svg%3E",
            sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable'
        }]
    };
    const el = document.createElement('link');
    el.rel = 'manifest';
    el.href = 'data:application/manifest+json,' + encodeURIComponent(JSON.stringify(manifest));
    document.head.appendChild(el);
})();