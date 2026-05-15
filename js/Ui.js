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