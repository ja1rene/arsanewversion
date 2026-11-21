/* ============================================
   ARSA — Exercise animations (GIF / image / short video)
   Sources, in order: a file saved on this device (IndexedDB), a link,
   or a bundled file from media/ for built-in exercises. Anything that
   fails to load becomes a friendly placeholder instead of a broken box.
   Offline: bundled files are cached by the service worker; linked
   files can be copied into Cache Storage ('arsa-media'); uploaded files
   live in IndexedDB. None of these are part of the JSON backup.
   ============================================ */

const ExMedia = {
  MAX_BYTES: 10 * 1024 * 1024,
  CACHE: 'arsa-media',
  DB: 'arsa-media-db',
  _urls: {},

  // ---------- helpers ----------
  isVideo(urlOrType) { return /\.(mp4|webm)(\?|#|$)/i.test(urlOrType || '') || /^video\//.test(urlOrType || ''); },

  // Turns a Giphy page link into the direct GIF file; leaves everything else alone.
  normalizeUrl(raw) {
    const u = String(raw || '').trim();
    const g = u.match(/^https?:\/\/(?:www\.)?giphy\.com\/gifs\/(?:[^/?#]*-)?([A-Za-z0-9]+)\/?(?:[?#].*)?$/i);
    return g ? 'https://media.giphy.com/media/' + g[1] + '/giphy.gif' : u;
  },

  source(ex) {
    if (ex.mediaLocal) return { kind: 'local', video: this.isVideo(ex.mediaType) };
    if (ex.animationUrl) return { kind: 'link', src: ex.animationUrl, video: this.isVideo(ex.animationUrl) };
    const f = (typeof EXERCISE_MEDIA !== 'undefined') && EXERCISE_MEDIA[ex.id];
    if (f) return { kind: 'bundled', src: f, video: this.isVideo(f) };
    return { kind: 'none' };
  },

  // ---------- display ----------
  placeholder(state) {
    const T = {
      soon:   ['Animation coming soon', 'This exercise has no animation yet.'],
      none:   ['No animation added', 'Use Change animation to add a GIF or image.'],
      broken: [navigator.onLine === false ? 'You are offline' : 'Could not load the animation',
               navigator.onLine === false ? 'This animation is not saved on this device yet.' : 'The link may be wrong or the site may block it.'],
      local:  ['File not found', 'This file is no longer on this device. Choose it again.']
    }[state] || ['No animation', ''];
    return `<div class="lb-ph" role="img" aria-label="${T[0]}">
      <svg class="lb-ph-art" viewBox="0 0 120 56" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <g class="lb-ph-bar"><path d="M20 28h80" class="acc"/><path d="M30 14v28M40 18v20M80 18v20M90 14v28"/></g>
      </svg>
      <span class="lb-ph-t">${T[0]}</span><span class="lb-ph-s">${T[1]}</span></div>`;
  },

  html(ex) {
    const s = this.source(ex);
    const alt = esc(ex.name) + ' demonstration';
    if (s.kind === 'none') return `<div class="lb-media" data-kind="none">${this.placeholder(ex.custom ? 'none' : 'soon')}</div>`;
    const local = s.kind === 'local' ? ` data-local="${esc(ex.id)}"` : '';
    const src = s.src ? ` src="${esc(s.src)}"` : '';
    const el = s.video
      ? `<video class="lb-mi"${src}${local} autoplay loop muted playsinline aria-label="${alt}" onerror="ExMedia.fail(this)"></video>`
      : `<img class="lb-mi"${src}${local} alt="${alt}" decoding="async" onerror="ExMedia.fail(this)">`;
    return `<div class="lb-media" data-kind="${s.kind}">${el}</div>`;
  },

  fail(el) {
    const box = el.closest('.lb-media');
    if (!box) return;
    const k = box.dataset.kind;
    box.innerHTML = this.placeholder(k === 'bundled' ? 'soon' : k === 'local' ? 'local' : 'broken');
  },

  hydrate(root) {
    root.querySelectorAll('[data-local]').forEach(el => {
      const id = el.dataset.local;
      this.getFile(id).then(blob => {
        if (!blob) return this.fail(el);
        if (this._urls[id]) URL.revokeObjectURL(this._urls[id]);
        this._urls[id] = URL.createObjectURL(blob);
        el.src = this._urls[id];
      }).catch(() => this.fail(el));
    });
  },

  // ---------- IndexedDB (files chosen on this device) ----------
  _db() {
    if (!this._dbp) {
      this._dbp = new Promise((res, rej) => {
        const r = indexedDB.open(this.DB, 1);
        r.onupgradeneeded = () => r.result.createObjectStore('files');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    }
    return this._dbp;
  },
  async _tx(mode, fn) {
    const db = await this._db();
    return new Promise((res, rej) => {
      const t = db.transaction('files', mode);
      const req = fn(t.objectStore('files'));
      t.oncomplete = () => res(req && req.result);
      t.onerror = t.onabort = () => rej(t.error);
    });
  },
  putFile(id, blob) { return this._tx('readwrite', s => s.put(blob, id)); },
  getFile(id) { return this._tx('readonly', s => s.get(id)); },
  delFile(id) { return this._tx('readwrite', s => s.delete(id)); },

  // ---------- offline copy of a linked file ----------
  async saveCopy(url) {
    if (!('caches' in window)) return 'unsupported';
    if (navigator.onLine === false) return 'offline';
    const c = await caches.open(this.CACHE);
    try {
      const r = await fetch(url, { mode: 'cors' });
      if (!r.ok) throw new Error('bad');
      await c.put(url, r);
      return 'saved';
    } catch (e) { /* many sites block reads; fall through */ }
    try {
      const r = await fetch(url, { mode: 'no-cors' }); // opaque, but an <img> can still show it
      await c.put(url, r);
      return 'saved';
    } catch (e) { return 'blocked'; }
  },
  async dropCopy(url) {
    if (!url || !('caches' in window)) return;
    try { const c = await caches.open(this.CACHE); await c.delete(url); } catch (e) { /* ignore */ }
  },

  // Removes everything stored for a custom exercise's animation.
  async remove(ex) {
    if (ex.mediaLocal) { try { await this.delFile(ex.id); } catch (e) { /* ignore */ } }
    if (this._urls[ex.id]) { URL.revokeObjectURL(this._urls[ex.id]); delete this._urls[ex.id]; }
    await this.dropCopy(ex.animationUrl);
  },

  // ---------- form ----------
  formHtml(ex) {
    const url = ex && ex.animationUrl ? ex.animationUrl : '';
    const hasLocal = ex && ex.mediaLocal;
    return `
      <div class="input-group md">
        <label class="input-label" for="md-url">Animation link (GIF or image)</label>
        <input type="url" class="input" id="md-url" placeholder="https://... .gif" value="${esc(url)}" autocomplete="off" inputmode="url">
        <div class="md-or"><span>or</span></div>
        <label class="btn btn-outline md-up" for="md-file">Upload from this device</label>
        <input type="file" id="md-file" hidden accept="image/gif,image/webp,image/png,image/jpeg,video/mp4,video/webm">
        <div class="md-prev" id="md-prev" hidden></div>
        <p class="md-status" id="md-status" role="status" aria-live="polite">${hasLocal ? 'Using a file saved on this device.' : ''}</p>
        <label class="md-chk" id="md-offline-wrap" ${url ? '' : 'hidden'}>
          <input type="checkbox" id="md-offline" checked> <span>Keep a copy for offline use</span>
        </label>
        ${(url || hasLocal) ? '<button class="md-remove" type="button" id="md-remove">Remove animation</button>' : ''}
      </div>`;
  },

  // Wires the form. Returns { collect() } describing what the person chose.
  bind(ex) {
    const $ = (id) => document.getElementById(id);
    const st = { file: null, remove: false, ok: null, pending: null };
    const prev = $('md-prev'), status = $('md-status');
    const say = (t, cls) => { status.textContent = t; status.className = 'md-status ' + (cls || ''); };
    let timer = 0, token = 0;

    const showPreview = (node) => { prev.innerHTML = ''; prev.appendChild(node); prev.hidden = false; };
    const clearPreview = () => { prev.innerHTML = ''; prev.hidden = true; };

    const check = (raw) => {
      const my = ++token;
      st.ok = null;
      let done;
      st.pending = new Promise(r => { done = r; });
      let url = this.normalizeUrl(raw);
      if (!url) { clearPreview(); say(''); $('md-offline-wrap').hidden = true; done(); return; }
      if (!/^https?:\/\//i.test(url)) { clearPreview(); st.ok = false; say('Use a link that starts with https://', 'err'); done(); return; }
      if (url !== raw.trim()) { $('md-url').value = url; }
      $('md-offline-wrap').hidden = false;
      say('Checking link...');
      const vid = this.isVideo(url);
      const node = document.createElement(vid ? 'video' : 'img');
      node.className = 'lb-mi';
      if (vid) { node.muted = true; node.loop = true; node.autoplay = true; node.playsInline = true; }
      const bad = () => {
        done();
        if (my !== token) return;
        clearPreview();
        if (navigator.onLine === false) { st.ok = null; say('You are offline, so the link cannot be checked. It will be saved as it is.'); return; }
        st.ok = false;
        say('This does not load as an image. Use a direct link to the file (ends in .gif, .webp, .png, .jpg or .mp4), not a web page. Tip: press and hold a GIF and choose Copy image address.', 'err');
      };
      const good = () => { done(); if (my !== token) return; st.ok = true; say(url !== raw.trim() ? 'Converted to the direct GIF link. Preview loaded.' : 'Preview loaded.', 'ok'); };
      node.addEventListener(vid ? 'loadeddata' : 'load', good);
      node.addEventListener('error', bad);
      showPreview(node);
      node.src = url;
      setTimeout(() => { if (my === token && st.ok === null && navigator.onLine !== false) bad(); }, 9000);
    };

    $('md-url').addEventListener('input', () => {
      st.file = null; st.remove = false; $('md-file').value = '';
      clearTimeout(timer); timer = setTimeout(() => check($('md-url').value), 500);
    });
    $('md-url').addEventListener('change', () => { clearTimeout(timer); check($('md-url').value); });

    $('md-file').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      token++; st.pending = null;
      if (f.size > this.MAX_BYTES) {
        e.target.value = ''; st.file = null;
        say('That file is ' + (f.size / 1048576).toFixed(1) + ' MB. Choose one under 10 MB.', 'err'); return;
      }
      if (!/^(image|video)\//.test(f.type)) { e.target.value = ''; say('Choose a GIF, image or MP4 file.', 'err'); return; }
      st.file = f; st.remove = false; st.ok = true;
      $('md-url').value = ''; $('md-offline-wrap').hidden = true;
      const vid = f.type.startsWith('video/');
      const node = document.createElement(vid ? 'video' : 'img');
      node.className = 'lb-mi';
      if (vid) { node.muted = true; node.loop = true; node.autoplay = true; node.playsInline = true; }
      node.src = URL.createObjectURL(f);
      showPreview(node);
      say(f.name + ' (' + Math.max(1, Math.round(f.size / 1024)) + ' KB). Saved on this device, works offline.', 'ok');
    });

    const rm = $('md-remove');
    if (rm) rm.addEventListener('click', () => {
      token++; st.pending = null; st.file = null; st.remove = true; st.ok = null;
      $('md-url').value = ''; $('md-file').value = ''; clearPreview();
      $('md-offline-wrap').hidden = true; rm.hidden = true;
      say('Animation will be removed when you save.');
    });

    // Show what is there already when editing.
    if (ex && ex.mediaLocal) {
      this.getFile(ex.id).then(b => {
        if (!b || st.file || st.remove) return;
        const vid = this.isVideo(ex.mediaType);
        const node = document.createElement(vid ? 'video' : 'img');
        node.className = 'lb-mi';
        if (vid) { node.muted = true; node.loop = true; node.autoplay = true; node.playsInline = true; }
        node.src = URL.createObjectURL(b);
        showPreview(node);
      }).catch(() => {});
    } else if (ex && ex.animationUrl) {
      check(ex.animationUrl);
    }

    return {
      collect: () => ({
        url: this.normalizeUrl($('md-url').value),
        file: st.file,
        remove: st.remove,
        ok: st.ok,
        offline: $('md-offline') ? $('md-offline').checked : false
      }),
      // Resolves once any link check in progress has finished.
      settled: () => st.pending || Promise.resolve(),
      blocked: () => {
        const c = { url: this.normalizeUrl($('md-url').value), ok: st.ok };
        return !!(c.url && !st.file && c.ok === false);
      }
    };
  },

  // Applies the form's choice to a custom exercise. Returns a short note for a toast, or ''.
  async commit(id, sel) {
    const ex = Store.data.exerciseLibrary.find(e => e.id === id);
    if (!ex) return '';
    let note = '';
    if (sel.remove) {
      await this.remove(ex);
      ex.animationUrl = ''; ex.mediaLocal = false; ex.mediaType = ''; ex.mediaSaved = false;
    }
    if (sel.file) {
      const oldUrl = ex.animationUrl;
      await this.putFile(id, sel.file);
      await this.dropCopy(oldUrl);
      ex.mediaLocal = true; ex.mediaType = sel.file.type; ex.animationUrl = ''; ex.mediaSaved = false;
    } else if (sel.url && (sel.url !== ex.animationUrl || ex.mediaLocal)) {
      if (ex.mediaLocal) { try { await this.delFile(id); } catch (e) { /* ignore */ } ex.mediaLocal = false; ex.mediaType = ''; }
      if (ex.animationUrl && ex.animationUrl !== sel.url) await this.dropCopy(ex.animationUrl);
      ex.animationUrl = sel.url; ex.mediaSaved = false;
    } else if (!sel.url && !sel.remove && !ex.mediaLocal && ex.animationUrl) {
      await this.dropCopy(ex.animationUrl); ex.animationUrl = ''; ex.mediaSaved = false;
    }
    if (ex.animationUrl && sel.offline && !ex.mediaSaved) {
      const r = await this.saveCopy(ex.animationUrl);
      ex.mediaSaved = r === 'saved';
      if (r === 'blocked') note = 'Saved, but that site does not allow an offline copy. Try Upload from this device.';
      else if (r === 'offline') note = 'Saved. Connect once and reopen this exercise to keep an offline copy.';
    }
    Store.save();
    return note;
  }
};
