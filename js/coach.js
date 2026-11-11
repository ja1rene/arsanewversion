/* ============================================
   ARSA — Coach
   An offline assistant. It reads the person's own training data (workouts,
   history, records, body weight) and answers from a built-in lifting
   knowledge base (coach-kb.js). Nothing is sent anywhere, so it works
   without internet and the questions stay on the device.

   How it works: the question is normalized, then every "intent" (data
   questions defined below) and every knowledge-base entry scores itself by
   the trigger phrases it finds. The best score answers. Follow-ups like
   "and for squat?" reuse the previous intent.
   ============================================ */

const COACH_CHAT_KEY = 'arsa-coach-chat';
const COACH_MISS_KEY = 'arsa-coach-misses';

const Coach = {
  _open: false,
  _msgs: [],        // { r: 'u' | 'c', p: [paragraphs], rows, act }
  _chips: [],
  _last: { id: null, ex: null, range: null },
  _idx: null,

  // =============================================================== Setup

  init() {
    if (document.getElementById('coach-fab')) return;

    const fab = document.createElement('button');
    fab.id = 'coach-fab';
    fab.type = 'button';
    fab.className = 'coach-fab';
    fab.setAttribute('aria-label', 'Ask Coach');
    fab.innerHTML = `${this._icon()}<span class="lbl">Ask Coach</span>`;
    document.body.appendChild(fab);

    const sheet = document.createElement('div');
    sheet.id = 'coach-sheet';
    sheet.className = 'coach hidden';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'Coach');
    sheet.innerHTML = `
      <div class="coach-back" data-close></div>
      <div class="coach-panel" id="coach-panel">
        <div class="coach-head">
          <div class="ti"><b>Coach</b><small>Works offline, stays on this phone</small></div>
          <button type="button" class="coach-hbtn" id="coach-clear">Clear</button>
          <button type="button" class="coach-hbtn" id="coach-x" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div class="coach-log" id="coach-log" aria-live="polite"></div>
        <div class="coach-chips" id="coach-chips"></div>
        <form class="coach-form" id="coach-form" autocomplete="off">
          <input type="text" id="coach-input" placeholder="Ask about your training" aria-label="Ask Coach" enterkeyhint="send" autocapitalize="sentences" maxlength="300">
          <button type="submit" class="coach-send" aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </form>
      </div>`;
    document.body.appendChild(sheet);

    fab.addEventListener('click', () => this.open());
    sheet.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]') || e.target.closest('#coach-x')) return this.close();
      if (e.target.closest('#coach-clear')) return this._confirmClear();
      const chip = e.target.closest('[data-chip]');
      if (chip) return this.ask(chip.dataset.chip);
      const act = e.target.closest('[data-act]');
      if (act) return this._doAction(JSON.parse(act.dataset.act));
    });
    sheet.querySelector('#coach-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('coach-input');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      this.ask(text);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this._open) this.close(); });

    // Keep the sheet above the on-screen keyboard.
    if (window.visualViewport) {
      const fit = () => { if (this._open) this._fitViewport(); };
      window.visualViewport.addEventListener('resize', fit);
      window.visualViewport.addEventListener('scroll', fit);
    }

    this._loadChat();

    // First launch only: show the label for a few seconds so the button is noticed.
    try {
      if (!localStorage.getItem('arsa-coach-seen')) {
        fab.classList.add('intro');
        setTimeout(() => fab.classList.remove('intro'), 5000);
        localStorage.setItem('arsa-coach-seen', '1');
      }
    } catch (e) { /* storage unavailable: skip the intro */ }
  },

  _icon() {
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H10l-6 4V5z"/><path d="M8 9.5h8M8 12.5h5" stroke-linecap="round"/></svg>';
  },

  open() {
    const sheet = document.getElementById('coach-sheet');
    this._open = true;
    sheet.classList.remove('hidden');
    document.body.classList.add('coach-open');
    document.getElementById('coach-fab').classList.remove('intro');

    if (!this._msgs.length) this._greet();
    else { this._chips = this._suggestions(4); }
    this._renderAll();
    this._fitViewport();

    if (window.matchMedia('(pointer: fine)').matches) document.getElementById('coach-input').focus();
  },

  close() {
    this._open = false;
    document.getElementById('coach-sheet').classList.add('hidden');
    document.body.classList.remove('coach-open');
    const p = document.getElementById('coach-panel');
    p.style.height = ''; p.style.bottom = '';
    document.getElementById('coach-fab').focus({ preventScroll: true });
  },

  _fitViewport() {
    const vv = window.visualViewport;
    if (!vv) return;
    const p = document.getElementById('coach-panel');
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    p.style.bottom = kb + 'px';
    p.style.height = Math.min(window.innerHeight * 0.88, vv.height - 8) + 'px';
  },

  // =============================================================== Chat state

  _loadChat() {
    try {
      const saved = JSON.parse(localStorage.getItem(COACH_CHAT_KEY) || 'null');
      if (saved && Array.isArray(saved.msgs)) this._msgs = saved.msgs.slice(-40);
    } catch (e) { this._msgs = []; }
  },
  _saveChat() {
    try { localStorage.setItem(COACH_CHAT_KEY, JSON.stringify({ msgs: this._msgs.slice(-40) })); } catch (e) { /* ignore */ }
  },

  _confirmClear() {
    if (!this._msgs.length) return;
    this._msgs = [];
    this._last = { id: null, ex: null, range: null };
    this._saveChat();
    this._greet();
    this._renderAll();
  },

  // Unanswered questions, kept on the device so the knowledge base can grow.
  getMisses() {
    try { return JSON.parse(localStorage.getItem(COACH_MISS_KEY) || '[]'); } catch (e) { return []; }
  },
  clearMisses() { try { localStorage.removeItem(COACH_MISS_KEY); } catch (e) { /* ignore */ } },
  _recordMiss(text) {
    try {
      const list = this.getMisses().filter(m => m.q.toLowerCase() !== text.toLowerCase());
      list.unshift({ q: text.slice(0, 200), t: new Date().toISOString() });
      localStorage.setItem(COACH_MISS_KEY, JSON.stringify(list.slice(0, 60)));
    } catch (e) { /* ignore */ }
  },

  // =============================================================== Rendering

  _fmt(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  },

  _msgHtml(m) {
    if (m.r === 'u') return `<div class="cm cm-u"><div class="cm-b">${esc(m.p[0])}</div></div>`;
    const paras = (m.p || []).map(t => `<p>${this._fmt(t)}</p>`).join('');
    const rows = (m.rows && m.rows.length)
      ? `<div class="cm-rows">${m.rows.map(r => `<div><span>${esc(r[0])}</span><span class="num">${esc(r[1])}</span></div>`).join('')}</div>` : '';
    const acts = (m.act && m.act.length)
      ? `<div class="cm-act">${m.act.map(a => `<button type="button" data-act='${esc(JSON.stringify(a)).replace(/'/g, '&#39;')}'>${esc(a.label)}</button>`).join('')}</div>` : '';
    return `<div class="cm cm-c"><div class="cm-b">${paras}${rows}${acts}</div></div>`;
  },

  _renderAll() {
    const log = document.getElementById('coach-log');
    log.innerHTML = this._msgs.map(m => this._msgHtml(m)).join('');
    this._renderChips();
    log.scrollTop = log.scrollHeight;
  },

  _renderChips() {
    const el = document.getElementById('coach-chips');
    el.innerHTML = this._chips.map(c => `<button type="button" class="coach-chip" data-chip="${esc(c)}">${esc(c)}</button>`).join('');
  },

  _push(m) {
    this._msgs.push(m);
    this._saveChat();
    const log = document.getElementById('coach-log');
    log.insertAdjacentHTML('beforeend', this._msgHtml(m));
    log.scrollTop = log.scrollHeight;
  },

  _typing(on) {
    const log = document.getElementById('coach-log');
    let el = document.getElementById('coach-typing');
    if (on && !el) {
      log.insertAdjacentHTML('beforeend', '<div class="cm cm-c" id="coach-typing"><div class="cm-b"><span class="dots"><i></i><i></i><i></i></span></div></div>');
      log.scrollTop = log.scrollHeight;
    } else if (!on && el) el.remove();
  },

  // =============================================================== Asking

  ask(text) {
    text = String(text || '').trim();
    if (!text) return;
    this._push({ r: 'u', p: [text] });
    this._chips = [];
    this._renderChips();
    this._typing(true);

    setTimeout(() => {
      let reply;
      try { reply = this._answer(text); }
      catch (err) {
        console.error('Arsa coach:', err);
        reply = { p: ['Something went wrong while reading your data. Try asking another way.'], f: this._suggestions(3) };
      }
      this._typing(false);
      this._push({ r: 'c', p: reply.p || [], rows: reply.rows || null, act: reply.act || null });
      this._chips = (reply.f && reply.f.length) ? reply.f.slice(0, 4) : this._suggestions(4);
      this._renderChips();
    }, 280);
  },

  _greet() {
    const reply = this._greetReply();
    this._msgs.push({ r: 'c', p: reply.p, rows: null, act: reply.act || null });
    this._saveChat();
    this._chips = reply.f || this._suggestions(4);
  },

  _greetReply() {
    const name = this._name();
    const hour = new Date().getHours();
    const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const p = [`${hello}${name ? ', ' + name : ''}. I'm your Coach. I can look at your own training and answer lifting questions, and I work without internet.`];
    const act = [];
    const pick = Store.getWorkouts().length ? Dashboard._pickToday(Store.getHistory()) : { kind: 'empty' };
    if (pick.kind === 'start' && pick.workout && pick.scheduled) {
      p.push(`You have **${pick.workout.name}** scheduled today.`);
      act.push({ label: `Start ${pick.workout.name}`, type: 'start', id: pick.workout.id });
    } else if (pick.kind === 'empty') {
      p.push('You have no workouts yet. I can point you to a beginner program.');
      act.push({ label: 'See training splits', type: 'nav', screen: 'workouts' });
    }
    p.push('Ask me something, or tap a suggestion.');
    return { p, act, f: this._suggestions(4) };
  },

  _name() {
    const n = (Store.data.settings.name || '').trim();
    return n && n !== 'Lifter' ? n : '';
  },

  _suggestions(n) {
    const hist = Store.getHistory();
    const list = [];
    if (hist.length) {
      list.push('What should I train today?', 'How is my week going?', 'Which muscles am I neglecting?');
      const top = this._topExercise(hist);
      if (top) list.push(`What's my best ${top.name}?`, `What should I do next on ${top.name}?`);
      list.push('Do I need a deload?', 'Which of my lifts are stalling?', 'How much protein do I need?', 'How long should I rest between sets?');
    } else {
      list.push('Which split is best?', 'How do I log a workout?', 'How do I warm up?', 'What is progressive overload?', 'How much protein do I need?', 'How often should I train?');
    }
    return list.sort(() => Math.random() - 0.5).slice(0, n);
  },

  _topExercise(hist) {
    const counts = {};
    hist.forEach(h => (h.exercises || []).forEach(e => { if (e.exerciseId) counts[e.exerciseId] = (counts[e.exerciseId] || 0) + 1; }));
    const id = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    return id ? Store.getExerciseById(id) : null;
  },

  // =============================================================== Actions

  _doAction(a) {
    if (!a) return;
    if (a.type === 'ask') return this.ask(a.text);
    this.close();
    if (a.type === 'nav') return App.navigateTo(a.screen);
    if (a.type === 'start') return Session.start(a.id);
    if (a.type === 'ex') {
      Progress._historyDetailId = null;
      Progress._tab = 'exercise';
      Progress._selectedExerciseId = a.id;
      return App.navigateTo('progress');
    }
    if (a.type === 'awards') {
      Progress._historyDetailId = null;
      Progress._tab = 'achievements';
      return App.navigateTo('progress');
    }
  },

  // =============================================================== Matching

  _norm(s) {
    return ' ' + String(s).toLowerCase()
      .replace(/[‘’`]/g, "'")
      .replace(/'/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ').trim() + ' ';
  },

  _buildIndex() {
    const prep = (e, data) => {
      e._k = (e.k || []).map(p => this._norm(p));
      e._not = (e.not || []).map(p => this._norm(p));
      e._data = data;
      return e;
    };
    this._idx = [
      ...this._intents().map(e => prep(e, true)),
      ...COACH_KB.map(e => prep(e, false))
    ];
  },

  _score(e, ctx) {
    if (e.needsEx && !ctx.ex) return 0;
    if (e._not.length && e._not.some(p => ctx.pad.includes(p))) return 0;
    let s = 0;
    e._k.forEach(p => {
      if (ctx.pad.includes(p)) s += Math.pow(p.trim().split(' ').length, 1.6);
    });
    if (s === 0) return 0;
    if (e.ex && ctx.ex) s += 2;
    if (e.personal && !(ctx.me || ctx.ex || s >= 3)) return 0;
    return s + (e._data ? 0.1 : 0);
  },

  // Longest alias wins, so "incline bench" beats "bench".
  _findEx(pad) {
    const all = Store.getAllExercises();
    const aliases = [];
    all.forEach(ex => {
      aliases.push([this._norm(ex.name).trim(), ex.id, false]);
      (EXERCISE_ALIASES[ex.id] || []).forEach(a => aliases.push([a, ex.id, false]));
    });
    Object.keys(EXERCISE_APPROX).forEach(a => aliases.push([a, EXERCISE_APPROX[a], true]));
    aliases.sort((a, b) => b[0].length - a[0].length);
    for (const [alias, id, approx] of aliases) {
      if (!alias) continue;
      if (pad.includes(' ' + alias + ' ')) {
        let exId = id;
        // "row" alone: use whichever row the person did most recently.
        if (alias === 'row' || alias === 'rows') {
          const h = Store.getHistory();
          const last = h.find(x => (x.exercises || []).some(e => e.exerciseId === 'ex_barbell_row' || e.exerciseId === 'ex_seated_row'));
          if (last) exId = last.exercises.find(e => e.exerciseId === 'ex_barbell_row' || e.exerciseId === 'ex_seated_row').exerciseId;
        }
        const ex = Store.getExerciseById(exId);
        if (ex) return { ex, approx: approx ? alias : null };
      }
    }
    return null;
  },

  _findRange(pad) {
    const has = (s) => pad.includes(' ' + s + ' ');
    if (has('last week') || has('previous week')) return 'lastweek';
    if (has('last month') || has('previous month')) return 'lastmonth';
    if (has('this month')) return 'month';
    if (has('this week') || has('so far this week')) return 'week';
    if (has('yesterday')) return 'yesterday';
    if (has('today')) return 'today';
    if (has('last 7 days') || has('past 7 days') || has('past week')) return '7d';
    if (has('last 30 days') || has('past 30 days') || has('past month')) return '30d';
    if (has('all time') || has('ever') || has('overall') || has('altogether') || has('in total') || has('total') || has('so far')) return 'all';
    if (has('month')) return 'month';
    if (has('week')) return 'week';
    return null;
  },

  _context(raw) {
    const pad = this._norm(raw);
    const found = this._findEx(pad);
    const logs = Store.getWeightLogs();
    const latest = logs.length ? logs[logs.length - 1] : null;
    const units = Store.data.settings.units;
    let bodyKg = null, bodyText = '';
    if (latest && Number(latest.weight) > 0) {
      bodyKg = units === 'lbs' ? Number(latest.weight) / 2.2046 : Number(latest.weight);
      bodyText = `${this._n(latest.weight)} ${units}`;
    }
    const hist = Store.getHistory();
    const durs = hist.map(h => Number(h.duration) || 0).filter(Boolean);
    return {
      raw, pad,
      me: /\b(my|i|me|mine|ive|im|am i|do i)\b/.test(pad.trim()),
      ex: found ? found.ex : null,
      approx: found ? found.approx : null,
      range: this._findRange(pad),
      bodyKg, bodyText,
      avgMinutes: durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length / 60) : null
    };
  },

  _answer(raw) {
    if (!this._idx) this._buildIndex();
    const ctx = this._context(raw);
    const q = ctx.pad.trim();

    if (/^(hi|hello|hey|yo|sup|hola|howdy)( coach| there)?$/.test(q) || /^good (morning|afternoon|evening)( coach)?$/.test(q)) return this._greetReply();
    if (/^(thanks|thank you|ty|thx|cool|nice|great|awesome|ok|okay|got it|perfect)( coach| so much| a lot)?$/.test(q)) {
      return { p: ['Anytime. Ask me whatever you want about your training.'], f: this._suggestions(3) };
    }

    let best = null, bestScore = 0;
    this._idx.forEach(e => {
      const s = this._score(e, ctx);
      if (s > bestScore) { best = e; bestScore = s; }
    });

    // Follow-ups like "and for squat?" or "what about last week?"
    if (!best && this._last.id) {
      const prev = this._idx.find(e => e.id === this._last.id && e._data);
      if (prev && ((ctx.ex && prev.ex) || (ctx.range && prev.range))) best = prev;
    }

    // Just an exercise name: give a quick summary of it.
    if (!best && ctx.ex) return this._exSummary(ctx);

    if (!best) {
      this._recordMiss(raw);
      return {
        p: ["I don't have an answer for that yet. I know lifting basics, how to use Arsa, and your own training numbers, and I run on this phone without internet. Try one of these:"],
        f: this._suggestions(4)
      };
    }

    if (best._data) {
      this._last = { id: best.id, ex: ctx.ex || this._last.ex, range: ctx.range || this._last.range };
      if (!ctx.ex && this._last.ex && best.ex && /^(and|what about|how about)/.test(q)) ctx.ex = this._last.ex;
      return best.run(ctx);
    }

    const a = typeof best.a === 'function' ? best.a(ctx) : best.a;
    return { p: a, act: best.act || null, f: best.f || this._suggestions(3) };
  },

  // =============================================================== Data helpers

  _n(v) {
    return Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
  },
  _w(v) { return `${this._n(v)} ${Store.data.settings.units}`; },
  _plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; },
  _day(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; },
  _weekStart(d) { const x = this._day(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; },
  _done(s) { return s.completed !== false; },
  _setVol(s) { return (Number(s.weight) || 0) * (Number(s.reps) || 0); },
  _e1rm(w, r) { return r > 0 && w > 0 ? w * (1 + r / 30) : 0; },

  _entryVol(h) {
    let v = 0;
    (h.exercises || []).forEach(e => (e.sets || []).forEach(s => { if (this._done(s)) v += this._setVol(s); }));
    return v;
  },
  _entrySets(h) {
    let n = 0;
    (h.exercises || []).forEach(e => (e.sets || []).forEach(s => { if (this._done(s)) n++; }));
    return n;
  },

  _ago(dateStr) {
    const n = Math.round((this._day(new Date()) - this._day(dateStr)) / 86400000);
    const when = n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`;
    return `${when} (${Fmt.date(dateStr, { weekday: 'short' })})`;
  },

  _rangeBounds(key) {
    const now = new Date();
    const today = this._day(now);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const ws = this._weekStart(now);
    const ms = new Date(now.getFullYear(), now.getMonth(), 1);
    const day = (n) => { const x = new Date(today); x.setDate(x.getDate() + n); return x; };
    switch (key) {
      case 'today': return { label: 'today', start: today, end: tomorrow, prev: null };
      case 'yesterday': return { label: 'yesterday', start: day(-1), end: today, prev: null };
      case 'week': { const ps = new Date(ws); ps.setDate(ps.getDate() - 7); return { label: 'this week', partial: true, start: ws, end: tomorrow, prev: { start: ps, end: ws, label: 'last week' } }; }
      case 'lastweek': { const ps = new Date(ws); ps.setDate(ps.getDate() - 7); const pp = new Date(ps); pp.setDate(pp.getDate() - 7); return { label: 'last week', start: ps, end: ws, prev: { start: pp, end: ps, label: 'the week before' } }; }
      case 'month': return { label: 'this month', partial: true, start: ms, end: tomorrow, prev: { start: new Date(ms.getFullYear(), ms.getMonth() - 1, 1), end: ms, label: 'last month' } };
      case 'lastmonth': { const ps = new Date(ms.getFullYear(), ms.getMonth() - 1, 1); return { label: 'last month', start: ps, end: ms, prev: { start: new Date(ms.getFullYear(), ms.getMonth() - 2, 1), end: ps, label: 'the month before' } }; }
      case '7d': return { label: 'the last 7 days', start: day(-6), end: tomorrow, prev: { start: day(-13), end: day(-6), label: 'the 7 days before' } };
      case '30d': return { label: 'the last 30 days', start: day(-29), end: tomorrow, prev: { start: day(-59), end: day(-29), label: 'the 30 days before' } };
      default: return { label: 'in total', start: new Date(0), end: tomorrow, prev: null };
    }
  },

  _inRange(hist, b) { return hist.filter(h => { const d = new Date(h.date); return d >= b.start && d < b.end; }); },

  // Sessions that included an exercise, newest first.
  _sessionsFor(exId) {
    const out = [];
    Store.getHistory().forEach(h => {
      const e = (h.exercises || []).find(x => x.exerciseId === exId && (x.sets || []).some(s => this._done(s)));
      if (e) out.push({ h, sets: e.sets.filter(s => this._done(s)) });
    });
    return out;
  },

  // One rule for "stalled", used by plateau and deload answers: at least 5
  // sessions, no new best in the last 4, and those 4 span two weeks or more.
  _stalled(exId) {
    const s = this._sessionsFor(exId);
    if (s.length < 5) return null;
    const score = (x) => this._bestE1rm(x.sets) || Math.max(0, ...x.sets.map(t => Number(t.reps) || 0));
    const e = s.map(score);
    const recent = Math.max(...e.slice(0, 4));
    const before = Math.max(...e.slice(4));
    const days = Math.round((new Date(s[0].h.date) - new Date(s[3].h.date)) / 86400000);
    return recent <= before && days >= 14 ? { sessions: s.length, days } : null;
  },

  _topSet(sets) {
    return sets.slice().sort((a, b) => (Number(b.weight) - Number(a.weight)) || (Number(b.reps) - Number(a.reps)))[0];
  },
  _setText(s) {
    return Number(s.weight) > 0 ? `${this._w(s.weight)} × ${s.reps}` : `${s.reps} reps`;
  },
  _bestE1rm(sets) {
    let best = 0;
    sets.forEach(s => { if (Number(s.reps) <= 12) best = Math.max(best, this._e1rm(Number(s.weight), Number(s.reps))); });
    return best;
  },

  _noHistory() {
    return {
      p: ["You haven't logged a workout yet, so I have no numbers to work with. Finish one and I can start answering questions about your training."],
      act: [{ label: 'Open Workouts', type: 'nav', screen: 'workouts' }],
      f: ['Which split is best?', 'How do I log a workout?']
    };
  },

  _askWhich(verb) {
    const top = this._topExercise(Store.getHistory());
    const eg = top ? top.name : 'bench press';
    return {
      p: [`Which lift do you mean? For example: "${verb} ${eg}".`],
      f: this._frequent(3).map(e => `${verb} ${e.name}`)
    };
  },

  _frequent(n) {
    const counts = {};
    Store.getHistory().forEach(h => (h.exercises || []).forEach(e => { if (e.exerciseId) counts[e.exerciseId] = (counts[e.exerciseId] || 0) + 1; }));
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, n).map(id => Store.getExerciseById(id)).filter(Boolean);
  },

  _approxNote(ctx) {
    return ctx.approx ? [`Note: "${ctx.approx}" is not in your library, so I used ${ctx.ex.name}, the closest match.`] : [];
  },

  // =============================================================== Intents

  _intents() {
    const C = this;
    return [

      // ---------------------------------------------------------- Today
      {
        id: 'today', personal: true,
        k: ['what should i train', 'what do i train', 'train today', 'workout today', 'what should i do today', 'whats next', 'next workout', 'what workout', 'what am i training', 'what is my workout', 'todays workout', 'what to train'],
        run() {
          const hist = Store.getHistory();
          const pick = Store.getWorkouts().length ? Dashboard._pickToday(hist) : { kind: 'empty' };
          if (pick.kind === 'empty') {
            return { p: ["You don't have any workouts yet. Pick a ready-made split and I'll set it up, or build your own."], act: [{ label: 'See training splits', type: 'nav', screen: 'workouts' }], f: ['Which split is best?'] };
          }
          if (pick.kind === 'done') {
            const w = pick.workout;
            return { p: [`You already trained today${w ? ': **' + w.name + '**' : ''}. Good work. Rest up, or ask me how your week is going.`], f: ['How is my week going?', 'Do I need a deload?'] };
          }
          const w = pick.workout;
          const names = w.exercises.slice(0, 5).map(e => e.name).join(', ');
          const more = w.exercises.length > 5 ? `, plus ${w.exercises.length - 5} more` : '';
          return {
            p: [
              pick.scheduled ? `Today is **${w.name}**.` : `Nothing is scheduled today. The workout you have left alone longest is **${w.name}**.`,
              `${C._plural(w.exercises.length, 'exercise', 'exercises')}: ${names}${more}. ${Dashboard._lastDoneText(w.id, hist)}`
            ],
            act: [{ label: `Start ${w.name}`, type: 'start', id: w.id }],
            f: ['How is my week going?', 'Which muscles am I neglecting?']
          };
        }
      },

      // ---------------------------------------------------------- Split / schedule
      {
        id: 'split', personal: true,
        k: ['my split', 'my routine', 'my program', 'my workouts', 'my schedule', 'training days', 'what workouts do i have', 'my plan', 'my training plan', 'what is my split', 'show my workouts'],
        run() {
          const ws = Store.getWorkouts();
          if (!ws.length) return { p: ["You don't have any workouts yet."], act: [{ label: 'See training splits', type: 'nav', screen: 'workouts' }], f: ['Which split is best?'] };
          const order = [1, 2, 3, 4, 5, 6, 0];
          const rows = ws.map(w => {
            const days = (w.scheduledDays || []).length ? order.filter(d => w.scheduledDays.includes(d)).map(d => WEEKDAYS[d]).join(', ') : 'no set days';
            return [w.name, `${days}, ${w.exercises.length} ex`];
          });
          const sessionsPerWeek = new Set(ws.flatMap(w => w.scheduledDays || [])).size;
          return {
            p: [`You have ${C._plural(ws.length, 'workout', 'workouts')}${sessionsPerWeek ? `, training on ${C._plural(sessionsPerWeek, 'day', 'days')} a week` : ''}.`],
            rows, act: [{ label: 'Open Workouts', type: 'nav', screen: 'workouts' }],
            f: ['What should I train today?', 'Which split is best?']
          };
        }
      },

      // ---------------------------------------------------------- This week
      {
        id: 'week', personal: true,
        k: ['how is my week', 'my week', 'week going', 'weekly progress', 'sessions this week', 'how many times have i trained', 'how am i doing', 'how am i doing this week', 'workouts this week', 'am i on track'],
        run() {
          const hist = Store.getHistory();
          if (!hist.length) return C._noHistory();
          const b = C._rangeBounds('week');
          const mine = C._inRange(hist, b);
          const prev = C._inRange(hist, b.prev);
          const stats = Store.getStats();
          const target = stats.streakMode === 'rolling-average' ? stats.streakTargetPerWeek
            : (stats.streakMode === 'fixed-days' && stats.streakDays ? stats.streakDays.length : null);
          const vol = mine.reduce((s, h) => s + C._entryVol(h), 0);
          const sets = mine.reduce((s, h) => s + C._entrySets(h), 0);
          const pvol = prev.reduce((s, h) => s + C._entryVol(h), 0);
          const p = [`This week: **${C._plural(mine.length, 'session', 'sessions')}**${target ? ` of ${target} planned` : ''}, ${C._plural(sets, 'set', 'sets')}, ${C._w(vol)} lifted.`];
          if (pvol > 0 && vol > 0) {
            p.push(`Last week finished at ${C._w(pvol)}, so you are at ${Math.round((vol / pvol) * 100)}% of that so far.`);
          }
          if (target && mine.length >= target) p.push('You have hit your target for the week.');
          else if (target) p.push(`${C._plural(target - mine.length, 'more session', 'more sessions')} to hit your target.`);
          return { p, f: ['What should I train today?', 'Which muscles am I neglecting?'] };
        }
      },

      // ---------------------------------------------------------- Volume
      {
        id: 'volume', personal: true, range: true,
        not: ['per muscle', 'should i do', 'recommended', 'ideal', 'is a good'],
        k: ['volume', 'how much volume', 'volume this week', 'volume this month', 'how much have i lifted', 'total weight', 'tonnage', 'how much did i lift', 'how much do i lift', 'how much weight have i lifted', 'total volume', 'weight lifted'],
        run(ctx) {
          const hist = Store.getHistory();
          if (!hist.length) return C._noHistory();
          const b = C._rangeBounds(ctx.range || 'week');
          const mine = C._inRange(hist, b);
          if (!mine.length) return { p: [b.label === 'in total' ? "You haven't logged any workouts yet." : `You haven't logged any workouts for ${b.label}.`], f: ['How is my week going?'] };
          const vol = mine.reduce((s, h) => s + C._entryVol(h), 0);
          const sets = mine.reduce((s, h) => s + C._entrySets(h), 0);
          const p = [b.label === 'in total'
            ? `In total you have lifted **${C._w(vol)}** across ${C._plural(mine.length, 'session', 'sessions')} and ${C._plural(sets, 'set', 'sets')}.`
            : `For ${b.label}, you lifted **${C._w(vol)}** across ${C._plural(mine.length, 'session', 'sessions')} and ${C._plural(sets, 'set', 'sets')}.`];
          if (b.prev) {
            const pv = C._inRange(hist, b.prev).reduce((s, h) => s + C._entryVol(h), 0);
            if (pv > 0) {
              if (b.partial) {
                p.push(`${b.prev.label[0].toUpperCase() + b.prev.label.slice(1)} finished at ${C._w(pv)}, so you are at ${Math.round((vol / pv) * 100)}% of that so far.`);
              } else {
                const pct = Math.round(((vol - pv) / pv) * 100);
                p.push(pct === 0 ? `That is level with ${b.prev.label}.` : `That is ${Math.abs(pct)}% ${pct > 0 ? 'up' : 'down'} on ${b.prev.label} (${C._w(pv)}).`);
              }
            }
          }
          return { p, f: ['How is my week going?', 'Which muscles am I neglecting?'] };
        }
      },

      // ---------------------------------------------------------- Last time
      {
        id: 'last', personal: true, ex: true,
        k: ['last time', 'last session', 'previous session', 'what did i', 'last workout', 'how much did i', 'most recent', 'last did', 'when did i last'],
        run(ctx) {
          const hist = Store.getHistory();
          if (!hist.length) return C._noHistory();
          if (!ctx.ex) {
            const h = hist[0];
            const rows = (h.exercises || []).map(e => {
              const sets = (e.sets || []).filter(s => C._done(s));
              return sets.length ? [e.name, C._setText(C._topSet(sets))] : null;
            }).filter(Boolean);
            return {
              p: [`Your last workout was **${h.workoutName}**, ${C._ago(h.date)}. ${C._plural(C._entrySets(h), 'set', 'sets')}, ${C._w(C._entryVol(h))} lifted${h.duration ? ', ' + Fmt.duration(h.duration) : ''}. Top set of each exercise:`],
              rows, act: Store.getWorkout(h.workoutId) ? [{ label: `Start ${h.workoutName}`, type: 'start', id: h.workoutId }] : null,
              f: ['How is my week going?']
            };
          }
          const sess = C._sessionsFor(ctx.ex.id);
          if (!sess.length) return { p: [`You haven't logged ${ctx.ex.name} yet.`, ...C._approxNote(ctx)], f: ['What should I train today?'] };
          const s0 = sess[0];
          const rows = s0.sets.map((s, i) => [`Set ${i + 1}`, C._setText(s)]);
          const p = [`Last time you did **${ctx.ex.name}** was ${C._ago(s0.h.date)}:`];
          if (sess[1]) {
            const a = C._bestE1rm(s0.sets), b = C._bestE1rm(sess[1].sets);
            if (a && b) {
              const d = Math.round(((a - b) / b) * 100);
              p.push(d === 0 ? 'That is level with the session before.' : `Estimated strength is ${Math.abs(d)}% ${d > 0 ? 'up' : 'down'} on the session before.`);
            }
          }
          return {
            p: p.concat(C._approxNote(ctx)), rows,
            act: [{ label: `${ctx.ex.name} progress`, type: 'ex', id: ctx.ex.id }],
            f: [`What should I do next on ${ctx.ex.name}?`, `What's my best ${ctx.ex.name}?`]
          };
        }
      },

      // ---------------------------------------------------------- Personal records
      {
        id: 'best', personal: true, ex: true,
        not: ['best time', 'best way', 'best split', 'best program', 'best exercise', 'best exercises', 'best for', 'best diet', 'best food', 'best supplement', 'best rep', 'best routine', 'best workout'],
        k: ['best', 'pr', 'prs', 'record', 'records', 'personal record', 'personal records', 'heaviest', 'max', 'strongest', 'my max'],
        run(ctx) {
          if (!ctx.ex) {
            const prs = Store.getAllPRs();
            if (!prs.length) return C._noHistory();
            const sorted = prs.slice().sort((a, b) => C._e1rm(b.maxWeight, b.maxWeightReps) - C._e1rm(a.maxWeight, a.maxWeightReps) || b.maxReps - a.maxReps);
            const rows = sorted.slice(0, 6).map(pr => [pr.name, pr.maxWeight > 0 ? `${C._w(pr.maxWeight)} × ${pr.maxWeightReps}` : `${pr.maxReps} reps`]);
            const rest = sorted.length - rows.length;
            return {
              p: [`You hold records on ${C._plural(prs.length, 'exercise', 'exercises')}. Your strongest:${rest > 0 ? ` (and ${rest} more in Progress)` : ''}`],
              rows, act: [{ label: 'Open Progress', type: 'nav', screen: 'progress' }],
              f: ["What's my 1RM?", 'How is my week going?']
            };
          }
          const pr = Store.getPR(ctx.ex.id);
          if (!pr) return { p: [`You don't have a record for ${ctx.ex.name} yet.`, ...C._approxNote(ctx)], f: [`What's the proper form for ${ctx.ex.name}?`] };
          const rows = [];
          if (pr.maxWeight > 0) rows.push(['Heaviest set', `${C._w(pr.maxWeight)} × ${pr.maxWeightReps}`]);
          rows.push(['Most reps in a set', pr.maxRepsWeight > 0 ? `${pr.maxReps} at ${C._w(pr.maxRepsWeight)}` : `${pr.maxReps} reps`]);
          if (pr.maxVolume > 0 && pr.maxWeight > 0) rows.push(['Biggest set volume', C._w(pr.maxVolume)]);
          const e = C._e1rm(pr.maxWeight, pr.maxWeightReps);
          if (e) rows.push(['Estimated 1RM', C._w(e)]);
          return {
            p: [`Your records on **${ctx.ex.name}**, last set ${Fmt.date(pr.maxWeightDate || pr.maxRepsDate, { year: 'numeric' })}:`, ...C._approxNote(ctx)],
            rows, act: [{ label: `${ctx.ex.name} progress`, type: 'ex', id: ctx.ex.id }],
            f: [`What should I do next on ${ctx.ex.name}?`, `What did I do last time on ${ctx.ex.name}?`]
          };
        }
      },

      // ---------------------------------------------------------- Estimated 1RM
      {
        id: 'e1rm', personal: true, ex: true,
        k: ['1rm', 'one rep max', 'estimated max', 'max out', 'my 1rm', 'e1rm', 'estimated 1rm'],
        not: ['what is a 1rm', 'what is 1rm', 'what is one rep max', 'how is 1rm calculated'],
        run(ctx) {
          const rowsFor = (exId) => {
            let best = 0, from = null;
            C._sessionsFor(exId).forEach(x => x.sets.forEach(s => {
              if (Number(s.reps) > 12) return;
              const v = C._e1rm(Number(s.weight), Number(s.reps));
              if (v > best) { best = v; from = s; }
            }));
            return best ? { best, from } : null;
          };
          if (ctx.ex) {
            const r = rowsFor(ctx.ex.id);
            if (!r) return { p: [`I need a weighted set of 12 reps or fewer on ${ctx.ex.name} to estimate that.`, ...C._approxNote(ctx)], f: [`What's my best ${ctx.ex.name}?`] };
            return {
              p: [`Your estimated 1RM on **${ctx.ex.name}** is about **${C._w(Math.round(r.best * 2) / 2)}**, from ${C._setText(r.from)}.`, 'It is a guide, not a test. It gets less accurate above 10 reps, and you should not attempt a true max without a spotter or safety bars.', ...C._approxNote(ctx)],
              f: [`What should I do next on ${ctx.ex.name}?`]
            };
          }
          const rows = [];
          Store.getAllExercises().forEach(e => { const r = rowsFor(e.id); if (r) rows.push([e.name, r.best]); });
          if (!rows.length) return C._noHistory();
          rows.sort((a, b) => b[1] - a[1]);
          return {
            p: ['Your estimated one rep maxes (Epley formula, from sets of 12 reps or fewer):'],
            rows: rows.slice(0, 6).map(r => [r[0], C._w(Math.round(r[1] * 2) / 2)]),
            f: ["What's my best bench press?"]
          };
        }
      },

      // ---------------------------------------------------------- What weight next
      {
        id: 'next', personal: true, ex: true,
        k: ['what weight', 'should i increase', 'should i add weight', 'go up', 'progress on', 'next weight', 'how much should i lift', 'what should i lift', 'ready to increase', 'add weight', 'try next', 'what should i do next on', 'next time', 'increase the weight', 'how heavy', 'what weight should i use', 'should i go heavier', 'level up'],
        run(ctx) {
          if (!ctx.ex) return C._askWhich('What should I do next on');
          const sess = C._sessionsFor(ctx.ex.id);
          if (!sess.length) {
            return { p: [`You haven't logged ${ctx.ex.name} yet. Start with a weight you can lift for about ${'10'} controlled reps with 2 or 3 left in the tank, and I'll build from there.`, ...C._approxNote(ctx)], f: [`What's the proper form for ${ctx.ex.name}?`] };
          }
          const last = sess[0].sets;
          const topW = Math.max(...last.map(s => Number(s.weight) || 0));
          const atTop = last.filter(s => (Number(s.weight) || 0) === topW);
          // Rep range from the workout that uses this exercise, else a common default.
          let rr = null;
          Store.getWorkouts().forEach(w => w.exercises.forEach(e => { if (!rr && e.exerciseId === ctx.ex.id && e.repRange) rr = String(e.repRange); }));
          const m = (rr || '8-12').match(/(\d+)\D+(\d+)/);
          const single = parseInt(rr, 10);
          const low = m ? +m[1] : (Number.isFinite(single) ? single : 8);
          const top = m ? +m[2] : (Number.isFinite(single) ? single : 12);
          const step = Store.data.settings.units === 'kg' ? 2.5 : 5;
          const lastText = last.map(s => (Number(s.weight) > 0 ? `${C._n(s.weight)}` : 'BW') + ` × ${s.reps}`).join(', ');
          const minReps = Math.min(...atTop.map(s => Number(s.reps) || 0));
          let call, why;
          if (topW > 0 && minReps >= top) {
            call = `${C._w(topW + step)} × ${low}`;
            why = `You hit the top of your ${low} to ${top} rep range on every set at ${C._w(topW)}, so it is time to add weight and start the range again.`;
          } else if (topW > 0) {
            call = `${C._w(topW)} × ${Math.min(top, minReps + 1)}`;
            why = `Your lowest set at ${C._w(topW)} was ${minReps} reps and the top of your range is ${top}. Keep the weight and add a rep before adding load.`;
          } else {
            call = `${Math.min(top, minReps + 1)} reps`;
            why = 'This is a bodyweight movement, so progress by adding a rep, a slower lowering phase, or extra weight.';
          }
          return {
            p: [`Last time on **${ctx.ex.name}**: ${lastText}.`, `**Next time, try ${call}.**`, why, 'If it felt too easy or too hard, trust that over the number.', ...C._approxNote(ctx)],
            act: [{ label: `${ctx.ex.name} progress`, type: 'ex', id: ctx.ex.id }],
            f: [`What's my best ${ctx.ex.name}?`, 'What is progressive overload?']
          };
        }
      },

      // ---------------------------------------------------------- Streak
      {
        id: 'streak', personal: true,
        k: ['streak', 'consistency', 'how consistent', 'days in a row', 'my streak', 'weeks in a row'],
        run() {
          const s = Store.getStats();
          if (!Store.getHistory().length) return C._noHistory();
          const weekly = s.streakMode === 'rolling-average';
          const unit = weekly ? 'week' : 'day';
          if (s.streakMode === 'bootstrap') {
            return { p: ['Keep logging workouts. After a few more sessions I can detect your pattern and start counting a streak.'], f: ['How is my week going?'] };
          }
          const p = [`Your streak is **${C._plural(s.currentStreak, unit, unit + 's')}**. Your best is ${C._plural(s.longestStreak, unit, unit + 's')}.`];
          if (weekly && s.streakTargetPerWeek) p.push(`A week counts when you reach about ${s.streakTargetPerWeek} sessions.`);
          if (!weekly && s.streakDays) p.push(`Your usual days: ${[1, 2, 3, 4, 5, 6, 0].filter(d => s.streakDays.includes(d)).map(d => WEEKDAYS[d]).join(', ')}.`);
          return { p, f: ['How is my week going?', 'What are my next awards?'] };
        }
      },

      // ---------------------------------------------------------- Overall stats
      {
        id: 'stats', personal: true,
        k: ['stats', 'my progress', 'how am i progressing', 'total workouts', 'how many workouts', 'workouts have i done', 'workouts total', 'training time', 'how long have i trained', 'my stats', 'overall stats', 'how many sets have i', 'how many reps have i', 'lifetime'],
        run() {
          const s = Store.getStats();
          const hist = Store.getHistory();
          if (!hist.length) return C._noHistory();
          const first = hist[hist.length - 1];
          return {
            p: [`You have completed **${C._plural(s.totalWorkouts, 'workout', 'workouts')}** since ${Fmt.date(first.date, { year: 'numeric' })}.`],
            rows: [
              ['Sets', Fmt.number(s.totalSets)],
              ['Reps', Fmt.number(s.totalReps)],
              ['Volume', C._w(s.totalVolume)],
              ['Training time', `${s.trainingHours} h`],
              ['Records held', String(s.prCount)]
            ],
            act: [{ label: 'Open Progress', type: 'nav', screen: 'progress' }],
            f: ['What are my next awards?', 'How is my week going?']
          };
        }
      },

      // ---------------------------------------------------------- Body weight
      {
        id: 'body', personal: true,
        k: ['my weight', 'body weight', 'bodyweight', 'how much do i weigh', 'weight trend', 'lost weight', 'gained weight', 'am i gaining', 'am i losing', 'my body weight'],
        not: ['bodyweight exercise', 'bodyweight exercises'],
        run() {
          const logs = Store.getWeightLogs().slice().sort((a, b) => new Date(a.date) - new Date(b.date));
          if (!logs.length) return { p: ["You haven't logged your body weight. Add it on the Dashboard and I can track the trend and work out numbers like protein for you."], act: [{ label: 'Open Dashboard', type: 'nav', screen: 'dashboard' }], f: ['How much protein do I need?'] };
          const u = Store.data.settings.units;
          const last = logs[logs.length - 1];
          const p = [`Your latest body weight is **${C._n(last.weight)} ${u}**, logged ${C._ago(last.date)}.`];
          const old = logs.find(l => (new Date(last.date) - new Date(l.date)) / 86400000 >= 28) || (logs.length > 1 ? logs[0] : null);
          if (old && old !== last) {
            const d = Math.round((last.weight - old.weight) * 10) / 10;
            const days = Math.round((new Date(last.date) - new Date(old.date)) / 86400000);
            p.push(d === 0 ? `That is unchanged over ${days} days.` : `That is ${C._n(Math.abs(d))} ${u} ${d > 0 ? 'up' : 'down'} over ${days} days.`);
          }
          return { p, f: ['How much protein do I need?'] };
        }
      },

      // ---------------------------------------------------------- Muscle balance
      {
        id: 'balance', personal: true,
        k: ['neglecting', 'muscle balance', 'which muscle', 'undertraining', 'imbalance', 'least trained', 'most trained', 'weak point', 'am i training enough', 'muscle groups', 'what am i missing', 'which muscles'],
        run() {
          const hist = Store.getHistory();
          if (!hist.length) return C._noHistory();
          const b = C._rangeBounds('30d');
          const mine = C._inRange(hist, b);
          if (!mine.length) return { p: ["You haven't trained in the last 30 days, so there is nothing to compare yet."], f: ['What should I train today?'] };
          const muscleOf = {};
          Store.getAllExercises().forEach(e => { muscleOf[e.id] = e.muscle; });
          const sets = { Chest: 0, Back: 0, Shoulders: 0, Legs: 0, Arms: 0 };
          mine.forEach(h => (h.exercises || []).forEach(e => {
            const m = muscleOf[e.exerciseId];
            if (!m) return;
            const n = (e.sets || []).filter(s => C._done(s)).length;
            sets[m] = (sets[m] || 0) + n;
          }));
          const perWeek = (n) => Math.round((n / (30 / 7)) * 10) / 10;
          const entries = Object.keys(sets).map(m => [m, perWeek(sets[m])]).sort((a, b) => b[1] - a[1]);
          const low = entries.filter(e => ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms'].includes(e[0])).slice(-1)[0];
          const high = entries[0];
          const tail = [];
          if (low && low[1] < 6) tail.push(`**${low[0]}** is your lowest at about ${C._n(low[1])} sets a week. Adding 2 or 3 sets of ${low[0].toLowerCase()} work could help balance things out.`);
          else tail.push('Nothing is badly neglected. A good target is about 10 to 20 hard sets per muscle per week.');
          if (high && low && high[0] !== low[0] && low[1] > 0 && high[1] / low[1] >= 2.5) tail.push(`**${high[0]}** gets more than double the work of ${low[0]}.`);
          return {
            p: ['Here are your average hard sets per week over the last 30 days.', ...tail],
            rows: entries.map(e => [e[0], `${C._n(e[1])} sets`]),
            f: ['How many sets per muscle should I do?', 'What should I train today?']
          };
        }
      },

      // ---------------------------------------------------------- Plateaus
      {
        id: 'plateau', personal: true, ex: true,
        k: ['stalling', 'which of my lifts', 'am i plateauing', 'am i stuck', 'lifts stalling', 'stalled lifts', 'not improving', 'plateauing', 'is my progress slowing', 'im stuck', 'stuck on'],
        run(ctx) {
          const stalled = (exId) => C._stalled(exId);
          if (ctx.ex) {
            const r = stalled(ctx.ex.id);
            const n = C._sessionsFor(ctx.ex.id).length;
            const tips = ['If a lift is stuck: check sleep and protein, add a rep or the smallest weight jump instead of a big one, try an extra set or a different rep range for 4 to 6 weeks, and take a deload week if you have trained hard for a while.'];
            if (n < 5) return { p: [`You have only ${n} session${n === 1 ? '' : 's'} of ${ctx.ex.name} logged, which is too few to call a plateau. Give it a few more.`, ...C._approxNote(ctx)], f: [`What should I do next on ${ctx.ex.name}?`] };
            return {
              p: [r ? `**${ctx.ex.name}** has not improved in your last 4 sessions (${r.days} days).` : `**${ctx.ex.name}** has improved recently, so it does not look stuck.`, ...(r ? tips : []), ...C._approxNote(ctx)],
              f: ['Do I need a deload?', `What should I do next on ${ctx.ex.name}?`]
            };
          }
          const rows = [];
          Store.getAllExercises().forEach(e => { const r = stalled(e.id); if (r) rows.push([e.name, `${r.days} days flat`]); });
          if (!Store.getHistory().length) return C._noHistory();
          if (!rows.length) return { p: ['None of your lifts look stalled. A lift needs at least 5 sessions over a couple of weeks before I can judge it, and everything with enough history is still moving.'], f: ['What is progressive overload?'] };
          return {
            p: [`${C._plural(rows.length, 'lift has', 'lifts have')} not improved across the last 4 sessions:`],
            rows: rows.slice(0, 6),
            act: [{ label: 'Open Progress', type: 'nav', screen: 'progress' }],
            f: ['Do I need a deload?', 'My lift is stuck, what should I do?']
          };
        }
      },

      // ---------------------------------------------------------- Deload check
      {
        id: 'deloadcheck', personal: true,
        k: ['do i need a deload', 'should i deload', 'am i overtraining', 'need a break', 'should i rest', 'need a rest week', 'am i overdoing it', 'time for a deload', 'do i need a rest'],
        run() {
          const hist = Store.getHistory();
          if (hist.length < 6) return { p: ['You have not trained long enough for a deload to matter yet. Keep building for a few more weeks.'], f: ['What is a deload?'] };
          // Consecutive weeks with at least one session, counting back from this week.
          const ws = C._weekStart(new Date());
          let weeks = 0;
          for (let i = 0; i < 20; i++) {
            const s = new Date(ws); s.setDate(s.getDate() - i * 7);
            const e = new Date(s); e.setDate(e.getDate() + 7);
            const any = hist.some(h => { const d = new Date(h.date); return d >= s && d < e; });
            if (any) weeks++; else if (i > 0) break; else continue;
          }
          const stalledCount = Store.getAllExercises().filter(e => C._stalled(e.id)).length;
          const p = [`You have trained in **${weeks} weeks in a row**, and ${stalledCount === 0 ? 'none of your lifts are stalled' : C._plural(stalledCount, 'lift is', 'lifts are') + ' stalled'}.`];
          if (weeks >= 8 || (weeks >= 6 && stalledCount >= 2)) p.push('A deload week looks worthwhile. Cut your sets roughly in half or use 10 to 20% less weight, and stop well short of failure.');
          else if (stalledCount >= 3) p.push('Several lifts are flat. Check sleep and food first, and consider a deload if you also feel run down.');
          else p.push('There is no clear sign you need one. Take one if your joints ache, your sleep is poor, or your lifts start dropping.');
          return { p, f: ['What is a deload?', 'Which of my lifts are stalling?'] };
        }
      },

      // ---------------------------------------------------------- Awards
      {
        id: 'awards', personal: true,
        k: ['award', 'awards', 'achievement', 'achievements', 'next award', 'unlock', 'badges', 'what can i unlock'],
        run() {
          const stats = Store.getStats();
          const items = ACHIEVEMENTS.map(a => ({ a, on: Store.hasAchievement(a.id), p: achievementProgress(a, stats) }));
          const got = items.filter(i => i.on).length;
          const next = items.filter(i => !i.on).sort((x, y) => y.p.pct - x.p.pct).slice(0, 3);
          if (!next.length) return { p: [`You have unlocked all ${items.length} awards. Impressive.`] };
          return {
            p: [`You have unlocked **${got} of ${items.length}** awards. Closest to unlocking:`],
            rows: next.map(i => [resolveAchievementText(i.a, stats, 'name'), `${Fmt.number(Math.min(i.p.value, i.p.target))} / ${Fmt.number(i.p.target)}`]),
            act: [{ label: 'See all awards', type: 'awards' }],
            f: ['How is my week going?']
          };
        }
      },

      // ---------------------------------------------------------- Exercise form
      {
        id: 'form', needsEx: true, ex: true,
        k: ['how do i', 'how to', 'form', 'technique', 'cues', 'proper form', 'mistakes', 'how should i', 'how do you', 'tips for', 'teach me', 'explain', 'cue'],
        run(ctx) {
          const db = (typeof ExerciseDB !== 'undefined' ? ExerciseDB : []).find(e => e.id === ctx.ex.id);
          const src = db || ctx.ex;
          const p = [];
          if (src.instructions) p.push(`**${ctx.ex.name}.** ${src.instructions}`);
          if (src.formTips && src.formTips.length) p.push('**Form cues:** ' + src.formTips.slice(0, 4).join('. ') + '.');
          if (src.mistakes && src.mistakes.length) p.push('**Common mistakes:** ' + src.mistakes.slice(0, 3).join('. ') + '.');
          if (!p.length) p.push(`I don't have form notes for ${ctx.ex.name} yet. You can add your own in the Library.`);
          return {
            p: p.concat(C._approxNote(ctx)),
            act: [{ label: `Open ${ctx.ex.name} in Library`, type: 'nav', screen: 'library' }],
            f: [`What should I do next on ${ctx.ex.name}?`, `What's my best ${ctx.ex.name}?`]
          };
        }
      },

      // ---------------------------------------------------------- Muscles worked
      {
        id: 'muscles', needsEx: true, ex: true,
        k: ['what muscles', 'muscles does', 'muscles worked', 'muscle does', 'which muscles does', 'what does it work', 'what does it target', 'works which muscles', 'target muscles'],
        run(ctx) {
          const db = (typeof ExerciseDB !== 'undefined' ? ExerciseDB : []).find(e => e.id === ctx.ex.id) || ctx.ex;
          const sec = (db.secondaryMuscles || []).length ? ` with help from ${db.secondaryMuscles.join(', ').toLowerCase()}` : '';
          return { p: [`**${ctx.ex.name}** mainly works your **${ctx.ex.muscle.toLowerCase()}**${sec}.`, ...C._approxNote(ctx)], f: [`How do I do ${ctx.ex.name}?`] };
        }
      },

      // ---------------------------------------------------------- Identity and help
      {
        id: 'whoami',
        k: ['my name', 'who am i', 'who are you', 'what is your name', 'whats your name', 'what are you'],
        run() {
          const n = C._name();
          return { p: [n ? `You are ${n}. I'm Coach, the assistant inside Arsa.` : "I'm Coach, the assistant inside Arsa. You can set your name in Settings and I'll use it.", 'I run on this phone, so I work offline and your questions never leave it.'], f: C._suggestions(3) };
        }
      },
      {
        id: 'help',
        k: ['help', 'what can you do', 'what can i ask', 'commands', 'features', 'what do you know', 'how do you work', 'what can you help with'],
        run() {
          return {
            p: [
              'I can answer in two ways. **About your training:** what to do today, your week, volume, last time on a lift, your records, what weight to try next, estimated 1RM, streak, body weight, muscle balance, stalled lifts, deloads and awards.',
              '**About lifting and Arsa:** rep ranges, rest, protein, warm-ups, splits, recovery, supplements, form for each exercise, and how to use the app.',
              'Add a lift name to a question, like "best squat", and I will focus on that lift.'
            ],
            f: C._suggestions(4)
          };
        }
      }
    ];
  },

  // Quick summary when someone types only an exercise name.
  _exSummary(ctx) {
    const sess = this._sessionsFor(ctx.ex.id);
    const pr = Store.getPR(ctx.ex.id);
    const rows = [];
    if (sess.length) rows.push(['Last done', this._ago(sess[0].h.date).split(' (')[0]], ['Last top set', this._setText(this._topSet(sess[0].sets))]);
    if (pr && pr.maxWeight > 0) rows.push(['Best set', `${this._w(pr.maxWeight)} × ${pr.maxWeightReps}`]);
    return {
      p: [sess.length ? `Here is where you stand on **${ctx.ex.name}**:` : `You haven't logged **${ctx.ex.name}** yet. What would you like to know?`, ...this._approxNote(ctx)],
      rows: rows.length ? rows : null,
      f: [`How do I do ${ctx.ex.name}?`, `What should I do next on ${ctx.ex.name}?`, `What's my best ${ctx.ex.name}?`]
    };
  }
};

document.addEventListener('DOMContentLoaded', () => Coach.init());
