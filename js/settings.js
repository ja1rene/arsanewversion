/* ============================================
   ARSA — Settings Screen
   Plain rows, no icons. Pickers open as sheets.
   The accent picker previews the color on real
   interface pieces and keeps it readable.
   ============================================ */

const ACCENT_PRESETS = [
  { hex: '#FFB224', name: 'Amber' },
  { hex: '#FF6B2C', name: 'Orange' },
  { hex: '#FF6B8A', name: 'Rose' },
  { hex: '#A78BFA', name: 'Violet' },
  { hex: '#4CC2FF', name: 'Sky' },
  { hex: '#2DD4BF', name: 'Teal' },
  { hex: '#B6E04A', name: 'Lime' }
];

const Settings = {
  render() {
    const screen = document.getElementById('screen-settings');
    this._bindScreen(screen);
    const s = Store.data.settings;
    const meta = Store.data.meta;
    const accentNow = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#FFB224';

    const row = (action, label, value, sub) => `
      <button class="st-row" type="button" data-action="${action}">
        <span class="lb"><span>${label}</span>${sub ? `<small>${sub}</small>` : ''}</span>
        <span class="val">${value}</span>
      </button>`;
    const sw = (id, label, sub, on) => `
      <div class="st-row">
        <span class="lb"><span>${label}</span>${sub ? `<small>${sub}</small>` : ''}</span>
        <button class="sw" type="button" role="switch" id="${id}" aria-checked="${!!on}" aria-label="${label}"></button>
      </div>`;

    const workoutCount = Store.data.exerciseHistory.length;
    const needsBackup = workoutCount >= 5 && (!meta.lastExportAt || this._daysSince(meta.lastExportAt) > 30);

    screen.innerHTML = `
      <h1 class="screen-title">Settings</h1>

      <div class="pg-sec"><span>Profile</span></div>
      <div class="st-row">
        <label class="lb" for="set-name"><span>Name</span></label>
        <input type="text" class="st-input" id="set-name" placeholder="Your name" value="${esc(s.name && s.name !== 'Lifter' ? s.name : '')}" autocomplete="off">
      </div>

      <div class="pg-sec"><span>Appearance</span></div>
      ${row('theme', 'Theme', this._themeLabel(s.theme))}
      ${row('accent', 'Accent color', `<i class="st-sw" style="background:${accentNow}"></i>${s.accentColor ? 'Custom' : 'Theme default'}`)}

      <div class="pg-sec"><span>Training</span></div>
      ${row('units', 'Weight units', s.units)}
      ${sw('toggle-plate-mode', 'Plate calculator', 'Log weight as bar plus plates per side', s.plateMode)}

      <div class="pg-sec"><span>Reminders</span></div>
      ${sw('toggle-notifications', 'Workout reminders', 'Notify me on training days', s.notifications)}
      ${s.notifications ? row('reminder-time', 'Remind me by', this._formatTime(s.notificationTime)) : ''}
      <p class="db-note">Reminders fire when you open Arsa on a training day and haven't logged a workout yet. They need a few weeks of history to learn your schedule. On Android, Arsa also tries a background check, but no phone can guarantee a notification while the app is fully closed without a paid server, which Arsa doesn't use. Opening the app regularly is what makes this work.</p>

      <div class="pg-sec"><span>Your data</span></div>
      ${row('export', 'Export backup', 'Save a file')}
      ${row('import', 'Import backup', 'Restore from a file')}
      <div class="st-row"><span class="lb"><span>Last backup</span></span><span class="val">${meta.lastExportAt ? Fmt.date(meta.lastExportAt, { year: 'numeric' }) : 'Never'}</span></div>
      <div class="st-row"><span class="lb"><span>Storage protection</span><small>Asks the browser not to clear your workouts when space runs low</small></span><span class="val" id="st-persist">Checking</span></div>
      ${needsBackup ? `<p class="db-note">You have ${workoutCount} workouts logged and ${meta.lastExportAt ? 'no backup in the last 30 days' : 'no backup yet'}. Export one so a lost phone doesn't mean lost history.</p>` : ''}
      <input type="file" id="import-file-input" accept="application/json" style="display:none;">

      <div class="pg-sec"><span>About</span></div>
      <div class="st-row"><span class="lb"><span>Version</span></span><span class="val num" id="st-version">...</span></div>
      ${row('check-update', 'Check for updates', '')}
      ${row('whats-new', "What's new", '')}
      ${row('coach-misses', 'Coach questions', Coach.getMisses().length ? Coach.getMisses().length + ' unanswered' : 'None', 'Questions Coach could not answer, saved on this device only')}

      <div class="form-section mt-8" style="padding-bottom: 8px;">
        <button class="bd-delete" type="button" data-action="reset">Reset all data</button>
      </div>
      <p class="db-note" style="text-align:center;padding-bottom:28px;">Arsa. Works offline and saves on this device.</p>
    `;

    this._showPersistStatus();
    Updater.version().then(v => {
      const el = document.getElementById('st-version');
      if (el) el.textContent = v || (typeof CHANGELOG !== 'undefined' ? CHANGELOG[0].version : '');
    });
  },

  _themeLabel(t) {
    return { light: 'Light', dark: 'Dark' }[t] || 'Dark';
  },

  _formatTime(time24) {
    const [h, m] = (time24 || '17:00').split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  },

  _daysSince(iso) {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  },

  async _showPersistStatus() {
    let text = 'Not available';
    try {
      if (navigator.storage && navigator.storage.persisted) {
        text = (await navigator.storage.persisted()) ? 'On' : 'Not granted';
      }
    } catch (e) { /* leave as not available */ }
    const el = document.getElementById('st-persist');
    if (el) el.textContent = text;
  },

  // One delegated handler set for the screen, assigned as properties so
  // re-rendering never stacks duplicate listeners.
  _bindScreen(screen) {
    screen.onclick = async (e) => {
      const t = e.target.closest('button');
      if (!t || !screen.contains(t)) return;
      const s = Store.data.settings;

      switch (t.dataset.action || t.id) {
        case 'theme': return this._openThemePicker();
        case 'accent': return this._openAccentPicker();
        case 'units': return this._openUnitsPicker();
        case 'reminder-time': return this._openReminderTimePicker();
        case 'export': return this._exportData();
        case 'import': return document.getElementById('import-file-input').click();
        case 'reset': return this._confirmReset();
        case 'whats-new': return this._openWhatsNew();
        case 'coach-misses': return this._openCoachMisses();
        case 'check-update': {
          showToast('Checking for updates');
          const r = await Updater.check();
          return showToast({ available: 'Update ready, tap Reload', current: "You're on the latest version", offline: "Can't check while offline", installing: 'Downloading the update', unsupported: 'Updates are not supported here' }[r]);
        }

        case 'toggle-plate-mode':
          s.plateMode = !s.plateMode;
          Store.save();
          t.setAttribute('aria-checked', String(s.plateMode));
          return showToast(s.plateMode ? 'Plate calculator on' : 'Plate calculator off');

        case 'toggle-notifications':
          if (!s.notifications) {
            // Turning on: ask for permission first, and only flip the setting
            // if it is granted, otherwise the switch would read "on" while
            // nothing works.
            const granted = await Reminders.requestPermission();
            if (!granted) return;
            s.notifications = true;
          } else {
            s.notifications = false;
          }
          Store.save();
          this.render();
          return showToast(s.notifications ? 'Reminders on' : 'Reminders off');
      }
    };

    screen.onchange = (e) => {
      if (e.target.id === 'set-name') {
        Store.data.settings.name = e.target.value.trim() || 'Lifter';
        Store.save();
      } else if (e.target.id === 'import-file-input') {
        this._importData(e);
      }
    };
  },

  // ---------- Pickers ----------

  _check() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>';
  },

  _openThemePicker() {
    const current = Store.data.settings.theme;
    openModal(`
      <div class="modal-title">Theme</div>
      <div class="modal-body">
        ${['dark', 'light'].map(t => `
          <button class="pk-row" type="button" data-theme-opt="${t}">
            <span>${this._themeLabel(t)}</span>${t === current ? this._check() : ''}
          </button>`).join('')}
      </div>
    `);
    document.querySelectorAll('[data-theme-opt]').forEach(el => {
      el.addEventListener('click', () => {
        Store.data.settings.theme = el.dataset.themeOpt;
        Store.save();
        App.applyTheme();
        closeModal();
        this.render();
        showToast(`${this._themeLabel(el.dataset.themeOpt)} theme on`);
      });
    });
  },

  _openAccentPicker() {
    const current = Store.data.settings.accentColor;
    let pending = current || ACCENT_PRESETS[0].hex;

    openModal(`
      <div class="modal-title">Accent color</div>
      <div class="modal-body">
        <div class="ac-presets" id="accent-presets" role="group" aria-label="Preset colors">
          ${ACCENT_PRESETS.map(p => `
            <button class="ac-sw ${current && current.toLowerCase() === p.hex.toLowerCase() ? 'on' : ''}" type="button" style="background:${p.hex}" data-accent="${p.hex}" aria-label="${p.name}"></button>`).join('')}
        </div>
        <div class="input-group">
          <label class="input-label" for="accent-custom">Or pick any color</label>
          <input type="color" class="input" id="accent-custom" value="${pending}" style="height:48px;cursor:pointer;padding:4px;">
        </div>

        <div class="ac-prev" id="ac-prev">
          <button class="db-go" type="button" tabindex="-1">Log set 3</button>
          <div class="ac-line"><em class="sx-pr">PR</em><span class="num">85 × 10</span><span class="ac-bar"><i></i></span></div>
        </div>
        <p class="bd-hint" id="ac-note"></p>
        ${current ? '<button class="sx-text" type="button" id="accent-reset" style="padding-left:0;">Use the theme default</button>' : ''}
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="accent-cancel">Cancel</button>
        <button class="btn btn-primary" id="accent-apply">Apply</button>
      </div>
    `);

    // The preview shows exactly what the app will use, after the contrast
    // adjustment, so there are no surprises after tapping Apply.
    const preview = () => {
      const d = App.deriveAccent(pending);
      const el = document.getElementById('ac-prev');
      el.style.setProperty('--accent', d.accent);
      el.style.setProperty('--accent-light', d.light);
      el.style.setProperty('--on-accent', d.onAccent);
      document.getElementById('ac-note').textContent = d.adjusted
        ? `Adjusted slightly so it stays readable on the ${Store.data.settings.theme === 'light' ? 'light' : 'dark'} theme.`
        : '';
    };
    preview();

    document.querySelectorAll('#accent-presets .ac-sw').forEach(dot => {
      dot.addEventListener('click', () => {
        pending = dot.dataset.accent;
        document.getElementById('accent-custom').value = pending;
        document.querySelectorAll('#accent-presets .ac-sw').forEach(d => d.classList.remove('on'));
        dot.classList.add('on');
        preview();
      });
    });

    document.getElementById('accent-custom').addEventListener('input', (e) => {
      pending = e.target.value;
      document.querySelectorAll('#accent-presets .ac-sw').forEach(d => d.classList.remove('on'));
      preview();
    });

    const resetBtn = document.getElementById('accent-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Store.data.settings.accentColor = null;
        Store.save();
        App.applyTheme();
        closeModal();
        this.render();
        showToast('Accent color reset');
      });
    }

    document.getElementById('accent-cancel').addEventListener('click', closeModal);
    document.getElementById('accent-apply').addEventListener('click', () => {
      Store.data.settings.accentColor = pending;
      Store.save();
      App.applyTheme();
      closeModal();
      this.render();
      showToast('Accent color updated');
    });
  },

  _openUnitsPicker() {
    const current = Store.data.settings.units;
    openModal(`
      <div class="modal-title">Weight units</div>
      <div class="modal-body">
        <p style="color:var(--text-3);font-size:12px;line-height:1.5;">Switching converts every saved weight: history, records, body weight and the plate bar. Values round to the nearest 0.5 lbs or 0.25 kg, so switching back and forth can drift slightly.</p>
        ${['kg', 'lbs'].map(u => `
          <button class="pk-row" type="button" data-unit-opt="${u}">
            <span>${u}</span>${u === current ? this._check() : ''}
          </button>`).join('')}
      </div>
    `);
    document.querySelectorAll('[data-unit-opt]').forEach(el => {
      el.addEventListener('click', () => {
        Store.convertUnits(el.dataset.unitOpt);
        closeModal();
        this.render();
        showToast(`Units set to ${el.dataset.unitOpt}, saved weights converted`);
      });
    });
  },

  _openReminderTimePicker() {
    const current = Store.data.settings.notificationTime || '17:00';
    openModal(`
      <div class="modal-title">Remind me by</div>
      <div class="modal-body">
        <p style="color:var(--text-2);font-size:13px;line-height:1.5;">On a training day, if you haven't logged a workout by this time, Arsa tries to notify you the next time you open the app.</p>
        <div class="input-group">
          <label class="input-label" for="reminder-time-input">Time</label>
          <input type="time" class="input" id="reminder-time-input" value="${current}">
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="reminder-time-cancel">Cancel</button>
        <button class="btn btn-primary" id="reminder-time-save">Save</button>
      </div>
    `);
    document.getElementById('reminder-time-cancel').addEventListener('click', closeModal);
    document.getElementById('reminder-time-save').addEventListener('click', () => {
      const val = document.getElementById('reminder-time-input').value;
      if (val) {
        Store.data.settings.notificationTime = val;
        Store.save();
      }
      closeModal();
      this.render();
      showToast('Reminder time saved');
    });
  },

  _openCoachMisses() {
    const list = Coach.getMisses();
    openModal(`
      <div class="modal-title">Questions Coach could not answer</div>
      <div class="modal-body">
        ${list.length
          ? `<ul class="lb-list" style="padding-left:18px">${list.map(m => `<li>${esc(m.q)}</li>`).join('')}</ul>`
          : '<p style="color:var(--text-2)">Nothing yet. Questions Coach cannot answer are saved here, on this device only, so the knowledge base can grow.</p>'}
      </div>
      <div class="modal-actions">
        ${list.length ? '<button class="btn btn-outline" id="cm-clear">Clear</button><button class="btn btn-outline" id="cm-copy">Copy</button>' : ''}
        <button class="btn btn-primary" id="cm-close">Close</button>
      </div>
    `);
    document.getElementById('cm-close').addEventListener('click', closeModal);
    const clear = document.getElementById('cm-clear');
    if (clear) clear.addEventListener('click', () => { Coach.clearMisses(); closeModal(); this.render(); showToast('Cleared'); });
    const copy = document.getElementById('cm-copy');
    if (copy) copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(list.map(m => m.q).join('\n')); showToast('Copied'); }
      catch (e) { showToast('Could not copy'); }
    });
  },

  _openWhatsNew() {
    openModal(`
      <div class="modal-title">What's new</div>
      <div class="modal-body">
        ${CHANGELOG.map(r => `
          <div class="pg-sec" style="padding-left:0;padding-right:0"><span>Version ${esc(r.version)}</span></div>
          <ul class="lb-list" style="padding-left:18px">${r.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`).join('')}
      </div>
      <div class="modal-actions"><button class="btn btn-primary" id="wn-close">Close</button></div>
    `);
    document.getElementById('wn-close').addEventListener('click', closeModal);
  },

  // ---------- Backup, restore, reset ----------

  _exportData() {
    const json = Store.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arsa-backup-${Store.todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Store.data.meta.lastExportAt = new Date().toISOString();
    Store.save();
    this.render();
    showToast('Backup downloaded');
  },

  _importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      openModal(`
        <div class="modal-title">Import this backup?</div>
        <div class="modal-body"><p style="color:var(--text-2);">This replaces your current workouts, history and settings with the contents of this file. This cannot be undone.</p></div>
        <div class="modal-actions">
          <button class="btn btn-outline" id="import-cancel">Cancel</button>
          <button class="btn btn-primary" id="import-confirm">Import</button>
        </div>
      `);
      document.getElementById('import-cancel').addEventListener('click', closeModal);
      document.getElementById('import-confirm').addEventListener('click', () => {
        const success = Store.importData(evt.target.result);
        closeModal();
        if (success) {
          App.applyTheme();
          showToast('Backup imported');
          App.navigateTo('dashboard');
          App.renderCurrentScreen();
        } else {
          showToast('Import failed. That file is not an Arsa backup.');
        }
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  },

  _confirmReset() {
    openModal(`
      <div class="modal-title">Reset all data?</div>
      <div class="modal-body">
        <p style="color:var(--text-2);">This permanently deletes all workouts, history, records and settings. Export a backup first if you might want them back.</p>
        <p style="color:var(--text-2);">Type <strong style="color:var(--text);">RESET</strong> to confirm.</p>
        <input type="text" class="input" id="reset-confirm-input" placeholder="Type RESET" autocomplete="off" autocapitalize="off">
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="reset-cancel">Cancel</button>
        <button class="btn btn-danger" id="reset-confirm" disabled style="opacity:0.4;">Reset everything</button>
      </div>
    `);
    const input = document.getElementById('reset-confirm-input');
    const confirmBtn = document.getElementById('reset-confirm');
    input.addEventListener('input', () => {
      const ok = input.value.trim().toUpperCase() === 'RESET';
      confirmBtn.disabled = !ok;
      confirmBtn.style.opacity = ok ? '1' : '0.4';
    });
    document.getElementById('reset-cancel').addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', () => {
      if (confirmBtn.disabled) return;
      Store.resetAll();
      App.applyTheme();
      closeModal();
      showToast('All data reset');
      App.navigateTo('dashboard');
      App.renderCurrentScreen();
    });
  }
};
