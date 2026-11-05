/* ============================================
   ARSA — Exercise Library Screen
   Search and filter the exercise list. Each row
   shows your own best for that exercise, and the
   detail page carries form cues and your notes.
   ============================================ */

const Library = {
  _searchTerm: '',
  _activeFilter: 'All',
  _detailId: null,

  render() {
    const screen = document.getElementById('screen-library');
    this._bindScreen(screen);

    if (this._detailId) {
      this._renderDetail(this._detailId);
      return;
    }

    const filters = ['All', ...MUSCLE_GROUPS];

    screen.innerHTML = `
      <div class="sc-head">
        <h1 class="screen-title">Library</h1>
        <button class="sc-add" type="button" data-add-custom>Add exercise</button>
      </div>

      <div class="lb-search">
        <input type="search" class="input" id="lib-search" placeholder="Search exercises" value="${esc(this._searchTerm)}" autocomplete="off" aria-label="Search exercises">
      </div>

      <div class="pg-tabs lb-filters" role="group" aria-label="Filter by muscle group">
        ${filters.map(f => `<button class="pg-tab ${f === this._activeFilter ? 'on' : ''}" type="button" data-filter="${f}" aria-pressed="${f === this._activeFilter}">${f}</button>`).join('')}
      </div>

      <div id="lib-grid">${this._renderGrid()}</div>
    `;
  },

  _recordText(pr) {
    if (!pr) return '';
    return pr.maxWeight > 0
      ? `${pr.maxWeight} ${Store.data.settings.units} × ${pr.maxWeightReps}`
      : `${pr.maxReps} reps`;
  },

  _renderGrid() {
    let list = Store.getAllExercises();
    if (this._activeFilter !== 'All') list = list.filter(e => e.muscle === this._activeFilter);
    if (this._searchTerm) {
      const t = this._searchTerm.toLowerCase();
      list = list.filter(e => e.name.toLowerCase().includes(t));
    }
    if (!list.length) {
      return `<p class="pg-empty pg-pad">No exercises match. Try another search or muscle group.</p>`;
    }
    return list.map(e => {
      const rec = this._recordText(Store.getPR(e.id));
      return `
        <button class="lb-row" type="button" data-id="${e.id}">
          <span class="nm">${esc(e.name)}</span>
          <span class="num rc">${esc(rec)}</span>
          <span class="tg">${esc(e.muscle)}${e.custom ? ', custom' : ''}</span>
        </button>`;
    }).join('');
  },

  // One delegated handler pair for the whole screen, assigned as properties
  // so re-rendering never stacks duplicate listeners.
  _bindScreen(screen) {
    screen.onclick = (e) => {
      const t = e.target.closest('button');
      if (!t || !screen.contains(t)) return;

      if (t.dataset.addCustom !== undefined) return this._openCustomExerciseForm();
      if (t.dataset.filter) { this._activeFilter = t.dataset.filter; return this.render(); }
      if (t.dataset.id) { this._detailId = t.dataset.id; return this.render(); }
      if (t.id === 'btn-detail-back') { this._detailId = null; return this.render(); }
      if (t.id === 'btn-delete-custom-ex') return this._confirmDeleteCustom();
    };

    screen.oninput = (e) => {
      if (e.target.id !== 'lib-search') return;
      this._searchTerm = e.target.value;
      document.getElementById('lib-grid').innerHTML = this._renderGrid();
    };
  },

  _renderDetail(id) {
    const ex = Store.getExerciseById(id);
    const screen = document.getElementById('screen-library');
    if (!ex) { this._detailId = null; this.render(); return; }

    const pr = Store.getPR(id);
    const para = (text) => `<p class="lb-p">${esc(text)}</p>`;
    const list = (items) => `<ul class="lb-list">${items.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
    const section = (title, body) => `<div class="pg-sec"><span>${title}</span></div>${body}`;

    const media = ex.animationUrl
      ? `<div class="lb-media">${/\.(mp4|webm)$/i.test(ex.animationUrl)
          ? `<video src="${esc(ex.animationUrl)}" autoplay loop muted playsinline></video>`
          : `<img src="${esc(ex.animationUrl)}" alt="${esc(ex.name)}">`}</div>`
      : '';

    screen.innerHTML = `
      <button class="back-btn" id="btn-detail-back" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        Library
      </button>

      <h1 class="screen-title" style="padding-top:8px;">${esc(ex.name)}</h1>
      <div class="pg-when">${esc(ex.muscle)}${ex.custom ? ', custom exercise' : ''}</div>

      ${media}

      ${pr ? `<div class="pg-ledger"><div class="pg-row"><span>Your best</span><span class="num">${esc(this._recordText(pr))}</span></div></div>` : ''}

      ${ex.instructions ? section('How to perform', para(ex.instructions)) : ''}
      ${ex.formTips && ex.formTips.length ? section('Proper form', list(ex.formTips)) : ''}
      ${ex.mistakes && ex.mistakes.length ? section('Common mistakes', list(ex.mistakes)) : ''}

      ${section('Muscles worked', `
        <div class="pg-ledger">
          <div class="pg-row"><span>${esc(ex.muscle)}</span><span>Primary</span></div>
          ${(ex.secondaryMuscles || []).map(m => `<div class="pg-row"><span>${esc(m)}</span><span>Secondary</span></div>`).join('')}
        </div>`)}

      ${ex.tips ? section('Tip', para(ex.tips)) : ''}
      ${ex.notes ? section('Your notes', para(ex.notes)) : ''}

      ${ex.custom ? `<div class="form-section mt-8" style="padding-bottom:28px;"><button class="bd-delete" type="button" id="btn-delete-custom-ex">Delete custom exercise</button></div>` : '<div style="height:28px;"></div>'}
    `;
  },

  _confirmDeleteCustom() {
    const ex = Store.getExerciseById(this._detailId);
    if (!ex) return;
    openModal(`
      <div class="modal-title">Delete exercise?</div>
      <div class="modal-body"><p style="color:var(--text-2);">"${esc(ex.name)}" is removed from the library. Workouts that already use it keep the name, and your history stays in Progress.</p></div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="lib-del-cancel">Cancel</button>
        <button class="btn btn-danger" id="lib-del-confirm">Delete</button>
      </div>
    `);
    document.getElementById('lib-del-cancel').addEventListener('click', closeModal);
    document.getElementById('lib-del-confirm').addEventListener('click', () => {
      Store.deleteCustomExercise(ex.id);
      closeModal();
      this._detailId = null;
      this.render();
      showToast('Exercise deleted');
    });
  },

  _openCustomExerciseForm() {
    openModal(`
      <div class="modal-title">New exercise</div>
      <div class="modal-body">
        <div class="input-group">
          <label class="input-label" for="ce-name">Name</label>
          <input type="text" class="input" id="ce-name" placeholder="e.g. Landmine press" autocomplete="off">
        </div>
        <div class="input-group">
          <label class="input-label" for="ce-muscle">Target muscle</label>
          <select class="input" id="ce-muscle">
            ${MUSCLE_GROUPS.map(m => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label class="input-label" for="ce-instructions">How to perform</label>
          <textarea class="input" id="ce-instructions" placeholder="Optional" rows="3"></textarea>
        </div>
        <div class="input-group">
          <label class="input-label" for="ce-notes">Your notes</label>
          <textarea class="input" id="ce-notes" placeholder="Optional" rows="2"></textarea>
        </div>
        <div class="input-group">
          <label class="input-label" for="ce-animation">Image or video link</label>
          <input type="url" class="input" id="ce-animation" placeholder="https://... (GIF, image or MP4). Optional" autocomplete="off">
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="ce-cancel">Cancel</button>
        <button class="btn btn-primary" id="ce-save">Add exercise</button>
      </div>
    `);

    document.getElementById('ce-cancel').addEventListener('click', closeModal);
    document.getElementById('ce-save').addEventListener('click', () => {
      const name = document.getElementById('ce-name').value.trim();
      if (!name) { showToast('Enter an exercise name'); return; }
      Store.addCustomExercise({
        name,
        muscle: document.getElementById('ce-muscle').value,
        instructions: document.getElementById('ce-instructions').value.trim(),
        notes: document.getElementById('ce-notes').value.trim(),
        animationUrl: document.getElementById('ce-animation').value.trim()
      });
      closeModal();
      showToast('Exercise added');
      this.render();
    });
  }
};
