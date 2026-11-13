/* ============================================
   ARSA — Workout Session
   Live tracking screen. One exercise is open at a
   time; the set being logged gets a large readout
   with weight and rep steppers. Timers run off
   timestamps, so a locked screen can't make them
   drift, and the screen is kept awake while lifting.
   Saved-session format is unchanged:
   { workoutId, startTime, logs } (+ optional rest).
   ============================================ */

const Session = {
  _workout: null,
  _startTime: null,
  _elapsedSeconds: 0,
  _logs: {},        // { exerciseIdx: [{weight, reps, completed}] }
  _tickInterval: null,
  _restEndsAt: null, // timestamp (ms) when the rest ends, or null
  _restTotal: 0,     // seconds, for the progress bar
  _autosaveTimeout: null,
  _openEx: 0,        // which exercise is expanded
  _focusSet: null,   // which set shows the live readout (null = none)
  _prevByName: {},   // last session's completed sets, by exercise name
  _wakeLock: null,
  _lifecycleBound: false,

  // ---------- Resume ----------

  // Call on app load. Returns true if a resumable session was found and the
  // resume prompt was shown.
  checkForResumableSession() {
    const saved = Store.getActiveSession();
    if (!saved) return false;

    const workout = Store.getWorkout(saved.workoutId);
    if (!workout) {
      // Workout was deleted since the session was saved — nothing to resume.
      Store.clearActiveSession();
      return false;
    }

    if (Store.isActiveSessionStale()) {
      // Probably an abandoned session from a different day — discard quietly.
      Store.clearActiveSession();
      return false;
    }

    this._showResumePrompt(saved, workout);
    return true;
  },

  _showResumePrompt(saved, workout) {
    const completedCount = Object.values(saved.logs || {})
      .reduce((sum, arr) => sum + arr.filter(s => s.completed).length, 0);

    openModal(`
      <div class="modal-title">Resume workout?</div>
      <div class="modal-body">
        <p style="color:var(--text-2);">You have an unfinished session for <strong style="color:var(--text);">${esc(workout.name)}</strong> with ${completedCount} set${completedCount === 1 ? '' : 's'} already logged.</p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="resume-discard">Discard</button>
        <button class="btn btn-primary" id="resume-continue">Resume</button>
      </div>
    `);

    document.getElementById('resume-discard').addEventListener('click', () => {
      Store.clearActiveSession();
      closeModal();
    });
    document.getElementById('resume-continue').addEventListener('click', () => {
      closeModal();
      this._restoreFromSaved(saved, workout);
    });
  },

  _restoreFromSaved(saved, workout) {
    this._workout = workout;
    this._startTime = saved.startTime;
    this._logs = saved.logs || {};

    // The workout may have been edited since the session was saved, so make
    // sure every exercise has a log array.
    workout.exercises.forEach((ex, idx) => {
      if (!Array.isArray(this._logs[idx]) || this._logs[idx].length === 0) {
        this._logs[idx] = this._blankSets(ex);
      }
    });

    if (saved.restEndsAt && saved.restEndsAt > Date.now()) {
      this._restEndsAt = saved.restEndsAt;
      this._restTotal = saved.restTotal || Math.ceil((saved.restEndsAt - Date.now()) / 1000);
    } else {
      this._restEndsAt = null;
    }

    this._begin();
  },

  start(workoutId) {
    const workout = Store.getWorkout(workoutId);
    if (!workout) { showToast('Workout not found'); return; }

    this._workout = workout;
    this._startTime = Date.now();
    this._logs = {};
    this._restEndsAt = null;

    workout.exercises.forEach((ex, idx) => {
      this._logs[idx] = this._blankSets(ex);
    });

    this._begin();
    this._persistActiveSession(true);
  },

  _blankSets(ex) {
    const sets = Number(ex.sets) || 3;
    return Array.from({ length: sets }, () => ({ weight: '', reps: '', completed: false }));
  },

  // Shared by start() and resume.
  _begin() {
    this._elapsedSeconds = Math.floor((Date.now() - this._startTime) / 1000);
    this._buildPrevious();

    const first = this._firstIncomplete();
    this._openEx = first ? first.ex : 0;
    this._focusSet = first ? first.set : null;

    document.getElementById('workout-session').classList.remove('hidden');
    this._render();

    clearInterval(this._tickInterval);
    this._tickInterval = setInterval(() => this._tick(), 500);

    this._bindLifecycle();
    this._acquireWakeLock();
  },

  // ---------- Saving ----------

  // Debounced autosave: called on every input change so typing doesn't hammer
  // LocalStorage, while set logging (the moment that matters for crash
  // recovery) saves immediately.
  _persistActiveSession(immediate = false) {
    if (!this._workout) return;
    clearTimeout(this._autosaveTimeout);

    const doSave = () => {
      Store.saveActiveSession({
        workoutId: this._workout.id,
        startTime: this._startTime,
        logs: this._logs,
        restEndsAt: this._restEndsAt,
        restTotal: this._restTotal
      });
    };

    if (immediate) doSave();
    else this._autosaveTimeout = setTimeout(doSave, 400);
  },

  // ---------- Previous performance ----------

  // For every exercise name, remember the completed sets from the most
  // recent session that included it ("last time").
  _buildPrevious() {
    this._prevByName = {};
    Store.getHistory().forEach(h => {
      (h.exercises || []).forEach(e => {
        if (this._prevByName[e.name] || !e.sets) return;
        const done = e.sets.filter(s => s.completed);
        if (done.length) this._prevByName[e.name] = done;
      });
    });
  },

  // Same set number last time; if this workout has more sets than last time,
  // fall back to the final set from last time.
  _prevSet(exIdx, setIdx) {
    const sets = this._prevByName[this._workout.exercises[exIdx].name];
    if (!sets) return null;
    return sets.find(s => s.setIndex === setIdx) || sets[sets.length - 1];
  },

  // What the readout shows before the person has touched anything:
  // the previous set from today, else last time, else the low end of the
  // rep range.
  _suggest(exIdx, setIdx) {
    const logs = this._logs[exIdx];
    for (let k = setIdx - 1; k >= 0; k--) {
      if (logs[k].completed) {
        return { weight: Number(logs[k].weight) || 0, reps: Number(logs[k].reps) || 0 };
      }
    }
    const prev = this._prevSet(exIdx, setIdx);
    if (prev) return { weight: prev.weight, reps: prev.reps };
    const low = parseInt(this._workout.exercises[exIdx].repRange, 10);
    return { weight: 0, reps: Number.isFinite(low) ? low : 0 };
  },

  _values(exIdx, setIdx) {
    const log = this._logs[exIdx][setIdx];
    const sug = this._suggest(exIdx, setIdx);
    const w = log.weight === '' || log.weight == null ? NaN : Number(log.weight);
    const r = log.reps === '' || log.reps == null ? NaN : Number(log.reps);
    return {
      weight: Number.isFinite(w) ? w : sug.weight,
      reps: Number.isFinite(r) ? r : sug.reps
    };
  },

  // A sensible next step from last time: if the top of the rep range was hit,
  // add weight and drop back to the low end; otherwise add a rep.
  _progression(exIdx, setIdx) {
    const prev = this._prevSet(exIdx, setIdx);
    if (!prev) return null;
    const m = String(this._workout.exercises[exIdx].repRange).match(/(\d+)\D+(\d+)/);
    const single = parseInt(this._workout.exercises[exIdx].repRange, 10);
    const low = m ? parseInt(m[1], 10) : single;
    const top = m ? parseInt(m[2], 10) : single;
    if (prev.weight > 0 && Number.isFinite(top) && prev.reps >= top) {
      return { weight: this._round(prev.weight + this._weightStep()), reps: Number.isFinite(low) ? low : prev.reps };
    }
    return { weight: prev.weight, reps: prev.reps + 1 };
  },

  _hintFor(exIdx, setIdx, weight) {
    if (!(weight > 0)) return 'Bodyweight';
    const prev = this._prevSet(exIdx, setIdx);
    if (!prev) return '';
    const u = Store.data.settings.units;
    const d = this._round(weight - prev.weight);
    if (d === 0) return 'Same as last time';
    return d > 0
      ? `Heavier than last time (+${d}${u})`
      : `Lighter than last time (−${Math.abs(d)}${u})`;
  },

  // Flags sets that beat the stored record (same rule the finish screen uses:
  // more weight, or more reps), counting earlier sets from today too.
  _prFlags(exIdx) {
    const ex = this._workout.exercises[exIdx];
    const stored = ex.exerciseId ? Store.getPR(ex.exerciseId) : null;
    const flags = [];
    if (!stored) return flags;
    let bestW = stored.maxWeight, bestR = stored.maxReps;
    this._logs[exIdx].forEach((s, i) => {
      if (!s.completed) { flags[i] = false; return; }
      const w = Number(s.weight) || 0, r = Number(s.reps) || 0;
      flags[i] = r > 0 && (w > bestW || r > bestR);
      if (w > bestW) bestW = w;
      if (r > bestR) bestR = r;
    });
    return flags;
  },

  // ---------- Small helpers ----------

  _round(v) { return Math.round(v * 100) / 100; },
  _weightStep() { return Store.data.settings.units === 'lbs' ? 5 : 2.5; },

  _clock(sec) {
    const h = Math.floor(sec / 3600);
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  },

  _setText(weight, reps) {
    return Number(weight) === 0 ? `BW × ${reps}` : `${weight} × ${reps}`;
  },

  _buzz(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* unsupported */ }
  },

  _counts() {
    let total = 0, done = 0;
    Object.values(this._logs).forEach(arr => {
      total += arr.length;
      done += arr.filter(s => s.completed).length;
    });
    return { total, done };
  },

  _firstIncomplete() {
    for (let i = 0; i < this._workout.exercises.length; i++) {
      const j = this._logs[i].findIndex(s => !s.completed);
      if (j !== -1) return { ex: i, set: j };
    }
    return null;
  },

  // Next unlogged set after (ex, set), wrapping around to the start.
  _nextIncomplete(ex, set) {
    const flat = [];
    this._workout.exercises.forEach((e, i) => {
      this._logs[i].forEach((s, j) => flat.push({ ex: i, set: j, done: s.completed }));
    });
    const start = flat.findIndex(f => f.ex === ex && f.set === set);
    for (let k = 1; k <= flat.length; k++) {
      const f = flat[(start + k) % flat.length];
      if (!f.done) return { ex: f.ex, set: f.set };
    }
    return null;
  },

  // ---------- Rendering ----------

  _render() {
    const overlay = document.getElementById('workout-session');
    overlay.innerHTML = `
      <header class="sx-head">
        <div class="sx-head-top">
          <div class="sx-title">${esc(this._workout.name)}</div>
          <div class="sx-clock num" id="sx-clock">${this._clock(this._elapsedSeconds)}</div>
        </div>
        <div class="sx-ticks" id="sx-ticks"></div>
        <div class="sx-head-meta">
          <span id="sx-count"></span>
          <button class="sx-text" id="sx-cancel" type="button">Cancel workout</button>
        </div>
      </header>

      <div class="sx-body" id="sx-body"></div>

      <div class="sx-rest" id="sx-rest" hidden>
        <div class="sx-rest-row">
          <div><div class="sx-rest-label">Rest</div><div class="sx-rest-time num" id="sx-rest-time">00:00</div></div>
          <div class="sx-rest-btns">
            <button class="sx-mini" type="button" data-rest="-15" aria-label="Subtract 15 seconds">−15</button>
            <button class="sx-mini" type="button" data-rest="15" aria-label="Add 15 seconds">+15</button>
            <button class="sx-mini" type="button" data-rest="skip">Skip</button>
          </div>
        </div>
        <div class="sx-rest-bar"><i id="sx-rest-fill"></i></div>
      </div>
    `;

    this._bindOverlay(overlay);
    this._refreshHeader();
    this._renderBody(true);
    this._refreshRest();
  },

  _refreshHeader() {
    const { total, done } = this._counts();
    let ticks = '';
    this._workout.exercises.forEach((e, i) => {
      this._logs[i].forEach(s => { ticks += `<i class="${s.completed ? 'f' : ''}"></i>`; });
    });
    const t = document.getElementById('sx-ticks');
    if (t) {
      t.innerHTML = ticks;
      t.setAttribute('role', 'progressbar');
      t.setAttribute('aria-valuemin', '0');
      t.setAttribute('aria-valuemax', String(total));
      t.setAttribute('aria-valuenow', String(done));
    }
    const c = document.getElementById('sx-count');
    if (c) c.textContent = `${done} of ${total} sets logged`;
  },

  _renderBody(scrollToLive = false) {
    const body = document.getElementById('sx-body');
    if (!body) return;
    const keep = body.scrollTop;
    const { total, done } = this._counts();

    body.innerHTML = this._workout.exercises
      .map((ex, i) => i === this._openEx ? this._renderOpen(ex, i) : this._renderFold(ex, i))
      .join('') + `
      <div class="sx-end">
        <button class="sx-finish ${total && done === total ? 'ready' : ''}" id="sx-finish" type="button">Finish workout</button>
      </div>`;

    body.scrollTop = keep;
    this._fitInputs();

    if (scrollToLive) {
      const target = body.querySelector('.sx-live') || body.querySelector('.sx-ex');
      if (target) {
        requestAnimationFrame(() => {
          const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          target.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
        });
      }
    }
  },

  _renderFold(ex, i) {
    const logs = this._logs[i];
    const done = logs.filter(s => s.completed).length;
    const finished = done === logs.length;
    return `
      <button class="sx-fold ${finished ? 'finished' : ''}" type="button" data-ex="${i}">
        <span>${esc(ex.name)}</span>
        <span class="num">${finished ? 'Done' : (done ? `${done} of ${logs.length}` : `${logs.length} sets`)}</span>
      </button>`;
  },

  _renderOpen(ex, i) {
    const logs = this._logs[i];
    const flags = this._prFlags(i);
    const rows = logs.map((s, j) => j === this._focusSet
      ? this._renderLive(i, j)
      : this._renderRow(i, j, s, flags[j])).join('');

    return `
      <section class="sx-ex" data-ex="${i}">
        <h3>${esc(ex.name)}</h3>
        <div class="sx-tag">${logs.length} sets of ${esc(ex.repRange)} reps, rest ${ex.restTime} s</div>
        ${ex.notes ? `<div class="sx-note">${esc(ex.notes)}</div>` : ''}
        <div class="sx-th"><span>Set</span><span>Last time</span><span>Today</span><span></span></div>
        ${rows}
        <button class="sx-add" type="button" data-add="${i}">Add set</button>
      </section>`;
  },

  _renderRow(i, j, s, isPR) {
    const prev = this._prevSet(i, j);
    const prevText = prev ? this._setText(prev.weight, prev.reps) : '–';
    // Pending sets show the numbers they will start with (last time, or the
    // previous set from today), so only changes need typing.
    const planned = !s.completed && (prev || (j > 0 && this._logs[i][j - 1].completed))
      ? this._values(i, j) : null;
    const todayText = s.completed ? this._setText(s.weight, s.reps)
      : planned ? this._setText(planned.weight, planned.reps) : '–';
    const check = s.completed
      ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 6.5l2.6 2.6L10 3.4"/></svg>'
      : '';
    return `
      <button class="sx-row ${s.completed ? 'done' : ''}" type="button" data-ex="${i}" data-set="${j}"
        aria-label="Set ${j + 1}${s.completed ? ', logged. Tap to edit' : ''}">
        <span class="n num">${j + 1}</span>
        <span class="v dim num">${prevText}</span>
        <span class="v num">${isPR ? '<em class="sx-pr">PR</em>' : ''}${todayText}</span>
        <span class="sx-chk">${check}</span>
      </button>`;
  },

  _renderLive(i, j) {
    const log = this._logs[i][j];
    const vals = this._values(i, j);
    const prev = this._prevSet(i, j);
    const u = Store.data.settings.units;
    const step = this._weightStep();
    const plates = Store.data.settings.plateMode;

    return `
      <div class="sx-live" data-live>
        <div class="sx-live-meta">
          <span>Set ${j + 1}${prev ? `, last time ${this._setText(prev.weight, prev.reps)}` : ''}</span>
          ${plates ? `<button class="sx-text" type="button" data-plates="${i}:${j}">Plates</button>` : ''}
        </div>

        ${this._renderChips(i, j)}

        <div class="sx-dial">
          <button class="sx-step" type="button" data-step="weight" data-dir="-1" aria-label="Weight minus ${step}">−${step}</button>
          <label class="sx-read">
            <input class="sx-num num" id="sx-weight" data-field="weight" data-ex="${i}" data-set="${j}"
              type="number" inputmode="decimal" step="any" min="0" value="${vals.weight}" aria-label="Weight in ${u}">
            <small>${u}</small>
          </label>
          <button class="sx-step" type="button" data-step="weight" data-dir="1" aria-label="Weight plus ${step}">+${step}</button>
        </div>
        <div class="sx-hint" id="sx-hint">${this._hintFor(i, j, vals.weight)}</div>

        <div class="sx-dial sm">
          <button class="sx-step" type="button" data-step="reps" data-dir="-1" aria-label="Reps minus 1">−1</button>
          <label class="sx-read">
            <input class="sx-num num" id="sx-reps" data-field="reps" data-ex="${i}" data-set="${j}"
              type="number" inputmode="numeric" step="1" min="0" value="${vals.reps}" aria-label="Reps">
            <small>reps</small>
          </label>
          <button class="sx-step" type="button" data-step="reps" data-dir="1" aria-label="Reps plus 1">+1</button>
        </div>

        <button class="sx-go" type="button" id="sx-log">${log.completed ? `Save set ${j + 1}` : `Log set ${j + 1}`}</button>
        ${log.completed ? '<button class="sx-ghost" type="button" id="sx-undo">Mark as not done</button>' : ''}
        ${!log.completed && this._logs[i].length > 1 ? '<button class="sx-ghost" type="button" id="sx-remove">Remove this set</button>' : ''}
      </div>`;
  },

  _renderChips(i, j) {
    const prev = this._prevSet(i, j);
    if (!prev) return '';
    const next = this._progression(i, j);
    const same = this._setText(prev.weight, prev.reps);
    const step = this._setText(next.weight, next.reps);
    return `
        <div class="sx-chips">
          <button class="sx-chip" type="button" data-fill="same">Same <span class="num">${same}</span></button>
          <button class="sx-chip up" type="button" data-fill="next">Try <span class="num">${step}</span></button>
        </div>`;
  },

  // Fills the dials from a chip. Nothing is saved until Log is tapped.
  _applyFill(kind) {
    const ex = this._openEx, set = this._focusSet;
    if (set === null || set === undefined) return;
    const v = kind === 'same' ? this._prevSet(ex, set) : this._progression(ex, set);
    if (!v) return;
    const w = document.getElementById('sx-weight');
    const r = document.getElementById('sx-reps');
    if (!w || !r) return;
    w.value = v.weight; r.value = v.reps;
    this._logs[ex][set].weight = v.weight;
    this._logs[ex][set].reps = v.reps;
    this._fitInputs();
    this._updateHint(ex, set);
    this._persistActiveSession();
    this._buzz(8);
  },

  // Size each readout to its digits so the unit label sits right next to it.
  _fitInputs() {
    document.querySelectorAll('.sx-num').forEach(el => {
      el.style.width = `${Math.max(2, String(el.value).length) + 0.4}ch`;
    });
  },

  // ---------- Events ----------

  // One delegated listener set on the overlay; assigned as properties so
  // restarting a session never stacks duplicate handlers.
  _bindOverlay(overlay) {
    overlay.onclick = (e) => {
      const t = e.target.closest('button');
      if (!t || !overlay.contains(t)) return;

      if (t.dataset.fill) return this._applyFill(t.dataset.fill);
      if (t.dataset.step) return this._step(t.dataset.step, Number(t.dataset.dir));
      if (t.id === 'sx-log') return this._logSet(this._openEx, this._focusSet);
      if (t.id === 'sx-undo') return this._undoSet(this._openEx, this._focusSet);
      if (t.id === 'sx-remove') return this._removeSet(this._openEx, this._focusSet);
      if (t.dataset.plates) {
        const [ex, set] = t.dataset.plates.split(':').map(Number);
        return PlateCalc.open(ex, set);
      }
      if (t.classList.contains('sx-row')) {
        this._openEx = Number(t.dataset.ex);
        this._focusSet = Number(t.dataset.set);
        return this._renderBody(true);
      }
      if (t.classList.contains('sx-fold')) {
        const i = Number(t.dataset.ex);
        const j = this._logs[i].findIndex(s => !s.completed);
        this._openEx = i;
        this._focusSet = j === -1 ? null : j;
        return this._renderBody(true);
      }
      if (t.dataset.add !== undefined) return this._addSet(Number(t.dataset.add));
      if (t.dataset.rest !== undefined) return this._adjustRest(t.dataset.rest);
      if (t.id === 'sx-finish') return this._confirmFinish();
      if (t.id === 'sx-cancel') return this._confirmCancel();
    };

    overlay.oninput = (e) => {
      const el = e.target;
      if (!el.classList || !el.classList.contains('sx-num')) return;
      const ex = Number(el.dataset.ex), set = Number(el.dataset.set);
      this._logs[ex][set][el.dataset.field] = el.value;
      this._fitInputs();
      if (el.dataset.field === 'weight') this._updateHint(ex, set);
      this._persistActiveSession();
    };
  },

  _updateHint(ex, set) {
    const hint = document.getElementById('sx-hint');
    const w = document.getElementById('sx-weight');
    if (!hint || !w) return;
    const v = parseFloat(w.value);
    hint.textContent = this._hintFor(ex, set, Number.isFinite(v) ? v : this._suggest(ex, set).weight);
  },

  _step(field, dir) {
    const ex = this._openEx, set = this._focusSet;
    if (set === null) return;
    const el = document.getElementById(field === 'weight' ? 'sx-weight' : 'sx-reps');
    if (!el) return;
    const typed = parseFloat(el.value);
    const cur = Number.isFinite(typed) ? typed : this._values(ex, set)[field];
    const size = field === 'weight' ? this._weightStep() : 1;
    const next = Math.max(0, this._round(cur + dir * size));
    el.value = next;
    this._logs[ex][set][field] = next;
    this._fitInputs();
    if (field === 'weight') this._updateHint(ex, set);
    this._persistActiveSession();
  },

  _logSet(ex, set) {
    if (set === null || set === undefined) return;
    const log = this._logs[ex][set];
    const vals = this._values(ex, set);
    const wEl = document.getElementById('sx-weight');
    const rEl = document.getElementById('sx-reps');

    // Text the number field rejects reads as empty, so check for it directly
    // instead of quietly logging 0.
    if ((wEl && wEl.validity && wEl.validity.badInput) || (rEl && rEl.validity && rEl.validity.badInput)) {
      showToast('Check the numbers. Use digits only.');
      return;
    }
    let weight = wEl && wEl.value !== '' ? parseFloat(wEl.value) : vals.weight;
    let reps = rEl && rEl.value !== '' ? parseFloat(rEl.value) : vals.reps;
    if (!Number.isFinite(weight) || weight < 0) weight = 0;

    if (!(reps > 0)) {
      showToast('Enter the reps you did');
      return;
    }
    if (!Number.isInteger(reps)) {
      showToast('Reps must be a whole number');
      return;
    }
    if (reps > 200) {
      showToast('That is a lot of reps. Check the number.');
      return;
    }
    const maxWeight = Store.data.settings.units === 'lbs' ? 2200 : 1000;
    if (weight > maxWeight) {
      showToast(`Weight over ${maxWeight} ${Store.data.settings.units}? Check the number.`);
      return;
    }

    const wasDone = log.completed;
    log.weight = weight;
    log.reps = reps;
    log.completed = true;

    this._buzz(15);
    if (!wasDone) this._startRest(this._workout.exercises[ex].restTime);

    const next = this._nextIncomplete(ex, set);
    if (next) { this._openEx = next.ex; this._focusSet = next.set; }
    else { this._openEx = ex; this._focusSet = null; }

    this._persistActiveSession(true);
    this._refreshHeader();
    this._renderBody(true);
  },

  _undoSet(ex, set) {
    if (set === null || set === undefined) return;
    this._logs[ex][set].completed = false;
    this._persistActiveSession(true);
    this._refreshHeader();
    this._renderBody(true);
  },

  _addSet(ex) {
    this._logs[ex].push({ weight: '', reps: '', completed: false });
    const idx = this._logs[ex].length - 1;
    this._openEx = ex;
    this._focusSet = idx;
    this._persistActiveSession(true);
    this._refreshHeader();
    this._renderBody(true);
    // A mistap on "Add set" is one tap to take back.
    showToast('Set added', 5000, { label: 'Undo', run: () => this._removeSet(ex, idx, { quiet: true }) });
  },

  // Removes a set that has not been logged. A logged set has to be marked as
  // not done first, so a real set is never deleted by accident. Every
  // exercise keeps at least one set.
  _removeSet(ex, set, opts = {}) {
    const logs = this._logs[ex];
    if (!logs || !logs[set]) return;
    if (logs[set].completed) { showToast('Mark the set as not done first'); return; }
    if (logs.length <= 1) { showToast('An exercise needs at least one set'); return; }

    const removed = logs.splice(set, 1)[0];

    // Land on the set now sitting in that spot, else the last unlogged one.
    let next = logs.findIndex((s, k) => !s.completed && k >= set);
    if (next === -1) {
      for (let k = logs.length - 1; k >= 0; k--) if (!logs[k].completed) { next = k; break; }
    }
    this._openEx = ex;
    this._focusSet = next === -1 ? null : next;

    this._persistActiveSession(true);
    this._refreshHeader();
    this._renderBody(true);

    if (!opts.quiet) {
      showToast('Set removed', 5000, {
        label: 'Undo',
        run: () => {
          this._logs[ex].splice(set, 0, removed);
          this._openEx = ex;
          this._focusSet = set;
          this._persistActiveSession(true);
          this._refreshHeader();
          this._renderBody(true);
        }
      });
    }
  },

  // Called by PlateCalc once the person confirms a plate selection.
  setWeightFromPlateCalc(exIdx, setIdx, totalWeight) {
    this._logs[exIdx][setIdx].weight = totalWeight;
    this._openEx = exIdx;
    this._focusSet = setIdx;
    this._persistActiveSession(true);
    this._renderBody(false);
  },

  // ---------- Timers ----------

  // Both clocks are computed from timestamps, never counted. A phone that
  // throttles timers while the screen is off still shows the right time.
  _tick() {
    if (!this._workout) return;
    const now = Date.now();
    this._elapsedSeconds = Math.floor((now - this._startTime) / 1000);
    const clock = document.getElementById('sx-clock');
    if (clock) clock.textContent = this._clock(this._elapsedSeconds);

    if (this._restEndsAt) {
      if (now >= this._restEndsAt) this._endRest(true);
      else this._refreshRest();
    }
  },

  _startRest(seconds) {
    const s = Number(seconds);
    if (!(s > 0)) return;
    this._restEndsAt = Date.now() + s * 1000;
    this._restTotal = s;
    this._refreshRest();
  },

  _refreshRest() {
    const bar = document.getElementById('sx-rest');
    if (!bar) return;
    if (!this._restEndsAt) { bar.hidden = true; return; }
    const msLeft = Math.max(0, this._restEndsAt - Date.now());
    bar.hidden = false;
    document.getElementById('sx-rest-time').textContent = Fmt.timer(Math.ceil(msLeft / 1000));
    const total = Math.max(1, this._restTotal) * 1000;
    document.getElementById('sx-rest-fill').style.width = `${Math.min(100, ((total - msLeft) / total) * 100)}%`;
  },

  _adjustRest(action) {
    if (!this._restEndsAt) return;
    if (action === 'skip') return this._endRest(false);
    const delta = Number(action);
    this._restEndsAt += delta * 1000;
    this._restTotal = Math.max(1, this._restTotal + delta);
    if (this._restEndsAt <= Date.now()) return this._endRest(false);
    this._persistActiveSession(true);
    this._refreshRest();
  },

  _endRest(notify) {
    const lateMs = this._restEndsAt ? Date.now() - this._restEndsAt : 0;
    this._restEndsAt = null;
    this._refreshRest();
    this._persistActiveSession(true);
    // Only buzz if the rest ended while the person was looking; coming back
    // to the app minutes later shouldn't buzz for something long over.
    if (notify && lateMs < 8000) {
      this._buzz([200, 100, 200]);
      showToast('Rest over. Next set.');
    }
  },

  // ---------- Keep the screen awake ----------

  async _acquireWakeLock() {
    try {
      if (!('wakeLock' in navigator)) return;
      if (this._wakeLock && !this._wakeLock.released) return;
      this._wakeLock = await navigator.wakeLock.request('screen');
    } catch (e) {
      this._wakeLock = null; // unsupported, or denied (low battery)
    }
  },

  _releaseWakeLock() {
    try { if (this._wakeLock) this._wakeLock.release(); } catch (e) { /* already released */ }
    this._wakeLock = null;
  },

  // The browser drops the wake lock whenever the page is hidden, so take it
  // again when the person comes back, and re-sync the timers right away.
  _bindLifecycle() {
    if (this._lifecycleBound) return;
    this._lifecycleBound = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this._workout) {
        this._acquireWakeLock();
        this._tick();
      }
    });
  },

  // ---------- Cancel / finish ----------

  _confirmCancel() {
    openModal(`
      <div class="modal-title">Cancel workout?</div>
      <div class="modal-body"><p style="color:var(--text-2);">Your progress for this session will not be saved.</p></div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="cancel-no">Keep going</button>
        <button class="btn btn-danger" id="cancel-yes">Cancel workout</button>
      </div>
    `);
    document.getElementById('cancel-no').addEventListener('click', closeModal);
    document.getElementById('cancel-yes').addEventListener('click', () => {
      closeModal();
      Store.clearActiveSession();
      this._end();
    });
  },

  _confirmFinish() {
    const { total: totalSets, done: completedSets } = this._counts();

    if (completedSets === 0) {
      openModal(`
        <div class="modal-title">No sets logged</div>
        <div class="modal-body"><p style="color:var(--text-2);">Log at least one set before finishing, or cancel the workout instead.</p></div>
        <div class="modal-actions"><button class="btn btn-primary btn-full" id="ok-modal">Got it</button></div>
      `);
      document.getElementById('ok-modal').addEventListener('click', closeModal);
      return;
    }

    const completionRatio = completedSets / totalSets;

    if (completionRatio < 1) {
      // Under half done is almost always an accidental tap, so make the
      // person type a confirmation word instead of tapping a button.
      if (completionRatio < 0.5) {
        this._showTypedFinishWarning(completedSets, totalSets);
      } else {
        openModal(`
          <div class="modal-title">Finish early?</div>
          <div class="modal-body"><p style="color:var(--text-2);">You've completed ${completedSets} of ${totalSets} sets. Finish anyway?</p></div>
          <div class="modal-actions">
            <button class="btn btn-outline" id="finish-no">Keep going</button>
            <button class="btn btn-success" id="finish-yes">Finish workout</button>
          </div>
        `);
        document.getElementById('finish-no').addEventListener('click', closeModal);
        document.getElementById('finish-yes').addEventListener('click', () => {
          closeModal();
          this._finishWorkout();
        });
      }
    } else {
      this._finishWorkout();
    }
  },

  _showTypedFinishWarning(completedSets, totalSets) {
    openModal(`
      <div class="modal-title">Most of this workout isn't done</div>
      <div class="modal-body">
        <p style="color:var(--text-2);">You've only completed <strong style="color:var(--text);">${completedSets} of ${totalSets}</strong> sets. This will be saved as a short workout.</p>
        <p style="color:var(--text-2);">Type <strong style="color:var(--text);">FINISH</strong> below to confirm.</p>
        <input type="text" class="input" id="finish-confirm-input" placeholder="Type FINISH" autocomplete="off" autocapitalize="off">
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="finish-typed-no">Keep going</button>
        <button class="btn btn-danger" id="finish-typed-yes" disabled style="opacity:0.4;">Finish workout</button>
      </div>
    `);

    const input = document.getElementById('finish-confirm-input');
    const confirmBtn = document.getElementById('finish-typed-yes');

    input.addEventListener('input', () => {
      const isMatch = input.value.trim().toUpperCase() === 'FINISH';
      confirmBtn.disabled = !isMatch;
      confirmBtn.style.opacity = isMatch ? '1' : '0.4';
    });
    input.focus();

    document.getElementById('finish-typed-no').addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', () => {
      if (confirmBtn.disabled) return;
      closeModal();
      this._finishWorkout();
    });
  },

  _finishWorkout() {
    clearInterval(this._tickInterval);
    this._restEndsAt = null;
    this._releaseWakeLock();
    this._elapsedSeconds = Math.floor((Date.now() - this._startTime) / 1000);

    const w = this._workout;
    let totalSets = 0, totalVolume = 0;
    const newPRs = [];

    const exercisesLog = w.exercises.map((ex, idx) => {
      const sets = this._logs[idx]
        .map((s, setIdx) => ({ s, setIdx }))
        .filter(({ s }) => s.completed)
        .map(({ s, setIdx }) => ({
          setIndex: setIdx,
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
          completed: true
        }));
      totalSets += sets.length;
      sets.forEach(s => {
        totalVolume += s.weight * s.reps;
        // Bodyweight sets (weight 0) count too: they record a reps PR.
        if (ex.exerciseId && s.reps > 0) {
          const isPR = Store.checkAndUpdatePR(ex.exerciseId, ex.name, s.weight, s.reps);
          if (isPR) newPRs.push({ name: ex.name, weight: s.weight, reps: s.reps });
        }
      });
      return { exerciseId: ex.exerciseId, name: ex.name, sets };
    });

    const entry = {
      workoutId: w.id,
      workoutName: w.name,
      date: new Date().toISOString(),
      duration: this._elapsedSeconds,
      exercises: exercisesLog,
      totalSets,
      totalVolume
    };

    Store.addHistoryEntry(entry);
    Store.clearActiveSession();
    const unlocked = checkAchievements();

    this._showSummary(entry, newPRs, unlocked);
  },

  _showSummary(entry, newPRs, unlocked) {
    const overlay = document.getElementById('workout-session');
    overlay.onclick = null;
    overlay.oninput = null;
    overlay.innerHTML = `
      <div class="session-body" style="padding-top: calc(var(--safe-top) + 40px);">
        <div class="completion-screen fade-in">
          <div class="completion-title">Workout complete</div>
          <div class="completion-sub">${esc(entry.workoutName)} &middot; ${Fmt.dateLong(entry.date)}</div>
        </div>

        <div class="summary-grid">
          <div class="summary-stat">
            <div class="summary-stat-val">${Fmt.duration(entry.duration)}</div>
            <div class="summary-stat-label">Duration</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-val">${entry.exercises.length}</div>
            <div class="summary-stat-label">Exercises</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-val">${entry.totalSets}</div>
            <div class="summary-stat-label">Total sets</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-val">${Fmt.number(entry.totalVolume)}</div>
            <div class="summary-stat-label">Volume (${Store.data.settings.units})</div>
          </div>
        </div>

        ${newPRs.length ? `
          <div class="section-label mt-8">New personal records</div>
          <div class="pr-list">
            ${newPRs.map(pr => `
              <div class="pr-item">
                <div class="pr-exercise">${esc(pr.name)}</div>
                <div class="pr-value">${Fmt.weight(pr.weight)} × ${pr.reps}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${unlocked.length ? `
          <div class="section-label mt-8">Achievements unlocked</div>
          <div class="achievement-grid">
            ${unlocked.map(a => {
              const stats = Store.getStats();
              const name = resolveAchievementText(a, stats, 'name');
              const desc = resolveAchievementText(a, stats, 'desc');
              return `
              <div class="achievement-card unlocked">
                <div class="achievement-name">${name}</div>
                <div class="achievement-desc">${desc}</div>
              </div>
            `;
            }).join('')}
          </div>
        ` : ''}

        <div class="form-section mt-8" style="padding-bottom:30px;">
          <button class="btn btn-primary btn-full" id="btn-done-summary">Done</button>
        </div>
      </div>
    `;
    document.getElementById('btn-done-summary').addEventListener('click', () => this._end());
  },

  _end() {
    clearInterval(this._tickInterval);
    clearTimeout(this._autosaveTimeout);
    this._restEndsAt = null;
    this._releaseWakeLock();
    document.getElementById('workout-session').classList.add('hidden');
    this._workout = null;
    App.navigateTo('dashboard');
  }
};
