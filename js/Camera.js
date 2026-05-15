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
        
        // Try with strict constraints first, then fall back to lenient ones
        const constraintsSets = [
            {
                video: {
                    facingMode: this.facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    aspectRatio: { ideal: 16 / 9 }
                },
                audio: this.mode === 'video'
            },
            {
                video: {
                    facingMode: this.facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: this.mode === 'video'
            },
            {
                video: { facingMode: this.facingMode },
                audio: this.mode === 'video'
            }
        ];

        for (let constraints of constraintsSets) {
            try {
                this.stream = await navigator.mediaDevices.getUserMedia(constraints);
                this.video.srcObject = this.stream;
                
                // Ensure video is properly configured for autoplay
                if (this.video.muted === undefined || !this.video.muted) {
                    this.video.muted = true;
                }
                
                // Use loadedmetadata to ensure video is ready
                if (this.video.readyState >= 2) {
                    // Video already has data
                    this.video.play().catch(err => console.warn('Autoplay blocked:', err));
                } else {
                    // Wait for metadata to load
                    this.video.onloadedmetadata = () => {
                        this.video.play().catch(err => console.warn('Autoplay blocked:', err));
                    };
                }
                
                this.applyFilter(this.filter, this.intensity);
                return true;
            } catch (e) {
                console.warn('Camera start failed with constraints:', constraints, e.message);
                continue;
            }
        }
        
        console.error('Camera error: Failed all constraint attempts');
        return false;
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
