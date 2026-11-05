/* ============================================
   ARSA — Dashboard Screen
   Answers one question first: what am I training
   today? Then a ledger of the numbers that matter,
   a 12-week training heatmap, and recent records.
   ============================================ */

const Dashboard = {
  render() {
    const screen = document.getElementById('screen-dashboard');
    const stats = Store.getStats();
    const history = Store.getHistory(); // newest first

    screen.innerHTML = `
      <div class="db-top">
        <span class="db-brand">Arsa</span>
        <span class="db-date">${new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </div>

      ${this._renderToday(history)}
      ${this._renderLedger(stats, history)}
      ${this._renderHeatmap(history)}
      ${this._renderRecords()}
    `;

    this._bindEvents(screen);
  },

  // ---------- Date helpers ----------

  _mid(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; },
  // Weeks run Monday to Sunday.
  _weekStart(d) {
    const x = this._mid(d);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  },
  _daysAgo(dateStr) {
    return Math.round((this._mid(new Date()) - this._mid(new Date(dateStr))) / 86400000);
  },
  _plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; },

  // ---------- Today ----------

  // Decides what the top block shows:
  //  start: a workout to begin (scheduled today, or the one you've left alone longest)
  //  done:  something was already logged today
  //  empty: no workouts exist yet
  _pickToday(history) {
    const workouts = Store.getWorkouts();
    if (!workouts.length) return { kind: 'empty' };

    const dow = new Date().getDay();
    const scheduled = workouts.filter(w => (w.scheduledDays || []).includes(dow));

    if (scheduled.length) {
      const pending = scheduled.find(w => !Store.getTodaysCompletionFor(w.id));
      if (pending) return { kind: 'start', workout: pending, scheduled: true };
      return { kind: 'done', workout: scheduled[0], completion: Store.getTodaysCompletionFor(scheduled[0].id) };
    }

    if (Store.hasTrainedToday()) {
      const todayKey = Store.todayStr();
      const entry = history.find(h => Store.todayStr(new Date(h.date)) === todayKey);
      return { kind: 'done', workout: Store.getWorkout(entry.workoutId) || null, completion: entry };
    }

    const lastTime = id => {
      const h = history.find(x => x.workoutId === id);
      return h ? new Date(h.date).getTime() : 0;
    };
    const sorted = workouts.slice().sort((a, b) => lastTime(a.id) - lastTime(b.id));
    return { kind: 'start', workout: sorted[0], scheduled: false };
  },

  _lastDoneText(workoutId, history) {
    const h = history.find(x => x.workoutId === workoutId);
    if (!h) return 'Not done yet.';
    const n = this._daysAgo(h.date);
    if (n <= 0) return 'Last done today.';
    if (n === 1) return 'Last done yesterday.';
    return `Last done ${n} days ago.`;
  },

  _renderToday(history) {
    const pick = this._pickToday(history);
    const many = Store.getWorkouts().length > 1;

    if (pick.kind === 'empty') {
      return `
        <section class="db-today">
          <div class="db-k">Today</div>
          <h2>No workouts yet</h2>
          <p>Build a routine and it shows up here, ready to start.</p>
          <button class="db-go" type="button" id="btn-create-workout">Create a workout</button>
        </section>`;
    }

    if (pick.kind === 'done') {
      const c = pick.completion;
      const name = pick.workout ? pick.workout.name : c.workoutName;
      return `
        <section class="db-today done">
          <div class="db-k">Today</div>
          <h2>${esc(name)}</h2>
          <p>Done in ${Math.max(1, Math.round(c.duration / 60))} min, ${this._plural(c.totalSets, 'set', 'sets')} logged.</p>
          ${pick.workout ? `<button class="db-go outline" type="button" id="btn-redo-today" data-id="${pick.workout.id}">Train again</button>` : ''}
          ${many ? '<button class="db-link" type="button" id="btn-pick-workout">Choose another workout</button>' : ''}
        </section>`;
    }

    const w = pick.workout;
    const last = history.find(h => h.workoutId === w.id);
    const minutes = last && last.duration
      ? Math.max(5, Math.round(last.duration / 60))
      : w.exercises.reduce((sum, ex) => sum + (Number(ex.sets) || 3) * 3, 0);

    return `
      <section class="db-today">
        <div class="db-k">${pick.scheduled ? 'Today' : 'Up next'}</div>
        <h2>${esc(w.name)}</h2>
        <p>${this._plural(w.exercises.length, 'exercise', 'exercises')}, about ${minutes} min. ${this._lastDoneText(w.id, history)}</p>
        <button class="db-go" type="button" id="btn-start-today" data-id="${w.id}">Start workout</button>
        ${!pick.scheduled && many ? '<button class="db-link" type="button" id="btn-pick-workout">Choose another workout</button>' : ''}
      </section>`;
  },

  // ---------- Ledger ----------

  _renderLedger(stats, history) {
    const units = Store.data.settings.units;
    const weekStart = this._weekStart(new Date());
    const thisWeek = history.filter(h => new Date(h.date) >= weekStart);
    const weekVolume = thisWeek.reduce((s, h) => s + (Number(h.totalVolume) || 0), 0);

    const weekly = stats.streakMode === 'rolling-average';
    const streakUnit = weekly ? 'week' : 'day';
    const target = weekly ? stats.streakTargetPerWeek
      : (stats.streakMode === 'fixed-days' && stats.streakDays ? stats.streakDays.length : null);
    const weekValue = target
      ? `${thisWeek.length} of ${target} sessions`
      : this._plural(thisWeek.length, 'session', 'sessions');

    const logs = Store.getWeightLogs();
    const latest = logs.length ? logs[logs.length - 1] : null;

    const row = (label, value, sub) => `
      <div class="db-row"><span>${label}</span><span class="num">${value}${sub ? `<small>${sub}</small>` : ''}</span></div>`;

    return `
      <div class="db-ledger">
        ${row('Streak', this._plural(stats.currentStreak, streakUnit, streakUnit + 's'), stats.longestStreak > stats.currentStreak ? `best ${stats.longestStreak}` : '')}
        ${row('This week', weekValue)}
        ${row('Volume this week', `${Fmt.number(weekVolume)} ${units}`)}
        ${latest ? `
          <button class="db-row link" type="button" data-go="progress">
            <span>Body weight</span><span class="num">${latest.weight} ${units}</span>
          </button>` : ''}
      </div>
      ${this._streakNote(stats)}`;
  },

  _streakNote(stats) {
    let text = '';
    if (stats.streakMode === 'bootstrap') {
      text = 'Keep logging workouts. Arsa is still learning your training pattern.';
    } else if (stats.streakMode === 'fixed-days') {
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      text = `Streak follows your usual training days: ${(stats.streakDays || []).map(d => names[d]).join(', ')}.`;
    } else if (stats.streakMode === 'rolling-average') {
      text = `Streak follows your typical pace: ${stats.streakTargetPerWeek}+ workouts a week.`;
    }
    return text ? `<p class="db-note">${text}</p>` : '';
  },

  // ---------- Heatmap (last 12 weeks) ----------

  _renderHeatmap(history) {
    const WEEKS = 12;
    const today = this._mid(new Date());
    const start = this._weekStart(today);
    start.setDate(start.getDate() - (WEEKS - 1) * 7);

    // sessions and sets per calendar day
    const byDay = {};
    history.forEach(h => {
      const key = Store.todayStr(new Date(h.date));
      const d = byDay[key] || (byDay[key] = { sessions: 0, sets: 0 });
      d.sessions += 1;
      d.sets += Number(h.totalSets) || 0;
    });

    let maxSets = 0, sessionTotal = 0;
    const cells = [];
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const key = Store.todayStr(date);
        const info = byDay[key];
        const future = date > today;
        if (info && !future) { maxSets = Math.max(maxSets, info.sets); sessionTotal += info.sessions; }
        cells.push({ key, date, info: future ? null : info, future, isToday: date.getTime() === today.getTime() });
      }
    }

    // month labels over the first week of each month
    let labels = '';
    let prevMonth = -1;
    for (let w = 0; w < WEEKS; w++) {
      const m = cells[w * 7].date.getMonth();
      labels += `<span>${m !== prevMonth ? cells[w * 7].date.toLocaleDateString('en-US', { month: 'short' }) : ''}</span>`;
      prevMonth = m;
    }

    const html = cells.map(c => {
      if (c.future) return '<i class="hm f"></i>';
      const nice = c.date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
      if (!c.info) return `<i class="hm${c.isToday ? ' t' : ''}"></i>`;
      const level = Math.max(1, Math.min(4, Math.ceil((c.info.sets / (maxSets || 1)) * 4)));
      return `<button class="hm l${level}${c.isToday ? ' t' : ''}" type="button" data-date="${c.key}"
        aria-label="${nice}, ${this._plural(c.info.sessions, 'workout', 'workouts')}, ${this._plural(c.info.sets, 'set', 'sets')}"></button>`;
    }).join('');

    return `
      <div class="db-sec"><span>Last 12 weeks</span><span class="num">${this._plural(sessionTotal, 'workout', 'workouts')}</span></div>
      <div class="hm-months" aria-hidden="true">${labels}</div>
      <div class="hm-grid">${html}</div>
      <div class="hm-legend" aria-hidden="true"><span>Fewer sets</span><i class="hm l1"></i><i class="hm l2"></i><i class="hm l3"></i><i class="hm l4"></i><span>More</span></div>`;
  },

  // Tapping a day: one workout opens it; several open a picker.
  _openDay(key) {
    const entries = Store.getHistory()
      .filter(h => Store.todayStr(new Date(h.date)) === key)
      .reverse(); // earliest first
    if (!entries.length) return;
    if (entries.length === 1) return Progress.showHistoryDetail(entries[0].id);

    const [y, m, d] = key.split('-').map(Number);
    const title = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

    openModal(`
      <div class="modal-title">${title}</div>
      <div class="modal-body">
        ${entries.map(h => `
          <button class="db-pick" type="button" data-history-id="${h.id}">
            <span>${esc(h.workoutName)}</span>
            <span class="num">${new Date(h.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}, ${Math.max(1, Math.round(h.duration / 60))} min, ${h.totalSets} sets</span>
          </button>`).join('')}
      </div>
    `);

    document.querySelectorAll('.db-pick').forEach(el => {
      el.addEventListener('click', () => {
        closeModal();
        Progress.showHistoryDetail(el.dataset.historyId);
      });
    });
  },

  // ---------- Records ----------

  _renderRecords() {
    // Weighted records date from maxWeightDate. Bodyweight exercises have no
    // weight, so their record is reps, dated from maxRepsDate.
    const WEEK = 7 * 24 * 60 * 60 * 1000;
    const prs = Store.getAllPRs()
      .map(p => {
        const bodyweight = !(p.maxWeight > 0);
        return { ...p, bodyweight, when: bodyweight ? p.maxRepsDate : p.maxWeightDate };
      })
      .sort((a, b) => new Date(b.when) - new Date(a.when))
      .slice(0, 3);

    if (!prs.length) {
      return `
        <div class="db-sec"><span>Recent records</span></div>
        <p class="db-empty">No records yet. Finish a workout and your best sets appear here.</p>`;
    }

    return `
      <div class="db-sec"><span>Recent records</span></div>
      ${prs.map(pr => {
        const fresh = Date.now() - new Date(pr.when).getTime() < WEEK;
        return `
        <button class="db-rec" type="button" data-ex="${pr.exerciseId}">
          <span class="nm">${esc(pr.name)}</span>
          <span class="num">${pr.bodyweight ? `${pr.maxReps} reps` : `${Fmt.weight(pr.maxWeight)} × ${pr.maxWeightReps}`}</span>
          <span class="dt">${fresh ? '<b>New</b> ' : ''}${Fmt.date(pr.when)}</span>
        </button>`;
      }).join('')}`;
  },

  // ---------- Events ----------

  // One delegated handler, assigned as a property so re-rendering never
  // stacks duplicate listeners.
  _bindEvents(screen) {
    screen.onclick = (e) => {
      const t = e.target.closest('button');
      if (!t || !screen.contains(t)) return;

      if (t.id === 'btn-start-today' || t.id === 'btn-redo-today') return Session.start(t.dataset.id);
      if (t.id === 'btn-pick-workout' || t.id === 'btn-create-workout') return App.navigateTo('workouts');
      if (t.dataset.date) return this._openDay(t.dataset.date);
      if (t.dataset.go === 'progress') {
        Progress._historyDetailId = null;
        Progress._tab = 'overview';
        return App.navigateTo('progress');
      }
      if (t.dataset.ex) {
        Progress._historyDetailId = null;
        Progress._tab = 'exercise';
        Progress._selectedExerciseId = t.dataset.ex;
        return App.navigateTo('progress');
      }
    };
  }
};

// Simple HTML escape utility used across modules
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
