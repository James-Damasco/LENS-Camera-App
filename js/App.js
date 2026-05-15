'use strict';

// ----------------------------------------------------------------
// 1. CONSTANTS & FILTER DEFINITIONS
// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
// 2. DATABASE MODULE (IndexedDB)
// ----------------------------------------------------------------

class DB {
    constructor() {
        this.name = 'LensCameraDB';
        this.version = 1;
        this.db = null;
    }

    async open() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.name, this.version);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('media')) {
                    const store = db.createObjectStore('media', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('favorite', 'favorite', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
            req.onsuccess = e => { this.db = e.target.result; resolve(); };
            req.onerror = e => reject(e.target.error);
        });
    }

    async add(item) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('media', 'readwrite');
            const req = tx.objectStore('media').add(item);
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e.target.error);
        });
    }

    async getAll() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('media', 'readonly');
            const req = tx.objectStore('media').getAll();
            req.onsuccess = e => resolve(e.target.result.reverse());
            req.onerror = e => reject(e.target.error);
        });
    }

    async get(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('media', 'readonly');
            const req = tx.objectStore('media').get(id);
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e.target.error);
        });
    }

    async update(id, changes) {
        return new Promise(async (resolve, reject) => {
            const item = await this.get(id);
            Object.assign(item, changes);
            const tx = this.db.transaction('media', 'readwrite');
            const req = tx.objectStore('media').put(item);
            req.onsuccess = () => resolve();
            req.onerror = e => reject(e.target.error);
        });
    }

    async delete(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('media', 'readwrite');
            const req = tx.objectStore('media').delete(id);
            req.onsuccess = () => resolve();
            req.onerror = e => reject(e.target.error);
        });
    }
}

// ----------------------------------------------------------------
// 3. CAMERA MODULE
// ----------------------------------------------------------------

class CameraModule {
    constructor() {
        this.stream = null;
        this.facingMode = 'environment';
        this.mode = 'photo';
        this.zoom = 1.0;
        this.filter = FILTERS[0];
        this.intensity = 100;
        this.flashMode = 'off';
        this.isRecording = false;
        this.recorder = null;
        this.chunks = [];
        this.recTimer = null;
        this.recSeconds = 0;
        this.timerVal = 0;
        this.timerCountdown = null;
        this.video = document.getElementById('cameraVideo');
        this.settings = { mirror: true, sound: true, geo: false };
    }

    async start() {
        if (this.stream) this.stop();
        const constraints = {
            video: {
                facingMode: this.facingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                aspectRatio: { ideal: 16 / 9 }
            },
            audio: this.mode === 'video'
        };
        try {
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            await this.video.play();
            this.applyFilter(this.filter, this.intensity);
            return true;
        } catch (e) {
            console.error('Camera error:', e);
            return false;
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
    }

    async flip() {
        this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
        this.video.style.transform = this.facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
        await this.start();
    }

    applyFilter(filter, intensity) {
        this.filter = filter;
        this.intensity = intensity;
        if (filter.id === 'normal' || intensity === 0) {
            this.video.style.filter = 'none';
        } else if (intensity < 100) {
            // Blend by reducing intensity (mix filter with none)
            this.video.style.filter = filter.css;
            this.video.style.opacity = 0.5 + intensity / 200;
        } else {
            this.video.style.filter = filter.css;
        }
        if (this.mode === 'portrait') {
            const blur = this.video.style.filter;
            // Portrait: fake bokeh via vignette on canvas overlay
        }
        if (this.mode === 'night') {
            this.video.style.filter += ' brightness(1.4)';
        }
    }

    setZoom(z) {
        this.zoom = Math.max(1, Math.min(5, z));
        this.video.style.transform = (this.facingMode === 'user' ? 'scaleX(-1) ' : '') + `scale(${this.zoom})`;
        document.getElementById('zoomLevel').textContent = this.zoom.toFixed(1) + '×';
        const badge = document.getElementById('zoomBadge');
        badge.textContent = this.zoom.toFixed(1) + '×';
        badge.style.opacity = '1';
        clearTimeout(this._zoomHide);
        this._zoomHide = setTimeout(() => badge.style.opacity = '0', 1500);
    }

    capturePhoto() {
        const canvas = document.createElement('canvas');
        canvas.width = this.video.videoWidth || 1280;
        canvas.height = this.video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        // Apply CSS filter through canvas
        if (this.filter.id !== 'normal' && this.intensity > 0) {
            ctx.filter = this.filter.css;
        }
        // Mirror selfie
        if (this.facingMode === 'user' && this.settings.mirror) {
            ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
        }
        ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.92);
    }

    async startRecording() {
        if (!this.stream) return null;
        // Restart stream with audio for video mode
        if (this.mode === 'video') {
            const constraints = {
                video: { facingMode: this.facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true
            };
            try {
                const avStream = await navigator.mediaDevices.getUserMedia(constraints);
                this.stream.getTracks().forEach(t => t.stop());
                this.stream = avStream;
                this.video.srcObject = avStream;
            } catch (e) { /* no mic, that's OK */ }
        }

        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9' : 'video/webm';
        this.chunks = [];
        this.recorder = new MediaRecorder(this.stream, { mimeType: mime });
        this.recorder.ondataavailable = e => { if (e.data.size > 0) this.chunks.push(e.data); };
        this.recorder.start(250);
        this.isRecording = true;
        this.recSeconds = 0;
        this.recTimer = setInterval(() => {
            this.recSeconds++;
            const m = String(Math.floor(this.recSeconds / 60)).padStart(2, '0');
            const s = String(this.recSeconds % 60).padStart(2, '0');
            document.getElementById('recTime').textContent = `${m}:${s}`;
        }, 1000);
        return new Promise(resolve => {
            this.recorder.onstop = () => {
                const blob = new Blob(this.chunks, { type: mime });
                resolve(URL.createObjectURL(blob));
            };
        });
    }

    stopRecording() {
        if (this.recorder && this.isRecording) {
            this.recorder.stop();
            this.isRecording = false;
            clearInterval(this.recTimer);
        }
    }

    setTimer(val) {
        this.timerVal = val;
        const btn = document.getElementById('timerBtn');
        btn.textContent = val === 0 ? '⏱' : `${val}s`;
        btn.classList.toggle('active', val > 0);
    }

    async doTimedCapture(captureFn) {
        if (this.timerVal === 0) { captureFn(); return; }
        const overlay = document.getElementById('countdownNum');
        let count = this.timerVal;
        await new Promise(resolve => {
            const tick = () => {
                overlay.textContent = count;
                overlay.style.opacity = '1';
                overlay.style.transform = 'scale(1.2)';
                overlay.style.transition = 'none';
                requestAnimationFrame(() => {
                    overlay.style.transition = 'transform .8s ease, opacity .8s ease';
                    overlay.style.transform = 'scale(0.7)';
                    overlay.style.opacity = '0';
                });
                count--;
                if (count > 0) setTimeout(tick, 1000);
                else setTimeout(resolve, 900);
            };
            tick();
        });
        overlay.textContent = '';
        captureFn();
    }

    toggleFlash() {
        const modes = ['off', 'on', 'auto'];
        const icons = ['⚡', '🔦', '⚡']; // off, on, auto
        this.flashMode = modes[(modes.indexOf(this.flashMode) + 1) % modes.length];
        const btn = document.getElementById('flashBtn');
        btn.textContent = this.flashMode === 'off' ? '⚡' : (this.flashMode === 'on' ? '🔦' : '⚡A');
        btn.classList.toggle('active', this.flashMode !== 'off');
        // Try torch if browser supports it
        const track = this.stream?.getVideoTracks()[0];
        if (track?.getCapabilities?.()?.torch) {
            track.applyConstraints({ advanced: [{ torch: this.flashMode === 'on' }] }).catch(() => { });
        }
    }
}

// ----------------------------------------------------------------
// 4. AI MODULE (Face Detection via TensorFlow.js BlazeFace)
// ----------------------------------------------------------------

class AIModule {
    constructor() {
        this.model = null;
        this.active = false;
        this.rafId = null;
        this.canvas = document.getElementById('faceCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.faceCount = 0;
        this.loaded = false;
        this.loading = false;
    }

    async load() {
        if (this.loaded || this.loading) return;
        this.loading = true;
        try {
            // Dynamically load TF.js + BlazeFace
            await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js');
            await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7/dist/blazeface.min.js');
            this.model = await blazeface.load();
            this.loaded = true;
            showToast('AI face detection ready', 'success');
        } catch (e) {
            console.warn('AI model load failed:', e);
            showToast('AI unavailable – check connection', 'error');
        } finally {
            this.loading = false;
        }
    }

    start(video) {
        if (!this.model) { showToast('Loading AI model…'); this.load(); return; }
        this.active = true;
        this.video = video;
        document.getElementById('aiBadge').classList.add('visible');
        this.detect();
    }

    stop() {
        this.active = false;
        cancelAnimationFrame(this.rafId);
        this.clearCanvas();
        document.getElementById('aiBadge').classList.remove('visible');
    }

    async detect() {
        if (!this.active || !this.model) return;
        const video = document.getElementById('cameraVideo');
        if (video.readyState < 2) { this.rafId = requestAnimationFrame(() => this.detect()); return; }

        // Sync canvas size
        this.canvas.width = video.clientWidth;
        this.canvas.height = video.clientHeight;

        try {
            const predictions = await this.model.estimateFaces(video, false);
            this.clearCanvas();
            this.faceCount = predictions.length;
            // Update badge
            const badge = document.getElementById('aiBadge');
            badge.textContent = predictions.length > 0
                ? `AI · ${predictions.length} FACE${predictions.length > 1 ? 'S' : ''}`
                : 'AI · FACE DETECT';

            predictions.forEach(face => {
                const scaleX = this.canvas.width / video.videoWidth;
                const scaleY = this.canvas.height / video.videoHeight;
                let [x, y] = [face.topLeft[0] * scaleX, face.topLeft[1] * scaleY];
                let [x2, y2] = [face.bottomRight[0] * scaleX, face.bottomRight[1] * scaleY];
                // Mirror for front camera
                const cam = window.app?.camera;
                if (cam?.facingMode === 'user') {
                    const tempX = this.canvas.width - x2;
                    x2 = this.canvas.width - x;
                    x = tempX;
                }
                const w = x2 - x, h = y2 - y;
                this.drawFaceBox(x, y, w, h, face.probability?.[0] ?? 0.9);
            });
        } catch (e) { /* silently fail */ }

        if (this.active) {
            this.rafId = requestAnimationFrame(() => setTimeout(() => this.detect(), 80));
        }
    }

    drawFaceBox(x, y, w, h, confidence) {
        const ctx = this.ctx;
        const color = `rgba(0,240,255,${0.7 + confidence * 0.3})`;
        const lineLen = 18, lineW = 2;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineW;
        ctx.shadowColor = 'rgba(0,240,255,0.5)';
        ctx.shadowBlur = 6;

        // Corner marks
        const corners = [
            [x, y, 1, 1],
            [x + w, y, -1, 1],
            [x, y + h, 1, -1],
            [x + w, y + h, -1, -1]
        ];
        corners.forEach(([cx, cy, dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(cx + dx * lineLen, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * lineLen);
            ctx.stroke();
        });

        // Confidence label
        const pct = Math.round(confidence * 100);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0,240,255,0.15)';
        ctx.fillRect(x, y - 20, 60, 18);
        ctx.fillStyle = 'rgba(0,240,255,1)';
        ctx.font = '10px "Space Mono", monospace';
        ctx.fillText(`FACE ${pct}%`, x + 4, y - 6);
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// ----------------------------------------------------------------
// 5. GALLERY MODULE
// ----------------------------------------------------------------

class GalleryModule {
    constructor(db) {
        this.db = db;
        this.items = [];
        this.filter = 'all';
        this.viewing = null;
    }

    async load() {
        this.items = await this.db.getAll();
        this.render();
        this.updateThumb();
    }

    render() {
        const grid = document.getElementById('galleryGrid');
        let items = this.items;
        if (this.filter === 'photos') items = items.filter(i => i.type === 'photo');
        if (this.filter === 'videos') items = items.filter(i => i.type === 'video');
        if (this.filter === 'favorites') items = items.filter(i => i.favorite);

        if (items.length === 0) {
            grid.innerHTML = `<div class="gallery-empty">
        <div class="empty-icon">📷</div>
        <p>No ${this.filter === 'all' ? 'media' : this.filter} yet</p>
        <p style="font-size:13px;opacity:.6;">Capture some ${this.filter === 'videos' ? 'videos' : 'photos'}!</p>
      </div>`;
            return;
        }

        grid.innerHTML = items.map(item => `
      <div class="gallery-item" data-id="${item.id}" role="button" tabindex="0" aria-label="${item.type} from ${new Date(item.timestamp).toLocaleDateString()}">
        ${item.type === 'photo'
                ? `<img src="${item.data}" alt="Photo" loading="lazy">`
                : `<video src="${item.data}" muted playsinline loop></video>`
            }
        ${item.type === 'video' ? `<div class="video-badge">▶ ${item.duration || '0:00'}</div>` : ''}
        ${item.favorite ? `<div class="fav-badge">♥</div>` : ''}
        <div class="item-overlay"></div>
      </div>
    `).join('');

        // Hover video play
        grid.querySelectorAll('.gallery-item video').forEach(v => {
            v.parentElement.addEventListener('mouseenter', () => v.play().catch(() => { }));
            v.parentElement.addEventListener('mouseleave', () => { v.pause(); v.currentTime = 0; });
        });

        // Click to view
        grid.querySelectorAll('.gallery-item').forEach(el => {
            el.addEventListener('click', () => this.view(parseInt(el.dataset.id)));
            el.addEventListener('keypress', e => e.key === 'Enter' && this.view(parseInt(el.dataset.id)));
        });
    }

    updateThumb() {
        const thumb = document.getElementById('galleryThumb');
        if (this.items.length === 0) {
            thumb.innerHTML = '<div class="empty-gallery">🖼</div>';
        } else {
            const last = this.items[0];
            if (last.type === 'photo') {
                thumb.innerHTML = `<img src="${last.data}" alt="Last photo">`;
            } else {
                thumb.innerHTML = `<video src="${last.data}" muted></video>`;
            }
        }
    }

    async add(item) {
        const id = await this.db.add({ ...item, favorite: false, timestamp: Date.now() });
        this.items = [{ ...item, id, favorite: false, timestamp: Date.now() }, ...this.items];
        this.updateThumb();
        return id;
    }

    async toggleFavorite(id) {
        const item = this.items.find(i => i.id === id);
        if (!item) return;
        item.favorite = !item.favorite;
        await this.db.update(id, { favorite: item.favorite });
        this.render();
        return item.favorite;
    }

    async delete(id) {
        await this.db.delete(id);
        this.items = this.items.filter(i => i.id !== id);
        this.render();
        this.updateThumb();
    }

    async view(id) {
        const item = await this.db.get(id);
        if (!item) return;
        this.viewing = item;
        const content = document.getElementById('viewerContent');
        content.innerHTML = item.type === 'photo'
            ? `<img src="${item.data}" alt="Photo" style="max-width:100%;max-height:100%;object-fit:contain">`
            : `<video src="${item.data}" controls playsinline style="max-width:100%;max-height:100%"></video>`;
        document.getElementById('viewerTitle').textContent =
            `${item.type === 'photo' ? 'Photo' : 'Video'} · ${new Date(item.timestamp).toLocaleDateString()}`;
        document.getElementById('viewerFavBtn').textContent = item.favorite ? '♥' : '♡';
        document.getElementById('viewerFavBtn').style.color = item.favorite ? 'var(--accent2)' : '';
        showScreen('viewer');
    }

    setFilter(f) {
        this.filter = f;
        this.render();
    }
}

// ----------------------------------------------------------------
// 6. EDITOR MODULE
// ----------------------------------------------------------------

class EditorModule {
    constructor() {
        this.canvas = document.getElementById('editorCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.image = null;
        this.history = [];
        this.adj = { brightness: 0, contrast: 0, saturation: 0, hue: 0, blur: 0, sharpen: 0 };
        this.editFilter = FILTERS[0];
        this.itemId = null;
    }

    load(dataUrl, itemId) {
        this.itemId = itemId;
        this.adj = { brightness: 0, contrast: 0, saturation: 0, hue: 0, blur: 0, sharpen: 0 };
        this.editFilter = FILTERS[0];
        this.history = [];
        const img = new Image();
        img.onload = () => {
            this.image = img;
            this.fitCanvas();
            this.render();
        };
        img.src = dataUrl;
    }

    fitCanvas() {
        const screen = document.getElementById('editor');
        const toolH = document.querySelector('.editor-tools').offsetHeight;
        const headerH = document.querySelector('.editor-header').offsetHeight;
        const availH = window.innerHeight - toolH - headerH;
        const ratio = this.image.width / this.image.height;
        const dispW = Math.min(screen.clientWidth, this.image.width);
        const dispH = Math.min(availH, dispW / ratio);
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;
        this.canvas.style.width = dispW + 'px';
        this.canvas.style.height = dispH + 'px';
    }

    render() {
        if (!this.image) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Build CSS filter string
        const b = 1 + this.adj.brightness / 100;
        const c = 1 + this.adj.contrast / 100;
        const s = 1 + this.adj.saturation / 100;
        const h = this.adj.hue;
        const bl = Math.max(0, this.adj.blur);
        let f = `brightness(${b}) contrast(${c}) saturate(${s}) hue-rotate(${h}deg)`;
        if (bl > 0) f += ` blur(${bl}px)`;
        // Combine with active filter
        if (this.editFilter.id !== 'normal') f += ' ' + this.editFilter.css;
        this.ctx.filter = f;
        this.ctx.drawImage(this.image, 0, 0);
        this.ctx.filter = 'none';
    }

    adjust(key, val) {
        this.history.push({ ...this.adj });
        this.adj[key] = parseFloat(val);
        this.render();
    }

    setEditFilter(filter) {
        this.history.push({ filter: this.editFilter });
        this.editFilter = filter;
        this.render();
    }

    undo() {
        if (this.history.length === 0) return;
        const prev = this.history.pop();
        if (prev.filter !== undefined) this.editFilter = prev.filter;
        else Object.assign(this.adj, prev);
        this.render();
        // Sync sliders
        Object.entries(this.adj).forEach(([k, v]) => {
            const slider = document.querySelector(`.adj-slider[data-adj="${k}"]`);
            const valEl = document.querySelector(`.adj-val[data-adj="${k}"]`);
            if (slider) slider.value = v;
            if (valEl) valEl.textContent = Math.round(v);
        });
    }

    reset() {
        this.history.push({ ...this.adj });
        this.adj = { brightness: 0, contrast: 0, saturation: 0, hue: 0, blur: 0, sharpen: 0 };
        this.editFilter = FILTERS[0];
        this.render();
        document.querySelectorAll('.adj-slider').forEach(s => { s.value = 0; });
        document.querySelectorAll('.adj-val').forEach(v => { v.textContent = '0'; });
    }

    export() {
        return this.canvas.toDataURL('image/jpeg', 0.92);
    }

    rotate(deg) {
        if (!this.image) return;
        const tmpCanvas = document.createElement('canvas');
        const tmp = tmpCanvas.getContext('2d');
        if (deg === 90 || deg === -90) {
            tmpCanvas.width = this.canvas.height;
            tmpCanvas.height = this.canvas.width;
        } else {
            tmpCanvas.width = this.canvas.width;
            tmpCanvas.height = this.canvas.height;
        }
        tmp.translate(tmpCanvas.width / 2, tmpCanvas.height / 2);
        tmp.rotate(deg * Math.PI / 180);
        tmp.drawImage(this.canvas, -this.canvas.width / 2, -this.canvas.height / 2);
        const rotated = new Image();
        rotated.onload = () => {
            this.image = rotated;
            this.canvas.width = tmpCanvas.width;
            this.canvas.height = tmpCanvas.height;
            this.render();
        };
        rotated.src = tmpCanvas.toDataURL();
    }

    flip(axis) {
        if (!this.image) return;
        const ctx = this.ctx;
        if (axis === 'h') {
            ctx.translate(this.canvas.width, 0); ctx.scale(-1, 1);
        } else {
            ctx.translate(0, this.canvas.height); ctx.scale(1, -1);
        }
        this.render();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}

// ----------------------------------------------------------------
// 7. UTILITY FUNCTIONS
// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
// 8. UI BUILDING: Filters & Editor
// ----------------------------------------------------------------

function buildFilterStrip() {
    const row = document.getElementById('filterRow');
    row.innerHTML = FILTERS.map((f, i) => `
    <div class="filter-chip ${i === 0 ? 'active' : ''}" data-filter="${f.id}" role="button" tabindex="0" aria-label="${f.name} filter">
      <div class="filter-thumb">
        <canvas width="50" height="50" style="border-radius:8px;"></canvas>
      </div>
      <span class="filter-name">${f.name}</span>
    </div>
  `).join('');

    // Draw filter previews (colored gradient thumbnails)
    row.querySelectorAll('.filter-chip').forEach((chip, i) => {
        const canvas = chip.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        // Draw a sample gradient
        const grad = ctx.createLinearGradient(0, 0, 50, 50);
        grad.addColorStop(0, '#ff6b9d'); grad.addColorStop(.5, '#4158d0'); grad.addColorStop(1, '#c850c0');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 50, 50);
        // Draw person silhouette
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.arc(25, 16, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(18, 26, 14, 14);
        // Apply filter to canvas
        if (FILTERS[i].css !== 'none') {
            const tmp = document.createElement('canvas'); tmp.width = 50; tmp.height = 50;
            const tmpCtx = tmp.getContext('2d');
            tmpCtx.filter = FILTERS[i].css;
            tmpCtx.drawImage(canvas, 0, 0);
            ctx.clearRect(0, 0, 50, 50); ctx.drawImage(tmp, 0, 0);
        }
    });

    // Clicks
    row.querySelectorAll('.filter-chip').forEach(chip => {
        const select = () => {
            row.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const f = FILTERS.find(f => f.id === chip.dataset.filter);
            const intensity = parseInt(document.getElementById('intensitySlider').value);
            window.app.camera.applyFilter(f, intensity);
            window.app.currentFilter = f;
        };
        chip.addEventListener('click', select);
        chip.addEventListener('keypress', e => e.key === 'Enter' && select());
    });
}

function buildEditorPanel(tab) {
    const panel = document.getElementById('editorPanel');
    if (tab === 'adjust') {
        const adjs = [
            { key: 'brightness', label: 'Bright', min: -100, max: 100 },
            { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
            { key: 'saturation', label: 'Saturat', min: -100, max: 100 },
            { key: 'hue', label: 'Hue', min: -180, max: 180 },
            { key: 'blur', label: 'Blur', min: 0, max: 10 },
        ];
        panel.innerHTML = adjs.map(a => `
      <div class="adj-row">
        <span class="adj-label">${a.label}</span>
        <input type="range" class="adj-slider" data-adj="${a.key}" min="${a.min}" max="${a.max}"
               step="1" value="${window.app.editor.adj[a.key]}" aria-label="${a.label}">
        <span class="adj-val" data-adj="${a.key}">${Math.round(window.app.editor.adj[a.key])}</span>
      </div>
    `).join('');
        panel.querySelectorAll('.adj-slider').forEach(s => {
            s.addEventListener('input', e => {
                const key = e.target.dataset.adj;
                const val = parseFloat(e.target.value);
                panel.querySelector(`.adj-val[data-adj="${key}"]`).textContent = Math.round(val);
                window.app.editor.adjust(key, val);
            });
        });
    } else if (tab === 'filter') {
        panel.innerHTML = `<div style="display:flex;gap:10px;overflow-x:auto;padding:4px 0;">
      ${FILTERS.map(f => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;flex-shrink:0"
             data-ef="${f.id}" role="button" tabindex="0" aria-label="${f.name}">
          <div style="width:48px;height:48px;border-radius:10px;background:linear-gradient(135deg,#ff6b9d,#4158d0);
               border:2px solid ${f.id === window.app.editor.editFilter?.id ? 'var(--accent)' : 'transparent'};
               filter:${f.css}" class="efilter-thumb"></div>
          <span style="font-size:10px;color:var(--text2);text-transform:uppercase">${f.name}</span>
        </div>
      `).join('')}
    </div>`;
        panel.querySelectorAll('[data-ef]').forEach(el => {
            el.addEventListener('click', () => {
                const f = FILTERS.find(x => x.id === el.dataset.ef);
                window.app.editor.setEditFilter(f);
                panel.querySelectorAll('[data-ef]').forEach(e => {
                    e.querySelector('.efilter-thumb').style.borderColor = 'transparent';
                });
                el.querySelector('.efilter-thumb').style.borderColor = 'var(--accent)';
            });
        });
    } else if (tab === 'crop') {
        panel.innerHTML = `
      <div style="display:flex;gap:10px;flex-wrap:wrap;padding:4px 0">
        <button onclick="window.app.editor.rotate(90)" class="sticker-btn" style="width:auto;padding:0 16px;font-size:13px">↻ Rotate</button>
        <button onclick="window.app.editor.rotate(-90)" class="sticker-btn" style="width:auto;padding:0 16px;font-size:13px">↺ Rotate</button>
        <button onclick="window.app.editor.flip('h')" class="sticker-btn" style="width:auto;padding:0 16px;font-size:13px">↔ Flip H</button>
        <button onclick="window.app.editor.flip('v')" class="sticker-btn" style="width:auto;padding:0 16px;font-size:13px">↕ Flip V</button>
      </div>
    `;
    } else if (tab === 'stickers') {
        panel.innerHTML = `<div class="sticker-grid">
      ${STICKERS.map(s => `<button class="sticker-btn" data-sticker="${s}" aria-label="Add ${s}">${s}</button>`).join('')}
    </div>`;
        panel.querySelectorAll('.sticker-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const s = btn.dataset.sticker;
                const ctx = window.app.editor.ctx;
                const c = window.app.editor.canvas;
                ctx.font = `${Math.round(c.width / 8)}px serif`;
                ctx.fillText(s, c.width / 2 - ctx.measureText(s).width / 2, c.height / 2);
                showToast('Sticker added!');
            });
        });
    } else if (tab === 'text') {
        panel.innerHTML = `
      <div class="adj-row">
        <input type="text" id="textInput" placeholder="Enter text..."
          style="flex:1;padding:10px 14px;background:var(--glass);border:1px solid var(--border);
                 border-radius:var(--r-sm);color:var(--text);font-size:14px;outline:none">
        <button onclick="addTextOverlay()" class="sticker-btn" style="width:auto;padding:0 14px;font-size:13px;margin-left:8px">Add</button>
      </div>
      <div class="adj-row">
        <span class="adj-label">SIZE</span>
        <input type="range" id="textSize" min="12" max="120" value="40" class="adj-slider">
        <span class="adj-val">40px</span>
      </div>
    `;
        document.getElementById('textSize').addEventListener('input', e => {
            e.target.nextElementSibling.textContent = e.target.value + 'px';
        });
    }
}

function addTextOverlay() {
    const txt = document.getElementById('textInput')?.value?.trim();
    const size = parseInt(document.getElementById('textSize')?.value || 40);
    if (!txt) return;
    const ctx = window.app.editor.ctx;
    const c = window.app.editor.canvas;
    ctx.font = `bold ${size}px 'Syne', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = size / 10;
    const x = c.width / 2 - ctx.measureText(txt).width / 2;
    const y = c.height * 0.8;
    ctx.strokeText(txt, x, y);
    ctx.fillText(txt, x, y);
    showToast('Text added!');
}

// ----------------------------------------------------------------
// 9. QR/SCAN MODE
// ----------------------------------------------------------------

function initQRMode() {
    loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js').then(() => {
        showToast('QR Scanner ready — point at a QR code');
    });
    const video = document.getElementById('cameraVideo');
    let scanInterval;

    const startScan = () => {
        scanInterval = setInterval(() => {
            const result = scanQR(video);
            if (result) {
                clearInterval(scanInterval);
                showToast(`QR: ${result.data}`, 'success');
                if (result.data.startsWith('http')) {
                    setTimeout(() => {
                        if (confirm(`Open URL?\n${result.data}`)) window.open(result.data, '_blank');
                    }, 300);
                }
                setTimeout(startScan, 3000);
            }
        }, 500);
    };

    startScan();
    return () => clearInterval(scanInterval);
}

// ----------------------------------------------------------------
// 10. SETTINGS
// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
// 11. MAIN APP CLASS
// ----------------------------------------------------------------

class App {
    constructor() {
        this.db = new DB();
        this.camera = new CameraModule();
        this.ai = new AIModule();
        this.gallery = new GalleryModule(this.db);
        this.editor = new EditorModule();
        this.currentFilter = FILTERS[0];
        this.qrCleanup = null;
        this._aiEnabled = true;
    }

    async init() {
        await this.db.open();
        // Show splash 2.5s then go to camera or permission
        setTimeout(async () => {
            const hasPermission = await this.checkCameraPermission();
            if (hasPermission) {
                await this.startCamera();
            } else {
                showScreen('permission');
            }
            await this.gallery.load();
            buildFilterStrip();
            this.bindEvents();
            initSettings();
            // Preload AI model in background
            setTimeout(() => this.ai.load(), 2000);
        }, 2600);
    }

    async checkCameraPermission() {
        try {
            if (navigator.permissions) {
                const perm = await navigator.permissions.query({ name: 'camera' });
                return perm.state === 'granted';
            }
            return false;
        } catch { return false; }
    }

    async startCamera() {
        showScreen('camera');
        const ok = await this.camera.start();
        if (!ok) { showScreen('permission'); return; }
        // Mirror front camera
        const saved = JSON.parse(localStorage.getItem('lens_settings') || '{}');
        if (this.camera.facingMode === 'user' && (saved.mirror !== false)) {
            this.camera.video.style.transform = 'scaleX(-1)';
        }
        // Auto-start AI if enabled
        if (saved.ai !== false) {
            setTimeout(() => {
                if (this.ai.loaded) this.ai.start(this.camera.video);
            }, 1000);
        }
    }

    bindEvents() {
        // Permission button
        document.getElementById('permBtn').addEventListener('click', async () => {
            await this.startCamera();
        });

        // Flash
        document.getElementById('flashBtn').addEventListener('click', () => {
            this.camera.toggleFlash();
        });

        // Grid
        document.getElementById('gridBtn').addEventListener('click', () => {
            const grid = document.getElementById('gridOverlay');
            grid.classList.toggle('visible');
            document.getElementById('gridBtn').classList.toggle('active');
        });

        // Timer cycle
        document.getElementById('timerBtn').addEventListener('click', () => {
            const vals = [0, 3, 10];
            const next = vals[(vals.indexOf(this.camera.timerVal) + 1) % vals.length];
            this.camera.setTimer(next);
        });

        // AI toggle
        document.getElementById('aiBtn').addEventListener('click', () => {
            if (this.ai.active) {
                this.ai.stop();
                document.getElementById('aiBtn').classList.remove('active');
            } else {
                this.ai.start(this.camera.video);
                document.getElementById('aiBtn').classList.add('active');
            }
        });

        // Pro controls
        document.getElementById('proBtn').addEventListener('click', () => {
            const exp = document.getElementById('exposureSlider');
            exp.classList.toggle('visible');
            document.getElementById('proBtn').classList.toggle('active');
            showToast(exp.classList.contains('visible') ? 'Pro controls on' : 'Pro controls off');
        });

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => {
            showScreen('settings');
        });
        document.getElementById('settingsBackBtn').addEventListener('click', () => {
            showScreen('camera');
        });

        // Zoom
        document.getElementById('zoomInBtn').addEventListener('click', () => {
            this.camera.setZoom(parseFloat((this.camera.zoom + 0.5).toFixed(1)));
        });
        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            this.camera.setZoom(parseFloat((this.camera.zoom - 0.5).toFixed(1)));
        });

        // Exposure slider
        document.getElementById('expRange').addEventListener('input', e => {
            const val = parseFloat(e.target.value);
            // Apply brightness adjustment
            const f = this.camera.filter;
            const brightAdj = 1 + val / 200;
            this.camera.video.style.filter = (f.css !== 'none' ? f.css : '') + ` brightness(${brightAdj})`;
        });

        // Filter intensity
        document.getElementById('intensitySlider').addEventListener('input', e => {
            const val = parseInt(e.target.value);
            document.getElementById('intensityVal').textContent = val;
            this.camera.applyFilter(this.currentFilter, val);
        });

        // Shutter button
        const shutter = document.getElementById('shutterBtn');
        shutter.addEventListener('click', () => this.handleShutter());
        shutter.addEventListener('keypress', e => e.key === 'Enter' && this.handleShutter());

        // Gallery thumb
        document.getElementById('galleryThumb').addEventListener('click', () => {
            showScreen('gallery');
        });

        // Flip camera
        document.getElementById('flipBtn').addEventListener('click', async () => {
            document.getElementById('flipBtn').style.transform = 'rotateY(180deg)';
            await this.camera.flip();
            setTimeout(() => document.getElementById('flipBtn').style.transform = '', 300);
        });

        // Mode tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.setMode(tab.dataset.mode);
            });
        });

        // Gallery tabs
        document.querySelectorAll('.gtab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.gtab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.gallery.setFilter(tab.dataset.gtab);
            });
        });

        // Gallery close
        document.getElementById('galleryCloseBtn').addEventListener('click', () => {
            showScreen('camera');
        });

        // Viewer controls
        document.getElementById('viewerBackBtn').addEventListener('click', () => {
            showScreen('gallery');
        });
        document.getElementById('viewerFavBtn').addEventListener('click', async () => {
            const item = this.gallery.viewing;
            if (!item) return;
            const isFav = await this.gallery.toggleFavorite(item.id);
            document.getElementById('viewerFavBtn').textContent = isFav ? '♥' : '♡';
            document.getElementById('viewerFavBtn').style.color = isFav ? 'var(--accent2)' : '';
            showToast(isFav ? 'Added to favorites ♥' : 'Removed from favorites', isFav ? 'success' : '');
        });
        document.getElementById('viewerEditBtn').addEventListener('click', () => {
            const item = this.gallery.viewing;
            if (!item || item.type !== 'photo') { showToast('Video editing not supported'); return; }
            this.editor.load(item.data, item.id);
            buildEditorPanel('adjust');
            showScreen('editor');
        });
        document.getElementById('viewerShareBtn').addEventListener('click', async () => {
            const item = this.gallery.viewing;
            if (!item) return;
            if (navigator.share) {
                try {
                    const blob = dataURLtoBlob(item.data);
                    const file = new File([blob], `lens-photo.${item.type === 'photo' ? 'jpg' : 'webm'}`, { type: blob.type });
                    await navigator.share({ title: 'LENS Photo', files: [file] });
                } catch (e) { if (e.name !== 'AbortError') this.downloadItem(item); }
            } else this.downloadItem(item);
        });
        document.getElementById('viewerDownloadBtn').addEventListener('click', () => {
            const item = this.gallery.viewing;
            if (item) this.downloadItem(item);
        });
        document.getElementById('viewerDeleteBtn').addEventListener('click', async () => {
            const item = this.gallery.viewing;
            if (!item) return;
            if (confirm('Delete this item?')) {
                await this.gallery.delete(item.id);
                showToast('Deleted', 'success');
                showScreen('gallery');
            }
        });

        // Editor tabs
        document.querySelectorAll('.etab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.etab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                buildEditorPanel(tab.dataset.etab);
            });
        });
        document.getElementById('editorBackBtn').addEventListener('click', () => {
            showScreen('viewer');
        });
        document.getElementById('editorUndoBtn').addEventListener('click', () => {
            this.editor.undo();
        });
        document.getElementById('editorResetBtn').addEventListener('click', () => {
            this.editor.reset();
            showToast('Reset to original');
        });
        document.getElementById('editorSaveBtn').addEventListener('click', async () => {
            const dataUrl = this.editor.export();
            const item = this.gallery.viewing;
            if (item) {
                await this.db.update(item.id, { data: dataUrl });
                item.data = dataUrl;
                this.gallery.items = this.gallery.items.map(i => i.id === item.id ? { ...i, data: dataUrl } : i);
                this.gallery.updateThumb();
                showToast('Saved!', 'success');
                showScreen('viewer');
                document.getElementById('viewerContent').innerHTML = `<img src="${dataUrl}" alt="Edited photo" style="max-width:100%;max-height:100%;object-fit:contain">`;
            }
        });

        // Tap to focus on viewfinder
        document.getElementById('viewfinder').addEventListener('click', e => {
            if (e.target !== document.getElementById('viewfinder') && !e.target.id.includes('Video')) return;
            const ring = document.getElementById('focusRing');
            ring.style.left = e.clientX + 'px';
            ring.style.top = e.clientY + 'px';
            ring.classList.add('active');
            setTimeout(() => ring.classList.remove('active'), 800);
        });

        // Pinch to zoom (touch)
        let initDist = 0, initZoom = 1;
        document.getElementById('viewfinder').addEventListener('touchstart', e => {
            if (e.touches.length === 2) {
                initDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                initZoom = this.camera.zoom;
            }
        }, { passive: true });
        document.getElementById('viewfinder').addEventListener('touchmove', e => {
            if (e.touches.length === 2) {
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const scale = dist / initDist;
                this.camera.setZoom(parseFloat((initZoom * scale).toFixed(1)));
            }
        }, { passive: true });

        // Keyboard shortcuts
        document.addEventListener('keydown', e => {
            if (_activeScreen !== 'camera') return;
            if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); this.handleShutter(); }
            if (e.code === 'ArrowLeft') this.cycleFilter(-1);
            if (e.code === 'ArrowRight') this.cycleFilter(1);
            if (e.code === 'KeyF') this.camera.flip();
            if (e.code === 'KeyG') document.getElementById('gridBtn').click();
            if (e.code === 'KeyA') document.getElementById('aiBtn').click();
        });

        // Swipe down on gallery to close
        let startY = 0;
        document.getElementById('gallery').addEventListener('touchstart', e => {
            startY = e.touches[0].clientY;
        }, { passive: true });
        document.getElementById('gallery').addEventListener('touchend', e => {
            const dy = e.changedTouches[0].clientY - startY;
            if (dy > 80) showScreen('camera');
        }, { passive: true });
    }

    handleShutter() {
        const mode = this.camera.mode;
        if (mode === 'video') {
            if (!this.camera.isRecording) this.startVideoRecording();
            else this.stopVideoRecording();
        } else {
            this.camera.doTimedCapture(() => this.capturePhoto());
        }
    }

    async capturePhoto() {
        triggerShutter();
        const dataUrl = this.camera.capturePhoto();
        await this.gallery.add({
            type: 'photo',
            data: dataUrl,
            filter: this.camera.filter.id,
            mode: this.camera.mode
        });
        showToast('Photo saved!', 'success');
    }

    async startVideoRecording() {
        document.getElementById('shutterBtn').classList.add('recording');
        document.getElementById('recIndicator').classList.add('visible');
        document.getElementById('recTime').textContent = '00:00';
        const videoBlob = await this.camera.startRecording();
        // videoBlob resolves when recording stops (returns URL)
        if (videoBlob) {
            const dur = formatDuration(this.camera.recSeconds);
            await this.gallery.add({ type: 'video', data: videoBlob, duration: dur, filter: this.camera.filter.id });
            showToast('Video saved!', 'success');
        }
    }

    stopVideoRecording() {
        this.camera.stopRecording();
        document.getElementById('shutterBtn').classList.remove('recording');
        document.getElementById('recIndicator').classList.remove('visible');
    }

    setMode(mode) {
        this.camera.mode = mode;
        document.getElementById('modeLabel').textContent = mode.toUpperCase();

        // Stop QR scanner if switching away
        if (this.qrCleanup) { this.qrCleanup(); this.qrCleanup = null; }

        // Stop recording if switching away from video
        if (mode !== 'video' && this.camera.isRecording) this.stopVideoRecording();

        // Mode-specific behavior
        switch (mode) {
            case 'night':
                this.camera.applyFilter({ id: 'night', css: 'brightness(1.45) contrast(1.1)', name: 'Night' }, 100);
                showToast('Night mode: enhanced low-light');
                break;
            case 'portrait':
                // Apply soft background blur effect
                this.camera.video.style.filter = 'blur(0)';
                document.getElementById('faceCanvas').style.filter = 'none';
                showToast('Portrait mode: AI blur active');
                break;
            case 'qr':
                this.qrCleanup = initQRMode();
                break;
            default:
                this.camera.applyFilter(this.currentFilter, this.camera.intensity || 100);
        }

        // Update shutter button style
        const shutter = document.getElementById('shutterBtn');
        if (mode === 'video') {
            document.querySelector('.shutter-inner').style.background = '#ff4444';
        } else {
            document.querySelector('.shutter-inner').style.background = 'var(--text)';
        }
    }

    cycleFilter(dir) {
        const chips = Array.from(document.querySelectorAll('.filter-chip'));
        const activeIdx = chips.findIndex(c => c.classList.contains('active'));
        const next = (activeIdx + dir + chips.length) % chips.length;
        chips[next].click();
        chips[next].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    downloadItem(item) {
        const a = document.createElement('a');
        a.href = item.data;
        a.download = `lens-${item.type}-${Date.now()}.${item.type === 'photo' ? 'jpg' : 'webm'}`;
        a.click();
        showToast('Downloading...', 'success');
    }
}

// ----------------------------------------------------------------
// 12. INITIALIZATION
// ----------------------------------------------------------------

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