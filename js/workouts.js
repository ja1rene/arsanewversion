/* ============================================
   ARSA — Workouts Screen (List + Builder)
   A workout is a name, optional training days, and an
   ordered list of exercises. Reordering uses up/down
   buttons, which work on touch screens.
   ============================================ */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Shown Monday-first; the numbers are still JavaScript's 0 = Sunday.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const Workouts = {
  _draft: null, // in-progress workout being built
  _split: null, // { id, variant } while a training split is open
  _original: null,     // JSON snapshot of the workout when the builder opened, to tell if it changed
  _histPushed: false,  // a browser history entry is held while the builder is open
  _ignorePop: false,

  render() {
    const screen = document.getElementById('screen-workouts');
    this._bindScreen(screen);
    if (this._split) return this._renderSplit();

    const workouts = Store.getWorkouts();
    const history = Store.getHistory();

    screen.innerHTML = `
      <div class="sc-head">
        <h1 class="screen-title">Workouts</h1>
        <button class="sc-add" type="button" data-new>New workout</button>
      </div>

      ${this._draftBannerHtml()}

      ${workouts.length === 0 ? `
        <section class="wk-empty">
          <h2>No workouts yet</h2>
          <p>Build your own routine: Upper day, Push, Legs, anything you train. Arsa never forces a structure on you.</p>
          <button class="db-go" type="button" data-new>Create your first workout</button>
        </section>
      ` : `
        <div class="wk-list">
          ${workouts.map(w => this._renderWorkoutItem(w, history)).join('')}
        </div>
      `}

      <div class="pg-sec"><span>Training splits</span><span>Ready-made programs</span></div>
      <div class="wk-list">
        ${SPLITS.map(sp => `
          <div class="wk-row">
            <button class="wk-main" type="button" data-split="${sp.id}">
              <span class="nm">${esc(sp.name)}</span>
              <span class="mt">${esc(sp.freq)}, ${esc(sp.level.toLowerCase())}</span>
            </button>
          </div>`).join('')}
      </div>
      <p class="db-note" style="padding-bottom:24px">Not sure where to start? Pick a split and Arsa adds the workouts for you. You can edit anything afterwards.</p>
    `;
  },

  // ---- TRAINING SPLITS ----
  _renderSplit() {
    const sp = SPLITS.find(s => s.id === this._split.id);
    if (!sp) { this._split = null; return this.render(); }
    const v = sp.variants[this._split.variant] || sp.variants[0];
    const screen = document.getElementById('screen-workouts');
    const dayText = (name) => (v.days[name] || []).length
      ? WEEK_ORDER.filter(d => v.days[name].includes(d)).map(d => WEEKDAYS[d]).join(', ') : '';

    // Days the new workouts will share with ones you already have.
    const used = new Set();
    Store.getWorkouts().forEach(w => (w.scheduledDays || []).forEach(d => used.add(d)));
    const clash = new Set();
    Object.values(v.days).forEach(list => list.forEach(d => { if (used.has(d)) clash.add(d); }));

    screen.innerHTML = `
      <button class="back-btn" id="btn-split-back" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        Workouts
      </button>
      <h1 class="screen-title" style="padding-top:8px;">${esc(sp.name)}</h1>
      <div class="pg-when">${esc(sp.freq)}, ${esc(sp.level.toLowerCase())}</div>
      <p class="lb-p" style="padding-top:14px">${esc(sp.blurb)}</p>

      ${sp.variants.length > 1 ? `
        <div class="pg-sec"><span>Schedule</span></div>
        <div class="bd-days" style="padding:0 20px" role="group" aria-label="Days per week">
          ${sp.variants.map((x, i) => `<button class="bd-day" type="button" data-variant="${i}" aria-pressed="${i === this._split.variant}">${esc(x.label)}</button>`).join('')}
        </div>` : ''}

      ${sp.workouts.map(w => `
        <div class="pg-sec"><span>${esc(w.name)}</span><span>${esc(dayText(w.name))}</span></div>
        <div class="pg-ledger">
          ${w.exercises.map(e => {
            const lib = ExerciseDB.find(x => x.id === e.id);
            return `<div class="pg-row"><span>${esc(lib ? lib.name : e.id)}</span><span class="num">${e.sets} × ${esc(e.reps)}</span></div>`;
          }).join('')}
        </div>`).join('')}

      <div class="pg-sec"><span>How to progress</span></div>
      <p class="lb-p">${esc(sp.tip)}</p>

      <div style="padding:22px 20px 8px">
        <button class="db-go" type="button" id="btn-add-split">Add ${sp.workouts.length} workouts</button>
      </div>
      <p class="bd-hint" style="padding:0 20px 28px">${clash.size ? `You already have workouts on ${WEEK_ORDER.filter(d => clash.has(d)).map(d => WEEKDAYS[d]).join(', ')}, so they will share those days. ` : ''}Weights start empty and fill in as you train. Nothing you have is changed or deleted.</p>
    `;
  },

  _addSplit() {
    const sp = SPLITS.find(s => s.id === this._split.id);
    if (!sp) return;
    const v = sp.variants[this._split.variant] || sp.variants[0];
    const taken = new Set(Store.getWorkouts().map(w => w.name));

    sp.workouts.forEach(w => {
      let name = w.name, n = 2;
      while (taken.has(name)) name = `${w.name} (${n++})`;
      taken.add(name);
      Store.createWorkout({
        name,
        description: `${sp.name} split`,
        color: '#64748B',
        icon: '',
        scheduledDays: (v.days[w.name] || []).slice(),
        exercises: w.exercises.map(e => {
          const lib = ExerciseDB.find(x => x.id === e.id);
          return { id: Store.uid(), exerciseId: e.id, name: lib ? lib.name : e.id, sets: e.sets, repRange: e.reps, restTime: e.rest, notes: '' };
        })
      });
    });

    this._split = null;
    this.render();
    showToast(`${sp.workouts.length} workouts added`);
  },

  _renderWorkoutItem(w, history) {
    const days = (w.scheduledDays && w.scheduledDays.length)
      ? WEEK_ORDER.filter(d => w.scheduledDays.includes(d)).map(d => WEEKDAYS[d]).join(', ')
      : 'No set days';
    const last = history.find(h => h.workoutId === w.id);
    const lastText = last ? Dashboard._lastDoneText(w.id, history) : 'Not done yet.';
    const n = w.exercises.length;

    return `
      <div class="wk-row">
        <button class="wk-main" type="button" data-open="${w.id}" aria-label="Edit ${esc(w.name)}">
          <span class="nm">${esc(w.name)}</span>
          <span class="mt">${n} ${n === 1 ? 'exercise' : 'exercises'}, ${days}</span>
          <span class="mt dim">${lastText}</span>
        </button>
        <button class="wk-start" type="button" data-start="${w.id}">Start</button>
      </div>`;
  },

  // One delegated handler for the whole screen, assigned as a property so
  // re-rendering never stacks duplicate listeners. Start buttons are handled
  // by the document-level handler at the bottom of this file.
  _bindScreen(screen) {
    screen.onclick = (e) => {
      const t = e.target.closest('button');
      if (!t || !screen.contains(t)) return;
      const d = this._draft;

      if (t.dataset.split) { this._split = { id: t.dataset.split, variant: 0 }; this.render(); return screen.scrollTo(0, 0); }
      if (t.id === 'btn-split-back') { this._split = null; return this.render(); }
      if (t.dataset.variant !== undefined) { this._split.variant = Number(t.dataset.variant); return this._renderSplit(); }
      if (t.id === 'btn-add-split') return this._addSplit();
      if (t.dataset.new !== undefined) return this._startNew();
      if (t.dataset.open) return this.openBuilder(t.dataset.open);
      if (t.dataset.draftContinue !== undefined) return this.restoreDraft();
      if (t.dataset.draftDiscard !== undefined) return this._confirmDiscardSaved();

      if (!d) return;

      if (t.id === 'btn-builder-back') return this._requestExit();
      if (t.dataset.day !== undefined) {
        const day = Number(t.dataset.day);
        const i = d.scheduledDays.indexOf(day);
        if (i > -1) d.scheduledDays.splice(i, 1); else d.scheduledDays.push(day);
        t.setAttribute('aria-pressed', String(i === -1));
        this._persistDraft();
        return;
      }
      if (t.id === 'btn-add-exercise') return this._openAddExercise();
      if (t.dataset.edit !== undefined) return this._openAddExercise(Number(t.dataset.edit));
      if (t.dataset.up !== undefined) return this._move(Number(t.dataset.up), -1);
      if (t.dataset.down !== undefined) return this._move(Number(t.dataset.down), 1);
      if (t.id === 'btn-save-workout') return this._saveDraft();
      if (t.id === 'btn-delete-workout') return this._confirmDelete();
    };

    screen.oninput = (e) => {
      if (!this._draft) return;
      if (e.target.id === 'wb-name') this._draft.name = e.target.value;
      if (e.target.id === 'wb-desc') this._draft.description = e.target.value;
      if (e.target.id === 'wb-name' || e.target.id === 'wb-desc') this._persistDraft();
    };
  },

  // ---- BUILDER ----
  // "New workout": if an unsaved draft exists, offer it instead of silently
  // starting over on top of it.
  _startNew() {
    if (this._readSavedDraft()) return this._askResumeOrNew();
    this.openBuilder();
  },

  openBuilder(workoutId = null) {
    if (workoutId) {
      const existing = Store.getWorkout(workoutId);
      if (!existing) return;
      this._draft = JSON.parse(JSON.stringify(existing));
    } else {
      this._draft = {
        id: null,
        name: '',
        description: '',
        // Kept so older saved data and backups stay valid; no longer shown.
        color: '#64748B',
        icon: '',
        exercises: [],
        scheduledDays: []
      };
    }
    this._original = this._snap(this._draft);
    this._holdHistory();
    this._renderBuilder();
  },

  _renderBuilder() {
    const screen = document.getElementById('screen-workouts');
    const d = this._draft;
    const isEdit = !!d.id;
    this._bindScreen(screen);
    this._persistDraft();

    screen.innerHTML = `
      <button class="back-btn" id="btn-builder-back" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        Workouts
      </button>
      <h1 class="screen-title" style="padding-top:8px;">${isEdit ? 'Edit workout' : 'New workout'}</h1>
      <p class="bd-hint" style="padding:0 20px;">Your changes are saved as you go. If you leave by mistake, you can pick up where you stopped.</p>

      <div class="form-section mt-4">
        <div class="input-group">
          <label class="input-label" for="wb-name">Name</label>
          <input type="text" class="input" id="wb-name" placeholder="e.g. Upper day" value="${esc(d.name)}" autocomplete="off" maxlength="50">
        </div>
        <div class="input-group">
          <label class="input-label" for="wb-desc">Notes</label>
          <textarea class="input" id="wb-desc" placeholder="Optional" rows="2">${esc(d.description)}</textarea>
        </div>
        <div class="input-group">
          <span class="input-label">Training days</span>
          <div class="bd-days" role="group" aria-label="Training days">
            ${WEEK_ORDER.map(day => `
              <button class="bd-day" type="button" data-day="${day}" aria-pressed="${d.scheduledDays.includes(day)}">${WEEKDAYS[day]}</button>
            `).join('')}
          </div>
          <span class="bd-hint">Optional. The Dashboard starts a workout on its training day.</span>
        </div>
      </div>

      <div class="pg-sec"><span>Exercises (${d.exercises.length})</span><button class="pg-act" type="button" id="btn-add-exercise">Add exercise</button></div>

      <div id="wb-exercise-list">
        ${d.exercises.length === 0
          ? '<p class="pg-empty">Add exercises from the library, or type your own.</p>'
          : d.exercises.map((ex, idx) => this._renderExerciseItem(ex, idx)).join('')}
      </div>

      <div class="form-section mt-8" style="padding-bottom: 28px;">
        <button class="db-go" type="button" id="btn-save-workout">${isEdit ? 'Save changes' : 'Create workout'}</button>
        ${isEdit ? '<button class="bd-delete" type="button" id="btn-delete-workout">Delete workout</button>' : ''}
      </div>
    `;
  },

  _renderExerciseItem(ex, idx) {
    const last = this._draft.exercises.length - 1;
    const arrow = (d) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${d}"/></svg>`;
    return `
      <div class="bd-ex">
        <button class="bd-ex-main" type="button" data-edit="${idx}" aria-label="Edit ${esc(ex.name)}">
          <span class="nm">${esc(ex.name)}</span>
          <span class="mt">${ex.sets} sets of ${esc(ex.repRange)} reps, rest ${ex.restTime} s</span>
        </button>
        <button class="bd-move" type="button" data-up="${idx}" aria-label="Move up" ${idx === 0 ? 'disabled' : ''}>${arrow('M6 15l6-6 6 6')}</button>
        <button class="bd-move" type="button" data-down="${idx}" aria-label="Move down" ${idx === last ? 'disabled' : ''}>${arrow('M6 9l6 6 6-6')}</button>
      </div>`;
  },

  _move(from, dir) {
    const d = this._draft;
    const to = from + dir;
    if (to < 0 || to >= d.exercises.length) return;
    [d.exercises[from], d.exercises[to]] = [d.exercises[to], d.exercises[from]];
    this._renderBuilder();
  },

  _confirmDelete() {
    const d = this._draft;
    openModal(`
      <div class="modal-title">Delete workout?</div>
      <div class="modal-body"><p style="color:var(--text-2);">This permanently deletes "${esc(d.name)}". Your logged history for it stays in Progress. This cannot be undone.</p></div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="cancel-del">Cancel</button>
        <button class="btn btn-danger" id="confirm-del">Delete</button>
      </div>
    `);
    document.getElementById('cancel-del').addEventListener('click', closeModal);
    document.getElementById('confirm-del').addEventListener('click', () => {
      Store.deleteWorkout(d.id);
      closeModal();
      this._closeBuilder();
      showToast('Workout deleted');
    });
  },

  _parseReps(str) {
    const s = String(str || '');
    const range = s.match(/^\s*(\d+)\s*(?:-|\u2013|to)\s*(\d+)\s*$/i);
    if (range) return { min: +range[1], max: +range[2] };
    const one = s.match(/^\s*(\d+)\s*$/);
    if (one) return { min: +one[1], max: +one[1] };
    return { min: '', max: '', odd: s };
  },

  _restText(sec) {
    const n = parseInt(sec, 10);
    if (!Number.isFinite(n)) return '';
    if (n === 0) return 'No rest';
    const m = Math.floor(n / 60), r = n % 60;
    return m && r ? `${m} min ${r} s` : m ? `${m} min` : `${r} s`;
  },

  _openAddExercise(editIdx = null) {
    const d = this._draft;
    const editingExisting = editIdx !== null;
    const ex = editingExisting ? d.exercises[editIdx] : null;
    const reps = editingExisting ? this._parseReps(ex.repRange) : { min: 8, max: 12 };
    const restNow = ex ? ex.restTime : 90;

    // Library exercises, grouped by muscle, so the list is easy to scan.
    const byMuscle = {};
    Store.getAllExercises().forEach(e => { (byMuscle[e.muscle || 'Other'] = byMuscle[e.muscle || 'Other'] || []).push(e); });
    const groups = Object.keys(byMuscle).sort();

    // Number fields are text inputs that only keep digits, so letters and
    // symbols never get in (number inputs still allow "e", "-" and "+").
    const num = (id, val, max, ph) => `<input type="text" inputmode="numeric" pattern="[0-9]*" data-num maxlength="${max}" class="input" id="${id}" placeholder="${ph}" value="${val === '' || val === undefined ? '' : val}" autocomplete="off">`;

    openModal(`
      <div class="modal-title">${editingExisting ? 'Edit exercise' : 'Add exercise'}</div>
      <div class="modal-body">
        ${!editingExisting ? `
          <div class="input-group">
            <label class="input-label" for="ae-select">From the library</label>
            <select class="input" id="ae-select">
              <option value="">Choose an exercise</option>
              ${groups.map(g => `
                <optgroup label="${esc(g)}">
                  ${byMuscle[g].map(e => `<option value="${e.id}">${esc(e.name)}</option>`).join('')}
                </optgroup>`).join('')}
            </select>
          </div>
          <p class="bd-hint" style="margin:-4px 0 0;">Or type your own name below.</p>
        ` : ''}
        <div class="input-group">
          <label class="input-label" for="ae-name">Name</label>
          <input type="text" class="input" id="ae-name" placeholder="e.g. Machine chest press" value="${ex ? esc(ex.name) : ''}" autocomplete="off" maxlength="60">
          <div class="ae-err" id="err-name" role="alert"></div>
        </div>
        <div class="input-group">
          <label class="input-label" for="ae-sets">Sets</label>
          ${num('ae-sets', ex ? ex.sets : 3, 2, '3')}
          <div class="ae-err" id="err-sets" role="alert"></div>
        </div>
        <div class="input-group">
          <span class="input-label">Reps per set</span>
          <div class="ae-pair">
            ${num('ae-min', reps.min, 3, 'Min')}
            <span aria-hidden="true">to</span>
            ${num('ae-max', reps.max, 3, 'Max')}
          </div>
          <span class="bd-hint">${reps.odd ? `This was "${esc(reps.odd)}". Enter numbers instead. ` : ''}Use the same number in both for a fixed target.</span>
          <div class="ae-err" id="err-reps" role="alert"></div>
        </div>
        <div class="input-group">
          <label class="input-label" for="ae-rest">Rest between sets (seconds)</label>
          ${num('ae-rest', restNow, 3, '90')}
          <div class="ae-chips">
            ${[30, 60, 90, 120, 180].map(v => `<button type="button" class="ae-chip" data-rest="${v}">${v}</button>`).join('')}
            <span class="ae-read" id="ae-rest-read">${this._restText(restNow)}</span>
          </div>
          <div class="ae-err" id="err-rest" role="alert"></div>
        </div>
        <div class="input-group">
          <label class="input-label" for="ae-notes">Notes</label>
          <textarea class="input" id="ae-notes" placeholder="Optional" rows="2" maxlength="300">${ex ? esc(ex.notes || '') : ''}</textarea>
        </div>
        ${editingExisting ? `
          <div class="bd-ex-tools">
            <button class="sx-text" type="button" id="ae-dup">Duplicate</button>
            <button class="sx-text" type="button" id="ae-remove" style="color:var(--red);">Remove from workout</button>
          </div>` : ''}
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="ae-cancel">Cancel</button>
        <button class="btn btn-primary" id="ae-save">${editingExisting ? 'Save' : 'Add'}</button>
      </div>
    `, { sticky: true });

    const $ = (id) => document.getElementById(id);
    const selectEl = $('ae-select');
    const setErr = (key, msg) => {
      $('err-' + key).textContent = msg || '';
      (key === 'reps' ? ['ae-min', 'ae-max'] : ['ae-' + key]).forEach(id => $(id).setAttribute('aria-invalid', msg ? 'true' : 'false'));
    };

    // Keep digits only, and clear a field's error as soon as it is edited.
    document.getElementById('modal-container').oninput = (e) => {
      const el = e.target;
      if (el.dataset && el.dataset.num !== undefined) {
        const clean = el.value.replace(/\D/g, '');
        if (clean !== el.value) el.value = clean;
        if (el.id === 'ae-rest') $('ae-rest-read').textContent = this._restText(el.value);
        setErr(el.id === 'ae-min' || el.id === 'ae-max' ? 'reps' : el.id.replace('ae-', ''), '');
      } else if (el.id === 'ae-name') setErr('name', '');
    };

    document.querySelectorAll('.ae-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        $('ae-rest').value = chip.dataset.rest;
        $('ae-rest-read').textContent = this._restText(chip.dataset.rest);
        setErr('rest', '');
      });
    });

    if (selectEl) {
      selectEl.addEventListener('change', () => {
        const lib = Store.getExerciseById(selectEl.value);
        if (lib) { $('ae-name').value = lib.name; setErr('name', ''); }
      });
    }

    $('ae-cancel').addEventListener('click', closeModal);

    if (editingExisting) {
      $('ae-dup').addEventListener('click', () => {
        const copy = JSON.parse(JSON.stringify(ex));
        copy.id = Store.uid();
        d.exercises.splice(editIdx + 1, 0, copy);
        closeModal();
        this._renderBuilder();
      });
      $('ae-remove').addEventListener('click', () => {
        const removed = d.exercises.splice(editIdx, 1)[0];
        closeModal();
        this._renderBuilder();
        showToast('Exercise removed', 5000, { label: 'Undo', run: () => { d.exercises.splice(editIdx, 0, removed); this._renderBuilder(); } });
      });
    }

    $('ae-save').addEventListener('click', () => {
      const name = $('ae-name').value.trim().replace(/\s+/g, ' ');
      const sets = parseInt($('ae-sets').value, 10);
      const min = parseInt($('ae-min').value, 10);
      const maxRaw = $('ae-max').value;
      const max = maxRaw === '' ? min : parseInt(maxRaw, 10);
      const restRaw = $('ae-rest').value;
      const rest = parseInt(restRaw, 10);

      const errors = {};
      if (!name) errors.name = 'Enter an exercise name';
      if (!(sets >= 1 && sets <= 20)) errors.sets = 'Enter 1 to 20 sets';
      if (!(min >= 1 && min <= 100) || !(max >= 1 && max <= 100)) errors.reps = 'Enter reps between 1 and 100';
      else if (max < min) errors.reps = 'Max reps cannot be lower than min reps';
      if (restRaw === '' || !Number.isFinite(rest)) errors.rest = 'Enter the rest in seconds, or 0 for none';
      else if (rest > 900) errors.rest = 'Rest can be up to 900 seconds (15 minutes)';

      ['name', 'sets', 'reps', 'rest'].forEach(k => setErr(k, errors[k]));
      const first = ['name', 'sets', 'reps', 'rest'].find(k => errors[k]);
      if (first) {
        const target = first === 'reps' ? $('ae-min') : $('ae-' + first);
        target.focus();
        return;
      }

      const repRange = min === max ? String(min) : `${min}-${max}`;
      const notes = $('ae-notes').value.trim();
      const libId = selectEl ? selectEl.value : (ex ? ex.exerciseId : '');

      if (editingExisting) {
        Object.assign(ex, { name, sets, repRange, restTime: rest, notes });
      } else {
        d.exercises.push({ id: Store.uid(), exerciseId: libId || null, name, sets, repRange, restTime: rest, notes });
      }
      closeModal();
      this._renderBuilder();
    });
  },

  _saveDraft() {
    const d = this._draft;
    d.name = d.name.trim().replace(/\s+/g, ' ');
    if (!d.name) { showToast('Name your workout first'); return; }
    if (d.exercises.length === 0) { showToast('Add at least one exercise'); return; }
    const clash = Store.getWorkouts().find(w => w.id !== d.id && w.name.trim().toLowerCase() === d.name.toLowerCase());
    if (clash) { showToast(`You already have a workout called "${d.name}"`); return; }

    if (d.id) {
      Store.updateWorkout(d.id, d);
      showToast('Workout saved');
    } else {
      Store.createWorkout(d);
      showToast('Workout created');
    }
    this._closeBuilder();
  },

  // ---- DRAFT SAFETY ----
  // The builder saves to the device on every change, so a reload, a crash or
  // a stray back gesture cannot throw away a half-built workout.

  _DRAFT_KEY: 'arsa-workout-draft',

  _snap(d) { return JSON.stringify(d); },
  _isDirty() { return !!this._draft && this._snap(this._draft) !== this._original; },

  _persistDraft() {
    try {
      if (!this._draft || !this._isDirty()) { localStorage.removeItem(this._DRAFT_KEY); return; }
      localStorage.setItem(this._DRAFT_KEY, JSON.stringify({ draft: this._draft, original: this._original, savedAt: new Date().toISOString() }));
    } catch (e) { /* storage full or blocked: the in-memory draft still works */ }
  },

  _clearDraftStorage() { try { localStorage.removeItem(this._DRAFT_KEY); } catch (e) { /* ignore */ } },

  _readSavedDraft() {
    try {
      const saved = JSON.parse(localStorage.getItem(this._DRAFT_KEY) || 'null');
      if (!saved || !saved.draft || !Array.isArray(saved.draft.exercises) || !Array.isArray(saved.draft.scheduledDays)) return null;
      const age = Date.now() - new Date(saved.savedAt).getTime();
      if (!(age < 14 * 86400000)) { this._clearDraftStorage(); return null; }
      return saved;
    } catch (e) { return null; }
  },

  hasSavedDraft() { return !!this._readSavedDraft(); },

  restoreDraft() {
    const saved = this._readSavedDraft();
    if (!saved) return false;
    this._draft = saved.draft;
    this._original = saved.original || this._snap({ ...saved.draft, name: '', exercises: [], scheduledDays: [], description: '' });
    // Editing a workout that has since been deleted: keep the work as a new one.
    if (this._draft.id && !Store.getWorkout(this._draft.id)) this._draft.id = null;
    this._holdHistory();
    this._renderBuilder();
    return true;
  },

  _draftBannerHtml() {
    const saved = this._readSavedDraft();
    if (!saved) return '';
    const n = saved.draft.exercises.length;
    const mins = Math.max(0, Math.round((Date.now() - new Date(saved.savedAt).getTime()) / 60000));
    const ago = mins < 1 ? 'just now' : mins < 60 ? `${mins} min ago` : mins < 1440 ? `${Math.round(mins / 60)} h ago` : `${Math.round(mins / 1440)} d ago`;
    const name = (saved.draft.name || '').trim() || 'Untitled workout';
    return `
      <div class="wk-draft" role="group" aria-label="Unsaved workout">
        <div class="tx"><b>Unsaved workout</b><small>${esc(name)}, ${n} ${n === 1 ? 'exercise' : 'exercises'}, ${ago}</small></div>
        <button class="wk-start" type="button" data-draft-continue>Continue</button>
        <button class="sx-text" type="button" data-draft-discard>Discard</button>
      </div>`;
  },

  _askResumeOrNew() {
    openModal(`
      <div class="modal-title">You have an unsaved workout</div>
      <div class="modal-body"><p style="color:var(--text-2);">Pick up where you stopped, or start a fresh one. Starting fresh discards the unsaved one.</p></div>
      <div class="stack-actions">
        <button class="btn btn-primary btn-full" id="rn-continue">Continue the unsaved one</button>
        <button class="btn btn-outline btn-full" id="rn-new">Start a new workout</button>
        <button class="btn btn-outline btn-full" id="rn-cancel">Cancel</button>
      </div>
    `, { sticky: true });
    document.getElementById('rn-continue').addEventListener('click', () => { closeModal(); this.restoreDraft(); });
    document.getElementById('rn-new').addEventListener('click', () => { closeModal(); this._clearDraftStorage(); this.openBuilder(); });
    document.getElementById('rn-cancel').addEventListener('click', closeModal);
  },

  _confirmDiscardSaved() {
    openModal(`
      <div class="modal-title">Discard the unsaved workout?</div>
      <div class="modal-body"><p style="color:var(--text-2);">The exercises and details you entered will be deleted. This cannot be undone.</p></div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="ds-keep">Keep it</button>
        <button class="btn btn-danger" id="ds-go">Discard</button>
      </div>
    `, { sticky: true });
    document.getElementById('ds-keep').addEventListener('click', closeModal);
    document.getElementById('ds-go').addEventListener('click', () => { closeModal(); this._clearDraftStorage(); this.render(); showToast('Unsaved workout discarded'); });
  },

  // Back button, Back gesture and the phone's back key all land here.
  _requestExit() {
    if (!this._isDirty()) return this._closeBuilder();
    openModal(`
      <div class="modal-title">Leave this workout?</div>
      <div class="modal-body"><p style="color:var(--text-2);">You have changes that are not saved to your workout list yet.</p></div>
      <div class="stack-actions">
        <button class="btn btn-primary btn-full" id="lv-stay">Keep editing</button>
        <button class="btn btn-outline btn-full" id="lv-draft">Leave and save as a draft</button>
        <button class="btn btn-outline btn-full" id="lv-discard" style="color:var(--red);">Discard changes</button>
      </div>
    `, { sticky: true });
    document.getElementById('lv-stay').addEventListener('click', closeModal);
    document.getElementById('lv-draft').addEventListener('click', () => {
      this._persistDraft();
      closeModal();
      this._closeBuilder({ keepDraft: true });
      showToast('Saved as a draft. Find it at the top of Workouts.');
    });
    document.getElementById('lv-discard').addEventListener('click', () => {
      closeModal();
      this._closeBuilder();
    });
  },

  _closeBuilder(opts = {}) {
    if (!opts.keepDraft) this._clearDraftStorage();
    this._draft = null;
    this._original = null;
    this._releaseHistory();
    this.render();
  },

  // While the builder is open, hold one browser history entry so the phone's
  // back key asks first instead of leaving the app.
  _holdHistory() {
    if (this._histPushed) return;
    try { history.pushState({ arsa: 'builder' }, ''); this._histPushed = true; } catch (e) { /* ignore */ }
  },
  _releaseHistory() {
    if (!this._histPushed) return;
    this._histPushed = false;
    this._ignorePop = true;
    try { history.back(); } catch (e) { this._ignorePop = false; }
  }
};

window.addEventListener('popstate', () => {
  if (Workouts._ignorePop) { Workouts._ignorePop = false; return; }
  if (!Workouts._draft) return;
  if (App.currentScreen !== 'workouts') { Workouts._histPushed = false; return; }
  history.pushState({ arsa: 'builder' }, '');
  Workouts._histPushed = true;
  Workouts._requestExit();
});

// Last chance to save when the page is hidden or closed.
['pagehide', 'visibilitychange'].forEach(ev => window.addEventListener(ev, () => {
  if (ev === 'visibilitychange' && document.visibilityState !== 'hidden') return;
  Workouts._persistDraft();
}));

document.addEventListener('click', (e) => {
  const startBtn = e.target.closest('[data-start]');
  if (startBtn) {
    e.stopPropagation();
    Session.start(startBtn.dataset.start);
  }
});
