/* ============================================
   ARSA — App Controller
   Bootstraps the app, handles bottom nav routing,
   and registers the service worker.
   ============================================ */

const App = {
  currentScreen: 'dashboard',

  init() {
    Store.load();
    checkAchievements();

    this.applyTheme();
    this._bindNav();
    this.renderCurrentScreen();
    this._registerServiceWorker();

    // A workout session in progress takes priority. Otherwise, reopen a
    // half-built workout that was left unsaved.
    const resuming = Session.checkForResumableSession();
    if (!resuming && Workouts.hasSavedDraft()) {
      this.navigateTo('workouts');
      if (Workouts.restoreDraft()) showToast('Restored your unsaved workout');
    }
    Reminders.checkAndMaybeNotify();

    // Ask the browser not to evict saved workouts when storage runs low.
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
  },

  // Applies the active theme preset and, if set, a custom accent color.
  // Called on load and again any time Settings changes either value, so
  // the whole app re-themes instantly without a reload.
  applyTheme() {
    const s = Store.data.settings;
    document.body.setAttribute('data-theme', s.theme === 'light' ? 'light' : 'dark');

    const props = ['--accent', '--accent-light', '--accent-glow', '--on-accent'];
    if (s.accentColor) {
      const d = this.deriveAccent(s.accentColor);
      document.body.style.setProperty('--accent', d.accent);
      document.body.style.setProperty('--accent-light', d.light);
      document.body.style.setProperty('--accent-glow', d.glow);
      document.body.style.setProperty('--on-accent', d.onAccent);
    } else {
      // No custom accent: clear inline overrides so the theme preset's own
      // accent (set in CSS) takes over again.
      props.forEach(p => document.body.style.removeProperty(p));
    }
  },

  // From ONE picked color, work out everything the interface needs, and keep
  // it readable on the current background:
  //   accent    the fill color (buttons, bars, ticks), at least 3:1 against the page
  //   light     the same hue as text or an outline, at least 4.5:1
  //   onAccent  dark or white text for use ON the accent, whichever reads better
  //   adjusted  true when the picked color had to be nudged to stay visible
  deriveAccent(hex) {
    const bgVar = getComputedStyle(document.body).getPropertyValue('--bg').trim();
    const bg = this._hexToRgb(bgVar || (Store.data.settings.theme === 'light' ? '#F1F0EC' : '#14161A'));
    const base = this._hexToRgb(hex);

    const fill = this._ensureContrast(base, bg, 3);
    const text = this._ensureContrast(base, bg, 4.5);
    const dark = { r: 20, g: 22, b: 26 }, white = { r: 255, g: 255, b: 255 };
    const onAccent = this._contrast(fill, dark) >= this._contrast(fill, white) ? '#14161A' : '#FFFFFF';

    return {
      accent: this._toHex(fill),
      light: this._toHex(text),
      glow: `rgba(${fill.r}, ${fill.g}, ${fill.b}, 0.16)`,
      onAccent,
      adjusted: this._toHex(fill) !== this._toHex(base)
    };
  },

  _hexToRgb(hex) {
    let clean = String(hex || '').replace('#', '').trim();
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) clean = '14161A';
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16)
    };
  },

  _toHex(c) {
    return '#' + [c.r, c.g, c.b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  },

  // WCAG relative luminance and contrast ratio.
  _lum(c) {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  },
  _contrast(a, b) {
    const la = this._lum(a), lb = this._lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  },

  // Nudge a color toward white (on dark pages) or black (on light pages)
  // just far enough to reach the contrast target.
  _ensureContrast(color, bg, min) {
    const toward = this._lum(bg) < 0.4 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
    let out = color;
    for (let amt = 0; this._contrast(out, bg) < min && amt < 1; ) {
      amt = Math.min(1, amt + 0.05);
      out = {
        r: color.r + (toward.r - color.r) * amt,
        g: color.g + (toward.g - color.g) * amt,
        b: color.b + (toward.b - color.b) * amt
      };
    }
    return out;
  },

  _bindNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigateTo(btn.dataset.screen);
      });
    });
  },

  navigateTo(screenName) {
    this.currentScreen = screenName;

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screenName}`).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[data-screen="${screenName}"]`).classList.add('active');

    this.renderCurrentScreen();
  },

  renderCurrentScreen() {
    switch (this.currentScreen) {
      case 'dashboard': Dashboard.render(); break;
      case 'workouts': Workouts.render(); break;
      case 'library': Library.render(); break;
      case 'progress': Progress.render(); break;
      case 'settings': Settings.render(); break;
    }
  },

  _registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(reg => Updater.watch(reg))
        .catch(err => console.warn('Arsa: service worker registration failed', err));
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());


/* ============================================
   Updater — "A new version is ready" banner.
   A new service worker installs in the background and waits. Tapping Reload
   tells it to take over, then the page reloads once. A workout in progress
   is autosaved, so reloading never loses it.
   ============================================ */
const Updater = {
  _reg: null,
  _reloading: false,

  watch(reg) {
    this._reg = reg;
    const offer = () => { if (navigator.serviceWorker.controller) this._showBanner(); };

    if (reg.waiting) offer();
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', () => { if (sw.state === 'installed') offer(); });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this._reloading) return;
      this._reloading = true;
      window.location.reload();
    });

    // Look for updates whenever the app comes back to the foreground.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {});
    });

    document.getElementById('update-reload').addEventListener('click', () => this.apply());
    document.getElementById('update-later').addEventListener('click', () => this._hideBanner());
  },

  apply() {
    const waiting = this._reg && this._reg.waiting;
    if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });
    else window.location.reload();
  },

  // For the Settings "Check for updates" button.
  async check() {
    if (!this._reg) return 'unsupported';
    try { await this._reg.update(); } catch (e) { return 'offline'; }
    if (this._reg.waiting) { this._showBanner(); return 'available'; }
    if (this._reg.installing) return 'installing';
    return 'current';
  },

  // The version comes from the cache name the service worker created.
  async version() {
    try {
      const keys = (await caches.keys()).filter(k => /^arsa-\d/.test(k));
      return keys.length ? keys[0].replace('arsa-', '') : null;
    } catch (e) { return null; }
  },

  _showBanner() { document.getElementById('update-banner').classList.remove('hidden'); },
  _hideBanner() { document.getElementById('update-banner').classList.add('hidden'); }
};
