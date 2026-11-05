/* ============================================
   ARSA — Progress Screen
   Overview (totals, weekly volume, sets per muscle,
   body weight), per-exercise trends, awards, and
   workout history. Charts can be scrubbed: touch or
   hover a point and the readout above shows its value.
   ============================================ */

const Progress = {
  _tab: 'overview', // overview | exercise | achievements | history
  _selectedExerciseId: null,
  _historyDetailId: null,
  _charts: [],

  render() {
    const screen = document.getElementById('screen-progress');

    if (this._historyDetailId) {
      this._renderHistoryDetail(this._historyDetailId);
      return;
    }

    const tabs = [['overview', 'Overview'], ['exercise', 'Exercise'], ['achievements', 'Awards'], ['history', 'History']];
    screen.innerHTML = `
      <h1 class="screen-title">Progress</h1>
      <div class="pg-tabs" role="tablist">
        ${tabs.map(([id, label]) => `
          <button class="pg-tab" type="button" role="tab" data-tab="${id}" aria-selected="${this._tab === id}">${label}</button>
        `).join('')}
      </div>
      <div id="progress-content"></div>
    `;

    this._bindScreen(screen);
    this._renderTabContent();
  },

  _renderTabContent() {
    const container = document.getElementById('progress-content');
    this._charts = [];
    if (this._tab === 'overview') container.innerHTML = this._renderOverview();
    else if (this._tab === 'exercise') container.innerHTML = this._renderExerciseTab();
    else if (this._tab === 'achievements') container.innerHTML = this._renderAchievements();
    else container.innerHTML = this._renderHistory();
    this._drawCharts();
  },

  // Charts need their canvas in the page (to know their width) before drawing.
  _drawCharts() {
    this._charts.forEach(c => Chart.draw(document.getElementById(c.id), c.cfg));
    this._charts = [];
  },

  _queueChart(id, cfg) { this._charts.push({ id, cfg }); },

  // One delegated handler for the whole screen, assigned as a property so
  // re-rendering never stacks duplicate listeners.
  _bindScreen(screen) {
    screen.onclick = (e) => {
      const t = e.target.closest('button');
      if (!t || !screen.contains(t)) return;

      if (t.dataset.tab) {
        this._tab = t.dataset.tab;
        return this.render();
      }
      if (t.dataset.historyId) return this.showHistoryDetail(t.dataset.historyId);
      if (t.id === 'btn-log-weight') return this._openLogWeight();
      if (t.id === 'btn-hist-back') {
        this._historyDetailId = null;
        return this.render();
      }
    };

    screen.onchange = (e) => {
      if (e.target.id !== 'prog-ex-select') return;
      this._selectedExerciseId = e.target.value || null;
      this._renderTabContent();
    };
  },

  // ---------- Small helpers ----------

  _u() { return Store.data.settings.units; },
  _n(v) { return Math.round(v * 10) / 10; },
  _e1rm(w, r) { return r <= 1 ? w : w * (1 + r / 30); }, // Epley estimate
  _row(label, value, sub) {
    return `<div class="pg-row"><span>${label}</span><span class="num">${value}${sub ? `<small>${sub}</small>` : ''}</span></div>`;
  },
  _delta(d) {
    const v = this._n(d);
    if (v === 0) return 'no change';
    return v > 0 ? `+${v}` : `−${Math.abs(v)}`;
  },
  _setLine(sets) {
    return (sets || []).map(s => `${Number(s.weight) > 0 ? s.weight : 'BW'}×${s.reps}`).join(', ') || 'No sets logged';
  },

  // ---------- OVERVIEW ----------

  _renderOverview() {
    const stats = Store.getStats();
    const u = this._u();
    const logs = Store.getWeightLogs();
    const latest = logs.length ? logs[logs.length - 1] : null;

    if (logs.length >= 2) {
      this._queueChart('ch-weight', {
        type: 'line',
        title: 'Body weight',
        values: logs.map(l => l.weight),
        labels: logs.map(l => Fmt.date(l.date, { year: 'numeric' })),
        axis: logs.map(l => Fmt.date(l.date)),
        format: v => `${v} ${u}`,
        readout: 'ro-weight'
      });
    }

    return `
      <div class="pg-ledger">
        ${this._row('Workouts', Fmt.number(stats.totalWorkouts))}
        ${this._row('Sets', Fmt.number(stats.totalSets))}
        ${this._row('Reps', Fmt.number(stats.totalReps))}
        ${this._row('Volume', `${Fmt.number(stats.totalVolume)} ${u}`)}
        ${this._row('Training time', `${stats.trainingHours} h`)}
      </div>

      ${this._renderWeeklyVolume()}
      ${this._renderMuscleSets()}

      <div class="pg-sec"><span>Body weight</span><button class="pg-act" type="button" id="btn-log-weight">Log weight</button></div>
      ${logs.length >= 2 ? `
        <div class="pg-chart">
          <div class="pg-readout" id="ro-weight"></div>
          <canvas class="arsa-chart" id="ch-weight"></canvas>
        </div>` : `<p class="pg-empty">${latest ? `Current: ${latest.weight} ${u}. ` : ''}Log your weight at least twice to see a trend.</p>`}
      ${logs.length ? `
        <div class="pg-ledger">
          ${logs.slice().reverse().slice(0, 5).map(w => this._row(Fmt.date(w.date, { year: 'numeric' }), `${w.weight} ${u}`)).join('')}
        </div>` : ''}
    `;
  },

  _renderWeeklyVolume() {
    const u = this._u();
    const WEEKS = 12;
    const start = Dashboard._weekStart(new Date());
    start.setDate(start.getDate() - (WEEKS - 1) * 7);

    const totals = Array(WEEKS).fill(0);
    Store.getHistory().forEach(h => {
      const idx = Math.floor((Dashboard._mid(new Date(h.date)) - start) / (7 * 86400000));
      if (idx >= 0 && idx < WEEKS) totals[idx] += Number(h.totalVolume) || 0;
    });

    if (totals.every(v => v === 0)) {
      return `
        <div class="pg-sec"><span>Weekly volume</span></div>
        <p class="pg-empty">Finish a workout and your weekly volume appears here.</p>`;
    }

    const weeks = totals.map((_, i) => { const d = new Date(start); d.setDate(start.getDate() + i * 7); return d; });
    this._queueChart('ch-weekly', {
      type: 'bar',
      title: 'Weekly volume',
      values: totals.map(v => Math.round(v)),
      labels: weeks.map(d => `Week of ${Fmt.date(d)}`),
      axis: weeks.map(d => Fmt.date(d)),
      format: v => `${Fmt.number(v)} ${u}`,
      readout: 'ro-weekly',
      selected: totals.reduce((last, v, i) => (v > 0 ? i : last), totals.length - 1)
    });

    return `
      <div class="pg-sec"><span>Weekly volume</span><span>Last 12 weeks</span></div>
      <div class="pg-chart">
        <div class="pg-readout" id="ro-weekly"></div>
        <canvas class="arsa-chart" id="ch-weekly"></canvas>
      </div>`;
  },

  _renderMuscleSets() {
    // Rolling windows, not calendar weeks: early in the week a calendar
    // comparison would always read as a big drop.
    const DAY = 86400000, now = Date.now();
    const cur = {}, prev = {};
    Store.getHistory().forEach(h => {
      const t = new Date(h.date).getTime();
      const bucket = t >= now - 7 * DAY ? cur : (t >= now - 14 * DAY ? prev : null);
      if (!bucket) return;
      (h.exercises || []).forEach(ex => {
        const n = (ex.sets || []).length;
        if (!n) return;
        const meta = ex.exerciseId ? Store.getExerciseById(ex.exerciseId) : null;
        const muscle = (meta && meta.muscle) || 'Other';
        bucket[muscle] = (bucket[muscle] || 0) + n;
      });
    });

    const muscles = Array.from(new Set([...Object.keys(cur), ...Object.keys(prev)]))
      .sort((a, b) => (cur[b] || 0) - (cur[a] || 0) || (prev[b] || 0) - (prev[a] || 0));

    if (!muscles.length) {
      return `
        <div class="pg-sec"><span>Sets by muscle</span></div>
        <p class="pg-empty">No sets logged in the last two weeks.</p>`;
    }

    const max = Math.max(...muscles.map(m => Math.max(cur[m] || 0, prev[m] || 0)), 1);
    return `
      <div class="pg-sec"><span>Sets by muscle, last 7 days</span><span>vs the 7 days before</span></div>
      <div class="pg-muscles">
        ${muscles.map(m => {
          const c = cur[m] || 0, p = prev[m] || 0, d = c - p;
          return `
          <div class="pg-mrow">
            <span class="nm">${esc(m)}</span>
            <span class="bar"><i style="width:${Math.round((c / max) * 100)}%"></i><b style="left:${Math.round((p / max) * 100)}%"></b></span>
            <span class="num">${c}</span>
            <span class="dl num">${d === 0 ? '0' : d > 0 ? `+${d}` : `−${Math.abs(d)}`}</span>
          </div>`;
        }).join('')}
      </div>
      <p class="pg-note">The tick on each bar marks the 7 days before.</p>`;
  },

  _openLogWeight() {
    openModal(`
      <div class="modal-title">Log body weight</div>
      <div class="modal-body">
        <div class="input-group">
          <label class="input-label">Weight (${this._u()})</label>
          <input type="number" inputmode="decimal" class="input" id="lw-weight" placeholder="e.g. 72.5">
        </div>
        <div class="input-group">
          <label class="input-label">Date</label>
          <input type="date" class="input" id="lw-date" value="${Store.todayStr()}">
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="lw-cancel">Cancel</button>
        <button class="btn btn-primary" id="lw-save">Save</button>
      </div>
    `);
    document.getElementById('lw-cancel').addEventListener('click', closeModal);
    document.getElementById('lw-save').addEventListener('click', () => {
      const weight = Number(document.getElementById('lw-weight').value);
      const date = document.getElementById('lw-date').value;
      if (!weight || weight <= 0) { showToast('Enter a valid weight'); return; }
      Store.addWeightLog(weight, new Date(date).toISOString());
      closeModal();
      showToast('Weight logged');
      this.render();
    });
  },

  // ---------- EXERCISE TAB ----------

  _renderExerciseTab() {
    const list = this._getExercisesWithHistory();

    if (!list.length) {
      return `<p class="pg-empty pg-pad">No exercises logged yet. Finish a workout and each exercise gets its own trend here.</p>`;
    }

    return `
      <div class="pg-pick">
        <select class="pg-select" id="prog-ex-select" aria-label="Exercise">
          <option value="">Select an exercise</option>
          ${list.map(e => `<option value="${e.id}" ${e.id === this._selectedExerciseId ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}
        </select>
      </div>
      ${this._selectedExerciseId
        ? this._renderExerciseProgress(this._selectedExerciseId)
        : '<p class="pg-empty pg-pad">Pick an exercise to see your estimated max, volume and recent sessions.</p>'}
    `;
  },

  _getExercisesWithHistory() {
    const seen = new Map();
    Store.getHistory().forEach(h => {
      (h.exercises || []).forEach(ex => {
        if (ex.exerciseId && !seen.has(ex.exerciseId)) seen.set(ex.exerciseId, { id: ex.exerciseId, name: ex.name });
      });
    });
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  },

  // One point per session, oldest first.
  _points(exerciseId) {
    const pts = [];
    Store.getHistory().slice().reverse().forEach(h => {
      const match = (h.exercises || []).find(e => e.exerciseId === exerciseId);
      if (!match || !match.sets || !match.sets.length) return;
      let best = null, volume = 0, maxReps = 0;
      match.sets.forEach(s => {
        const w = Number(s.weight) || 0, r = Number(s.reps) || 0;
        const e = w > 0 ? this._e1rm(w, r) : 0;
        volume += w * r;
        maxReps = Math.max(maxReps, r);
        if (!best || e > best.e || (e === best.e && r > best.r)) best = { w, r, e };
      });
      pts.push({ id: h.id, date: h.date, topW: best.w, topR: best.r, e1rm: this._n(best.e), volume, maxReps, sets: match.sets });
    });
    return pts;
  },

  _renderExerciseProgress(exerciseId) {
    const pts = this._points(exerciseId);
    if (!pts.length) return '';
    const u = this._u();
    const bodyweight = pts.every(p => p.topW === 0);
    const last = pts[pts.length - 1], prev = pts.length > 1 ? pts[pts.length - 2] : null;

    // Records, from the logged sessions
    const bestW = pts.reduce((a, b) => (b.topW > a.topW ? b : a), pts[0]);
    const bestE = Math.max(...pts.map(p => p.e1rm));
    const mostReps = Math.max(...pts.map(p => p.maxReps));
    const bestVol = Math.max(...pts.map(p => p.volume));

    const records = bodyweight
      ? `${this._row('Most reps in a set', mostReps)}${this._row('Sessions', pts.length)}`
      : `${this._row('Best set', `${bestW.topW} ${u} × ${bestW.topR}`)}
         ${this._row('Estimated 1RM', `${bestE} ${u}`)}
         ${this._row('Most reps in a set', mostReps)}
         ${this._row('Best session volume', `${Fmt.number(bestVol)} ${u}`)}
         ${this._row('Sessions', pts.length)}`;

    let since = '';
    if (prev) {
      since = `
        <div class="pg-sec"><span>Since last time</span><span>vs ${Fmt.date(prev.date)}</span></div>
        <div class="pg-ledger">
          ${bodyweight
            ? this._row('Most reps in a set', last.maxReps, this._delta(last.maxReps - prev.maxReps))
            : `${this._row('Estimated 1RM', `${last.e1rm} ${u}`, this._delta(last.e1rm - prev.e1rm))}
               ${this._row('Volume', `${Fmt.number(last.volume)} ${u}`, this._delta(last.volume - prev.volume))}`}
        </div>`;
    }

    let charts = '';
    if (pts.length < 2) {
      charts = `<p class="pg-empty pg-pad">One session logged so far. Trend charts appear after your second.</p>`;
    } else {
      const labels = pts.map(p => Fmt.date(p.date, { year: 'numeric' }));
      const axis = pts.map(p => Fmt.date(p.date));
      if (bodyweight) {
        this._queueChart('ch-ex-a', { type: 'line', title: 'Most reps per session', values: pts.map(p => p.maxReps), labels, axis, format: v => `${v} reps`, readout: 'ro-ex-a' });
        charts = `
          <div class="pg-sec"><span>Most reps per session</span></div>
          <div class="pg-chart"><div class="pg-readout" id="ro-ex-a"></div><canvas class="arsa-chart" id="ch-ex-a"></canvas></div>`;
      } else {
        this._queueChart('ch-ex-a', { type: 'line', title: 'Estimated 1RM', values: pts.map(p => p.e1rm), labels, axis, format: v => `${v} ${u}`, readout: 'ro-ex-a' });
        this._queueChart('ch-ex-b', { type: 'bar', title: 'Volume per session', values: pts.map(p => Math.round(p.volume)), labels, axis, format: v => `${Fmt.number(v)} ${u}`, readout: 'ro-ex-b' });
        charts = `
          <div class="pg-sec"><span>Estimated 1RM</span><span>Epley formula</span></div>
          <div class="pg-chart"><div class="pg-readout" id="ro-ex-a"></div><canvas class="arsa-chart" id="ch-ex-a"></canvas></div>
          <div class="pg-sec"><span>Volume per session</span></div>
          <div class="pg-chart"><div class="pg-readout" id="ro-ex-b"></div><canvas class="arsa-chart" id="ch-ex-b"></canvas></div>`;
      }
    }

    const recent = pts.slice(-6).reverse();
    const sessions = `
      <div class="pg-sec"><span>Recent sessions</span></div>
      ${recent.map(p => `
        <button class="pg-sess" type="button" data-history-id="${p.id}">
          <span class="d">${Fmt.date(p.date, { weekday: 'short' })}</span>
          <span class="s num">${this._setLine(p.sets)}</span>
        </button>`).join('')}`;

    // Drawn by _renderTabContent once the markup is in the page.
    return `
      <div class="pg-sec"><span>Records</span></div>
      <div class="pg-ledger">${records}</div>
      ${since}
      ${charts}
      ${sessions}`;
  },

  // ---------- AWARDS ----------

  _renderAchievements() {
    const stats = Store.getStats();
    const unlockedCount = ACHIEVEMENTS.filter(a => Store.hasAchievement(a.id)).length;
    return `
      <div class="pg-sec"><span>Awards</span><span class="num">${unlockedCount} of ${ACHIEVEMENTS.length} unlocked</span></div>
      ${ACHIEVEMENTS.map(a => {
        const on = Store.hasAchievement(a.id);
        return `
        <div class="pg-award ${on ? 'on' : ''}">
          <span class="chk">${on ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 6.5l2.6 2.6L10 3.4"/></svg>' : ''}</span>
          <span class="tx"><b>${resolveAchievementText(a, stats, 'name')}</b><small>${resolveAchievementText(a, stats, 'desc')}</small></span>
          <span class="st">${on ? 'Unlocked' : 'Locked'}</span>
        </div>`;
      }).join('')}`;
  },

  // ---------- HISTORY ----------

  _renderHistory() {
    const history = Store.getHistory();
    if (!history.length) {
      return `<p class="pg-empty pg-pad">No workouts yet. Finish one and it is saved here.</p>`;
    }

    const u = this._u();
    const groups = [];
    history.forEach(h => {
      const d = new Date(h.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      let g = groups[groups.length - 1];
      if (!g || g.key !== key) {
        g = { key, title: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), items: [] };
        groups.push(g);
      }
      g.items.push(h);
    });

    return groups.map(g => `
      <div class="pg-sec"><span>${g.title}</span><span class="num">${g.items.length} ${g.items.length === 1 ? 'workout' : 'workouts'}</span></div>
      ${g.items.map(h => `
        <button class="pg-hist" type="button" data-history-id="${h.id}">
          <span class="top"><span class="nm">${esc(h.workoutName)}</span><span class="dt">${Fmt.date(h.date, { weekday: 'short' })}</span></span>
          <span class="st num">${Math.max(1, Math.round(h.duration / 60))} min, ${h.totalSets} sets, ${Fmt.number(h.totalVolume)} ${u}</span>
        </button>`).join('')}
    `).join('');
  },

  showHistoryDetail(id) {
    this._historyDetailId = id;
    App.navigateTo('progress');
    this.render();
  },

  _renderHistoryDetail(id) {
    const h = Store.getHistory().find(x => x.id === id);
    const screen = document.getElementById('screen-progress');
    if (!h) { this._historyDetailId = null; this.render(); return; }
    const u = this._u();

    screen.innerHTML = `
      <button class="back-btn" id="btn-hist-back" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        Progress
      </button>
      <h1 class="screen-title" style="padding-top:8px;">${esc(h.workoutName)}</h1>
      <div class="pg-when">${Fmt.dateLong(h.date)}</div>

      <div class="pg-ledger">
        ${this._row('Duration', Fmt.duration(h.duration))}
        ${this._row('Exercises', h.exercises.length)}
        ${this._row('Sets', h.totalSets)}
        ${this._row('Volume', `${Fmt.number(h.totalVolume)} ${u}`)}
      </div>

      ${h.exercises.map(ex => `
        <div class="pg-sec"><span>${esc(ex.name)}</span></div>
        ${(ex.sets || []).length ? ex.sets.map((s, i) => `
          <div class="pg-set"><span class="n num">${i + 1}</span><span class="num">${Number(s.weight) > 0 ? `${s.weight} ${u}` : 'Bodyweight'} × ${s.reps}</span></div>`).join('')
          : '<p class="pg-empty">No sets logged.</p>'}
      `).join('')}
    `;

    this._bindScreen(screen);
  }
};

// ---------- Chart ----------
// Minimal canvas line/bar chart with no dependencies. Canvas can't use
// var(--accent) directly, so colors are read from the live CSS variables at
// draw time and charts stay in sync with the theme and any custom accent.
function cssVar(name, fallback) {
  const value = getComputedStyle(document.body).getPropertyValue(name).trim();
  return value || fallback;
}

const Chart = {
  // cfg: { type: 'line'|'bar', values[], labels[], axis[], format(v), readout (element id), title, selected (index shown first) }
  draw(canvas, cfg) {
    if (!canvas || !cfg.values.length) return;
    const state = { sel: cfg.selected != null ? cfg.selected : cfg.values.length - 1 };
    const n = cfg.values.length;

    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `${cfg.title || 'Chart'}: ${n} points, latest ${cfg.format(cfg.values[n - 1])}`);

    const paint = () => this._paint(canvas, cfg, state);
    paint();

    const pick = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      let i;
      if (cfg.type === 'bar') i = Math.floor(x / (r.width / n));
      else i = Math.round(((x - 6) / Math.max(1, r.width - 12)) * (n - 1));
      i = Math.max(0, Math.min(n - 1, i));
      if (i !== state.sel) { state.sel = i; paint(); }
    };
    canvas.addEventListener('pointerdown', pick);
    canvas.addEventListener('pointermove', pick);
  },

  _paint(canvas, cfg, state) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = rect.width, H = rect.height;
    const padT = 16, padB = 20, padX = 6;
    const cw = W - padX * 2, ch = H - padT - padB;
    const accent = cssVar('--accent', '#FFB224');
    const rule = cssVar('--border', '#2C3037');
    const dim = cssVar('--text-3', '#6B6F77');
    const vals = cfg.values, n = vals.length;

    const dMin = Math.min(...vals), dMax = Math.max(...vals);
    let lo, hi;
    if (cfg.type === 'bar') { lo = 0; hi = dMax || 1; }
    else {
      const span = (dMax - dMin) || Math.max(1, Math.abs(dMax) * 0.1);
      lo = dMin - span * 0.15; hi = dMax + span * 0.15;
    }
    const y = v => padT + ch - ((v - lo) / (hi - lo)) * ch;
    const slot = cw / n;
    const xAt = i => cfg.type === 'bar' ? padX + i * slot + slot / 2 : padX + (n === 1 ? cw / 2 : (i / (n - 1)) * cw);

    ctx.clearRect(0, 0, W, H);
    ctx.font = `10px ${cssVar('--font-mono', 'monospace')}`;
    ctx.lineWidth = 1;

    // Hairlines at the data's high and low (or at the baseline for bars)
    ctx.strokeStyle = rule;
    ctx.fillStyle = dim;
    ctx.textAlign = 'left';
    const rules = cfg.type === 'bar' ? [[dMax, 'bottom'], [0, null]] : [[dMax, 'bottom'], [dMin, 'top']];
    rules.forEach(([v, align]) => {
      const yy = Math.round(y(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke();
      if (align) {
        ctx.textBaseline = align;
        ctx.fillText(cfg.format(v), 0, align === 'bottom' ? yy - 3 : yy + 3);
      }
    });

    if (cfg.type === 'bar') {
      const bw = Math.max(2, slot * 0.62);
      vals.forEach((v, i) => {
        const h = (v / hi) * ch;
        ctx.globalAlpha = i === state.sel ? 1 : 0.35;
        ctx.fillStyle = accent;
        ctx.fillRect(padX + i * slot + (slot - bw) / 2, padT + ch - Math.max(h, v > 0 ? 1 : 0), bw, Math.max(h, v > 0 ? 1 : 0));
      });
      ctx.globalAlpha = 1;
    } else {
      // selected-point guide
      ctx.strokeStyle = rule;
      ctx.beginPath(); ctx.moveTo(Math.round(xAt(state.sel)) + 0.5, padT); ctx.lineTo(Math.round(xAt(state.sel)) + 0.5, padT + ch); ctx.stroke();

      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      vals.forEach((v, i) => i === 0 ? ctx.moveTo(xAt(i), y(v)) : ctx.lineTo(xAt(i), y(v)));
      ctx.stroke();

      ctx.fillStyle = accent;
      vals.forEach((v, i) => {
        const s = i === state.sel ? 8 : 3;
        ctx.fillRect(xAt(i) - s / 2, y(v) - s / 2, s, s);
      });
    }

    // First and last x labels
    const axis = cfg.axis || cfg.labels;
    ctx.fillStyle = dim;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillText(axis[0], 0, H - 4);
    if (n > 1) { ctx.textAlign = 'right'; ctx.fillText(axis[n - 1], W, H - 4); }

    const ro = cfg.readout ? document.getElementById(cfg.readout) : null;
    if (ro) ro.innerHTML = `<span class="num">${esc(cfg.format(vals[state.sel]))}</span><span>${esc(cfg.labels[state.sel])}</span>`;
  }
};

// Kept for compatibility with older code that called the original function.
function drawLineChart(canvas, values, labels, opts = {}) {
  Chart.draw(canvas, { type: 'line', values, labels, format: v => String(v), title: '' });
}
