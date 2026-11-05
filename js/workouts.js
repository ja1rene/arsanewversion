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

  render() {
    const screen = document.getElementById('screen-workouts');
    this._bindScreen(screen);

    const workouts = Store.getWorkouts();
    const history = Store.getHistory();

    screen.innerHTML = `
      <div class="sc-head">
        <h1 class="screen-title">Workouts</h1>
        <button class="sc-add" type="button" data-new>New workout</button>
      </div>

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
    `;
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

      if (t.dataset.new !== undefined) return this.openBuilder();
      if (t.dataset.open) return this.openBuilder(t.dataset.open);

      if (!d) return;

      if (t.id === 'btn-builder-back') { this._draft = null; return this.render(); }
      if (t.dataset.day !== undefined) {
        const day = Number(t.dataset.day);
        const i = d.scheduledDays.indexOf(day);
        if (i > -1) d.scheduledDays.splice(i, 1); else d.scheduledDays.push(day);
        t.setAttribute('aria-pressed', String(i === -1));
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
    };
  },

  // ---- BUILDER ----
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
    this._renderBuilder();
  },

  _renderBuilder() {
    const screen = document.getElementById('screen-workouts');
    const d = this._draft;
    const isEdit = !!d.id;
    this._bindScreen(screen);

    screen.innerHTML = `
      <button class="back-btn" id="btn-builder-back" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        Workouts
      </button>
      <h1 class="screen-title" style="padding-top:8px;">${isEdit ? 'Edit workout' : 'New workout'}</h1>

      <div class="form-section mt-4">
        <div class="input-group">
          <label class="input-label" for="wb-name">Name</label>
          <input type="text" class="input" id="wb-name" placeholder="e.g. Upper day" value="${esc(d.name)}" autocomplete="off">
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
      this._draft = null;
      this.render();
      showToast('Workout deleted');
    });
  },

  _openAddExercise(editIdx = null) {
    const d = this._draft;
    const editingExisting = editIdx !== null;
    const ex = editingExisting ? d.exercises[editIdx] : null;

    // Library exercises, grouped by muscle, so the list is easy to scan.
    const byMuscle = {};
    Store.getAllExercises().forEach(e => { (byMuscle[e.muscle || 'Other'] = byMuscle[e.muscle || 'Other'] || []).push(e); });
    const groups = Object.keys(byMuscle).sort();

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
          <input type="text" class="input" id="ae-name" placeholder="e.g. Machine chest press" value="${ex ? esc(ex.name) : ''}" autocomplete="off">
        </div>
        <div class="input-group">
          <label class="input-label" for="ae-sets">Sets</label>
          <input type="number" inputmode="numeric" class="input" id="ae-sets" placeholder="4" min="1" value="${ex ? ex.sets : 3}">
        </div>
        <div class="input-group">
          <label class="input-label" for="ae-reps">Rep range</label>
          <input type="text" class="input" id="ae-reps" placeholder="8-12" value="${ex ? esc(ex.repRange) : '8-12'}" autocomplete="off">
        </div>
        <div class="input-group">
          <label class="input-label" for="ae-rest">Rest (seconds)</label>
          <input type="number" inputmode="numeric" class="input" id="ae-rest" placeholder="90" min="0" value="${ex ? ex.restTime : 90}">
        </div>
        <div class="input-group">
          <label class="input-label" for="ae-notes">Notes</label>
          <textarea class="input" id="ae-notes" placeholder="Optional" rows="2">${ex ? esc(ex.notes || '') : ''}</textarea>
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
    `);

    const selectEl = document.getElementById('ae-select');
    if (selectEl) {
      selectEl.addEventListener('change', () => {
        const lib = Store.getExerciseById(selectEl.value);
        if (lib) document.getElementById('ae-name').value = lib.name;
      });
    }

    document.getElementById('ae-cancel').addEventListener('click', closeModal);

    if (editingExisting) {
      document.getElementById('ae-dup').addEventListener('click', () => {
        const copy = JSON.parse(JSON.stringify(ex));
        copy.id = Store.uid();
        d.exercises.splice(editIdx + 1, 0, copy);
        closeModal();
        this._renderBuilder();
      });
      document.getElementById('ae-remove').addEventListener('click', () => {
        d.exercises.splice(editIdx, 1);
        closeModal();
        this._renderBuilder();
      });
    }

    document.getElementById('ae-save').addEventListener('click', () => {
      const name = document.getElementById('ae-name').value.trim();
      if (!name) { showToast('Enter an exercise name'); return; }
      const sets = Number(document.getElementById('ae-sets').value) || 3;
      const repRange = document.getElementById('ae-reps').value.trim() || '8-12';
      const restTime = Number(document.getElementById('ae-rest').value) || 90;
      const notes = document.getElementById('ae-notes').value.trim();
      const libId = selectEl ? selectEl.value : (ex ? ex.exerciseId : '');

      if (editingExisting) {
        Object.assign(ex, { name, sets, repRange, restTime, notes });
      } else {
        d.exercises.push({
          id: Store.uid(),
          exerciseId: libId || null,
          name, sets, repRange, restTime, notes
        });
      }
      closeModal();
      this._renderBuilder();
    });
  },

  _saveDraft() {
    const d = this._draft;
    if (!d.name.trim()) { showToast('Name your workout first'); return; }
    if (d.exercises.length === 0) { showToast('Add at least one exercise'); return; }

    if (d.id) {
      Store.updateWorkout(d.id, d);
      showToast('Workout saved');
    } else {
      Store.createWorkout(d);
      showToast('Workout created');
    }
    this._draft = null;
    this.render();
  }
};

document.addEventListener('click', (e) => {
  const startBtn = e.target.closest('[data-start]');
  if (startBtn) {
    e.stopPropagation();
    Session.start(startBtn.dataset.start);
  }
});
