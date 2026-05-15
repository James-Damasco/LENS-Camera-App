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