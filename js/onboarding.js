/* ============================================
   ARSA — First-time welcome, tutorial and profile name
   Stored in localStorage key 'arsa-onboarding' ({status:'done'|'skipped'|'existing'}).
   Existing users who already have data never see it automatically;
   they can replay it from Settings > About.
   ============================================ */

const Profile = {
  MAX: 30,
  get() {
    const n = Store.data && Store.data.settings && Store.data.settings.name;
    return n && n !== 'Lifter' ? String(n).trim() : '';
  },
  validate(raw) {
    const v = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim();
    if (!v) return { ok: false, error: 'Enter your name to save it.' };
    if (v.length > this.MAX) return { ok: false, error: 'Keep it to ' + this.MAX + ' characters or fewer.' };
    return { ok: true, value: v };
  },
  save(raw) {
    const r = this.validate(raw);
    if (r.ok) { Store.data.settings.name = r.value; Store.save(); }
    return r;
  },
  greeting() {
    const h = new Date().getHours();
    const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const n = this.get();
    return { title: n ? part + ', ' + n + '!' : part + '!', sub: "Ready for today's workout?" };
  }
};

const Onboarding = {
  KEY: 'arsa-onboarding',
  _i: -1,          // -1 = welcome, 0..4 = steps
  _dir: 1,
  _open: false,
  _returnFocus: null,

  STEPS: [
    { screen: 'dashboard', title: 'Dashboard',
      text: 'Your home screen. See today’s workout, your streak, weekly volume and personal records at a glance.',
      art: '<rect x="8" y="10" width="64" height="22" rx="2"/><rect x="8" y="38" width="30" height="16" rx="2"/><rect x="42" y="38" width="30" height="16" rx="2"/><path d="M14 22h22" class="acc"/>' },
    { screen: 'workouts', title: 'Log a workout',
      text: 'Open a workout from Workouts and tap Start. Enter the weight and reps for each set, then finish to save it. “Same” and “Try” fill in numbers for you.',
      art: '<path d="M10 32h60M18 22v20M26 18v28M54 18v28M62 22v20"/><path d="M26 32h28" class="acc"/>' },
    { screen: 'progress', title: 'Track progress',
      text: 'The Progress tab shows your overview, each exercise’s strength trend, awards and your full workout history.',
      art: '<path d="M10 52V12M10 52h60"/><path d="M16 44l14-10 12 6 22-22" class="acc"/>' },
    { screen: 'workouts', title: 'Training plans',
      text: 'Build your own workouts and training splits from the Workouts tab, and pick exercises from the Library. Everything can be edited later.',
      art: '<rect x="10" y="12" width="60" height="12" rx="2"/><rect x="10" y="30" width="60" height="12" rx="2"/><rect x="10" y="48" width="38" height="8" rx="2" class="acc"/>' },
    { screen: 'settings', title: 'Settings',
      text: 'Add your name so Arsa can greet you, and set theme, units and reminders. You can also back up your data here.',
      art: '<circle cx="40" cy="22" r="9"/><path d="M22 54c2-12 10-16 18-16s16 4 18 16" class="acc"/>' }
  ],

  _status() { try { return (JSON.parse(localStorage.getItem(this.KEY)) || {}).status || null; } catch (e) { return null; } },
  _setStatus(s) { try { localStorage.setItem(this.KEY, JSON.stringify({ status: s, at: new Date().toISOString() })); } catch (e) { /* ignore */ } },

  // Called once from App.init. First open only; existing users are marked, not interrupted.
  maybeStart() {
    if (this._status()) return;
    const d = Store.data || {};
    const hasData = (Store.getWorkouts && Store.getWorkouts().length) || (Store.getHistory && Store.getHistory().length) || Profile.get();
    if (hasData) { this._setStatus('existing'); return; }
    this.start();
  },

  start(opts) {
    if (this._open) return;
    this._open = true;
    this._i = -1;
    this._returnFocus = document.activeElement;
    const el = document.createElement('div');
    el.className = 'ob';
    el.id = 'onboarding';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'ob-title');
    document.body.appendChild(el);
    el.addEventListener('click', (e) => this._click(e));
    this._key = (e) => this._onKey(e);
    document.addEventListener('keydown', this._key);
    this._render(true);
  },

  _close(status) {
    this._setStatus(status);
    document.removeEventListener('keydown', this._key);
    const el = document.getElementById('onboarding');
    if (el) el.remove();
    this._open = false;
    const rf = this._returnFocus;
    if (rf && rf.focus && document.contains(rf)) { try { rf.focus(); } catch (e) { /* ignore */ } }
    // Land on the dashboard so the greeting and Settings are one tap away.
    if (typeof App !== 'undefined' && App.currentScreen !== 'dashboard' && !document.getElementById('workout-session')?.classList.contains('active')) {
      // stay where they are if they replayed from Settings
    }
    if (typeof App !== 'undefined') App.renderCurrentScreen && App.renderCurrentScreen();
  },

  _art(svg) {
    return '<svg class="ob-art" viewBox="0 0 80 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + svg + '</svg>';
  },

  _render(first) {
    const el = document.getElementById('onboarding');
    if (!el) return;
    const i = this._i, n = this.STEPS.length;
    let body;
    if (i < 0) {
      body = `
        <div class="ob-card ${first ? '' : 'ob-in' + (this._dir < 0 ? '-back' : '')}">
          <img class="ob-logo" src="icons/logo-mark.svg" alt="" width="56" height="56">
          <h1 class="ob-h" id="ob-title">Welcome to Arsa</h1>
          <p class="ob-p">Welcome to your personal training logbook! This app helps you track your workouts, monitor your progress, and stay consistent with your fitness journey.</p>
        </div>
        <div class="ob-foot">
          <button class="ob-btn primary" type="button" data-ob="next" id="ob-primary">Get started</button>
          <button class="ob-btn link" type="button" data-ob="skip">Skip tutorial</button>
        </div>`;
    } else {
      const s = this.STEPS[i], last = i === n - 1;
      body = `
        <div class="ob-top">
          <span class="ob-count num" aria-live="polite">${i + 1} of ${n}</span>
          <button class="ob-btn link sm" type="button" data-ob="skip">Skip</button>
        </div>
        <div class="ob-card ob-in${this._dir < 0 ? '-back' : ''}">
          <div class="ob-artwrap">${this._art(s.art)}</div>
          <h2 class="ob-h" id="ob-title">${s.title}</h2>
          <p class="ob-p">${s.text}</p>
        </div>
        <div class="ob-dots" aria-hidden="true">${this.STEPS.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
        <div class="ob-foot row">
          <button class="ob-btn ghost" type="button" data-ob="prev">${i === 0 ? 'Back' : 'Previous'}</button>
          <button class="ob-btn primary" type="button" data-ob="${last ? 'finish' : 'next'}" id="ob-primary">${last ? 'Finish' : 'Next'}</button>
        </div>`;
    }
    el.innerHTML = '<div class="ob-inner">' + body + '</div>';
    const b = document.getElementById('ob-primary');
    if (b) b.focus({ preventScroll: true });
    const ttl = document.getElementById('ob-title');
    if (ttl) ttl.setAttribute('tabindex', '-1');
  },

  _go(d) {
    const n = this.STEPS.length;
    const next = this._i + d;
    if (next < -1) return;
    if (next >= n) return this._close('done');
    this._dir = d;
    this._i = next;
    this._render(false);
  },

  _click(e) {
    const b = e.target.closest('[data-ob]');
    if (!b) return;
    switch (b.dataset.ob) {
      case 'next': return this._go(1);
      case 'prev': return this._go(-1);
      case 'skip': return this._close('skipped');
      case 'finish': return this._close('done');
    }
  },

  _onKey(e) {
    if (!this._open) return;
    if (e.key === 'Escape') { e.preventDefault(); return this._close('skipped'); }
    if (e.key === 'ArrowRight') { e.preventDefault(); return this._go(1); }
    if (e.key === 'ArrowLeft' && this._i >= 0) { e.preventDefault(); return this._go(-1); }
    if (e.key === 'Tab') {
      const f = [...document.querySelectorAll('#onboarding button')];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
};
