function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src; s.async = true;
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
    });
}

let _activeScreen = 'splash';
function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active', 'slide-left', 'slide-right');
    });
    const target = document.getElementById(name);
    target.classList.add('active');
    _activeScreen = name;
}

function showToast(msg, type = '') {
    const tc = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    tc.appendChild(t);
    setTimeout(() => t.remove(), 3200);
}

function triggerShutter() {
    const flash = document.getElementById('shutterFlash');
    flash.style.animation = 'none';
    flash.style.opacity = '0.6';
    requestAnimationFrame(() => {
        flash.style.animation = 'shutterFlash 0.4s ease forwards';
    });
}

function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
}

function formatDuration(seconds) {
    const m = Math.floor(seconds / 60), s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

// QR Scanner (manual canvas sampling)
function scanQR(video) {
    if (typeof jsQR === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = video.videoWidth; c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);
    const imageData = c.getContext('2d').getImageData(0, 0, c.width, c.height);
    return jsQR(imageData.data, imageData.width, imageData.height);
}