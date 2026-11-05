/* ============================================
   ARSA — Plate Calculator
   Lets a person think in "bar + plates per side"
   instead of typing an absolute number. The result
   is just a number written into the existing weight
   field — PRs, charts, and volume math never know
   this calculator was involved.
   ============================================ */

// Standard plate sizes, in kg. lbs users get a separate set further down.
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATES_LB = [45, 35, 25, 10, 5, 2.5];

const PlateCalc = {
  _exIdx: null,
  _setIdx: null,
  _barWeight: 20,
  _platesPerSide: {}, // { plateValue: count }

  open(exIdx, setIdx) {
    this._exIdx = exIdx;
    this._setIdx = setIdx;
    this._barWeight = Store.data.settings.plateBarWeight || (Store.data.settings.units === 'lbs' ? 45 : 20);
    this._platesPerSide = {};

    this._render();
  },

  _availablePlates() {
    return Store.data.settings.units === 'lbs' ? PLATES_LB : PLATES_KG;
  },

  _total() {
    const plateWeight = Object.entries(this._platesPerSide)
      .reduce((sum, [val, count]) => sum + Number(val) * count, 0);
    return this._barWeight + plateWeight * 2; // plates are per side, both sides
  },

  _render() {
    const units = Store.data.settings.units;
    const plates = this._availablePlates();

    openModal(`
      <div class="modal-title">Plate Calculator</div>
      <div class="modal-body">
        <div class="input-group">
          <label class="input-label">Bar Weight (${units})</label>
          <input type="number" inputmode="decimal" class="input" id="plate-bar-weight" value="${this._barWeight}">
        </div>

        <div class="input-label" style="margin-top:4px;">Plates per side</div>
        <div class="plate-picker">
          ${plates.map(p => `
            <div class="plate-row" data-plate="${p}">
              <div class="plate-visual" style="height:${this._plateHeight(p)}px;">${p}</div>
              <div class="plate-counter">
                <button class="plate-btn" data-action="dec" data-plate="${p}">−</button>
                <span class="plate-count" id="plate-count-${p}">${this._platesPerSide[p] || 0}</span>
                <button class="plate-btn" data-action="inc" data-plate="${p}">+</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="plate-total-display">
          <div class="plate-total-label">Total Weight</div>
          <div class="plate-total-value" id="plate-total-value">${this._total()}${units}</div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="plate-cancel">Cancel</button>
        <button class="btn btn-primary" id="plate-confirm">Use This Weight</button>
      </div>
    `);

    this._bindEvents();
  },

  // Purely cosmetic: bigger plates render visually taller, smallest plates
  // render visually smaller, so the picker reads like a real plate stack.
  _plateHeight(p) {
    const max = Math.max(...this._availablePlates());
    const min = Math.min(...this._availablePlates());
    const ratio = (p - min) / (max - min || 1);
    return Math.round(36 + ratio * 28); // 36px..64px range
  },

  _bindEvents() {
    document.getElementById('plate-bar-weight').addEventListener('input', (e) => {
      this._barWeight = Number(e.target.value) || 0;
      this._updateTotal();
    });

    document.querySelectorAll('.plate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const plate = btn.dataset.plate;
        const action = btn.dataset.action;
        const current = this._platesPerSide[plate] || 0;
        this._platesPerSide[plate] = action === 'inc' ? current + 1 : Math.max(0, current - 1);
        document.getElementById(`plate-count-${plate}`).textContent = this._platesPerSide[plate];
        this._updateTotal();
      });
    });

    document.getElementById('plate-cancel').addEventListener('click', closeModal);
    document.getElementById('plate-confirm').addEventListener('click', () => {
      const total = this._total();
      // Remember the bar weight as the new default for next time, so the
      // person doesn't have to re-enter it every set.
      Store.data.settings.plateBarWeight = this._barWeight;
      Store.save();

      Session.setWeightFromPlateCalc(this._exIdx, this._setIdx, total);
      closeModal();
    });
  },

  _updateTotal() {
    const units = Store.data.settings.units;
    document.getElementById('plate-total-value').textContent = `${this._total()}${units}`;
  }
};
