/* ============================================
   ARSA — Coach engine (question understanding and conversation)
   Works fully offline. No servers, no AI service. Pieces:

   1. CoachNLP    turns a sentence into comparable "tokens": lowercase, no
                  filler words, plurals and endings trimmed, synonyms joined
                  (grow / build / bigger / increase), small typos repaired.
   2. Matching    every knowledge entry has a main question plus other ways
                  to ask it. The best overlap wins. Weak matches become a
                  "did you mean" instead of a made-up answer.
   3. Memory      the conversation remembers the topic, the exercise, the
                  muscle and what you told Coach (days per week, bulking...),
                  so "what about dumbbells?" and "explain that simply" work.
   4. Safety      always checked first (coach-safety.js).
   5. Your data   questions about your own training use the log (coach.js).
   ============================================ */

// ============================================================ 1. Language helpers

const CoachNLP = {
  stop: new Set(('a an the i me my mine you your we our is are am was were be been being do does did doing done can could should would will shall may might ' +
    'to of for in on at with and or but it its this that these those how what when where why which who if so just really very much many more some any ' +
    'get got have has had im ive id thats whats hows please tell about mean means meaning define explain way there then than also too into out hey hi hello ' +
    'coach ok okay yes no thanks thank like lot lots kind sort bit').split(' ')),

  // Words that mean the same thing become one word.
  groups: [
    ['grow', 'grow', 'build', 'bigger', 'larger', 'increase', 'develop', 'gain', 'size', 'bulk', 'hypertrophy', 'huge', 'big', 'expand', 'add', 'more'],
    ['arm', 'arm', 'bicep', 'biceps'],
    ['tired', 'tired', 'exhausted', 'fatigue', 'fatigued', 'drained', 'sleepy', 'wiped'],
    ['stuck', 'stuck', 'plateau', 'stall', 'stalled', 'stalling', 'stagnant'],
    ['pain', 'pain', 'hurt', 'hurts', 'ache', 'aches', 'sore', 'painful'],
    ['strong', 'strong', 'stronger', 'strength'],
    ['weak', 'weak', 'weaker', 'weakness'],
    ['eat', 'eat', 'food', 'diet', 'meal', 'meals', 'nutrition', 'eating'],
    ['beginner', 'beginner', 'newbie', 'novice', 'starter', 'new'],
    ['recover', 'recover', 'recovery', 'recovering'],
    ['weight', 'weight', 'load', 'kg', 'kgs', 'lbs', 'pounds', 'heavy', 'heavier'],
    ['rep', 'rep', 'reps', 'repetition', 'repetitions'],
    ['workout', 'workout', 'workouts', 'session', 'training'],
    ['lose', 'lose', 'loss', 'losing', 'shred'],
    ['form', 'form', 'technique', 'posture'],
    ['proper', 'proper', 'correct', 'right', 'properly', 'correctly'],
    ['chest', 'chest', 'pec', 'pecs'],
    ['shoulder', 'shoulder', 'delt', 'delts', 'deltoid', 'deltoids'],
    ['core', 'core', 'abs', 'abdominal', 'abdominals'],
    ['glute', 'glute', 'glutes', 'butt'],
    ['quad', 'quad', 'quads', 'quadricep', 'quadriceps'],
    ['hamstring', 'hamstring', 'hamstrings', 'hams'],
    ['minute', 'minute', 'min', 'mins', 'minutes'],
    ['difference', 'difference', 'differ', 'versus', 'vs', 'compare']
  ],

  // Phrases written in different ways are made the same before splitting.
  phrases: [
    [/ bench ?press(es)? /g, ' bench press '], [/ work ?outs? /g, ' workout '], [/ push ?ups? /g, ' pushup '], [/ pull ?ups? /g, ' pullup '], [/ chin ?ups? /g, ' chinup '],
    [/ sit ?ups? /g, ' situp '], [/ dead ?lifts? /g, ' deadlift '], [/ warm ?ups? /g, ' warmup '], [/ drop ?sets? /g, ' dropset '],
    [/ super ?sets? /g, ' superset '], [/ pre ?workout /g, ' preworkout '], [/ post ?workout /g, ' postworkout '],
    [/ lat pull ?downs? /g, ' pulldown '], [/ lat pulldowns? /g, ' pulldown '], [/ pull downs? /g, ' pulldown '],
    [/ dumb ?bells? /g, ' dumbbell '], [/ bar ?bells? /g, ' barbell '],
    [/ (1|one) ?(rep )?max /g, ' 1rm '], [/ 1 rm /g, ' 1rm '], [/ one rep maximum /g, ' 1rm '],
    [/ rate of perceived exertion /g, ' rpe '], [/ reps? in reserve /g, ' rir '], [/ delayed onset muscle soreness /g, ' doms '],
    [/ personal (record|best) /g, ' pr '], [/ time under tension /g, ' tut '], [/ rest days? /g, ' restday '],
    [/ (isnt|arent|wont|cant|cannot|dont|doesnt|didnt|couldnt|wasnt|aint) /g, ' not '],
    [/ ya | u /g, ' you ']
  ],

  _stemCache: {},
  stem(w) {
    if (this._stemCache[w] !== undefined) return this._stemCache[w];
    let s = w;
    if (s.length > 3) {
      if (/(ches|shes|sses|xes)$/.test(s)) s = s.slice(0, -2);
      else if (/ies$/.test(s) && s.length > 4) s = s.slice(0, -3) + 'y';
      else if (/s$/.test(s) && !/(ss|us|is)$/.test(s)) s = s.slice(0, -1);
    }
    if (s.length > 5 && /ing$/.test(s)) { s = s.slice(0, -3); if (/(.)\1$/.test(s)) s = s.slice(0, -1); }
    else if (s.length > 5 && /ed$/.test(s)) { s = s.slice(0, -2); if (/(.)\1$/.test(s)) s = s.slice(0, -1); }
    if (s.length > 4 && /e$/.test(s)) s = s.slice(0, -1);
    return (this._stemCache[w] = s);
  },

  syn: null,
  _initSyn() {
    this.syn = {};
    this.groups.forEach(g => { const head = this.stem(g[0]); g.forEach(w => { this.syn[this.stem(w)] = head; }); });
    this.stopStem = new Set([...this.stop].map(w => this.stem(w)));
  },

  norm(s) {
    let t = ' ' + String(s).toLowerCase().replace(/[‘’`]/g, "'").replace(/'/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
    this.phrases.forEach(([re, to]) => { t = t.replace(re, to); });
    return t;
  },

  // Words -> comparable tokens. `fix` repairs typos using the known vocabulary.
  toks(text, vocab, onUnknown) {
    if (!this.syn) this._initSyn();
    const out = [];
    this.norm(text).trim().split(' ').forEach(raw => {
      if (!raw || this.stop.has(raw)) return;
      if (vocab && raw.length <= 2 && !/^\d/.test(raw) && !vocab.has(this.stem(raw))) return;
      let t = this.stem(raw);
      if (this.stopStem.has(t)) return;
      if (vocab && !vocab.has(t) && !this.syn[t] && raw.length >= 4 && !/^\d/.test(t)) {
        const fixed = this._nearest(raw, vocab) || (t.length >= 4 ? this._nearest(t, vocab) : null);
        if (fixed) t = fixed; else if (onUnknown) onUnknown(t);
      }
      t = this.syn[t] || t;
      if (!out.includes(t)) out.push(t);
    });
    return out;
  },

  // Edit distance where swapping two neighbouring letters counts as one change.
  _dist(a, b) {
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 2) return 9;
    const d = [];
    for (let i = 0; i <= m; i++) { d[i] = [i]; }
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[m][n];
  },
  _nearest(t, vocab) {
    const limit = t.length >= 8 ? 2 : 1;
    let best = null, bd = 9;
    vocab.forEach(v => {
      if (v[0] !== t[0] && t.length < 7) return;
      const dd = this._dist(t, v);
      if (dd < bd && dd <= limit) { bd = dd; best = v; }
    });
    return best;
  }
};

// ============================================================ 2. Engine

Object.assign(Coach, {

  _conv: null,
  _kb: null,
  _byId: null,

  _newConv() {
    return { profile: {}, answers: {}, last: null, pending: null, muscle: null, ex: null, exRec: null, facet: null, safety: null, turn: 0 };
  },

  // ---------------------------------------------------------------- Build the knowledge index

  _exEntry(x) {
    const alts = [];
    x.al.forEach(a => { alts.push(`how do i do the ${a}`, `${a} form`, `proper ${a}`, `${a} technique`, `how to ${a}`, `how do i perform a proper ${a}`); });
    return {
      cat: 'exercise', id: 'ex-' + x.id, q: `How do I perform a proper ${x.name.toLowerCase()}?`, alt: alts, exRec: x.id,
      a: () => this._exForm(x), simple: this._exSimple(x),
      f: [`What muscles does the ${x.name.toLowerCase()} work?`, `Common ${x.name.toLowerCase()} mistakes`, `${x.name} tips for beginners`],
      rel: []
    };
  },

  _list(items, numbered) { return items.map((t, i) => (numbered ? `${i + 1}. ` : '- ') + t).join('\n'); },

  _exForm(x) {
    const eq = Object.keys(x.v || {}).length ? ` You can also ask me about ${Object.keys(x.v).join(' or ')} versions.` : '';
    return [
      `**${x.name}** mainly works your ${x.pri.join(', ').toLowerCase()}, with help from ${x.sec.length ? x.sec.join(', ').toLowerCase() : 'little else'}. You need: ${x.eq}.${eq}`,
      '**Set up**\n' + this._list(x.setup, true),
      '**Movement**\n' + this._list(x.steps, true),
      `**Breathing:** ${x.br}`,
      '**Common mistakes**\n' + this._list(x.mist.slice(0, 3)),
      `**Stay safe:** ${x.safe}`
    ];
  },
  _exSimple(x) { return [`**${x.name}**, in short:`, this._list(x.steps, true), `Beginner tip: ${x.tips[0]}`]; },

  _buildKB() {
    const N = CoachNLP;
    N._initSyn();
    const entries = COACH_KB2.slice();
    COACH_EXERCISES.forEach(x => entries.push(this._exEntry(x)));

    // Words the Coach knows: every word in every question, plus extras.
    const vocab = new Set();
    const addWords = (text) => N.norm(text).trim().split(' ').forEach(w => { if (w && !N.stop.has(w)) vocab.add(N.stem(w)); });
    entries.forEach(e => { addWords(e.q); (e.alt || []).forEach(addWords); (e.kw || []).forEach(addWords); });
    COACH_MUSCLES.forEach(m => m.al.forEach(addWords));
    COACH_EXERCISES.forEach(x => x.al.forEach(addWords));
    N.groups.forEach(g => g.forEach(w => vocab.add(N.stem(w))));
    ('gym lift lifting train training fitness exercise exercises muscle muscles workout workouts weights rep set sets routine split program plan diet calorie ' +
      'protein carb fat sleep rest recover sore pain stretch warmup cardio bulk cut strength hypertrophy dumbbell barbell machine cable bench squat deadlift').split(' ').forEach(w => vocab.add(N.stem(w)));
    vocab.delete('pre');
    this._vocab = vocab;

    // Weighted by rarity: rare words matter more than common ones.
    const df = {};
    this._byId = {};
    entries.forEach(e => {
      e._forms = [e.q, ...(e.alt || [])].map(f => ({ txt: N.norm(f).trim(), t: N.toks(f) }));
      e._kw = (e.kw || []).map(k => N.toks(k));
      const seen = new Set();
      e._forms.forEach(f => f.t.forEach(t => seen.add(t)));
      seen.forEach(t => { df[t] = (df[t] || 0) + 1; });
      e._tokset = seen;
      this._byId[e.id] = e;
    });
    this._df = df;
    this._nKB = entries.length;
    this._kb = entries;
    // "Related" ids that point nowhere are ignored, but flag them for developers.
    entries.forEach(e => (e.rel || []).forEach(id => { if (!this._byId[id]) console.warn('Coach: unknown related id', id, 'in', e.id); }));
  },

  _idf(t) { return Math.log(1 + this._nKB / (1 + (this._df[t] || 0))); },
  _unknownW() { return Math.log(1 + this._nKB); },

  // ---------------------------------------------------------------- Retrieval

  _retrieve(raw, ctx) {
    const N = CoachNLP;
    const unknown = [];
    const qt = N.toks(raw, this._vocab, t => unknown.push(t));
    const qnorm = N.norm(raw).trim();
    const wq = qt.reduce((a, t) => a + this._idf(t), 0) + unknown.length * this._unknownW();
    const results = [];
    if (!qt.length) return { list: results, qt, unknown, none: true };

    this._kb.forEach(e => {
      let best = 0;
      e._forms.forEach(f => {
        if (!f.t.length) return;
        let hit = 0, wf = 0;
        f.t.forEach(t => { const w = this._idf(t); wf += w; if (qt.includes(t)) hit += w; });
        if (!hit) return;
        const R = hit / wf, P = wq ? hit / wq : 0;
        let s = R * (0.55 + 0.45 * P);
        if (f.t.length <= 1 && P < 0.5) s *= 0.5;
        if (f.txt === qnorm) s += 0.25;
        else if (f.t.length >= 2 && (' ' + qnorm + ' ').includes(' ' + f.txt + ' ')) s += 0.12;
        if (s > best) best = s;
      });
      if (!best) return;
      e._kw.forEach(k => { if (k.length && k.every(t => qt.includes(t))) best += 0.06; });
      if (this._conv.last && this._conv.last.cat === e.cat) best += 0.03;
      results.push({ e, s: best });
    });
    results.sort((a, b) => b.s - a.s);
    return { list: results, qt, unknown };
  },

  // ---------------------------------------------------------------- What the person tells Coach

  _stamp() { return Date.now(); },
  _answerKnown(key) {
    const a = this._conv.answers[key];
    if (a && Date.now() - a.t < 30 * 60000) return a;
    return null;
  },

  _learn(ctx) {
    const q = ctx.pad, conv = this._conv, prof = conv.profile;
    let m;
    if ((m = q.match(/\b([1-7]) (days|times|x|sessions) (a|per|each|every) week\b/))) prof.days = +m[1];
    else if ((m = q.match(/\btrain (\d) days\b/)) || (m = q.match(/\b(\d) day (split|program|routine)\b/))) prof.days = +m[1];
    if (/\b(i am|im|i m) (currently )?(a )?(beginner|newbie|new to lifting|new to the gym)\b/.test(q)) prof.level = 'beginner';
    if (/\b(i am|im) (an )?(intermediate|advanced)\b/.test(q)) prof.level = q.includes('advanced') ? 'advanced' : 'intermediate';
    if (/\b(i am|im|i m|currently|now) (am )?(bulking|in a bulk|on a bulk)\b/.test(q)) prof.stage = 'bulking';
    if (/\b(i am|im|i m|currently|now) (am )?(cutting|in a cut|on a cut|in a deficit)\b/.test(q)) prof.stage = 'cutting';
    if (/\b(i am|im|i m|currently|now) (am )?(maintaining|on maintenance|at maintenance)\b/.test(q)) prof.stage = 'maintaining';
    if ((m = q.match(/\b(\d{2}) (min|mins|minutes)\b/)) && /\b(only|have|got|just)\b/.test(q)) prof.minutes = +m[1];

    // The exercise or muscle being talked about.
    const ex = this._findExRec(q);
    if (ex) {
      conv.exRec = ex.rec.id;
      conv.muscle = ex.rec.grp === 'arms' ? 'arms' : ex.rec.grp;
    }
    const lib = ctx.ex;
    if (lib) conv.ex = lib.id;
    const mu = this._findMuscle(q, !!ex);
    if (mu) conv.muscle = mu.alias;
    if (/\b(dumbbell|dumbbells)\b/.test(q)) conv.equip = 'dumbbell';
    else if (/\b(barbell)\b/.test(q)) conv.equip = 'barbell';
    else if (/\b(machine|machines|cable|cables)\b/.test(q)) conv.equip = 'machine';
  },

  _findExRec(pad) {
    if (!this._exAliases) {
      this._exAliases = [];
      COACH_EXERCISES.forEach(x => x.al.forEach(a => this._exAliases.push([CoachNLP.norm(a).trim(), x])));
      this._exAliases.sort((a, b) => b[0].length - a[0].length);
    }
    pad = CoachNLP.norm(pad);
    for (const [alias, rec] of this._exAliases) {
      if (pad.includes(' ' + alias + ' ')) return { rec, alias };
    }
    return null;
  },

  _findMuscle(pad, hasEx) {
    if (!this._muAliases) {
      this._muAliases = [];
      COACH_MUSCLES.forEach(m => m.al.forEach(a => this._muAliases.push([CoachNLP.norm(a).trim(), m])));
      this._muAliases.sort((a, b) => b[0].length - a[0].length);
    }
    pad = CoachNLP.norm(pad);
    for (const [alias, m] of this._muAliases) {
      if (alias === 'back' && /\bback (squat|pain|hurt)/.test(pad)) continue;
      if (pad.includes(' ' + alias + ' ')) return { m, alias };
    }
    return null;
  },

  // ---------------------------------------------------------------- Building replies

  _fillAsk(e, reply, ctx) {
    const conv = this._conv;
    if (!e.ask) return;
    const key = e.ask.key + (e.ask.perMuscle ? ':' + (conv.muscle || '') : '');
    const known = this._answerKnown(key) || (conv.profile[e.ask.key] !== undefined && !e.ask.perMuscle ? { v: conv.profile[e.ask.key] } : null);
    if (known && !e.ask.opts.some(o => o.num)) {
      const opt = e.ask.opts.find(o => o.v === known.v);
      if (e.ask.text === null && reply.p.length) reply.p.pop(); // the question was the last paragraph
      if (opt) {
        const extra = typeof opt.a === 'function' ? opt.a(null, ctx) : opt.a;
        reply.p.push(...extra);
      }
      return;
    }
    if (e.ask.text) reply.p.push(e.ask.text);
    conv.pending = { id: e.id, key, turn: conv.turn };
    reply.f = e.ask.opts.map(o => o.l);
    reply.askChips = true;
  },

  _entryReply(e, ctx) {
    const conv = this._conv;
    let a = typeof e.a === 'function' ? e.a(ctx) : e.a;
    const reply = { p: a.slice(), act: e.act || null, f: [] };
    conv.pending = null;
    this._fillAsk(e, reply, ctx);
    if (!reply.askChips) {
      const chips = [];
      (e.f || []).forEach(t => chips.push(t));
      (e.rel || []).forEach(id => { const r = this._byId[id]; if (r) chips.push(r.q); });
      reply.f = chips.filter((c, i) => chips.indexOf(c) === i).slice(0, 4);
    } else if (e.rel) {
      reply.rel = e.rel.map(id => this._byId[id] && this._byId[id].q).filter(Boolean).slice(0, 2);
    }
    conv.last = { id: e.id, cat: e.cat, simple: e.simple || null, plan: e.plan || null, more: e.more || null, why: e.why || null, example: e.example || null, first: reply.p[0] || '', rel: (e.rel || []).slice(0, 3) };
    return reply;
  },

  _cardReply(m) {
    const bits = [
      `**${m.name}.** ${m.fn}`,
      '**Main exercises**\n' + this._list(m.comp.length ? m.comp : ['(isolation work is the main option)']),
      '**Isolation exercises**\n' + this._list(m.iso),
      `**For beginners:** ${m.beg}`
    ];
    if (!m.comp.length) bits.splice(1, 1);
    const f = [`What exercises target the ${m.name.toLowerCase()}?`];
    const first = COACH_EXERCISES.find(x => x.id === m.first);
    if (first) f.unshift(`How do I do the ${first.name.toLowerCase()}?`);
    this._conv.last = { id: 'muscle-' + m.id, cat: 'muscles', simple: [`**${m.name}.** ${m.fn}`, `For beginners: ${m.beg}`], plan: [`Start with this: ${m.beg}`], first: bits[0], rel: [] };
    return { p: bits, f: f.slice(0, 3).concat(['Which muscles am I neglecting?']).slice(0, 4) };
  },

  _facetReply(rec, facet, ctx) {
    const conv = this._conv;
    conv.facet = facet;
    const name = rec.name;
    let p;
    if (facet === 'muscles') {
      p = [
        `**${name}: muscles worked**`,
        `**Main muscles:** ${rec.pri.join(', ')}.\n**Helping muscles:** ${rec.sec.length ? rec.sec.join(', ') : 'very little else'}.\n**Equipment:** ${rec.eq}.`
      ];
    } else if (facet === 'mistakes') {
      p = [`**Common ${name.toLowerCase()} mistakes**`, this._list(rec.mist), `**Stay safe:** ${rec.safe}`];
    } else if (facet === 'breathing') {
      p = [`**Breathing on the ${name.toLowerCase()}**`, rec.br, 'Never hold your breath for long, and skip breath-holding if you have high blood pressure or feel dizzy.'];
    } else if (facet === 'tips') {
      p = [`**${name}: tips for beginners**`, this._list(rec.tips), `**Stay safe:** ${rec.safe}`];
    } else {
      p = this._exForm(rec);
    }
    const f = [];
    if (facet !== 'form') f.push(`How do I do the ${name.toLowerCase()}?`);
    if (facet !== 'muscles') f.push(`What muscles does the ${name.toLowerCase()} work?`);
    if (facet !== 'mistakes') f.push(`Common ${name.toLowerCase()} mistakes`);
    if (facet !== 'tips') f.push(`${name} tips for beginners`);
    const simple = facet === 'form' ? this._exSimple(rec) : [p[0], String(p[1] || '').split('\n').slice(0, 3).join('\n')];
    conv.last = { id: 'ex-' + rec.id, cat: 'exercise', simple, plan: null, first: p[0], rel: [] };
    return { p, f: f.slice(0, 4) };
  },

  _exBare(rec) {
    this._conv.last = { id: 'ex-' + rec.id, cat: 'exercise', simple: this._exSimple(rec), first: rec.name, rel: [] };
    return {
      p: [`**${rec.name}.** Mainly works your ${rec.pri.join(', ').toLowerCase()}. Equipment: ${rec.eq}.`, 'What would you like to know about it?'],
      f: [`How do I do the ${rec.name.toLowerCase()}?`, `Common ${rec.name.toLowerCase()} mistakes`, `What muscles does the ${rec.name.toLowerCase()} work?`, `${rec.name} tips for beginners`]
    };
  },

  _equipForMuscle(muscleAlias, equip) {
    const mu = this._findMuscle(' ' + CoachNLP.norm(muscleAlias).trim() + ' ');
    if (!mu) return null;
    const grp = mu.m.id;
    const list = COACH_EXERCISES.filter(x => x.grp === grp && ((x.v && x.v[equip]) || new RegExp(equip, 'i').test(x.eq)));
    if (!list.length) return null;
    const label = { dumbbell: 'dumbbells', barbell: 'a barbell', machine: 'machines and cables', cable: 'cables', bodyweight: 'bodyweight' }[equip] || equip;
    const lines = list.map(x => `${x.name}${x.v && x.v[equip] ? ': ' + x.v[equip].split('. ')[0].replace(/\.$/, '') : ''}`);
    return {
      p: [`With ${label}, good options for your ${mu.alias} are:`, this._list(lines), 'Pick 2 of them, do 3 sets each, and add a rep or a little weight over time.'],
      f: list.slice(0, 2).map(x => `How do I do the ${x.name.toLowerCase()}?`)
    };
  },

  // ---------------------------------------------------------------- Pending questions

  _tryPending(ctx) {
    const conv = this._conv, p = conv.pending;
    if (!p) return null;
    if (conv.turn - p.turn > 6) { conv.pending = null; return null; }
    const e = this._byId[p.id];
    if (!e || !e.ask) { conv.pending = null; return null; }
    const q = ctx.pad.trim();
    const words = q.split(' ').filter(Boolean).length;
    const isQuestion = /^(how|what|why|when|where|which|who|can|could|should|is|are|does|do|will|whats|hows)\b/.test(q) && words > 2;
    const label = e.ask.opts.find(o => CoachNLP.norm(o.l).trim() === q);
    let opt = label || null, m = null;
    if (!opt && !isQuestion && words <= 8) {
      opt = e.ask.opts.find(o => o.re && (m = q.match(o.re)));
    }
    if (!opt) return null;
    if (!m && opt.re) m = q.match(opt.re);
    conv.pending = null;
    conv.answers[p.key] = { v: opt.v, t: Date.now() };
    if (['stage', 'days', 'equip', 'level'].includes(e.ask.key) && opt.v !== 'ask') conv.profile[e.ask.key] = opt.v;
    if (opt.v === 'sharp' || e.ask.key === 'soreType' && opt.v === 'sharp') conv.safety = 'sharp';
    const body = typeof opt.a === 'function' ? opt.a(m, ctx) : opt.a;
    const reply = { p: body.slice(), f: [] };
    const chips = (e.rel || []).map(id => this._byId[id] && this._byId[id].q).filter(Boolean);
    reply.f = chips.slice(0, 3);
    if (opt.v === 'sharp') return Object.assign(reply, { safety: 'sharp' });
    conv.last = Object.assign({}, conv.last || {}, { id: e.id, cat: e.cat, plan: e.plan || null, first: reply.p[0] });
    return reply;
  },

  // ---------------------------------------------------------------- Follow-ups ("explain simply", "what about...")

  _firstSentences(text, n) {
    const flat = String(text).replace(/\n.*/s, '');
    const parts = flat.match(/[^.!?]+[.!?]+(\s|$)/g) || [flat];
    return parts.slice(0, n).join('').trim();
  },

  _meta(ctx) {
    const q = ctx.pad.trim(), conv = this._conv, last = conv.last;
    const has = (re) => re.test(q);

    if (has(/\b(simpler|simply|simple terms|plain english|eli5|like im five|dumb it down|easier to understand|dont understand|do not understand|(im|i am|this is|that is|thats|its|so|im so) confus\w*|too technical|too complicated|break it down|shorter version|short version|tldr|in short|put it simply)\b/)) {
      if (!last) return { p: ['Ask me a lifting question first and I will explain it in plain words. For example: "What is progressive overload?"'], f: this._suggestions(3) };
      if (last.simple) return { p: last.simple.slice(), f: last.rel.map(id => this._byId[id] && this._byId[id].q).filter(Boolean).slice(0, 3), keepLast: true };
      const first = this._firstSentences(last.first, 2);
      return { p: ['In plain words:', first, 'Say "tell me more" if you want the longer version.'], f: [], keepLast: true };
    }

    if (has(/\b(tell me more|more detail|more details|go deeper|elaborate|more info|in depth|expand on|and then|what else|anything else)\b/) && last) {
      if (last.more) return { p: last.more.slice(), keepLast: true };
      const rel = (last.rel || []).map(id => this._byId[id]).filter(Boolean);
      if (rel.length) return { p: ['Here is what else I can explain on this:'], f: rel.map(r => r.q).slice(0, 4), keepLast: true };
      return { p: ['That is the main idea. Ask me about a specific part and I will go into it.'], f: this._suggestions(3), keepLast: true };
    }

    if (/^(so )?(what (should|can|do|would) i do( then| now| about it| about this)?|what now|now what|so what( now)?|any advice|what do you suggest|what do you recommend|give me advice|help me|how do i fix (it|this|that)|what is the fix|so what do i do)$/.test(q)) {
      if (last && last.plan) return { p: last.plan.slice(), f: (last.rel || []).map(id => this._byId[id] && this._byId[id].q).filter(Boolean).slice(0, 3), keepLast: true };
      const pend = conv.pending && this._byId[conv.pending.id];
      if (pend && pend.ask) {
        const text = pend.ask.text || 'Tell me a bit more so I can be specific.';
        return { p: ['Let us narrow it down first.', text], f: pend.ask.opts.map(o => o.l), keepLast: true };
      }
      return { p: ['What would you like help with? You can ask about an exercise, your routine, food, recovery or a problem you are having.'], f: this._suggestions(4) };
    }

    if (/^(why|why is that|why is that so|how come|but why|why though)$/.test(q) && last) {
      if (last.why) return { p: last.why.slice(), keepLast: true };
      if (last.more) return { p: last.more.slice(), keepLast: true };
    }

    if (/^(give me an example|for example|example|can you give an example|show me an example|an example)$/.test(q) && last && last.example) {
      return { p: last.example.slice(), keepLast: true };
    }

    // "Common mistakes?" / "tips" / "what muscles?" about the exercise we were just discussing.
    if (conv.exRec && last && /^ex-/.test(last.id || '')) {
      const rec = COACH_EXERCISES.find(x => x.id === conv.exRec);
      let facet = null;
      if (/^(what are )?(the )?(common )?(mistakes|errors)( to avoid)?$|^what (do|should) i avoid$/.test(q)) facet = 'mistakes';
      else if (/^(any )?(beginner )?(tips|advice|cues)( for beginners)?$/.test(q)) facet = 'tips';
      else if (/^(how (do|should) i )?breath(e|ing)( on (it|this))?$/.test(q)) facet = 'breathing';
      else if (/^(what )?(muscles|muscle)( (does|do) (it|this) (work|target|hit))?( worked)?$|^what (does|do) (it|this) (work|target|hit)$/.test(q)) facet = 'muscles';
      else if (/^(show me )?(the )?(full )?(form|steps|how)$/.test(q)) facet = 'form';
      if (rec && facet) return this._facetReply(rec, facet, ctx);
    }

    // "What about dumbbells?" / "and for squats?" / "how about legs?"
    const lead = q.match(/^(and )?(what|how) about (using )?(.+)$/) || q.match(/^and (for |with )?(.+)$/) || q.match(/^(what if i (use|used|am using|have|only have)) (.+)$/);
    if (lead) {
      const rest = ' ' + (lead[4] || lead[2] || lead[3] || '') + ' ';
      const eq = (rest.match(/\b(dumbbell|dumbbells|barbell|machine|machines|cable|cables|bodyweight|bands?)\b/) || [])[1];
      const exF = this._findExRec(rest);
      const mu = this._findMuscle(rest, !!exF);
      const rec = exF ? exF.rec : (conv.exRec ? COACH_EXERCISES.find(x => x.id === conv.exRec) : null);
      if (eq) {
        const key = /dumbbell/.test(eq) ? 'dumbbell' : /barbell/.test(eq) ? 'barbell' : /machine|cable/.test(eq) ? 'machine' : /band/.test(eq) ? 'band' : 'bodyweight';
        conv.equip = key;
        if (rec) {
          const t = rec.v && rec.v[key];
          if (t) return { p: [`**${rec.name} with ${/^dumbbell$/.test(eq) ? 'dumbbells' : eq}:** ${t}`], f: [`How do I do the ${rec.name.toLowerCase()}?`, `Common ${rec.name.toLowerCase()} mistakes`] };
        }
        if (conv.muscle) { const r = this._equipForMuscle(conv.muscle, key); if (r) return r; }
        if (rec) return { p: [`For the ${rec.name.toLowerCase()}, the movement is the same with ${eq}. Keep the weight lighter at first and control the lowering phase.`], f: [`How do I do the ${rec.name.toLowerCase()}?`] };
      }
      if (exF) { return this._facetReply(exF.rec, conv.facet || 'form', ctx); }
      if (mu) { conv.muscle = mu.alias; return this._cardReply(mu.m); }
    }
    return null;
  },

  // ---------------------------------------------------------------- Linking to the workout log

  // Plain recorded facts about one lift, kept separate from general advice.
  _recorded(exOrId) {
    try {
      const id = typeof exOrId === 'string' ? exOrId : exOrId && exOrId.id;
      if (!id) return [];
      const ex = Store.getExerciseById(id);
      const sess = this._sessionsFor(id);
      if (!ex || !sess.length) return [];
      const txt = (s) => this._setText(this._topSet(s.sets));
      const out = ['**From your log** (these numbers are what you recorded, not general advice):'];
      out.push(`Latest ${ex.name}: ${txt(sess[0])} (${this._ago(sess[0].h.date)}).`);
      if (sess[1]) out.push(`Before that: ${txt(sess[1])}.`);
      return out;
    } catch (e) { return []; }
  },

  _latestLibEx() {
    const h = Store.getHistory()[0];
    if (!h) return null;
    for (const e of (h.exercises || [])) {
      if (e.exerciseId && (e.sets || []).some(s => this._done(s))) { const x = Store.getExerciseById(e.exerciseId); if (x) return x; }
    }
    return null;
  },

  // "Should I increase my weight?" with real numbers, clearly labelled.
  _decorateNext(reply, ctx, usedLatest) {
    if (!reply || !reply.p || !/^Last time on/.test(reply.p[0] || '')) return reply;
    try {
      const sess = this._sessionsFor(ctx.ex.id);
      const out = ['**From your log**', reply.p[0]];
      if (sess[1]) out.push(`The session before that: ${this._setText(this._topSet(sess[1].sets))}.`);
      const rest = reply.p.slice(1);
      out.push('**What I suggest**', ...rest);
      out.push('**General advice:** add weight only when you can finish every set with good form and still have a rep or two in reserve. A small step is plenty.');
      if (usedLatest) out.push(`I used **${ctx.ex.name}**, your most recent lift. Name another lift if you meant a different one.`);
      reply.p = out;
    } catch (e) { /* keep the original reply */ }
    return reply;
  },

  // ---------------------------------------------------------------- Main entry point

  _lastTurnUnknown: false,

  _topicChips(n) {
    const pool = ['How do I bench press?', 'How many reps should I do?', 'What is progressive overload?', 'How much protein do I need?', 'Why am I sore after working out?', 'Can you give me a workout routine?', 'How do I grow my arms?', 'What should I eat before working out?'];
    return pool.sort(() => Math.random() - 0.5).slice(0, n);
  },

  _answer(raw) {
    if (!this._conv) this._conv = this._newConv();
    if (!this._idx) this._buildIndex();
    if (!this._kb) this._buildKB();

    let text = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim().slice(0, 300);
    const conv = this._conv;
    if (!text) return { p: ['I did not catch a question. Try one like "How do I squat?" or "How much protein do I need?"'], f: this._topicChips(3) };

    const ctx = this._context(text);
    const q = ctx.pad.trim();
    conv.turn++;
    this._learn(ctx);

    // Greetings and thanks.
    if (/^(hi|hello|hey|yo|sup|hola|howdy)( coach| there)?$/.test(q) || /^good (morning|afternoon|evening)( coach)?$/.test(q)) return this._greetReply();
    if (/^(thanks|thank you|ty|thx|cool|nice|great|awesome|ok|okay|got it|perfect|alright)( coach| so much| a lot)?$/.test(q)) {
      return { p: ['Anytime. Ask me whatever you want about your training.'], f: this._suggestions(3) };
    }
    if (/^(help|what can you do|what do you know|what can i ask|menu|topics|what can you help with)$/.test(q)) {
      return {
        p: ['I am your offline gym coach. I can help with:', this._list(['Exercise form and technique', 'Sets, reps and progressive overload', 'Muscles and how to grow them', 'Nutrition basics', 'Recovery and soreness', 'Real gym problems', 'Gym words explained', 'Your own training numbers']), 'Tap a category below, or just ask.'],
        f: this._topicChips(4)
      };
    }

    // Safety always comes first.
    const safe = this._safety(ctx);
    if (safe) { conv.safety = safe.safety || 'part'; conv.pending = null; return safe; }
    conv.safety = null;

    // An answer to a question Coach just asked.
    const pend = this._tryPending(ctx);
    if (pend) { if (pend.safety) conv.safety = pend.safety; return pend; }

    // "Explain simpler", "what about dumbbells", "what should I do".
    const meta = this._meta(ctx);
    if (meta) return meta;

    // A muscle name on its own ("chest", "legs", "abs").
    {
      const stripped = ctx.pad.trim().split(' ').filter(w => !CoachNLP.stop.has(w)).join(' ');
      const bare = this._findMuscle(ctx.pad);
      if (bare && stripped === CoachNLP.norm(bare.alias).trim()) { conv.muscle = bare.alias; return this._cardReply(bare.m); }
    }

    // "Should I increase my weight?" is about the person's own lifts.
    if (/\b(should i|can i|am i ready to|is it time to|time to) (increase|add|raise|go up|go heavier|lift heavier|up)\b/.test(q) && /\b(weight|load|heavier|bar)\b/.test(q) && !/\b(or|reps|repetitions)\b/.test(q) && Store.getHistory().length) {
      const intent = this._idx.find(i => i.id === 'next');
      if (intent) return this._runData(intent, ctx, q);
    }

    // Search the knowledge base.
    const res = this._retrieve(text, ctx);
    const top = res.list[0], second = res.list[1];
    const topS = top ? top.s : 0;

    const exF = this._findExRec(ctx.pad);
    // "Exercises for chest", "best workout for legs": a muscle group card.
    if (!exF && topS < 1.0) {
      const mu0 = this._findMuscle(ctx.pad);
      if (mu0 && /\b(exercises?|workouts?|routine|train|training|build|best)\b/.test(ctx.pad)) { conv.muscle = mu0.alias; return this._cardReply(mu0.m); }
    }

    // Questions about one exercise: muscles, mistakes, breathing, tips, versions.
    if (exF && topS < 0.9) {
      const q2 = ctx.pad;
      let facet = null;
      if (/\b(mistake|mistakes|wrong|avoid|bad form|errors?|common problems)\b/.test(q2)) facet = 'mistakes';
      else if (/\b(breath\w*|inhale|exhale)\b/.test(q2)) facet = 'breathing';
      else if (/\b(tips?|advice|cues?)\b/.test(q2)) facet = 'tips';
      else if (/\b(muscle|muscles|target|targets|targeted|work|works|worked|hit|hits|primary|secondary|involved|activate|activates)\b/.test(q2) && /\b(what|which|does|do|muscles?)\b/.test(q2)) facet = 'muscles';
      if (facet) { conv.exRec = exF.rec.id; return this._facetReply(exF.rec, facet, ctx); }
      const eq = (q2.match(/\b(dumbbell|dumbbells|machine|cable|barbell|bodyweight)\b/) || [])[1];
      if (eq) {
        const key = /dumbbell/.test(eq) ? 'dumbbell' : eq;
        if (exF.rec.v && exF.rec.v[key]) return { p: [`**${exF.rec.name} with ${/^dumbbell$/.test(eq) ? 'dumbbells' : eq}:** ${exF.rec.v[key]}`], f: [`How do I do the ${exF.rec.name.toLowerCase()}?`, `Common ${exF.rec.name.toLowerCase()} mistakes`] };
      }
      const bare = ctx.pad.trim().split(' ').filter(w => !CoachNLP.stop.has(w)).join(' ') === exF.alias;
      if (bare && !(ctx.ex && this._sessionsFor(ctx.ex.id).length)) return this._exBare(exF.rec);
    }

    // Your own training data (today, this week, best lifts, next weight...).
    let old = null, oldScore = 0;
    this._idx.forEach(e => { const s = this._score(e, ctx); if (s > oldScore) { old = e; oldScore = s; } });
    if (!old && this._last.id) {
      const prev = this._idx.find(e => e.id === this._last.id && e._data);
      if (prev && ((ctx.ex && prev.ex) || (ctx.range && prev.range))) { old = prev; oldScore = 1; }
    }
    const dataWins = old && old._data && oldScore >= 3 && (topS < 0.8 || (old.personal && topS < 1.2 && ((/\b(my|mine)\b/.test(q) && oldScore >= 3) || (oldScore >= 5 && /\b(me|am i|do i need|should i)\b/.test(q)))));
    if (dataWins) return this._runData(old, ctx, q);

    // Strong match in the knowledge base.
    const oldVal = old && !old._data ? oldScore / 6 : 0;
    if (topS >= 0.5 && topS >= oldVal) {
      // "Should I increase my weight?" is answered from your log when there is one.
      if (top.e.dataIntent && top.e.dataWhen && top.e.dataWhen.test(q) && Store.getHistory().length) {
        const intent = this._idx.find(i => i.id === top.e.dataIntent);
        if (intent) return this._runData(intent, ctx, q);
      }
      const reply = this._entryReply(top.e, ctx);
      return reply;
    }
    if (old && !old._data && oldScore >= 2) {
      conv.last = null;
      const a = typeof old.a === 'function' ? old.a(ctx) : old.a;
      return { p: a, act: old.act || null, f: old.f || this._suggestions(3) };
    }
    if (old && old._data && oldScore > 0) return this._runData(old, ctx, q);

    // Just a muscle or an exercise name.
    const mu = this._findMuscle(ctx.pad, !!exF);
    if (mu && /\b(train|training|exercise|exercises|workout|build|grow|best|routine|target|work|hit|beginner|function|do)\b|^ ?[a-z ]+ $/.test(ctx.pad) && (!exF)) {
      const bareMu = ctx.pad.trim() === mu.alias || /\b(train|exercise|exercises|workout|build|grow|best|routine|target|hit|beginner|function)\b/.test(ctx.pad);
      if (bareMu) { conv.muscle = mu.alias; return this._cardReply(mu.m); }
    }
    if (exF) return this._exBare(exF.rec);
    if (ctx.ex) return this._exSummary(ctx);

    // Not sure, or not about training.
    this._recordMiss(text);
    const fitness = res.qt.some(t => this._vocab.has(t));
    if (topS >= 0.3 && fitness) {
      const picks = res.list.slice(0, 3).filter(r => r.s >= 0.25).map(r => r.e.q);
      return { p: ['I am not sure I understood that. Did you mean one of these?'], f: picks.length ? picks : this._topicChips(3), unsure: true };
    }
    if (!res.qt.length || !fitness) {
      if (!res.qt.length) return { p: ['I could not tell what you are asking. Try a short question like "How do I squat?" or pick a topic below.'], f: this._topicChips(4) };
      return { p: ['That one is outside what I know. I stick to lifting, training, nutrition for training, recovery, and your numbers in Arsa, so I do not want to guess. Try one of these:'], f: this._topicChips(4) };
    }
    return { p: ["I don't have a good answer to that yet, and I would rather say so than guess. I know lifting basics, technique, nutrition and recovery, how to use Arsa, and your own training numbers. Try one of these:"], f: this._topicChips(4) };
  },

  _runData(old, ctx, q) {
    const conv = this._conv;
    this._last = { id: old.id, ex: ctx.ex || this._last.ex, range: ctx.range || this._last.range };
    let usedLatest = false;
    if (old.id === 'next' && !ctx.ex) {
      const known = conv.ex ? Store.getExerciseById(conv.ex) : null;
      const lib = known || this._latestLibEx();
      if (lib) { ctx.ex = lib; usedLatest = !known; }
    }
    if (!ctx.ex && this._last.ex && old.ex && /^(and|what about|how about)/.test(q)) ctx.ex = this._last.ex;
    if (ctx.ex) conv.ex = ctx.ex.id;
    conv.last = { id: 'data-' + old.id, cat: 'data', first: '', rel: [] };
    let reply = old.run(ctx);
    if (old.id === 'next' && ctx.ex) reply = this._decorateNext(reply, ctx, usedLatest);
    return reply;
  }
});
