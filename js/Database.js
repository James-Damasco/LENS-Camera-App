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
