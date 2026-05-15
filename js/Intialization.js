window.app = new App();
window.app.init().catch(e => {
    console.error('App init error:', e);
    showToast('Error initializing app', 'error');
    showScreen('permission');
});

// PWA — register service worker (inline via blob)
if ('serviceWorker' in navigator) {
    const swCode = `
    const CACHE='lens-v1';
    const ASSETS=['/']; 
    self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
    self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
  `;
    const blob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);
    navigator.serviceWorker.register(swUrl).catch(() => { });
}