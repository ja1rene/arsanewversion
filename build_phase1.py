#!/usr/bin/env python3
"""Arsa phase 1: builds complete updated files from your current project.

Usage (from your project root, the folder containing index.html):
    python3 build_phase1.py            # writes full files into ./arsa-phase1-out/
    python3 build_phase1.py --inplace  # also overwrites your files (saves .bak copies)

Nothing is written unless EVERY edit matches exactly. If something doesn't,
it tells you which one, so you never end up with a half-patched project.
"""
import os, re, shutil, sys

OUT = 'arsa-phase1-out'
errors = []

def read(p):
    if not os.path.exists(p):
        errors.append(f'missing file: {p}'); return ''
    return open(p, encoding='utf-8').read()

def sub(label, text, old, new):
    if text.count(old) != 1:
        errors.append(f'{label}: expected 1 match, found {text.count(old)}'); return text
    return text.replace(old, new)

def rx(label, text, pattern, new):
    out, n = re.subn(pattern, lambda m: new, text, count=1, flags=re.S)
    if n != 1: errors.append(f'{label}: pattern not found')
    return out

files = {}

# ---------------- js/data.js ----------------
t = read('js/data.js')
t = sub('data: calendar', t,
  "this.data.calendar[dateKey] = { completed: true, historyId: h.id };",
  """const prevCal = this.data.calendar[dateKey];
    this.data.calendar[dateKey] = {
      completed: true,
      historyId: h.id,
      historyIds: [...(prevCal ? (prevCal.historyIds || [prevCal.historyId]) : []), h.id]
    };""")
t = sub('data: convertUnits', t, "// ---- Backup / Restore ----", r"""// ---- Unit conversion ----
  // Converts every saved weight when the unit setting changes, instead of
  // just relabeling it. Rounds to 0.5 lbs / 0.25 kg.
  convertUnits(to) {
    const d = this.data;
    if (d.settings.units === to) return;
    const f = to === 'lbs' ? 2.20462 : 1 / 2.20462;
    const step = to === 'lbs' ? 0.5 : 0.25;
    const conv = v => {
      const n = Number(v);
      if (!isFinite(n) || n === 0) return v;
      return Math.round((n * f) / step) * step;
    };
    d.exerciseHistory.forEach(h => {
      let vol = 0;
      (h.exercises || []).forEach(ex => (ex.sets || []).forEach(s => {
        s.weight = conv(s.weight);
        vol += (Number(s.weight) || 0) * (Number(s.reps) || 0);
      }));
      h.totalVolume = vol;
    });
    Object.values(d.personalRecords).forEach(p => {
      p.maxWeight = conv(p.maxWeight);
      p.maxRepsWeight = conv(p.maxRepsWeight);
      p.maxVolume = Math.round(p.maxVolume * f);
    });
    d.weightLogs.forEach(w => { w.weight = conv(w.weight); });
    if (d.activeSession && d.activeSession.logs) {
      Object.values(d.activeSession.logs).forEach(arr => arr.forEach(s => {
        if (s.weight !== '' && s.weight != null) s.weight = conv(s.weight);
      }));
    }
    d.settings.plateBarWeight = to === 'lbs' ? 45 : 20;
    d.settings.units = to;
    this.save();
  },

  // ---- Backup / Restore ----""")
t = sub('data: Fmt.weight', t, "weight(val, units) {",
  "weight(val, units) {\n    if (Number(val) === 0) return 'Bodyweight';")
t = rx('data: achievements', t,
  r"\{ id: 'first_100kg'.*?\n  \}\},\n  \{ id: 'volume_500k'[^\n]*",
  """{
    id: 'first_100kg', icon: '🏋️',
    name: () => Store.data.settings.units === 'lbs' ? 'First 225lb Lift' : 'First 100kg Lift',
    desc: () => Store.data.settings.units === 'lbs' ? 'Lift 225lb in a single set' : 'Lift 100kg in a single set',
    check: () => Store.getAllPRs().some(p => p.maxWeight >= (Store.data.settings.units === 'lbs' ? 225 : 100))
  },
  {
    id: 'volume_500k', icon: '🏆',
    name: () => Store.data.settings.units === 'lbs' ? '1,100,000lb Club' : '500,000kg Club',
    desc: () => Store.data.settings.units === 'lbs' ? 'Lift 1,100,000lb total volume' : 'Lift 500,000kg total volume',
    check: stats => stats.totalVolume >= (Store.data.settings.units === 'lbs' ? 1100000 : 500000)
  }""")
files['js/data.js'] = t

# ---------------- js/workouts.js ----------------
t = read('js/workouts.js')
arrow = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="%s"/></svg>'
t = sub('workouts: move buttons', t, '<div class="exercise-builder-actions">',
  '<div class="exercise-builder-actions">\n'
  '          <button class="btn btn-icon btn-ghost btn-sm" data-move="up" data-idx-move="${idx}" aria-label="Move up" ${idx === 0 ? \'disabled style="opacity:.3"\' : \'\'}>' + arrow % 'M6 15l6-6 6 6' + '</button>\n'
  '          <button class="btn btn-icon btn-ghost btn-sm" data-move="down" data-idx-move="${idx}" aria-label="Move down" ${idx === this._draft.exercises.length - 1 ? \'disabled style="opacity:.3"\' : \'\'}>' + arrow % 'M6 9l6 6 6-6' + '</button>')
t = sub('workouts: move handler', t, 'this._bindDragReorder();',
  """document.querySelectorAll('[data-move]').forEach(el => {
      el.addEventListener('click', () => {
        const i = Number(el.dataset.idxMove);
        const to = i + (el.dataset.move === 'up' ? -1 : 1);
        if (to < 0 || to >= d.exercises.length) return;
        [d.exercises[i], d.exercises[to]] = [d.exercises[to], d.exercises[i]];
        this._renderBuilder();
      });
    });

    this._bindDragReorder();""")
files['js/workouts.js'] = t

# ---------------- js/settings.js ----------------
t = read('js/settings.js')
t = sub('settings: convert', t, 'Store.data.settings.units = el.dataset.unitOpt;',
  'Store.convertUnits(el.dataset.unitOpt);')
t = sub('settings: toast', t, 'showToast(`Units set to ${el.dataset.unitOpt}`);',
  'showToast(`Units set to ${el.dataset.unitOpt}, saved weights converted`);')
t = sub('settings: note', t, '<div class="modal-title">Weight Units</div>',
  '<div class="modal-title">Weight Units</div>\n'
  '      <p style="padding:0 20px 12px;color:var(--text-3);font-size:12px;line-height:1.5;">Switching converts every saved weight (history, records, body weight, plate bar). Values round to the nearest 0.5 lbs or 0.25 kg, so switching back and forth can drift slightly.</p>')
files['js/settings.js'] = t

# ---------------- js/dashboard.js ----------------
t = read('js/dashboard.js')
t = sub('dashboard: label', t, '<div class="section-label mt-8">This Month</div>\n      <div class="stats-grid">',
  '<div class="section-label mt-8">Overview</div>\n      <div class="stats-grid">')
t = rx('dashboard: recent PRs', t,
  r"  _renderRecentPRs\(\) \{.*?\n  \},\n\n  _renderMiniCalendar",
  """  _renderRecentPRs() {
    const WEEK = 7 * 86400000;
    const prs = Store.getAllPRs().map(p => {
      const bw = !(p.maxWeight > 0);
      return { ...p, bw, when: new Date(bw ? p.maxRepsDate : p.maxWeightDate) };
    }).sort((a, b) => b.when - a.when).slice(0, 3);

    if (prs.length === 0) {
      return `<div class="px-20"><div class="card" style="text-align:center; color: var(--text-3); font-size: 14px;">No records yet. Complete a workout to set your first PR.</div></div>`;
    }

    return `
      <div class="pr-list">
        ${prs.map(pr => `
          <div class="pr-item">
            <div>
              <div class="pr-exercise">${esc(pr.name)}</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:2px;">${Fmt.date(pr.when)}</div>
            </div>
            <div style="text-align:right;">
              <div class="pr-value">${pr.bw ? `${pr.maxReps} reps` : `${Fmt.weight(pr.maxWeight)} × ${pr.maxWeightReps}`}</div>
              ${Date.now() - pr.when < WEEK ? '<span class="pr-new-badge" style="margin-top:4px;">New</span>' : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  _renderMiniCalendar""")
files['js/dashboard.js'] = t

# ---------------- js/session.js ----------------
t = read('js/session.js')
t = sub('session: bodyweight PRs', t, 'if (ex.exerciseId && s.weight > 0) {', 'if (ex.exerciseId && s.reps > 0) {')
files['js/session.js'] = t

# ---------------- js/app.js ----------------
t = read('js/app.js')
t = sub('app: persist', t, 'Reminders.checkAndMaybeNotify();',
  """Reminders.checkAndMaybeNotify();

    // Ask the browser not to evict saved workouts under storage pressure.
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }""")
files['js/app.js'] = t

# ---------------- index.html ----------------
t = read('index.html')
t = re.sub(r'[ \t]*<link rel="preconnect" href="https://fonts\.googleapis\.com" />\n', '', t)
t = re.sub(r'[ \t]*<link href="https://fonts\.googleapis\.com/css2[^\n]*\n', '', t)
t = re.sub(r'[ \t]*<script src="js/phase1-fixes\.js"></script>\n', '', t)
if 'css/tokens.css' not in t:
    t = sub('index: tokens link', t, '<link rel="stylesheet" href="css/main.css" />',
      '<link rel="stylesheet" href="css/main.css" />\n  <link rel="stylesheet" href="css/tokens.css" />')
files['index.html'] = t

# ---------------- service-worker.js ----------------
t = read('service-worker.js')
t = re.sub(r"[ \t]*'\./js/phase1-fixes\.js',\n", '', t)
t = re.sub(r"const CACHE_NAME = 'arsa-cache-v\d+';", "const CACHE_NAME = 'arsa-cache-v3';", t)
if './css/tokens.css' not in t:
    fonts = ['archivo-latin-%d-normal' % w for w in (400, 500, 600, 700)] + \
            ['martian-mono-latin-%d-normal' % w for w in (400, 500, 600)]
    extra = "'./css/main.css',\n  './css/tokens.css',\n" + ''.join(f"  './fonts/{f}.woff2',\n" for f in fonts)
    t = sub('sw: shell', t, "'./css/main.css',\n", extra)
files['service-worker.js'] = t

# ---------------- write ----------------
if errors:
    print('NOTHING WRITTEN. Fix these first:')
    for e in errors: print('  -', e)
    sys.exit(1)

for path, content in files.items():
    dest = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(dest) or '.', exist_ok=True)
    open(dest, 'w', encoding='utf-8').write(content)
    if '--inplace' in sys.argv:
        shutil.copy(path, path + '.bak')
        open(path, 'w', encoding='utf-8').write(content)
print(f'Wrote {len(files)} full files to ./{OUT}/' + (' and updated your project in place (.bak saved).' if '--inplace' in sys.argv else '.'))