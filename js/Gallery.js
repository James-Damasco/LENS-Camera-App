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