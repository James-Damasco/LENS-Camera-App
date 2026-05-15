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