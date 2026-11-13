/* ============================================
   ARSA — Data Layer
   LocalStorage-backed data store with a clean
   pub/sub-free API. Everything else reads/writes
   through this module.
   ============================================ */

const STORAGE_KEY = 'arsa-data-v1';

const DEFAULT_DATA = {
  workouts: [],          // { id, name, description, color, icon, exercises: [{id, exerciseId, name, sets, repRange, restTime, notes}], scheduledDays: [] }
  exerciseLibrary: [],    // custom exercises added by user: { id, name, instructions, notes, muscle, secondaryMuscles, animationUrl, custom:true }
  exerciseHistory: [],    // logged sessions: { id, workoutId, workoutName, date, duration, exercises: [{exerciseId,name,sets:[{weight,reps,completed}]}], totalVolume, totalSets }
  calendar: {},           // { 'YYYY-MM-DD': { completed: true, historyId, historyIds: [] } }
  weightLogs: [],         // { id, date, weight }
  personalRecords: {},    // { exerciseId: { maxWeight, maxReps, maxVolume, date } }
  achievements: [],       // unlocked achievement ids
  activeSession: null,    // { workoutId, startTime, logs } — in-progress workout, survives reload
  settings: {
    theme: 'dark',
    accentColor: null,       // null = use theme default; otherwise a hex string like '#2563EB'
    units: 'kg',
    notifications: false,
    notificationTime: '17:00', // "remind me by" time, 24h format, checked against local time on app open
    name: 'Lifter',
    plateMode: false,        // when true, weight inputs default to opening the plate calculator
    plateBarWeight: 20       // default bar weight in the current units (20kg or 45lb standard)
  },
  meta: {
    longestStreak: 0,
    lastWorkoutDate: null, // vestigial — kept so existing saved data doesn't break on load; streak is now fully computed live, see Store.getStreakInfo()
    lastReminderDate: null, // 'YYYY-MM-DD' of the last day a local reminder notification fired, prevents firing more than once per day
    createdAt: null
  }
};

const Store = {
  _data: null,

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this._data = JSON.parse(raw);
        // Merge in any new default keys from app updates
        this._data = this._mergeDefaults(this._data, DEFAULT_DATA);
      } else {
        this._data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        this._data.meta.createdAt = new Date().toISOString();
        this.save();
      }
    } catch (e) {
      console.error('Arsa: failed to load data, resetting', e);
      this._data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      this._data.meta.createdAt = new Date().toISOString();
      this.save();
    }
    return this._data;
  },

  _mergeDefaults(data, defaults) {
    for (const key in defaults) {
      if (!(key in data)) {
        data[key] = JSON.parse(JSON.stringify(defaults[key]));
      } else if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key]) && defaults[key] !== null) {
        data[key] = this._mergeDefaults(data[key] || {}, defaults[key]);
      }
    }
    return data;
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
      return true;
    } catch (e) {
      console.error('Arsa: failed to save data', e);
      return false;
    }
  },

  get data() {
    if (!this._data) this.load();
    return this._data;
  },

  // ---- Helpers ----
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  todayStr(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  // ---- Workouts CRUD ----
  getWorkouts() {
    return this.data.workouts;
  },
  getWorkout(id) {
    return this.data.workouts.find(w => w.id === id);
  },
  createWorkout(workout) {
    const w = {
      id: this.uid(),
      name: workout.name || 'New Workout',
      description: workout.description || '',
      color: workout.color || '#2563EB',
      icon: workout.icon || '💪',
      exercises: workout.exercises || [],
      scheduledDays: workout.scheduledDays || [],
      createdAt: new Date().toISOString()
    };
    this.data.workouts.push(w);
    this.save();
    return w;
  },
  updateWorkout(id, updates) {
    const w = this.getWorkout(id);
    if (!w) return null;
    Object.assign(w, updates);
    this.save();
    return w;
  },
  deleteWorkout(id) {
    this.data.workouts = this.data.workouts.filter(w => w.id !== id);
    this.save();
  },

  // ---- Custom Exercise Library ----
  getCustomExercises() {
    return this.data.exerciseLibrary;
  },
  addCustomExercise(ex) {
    const e = {
      id: this.uid(),
      name: ex.name,
      instructions: ex.instructions || '',
      notes: ex.notes || '',
      muscle: ex.muscle || 'Other',
      secondaryMuscles: ex.secondaryMuscles || [],
      animationUrl: ex.animationUrl || '',
      mistakes: ex.mistakes || [],
      tips: ex.tips || '',
      custom: true
    };
    this.data.exerciseLibrary.push(e);
    this.save();
    return e;
  },
  deleteCustomExercise(id) {
    this.data.exerciseLibrary = this.data.exerciseLibrary.filter(e => e.id !== id);
    this.save();
  },

  // Combined library (preloaded + custom)
  getAllExercises() {
    return [...ExerciseDB, ...this.data.exerciseLibrary];
  },
  getExerciseById(id) {
    return this.getAllExercises().find(e => e.id === id);
  },

  // ---- History ----
  getHistory() {
    return this.data.exerciseHistory.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  // Returns the history entry if this exact workout was completed today,
  // otherwise null. Used to swap the dashboard's "Start Workout" card to a
  // completed state instead of letting it linger after the workout is done.
  getTodaysCompletionFor(workoutId) {
    const todayKey = this.todayStr();
    const todaysEntries = this.data.exerciseHistory.filter(h => this.todayStr(new Date(h.date)) === todayKey);
    return todaysEntries.find(h => h.workoutId === workoutId) || null;
  },
  // Returns true if ANY workout was logged today, regardless of which one.
  // Used by the reminder system, which works off the auto-detected
  // training pattern rather than requiring a specific workout to have
  // manually-set scheduledDays — a person can train today on any workout
  // and that should count as "done for today."
  hasTrainedToday() {
    const todayKey = this.todayStr();
    return this.data.exerciseHistory.some(h => this.todayStr(new Date(h.date)) === todayKey);
  },
  addHistoryEntry(entry) {
    const h = {
      id: this.uid(),
      ...entry
    };
    this.data.exerciseHistory.push(h);

    // Update calendar
    const dateKey = this.todayStr(new Date(entry.date));
    // A day can hold several workouts, so keep every id (historyId stays as
    // the latest, for code that still reads the single value).
    const prevCal = this.data.calendar[dateKey];
    this.data.calendar[dateKey] = {
      completed: true,
      historyId: h.id,
      historyIds: [...(prevCal ? (prevCal.historyIds || [prevCal.historyId]) : []), h.id]
    };

    // Recompute streak from scratch using the auto-detect engine, then
    // track the best-ever value separately since the engine only reports
    // the streak as of right now, not historical peaks across pattern
    // changes (e.g. if your training days shift, the old peak shouldn't
    // be lost).
    const result = this.getStreakInfo();
    if (result.current > this.data.meta.longestStreak) {
      this.data.meta.longestStreak = result.current;
    }

    this.save();
    return h;
  },

  // Computes the live streak using the auto-detect engine. This is fully
  // derived from history every time it's called — no stale stored state,
  // no manual increment/reset logic that can drift out of sync.
  getStreakInfo() {
    const history = this.data.exerciseHistory;
    const pattern = detectPattern(history);
    const result = computeStreak(history, pattern, new Date());
    return result;
  },

  // ---- Active Session (crash/reload recovery) ----
  saveActiveSession(sessionState) {
    this.data.activeSession = {
      ...sessionState,
      savedAt: new Date().toISOString()
    };
    this.save();
  },
  getActiveSession() {
    return this.data.activeSession || null;
  },
  clearActiveSession() {
    this.data.activeSession = null;
    this.save();
  },
  isActiveSessionStale(maxAgeHours = 18) {
    const session = this.getActiveSession();
    if (!session || !session.savedAt) return false;
    const ageMs = Date.now() - new Date(session.savedAt).getTime();
    return ageMs > maxAgeHours * 60 * 60 * 1000;
  },

  // ---- Weight Logs ----
  getWeightLogs() {
    return this.data.weightLogs.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  },
  addWeightLog(weight, date) {
    const entry = { id: this.uid(), weight, date: date || new Date().toISOString() };
    this.data.weightLogs.push(entry);
    this.save();
    return entry;
  },
  deleteWeightLog(id) {
    this.data.weightLogs = this.data.weightLogs.filter(w => w.id !== id);
    this.save();
  },

  // ---- Personal Records ----
  getPR(exerciseId) {
    return this.data.personalRecords[exerciseId] || null;
  },
  checkAndUpdatePR(exerciseId, exerciseName, weight, reps) {
    const volume = weight * reps;
    const existing = this.data.personalRecords[exerciseId];
    let isNewPR = false;
    const date = new Date().toISOString();

    if (!existing) {
      this.data.personalRecords[exerciseId] = {
        name: exerciseName,
        maxWeight: weight, maxWeightReps: reps, maxWeightDate: date,
        maxReps: reps, maxRepsWeight: weight, maxRepsDate: date,
        maxVolume: volume, maxVolumeDate: date
      };
      isNewPR = true;
    } else {
      if (weight > existing.maxWeight) {
        existing.maxWeight = weight;
        existing.maxWeightReps = reps;
        existing.maxWeightDate = date;
        isNewPR = true;
      }
      if (reps > existing.maxReps) {
        existing.maxReps = reps;
        existing.maxRepsWeight = weight;
        existing.maxRepsDate = date;
        isNewPR = true;
      }
      if (volume > existing.maxVolume) {
        existing.maxVolume = volume;
        existing.maxVolumeDate = date;
      }
    }
    this.save();
    return isNewPR;
  },
  getAllPRs() {
    return Object.entries(this.data.personalRecords).map(([id, pr]) => ({ exerciseId: id, ...pr }));
  },

  // ---- Achievements ----
  hasAchievement(id) {
    return this.data.achievements.includes(id);
  },
  unlockAchievement(id) {
    if (!this.hasAchievement(id)) {
      this.data.achievements.push(id);
      this.save();
      return true;
    }
    return false;
  },

  // ---- Stats ----
  getStats() {
    const history = this.data.exerciseHistory;
    const now = new Date();
    const thisMonth = history.filter(h => {
      const d = new Date(h.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    let totalSets = 0, totalReps = 0, totalVolume = 0, trainingSeconds = 0;
    let heaviestLift = 0, longestSession = 0;
    const distinct = new Set();
    const perMonth = {};
    history.forEach(h => {
      totalSets += h.totalSets || 0;
      trainingSeconds += h.duration || 0;
      longestSession = Math.max(longestSession, h.duration || 0);
      const mk = String(h.date).slice(0, 7);
      perMonth[mk] = (perMonth[mk] || 0) + 1;
      (h.exercises || []).forEach(ex => {
        if ((ex.sets || []).some(s => s.completed)) distinct.add(ex.exerciseId || ex.name);
        (ex.sets || []).forEach(s => {
          if (s.completed) {
            heaviestLift = Math.max(heaviestLift, Number(s.weight) || 0);
            totalReps += Number(s.reps) || 0;
            totalVolume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
          }
        });
      });
    });

    const streakInfo = this.getStreakInfo();
    const bestMonthWorkouts = Math.max(0, ...Object.values(perMonth));

    return {
      totalWorkouts: history.length,
      workoutsThisMonth: thisMonth.length,
      currentStreak: streakInfo.current,
      longestStreak: this.data.meta.longestStreak,
      streakMode: streakInfo.mode,
      streakDays: streakInfo.days || null,
      streakTargetPerWeek: streakInfo.targetPerWeek || null,
      totalSets,
      totalReps,
      totalVolume,
      trainingHours: (trainingSeconds / 3600).toFixed(1),
      totalExercises: this.getAllExercises().length,
      // Used by the awards
      bestMonthWorkouts,
      heaviestLift,
      prCount: this.getAllPRs().length,
      distinctExercises: distinct.size,
      longestSessionMin: Math.round(longestSession / 60),
      bodyWeightLogs: this.getWeightLogs().length,
      customExercises: this.getAllExercises().filter(e => e.custom).length,
      hasBackup: !!(this.data.meta && this.data.meta.lastExportAt)
    };
  },

  // ---- Unit conversion ----
  // Converts every saved weight when the unit setting changes, instead of
  // just relabeling the numbers. Rounds to the nearest 0.5 lbs / 0.25 kg,
  // so switching back and forth can drift slightly.
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

  // ---- Backup / Restore ----
  exportData() {
    return JSON.stringify(this.data, null, 2);
  },
  importData(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      this._data = this._mergeDefaults(parsed, DEFAULT_DATA);
      this.save();
      return true;
    } catch (e) {
      console.error('Arsa: import failed', e);
      return false;
    }
  },
  resetAll() {
    try { localStorage.removeItem('arsa-workout-draft'); } catch (e) { /* ignore */ }
    this._data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this._data.meta.createdAt = new Date().toISOString();
    this.save();
  }
};

// ---- Formatting Utilities ----
const Fmt = {
  date(dateStr, opts = {}) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...opts });
  },
  dateLong(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  },
  duration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return `${m}m ${s}s`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  },
  timer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },
  weight(val, units) {
    if (Number(val) === 0) return 'Bodyweight';
    const u = units || Store.data.settings.units;
    return `${val}${u}`;
  },
  number(val) {
    return new Intl.NumberFormat('en-US').format(Math.round(val));
  },
  greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }
};

// ---- Toast ----
// action (optional): { label, run } adds a button, such as Undo, to the toast.
function showToast(msg, duration = 2200, action = null) {
  const el = document.getElementById('toast');
  el.textContent = '';
  const text = document.createElement('span');
  text.textContent = msg;
  el.appendChild(text);
  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-act';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      clearTimeout(el._timeout);
      el.classList.add('hidden');
      action.run();
    });
    el.appendChild(btn);
  }
  el.classList.remove('hidden');
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => el.classList.add('hidden'), action ? Math.max(duration, 5000) : duration);
}

// ---- Modal Helpers ----
// opts.sticky: forms with typed-in details. Tapping outside does not close
// them (it only nudges the sheet), so a stray tap cannot throw the input away.
function openModal(html, opts = {}) {
  const overlay = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');
  container.innerHTML = `<div class="modal-handle"></div>${html}`;
  overlay.dataset.sticky = opts.sticky ? '1' : '';
  overlay.classList.remove('hidden');
}
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.dataset.sticky = '';
  overlay.classList.add('hidden');
}
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('modal-overlay');
  overlay.addEventListener('click', (e) => {
    if (e.target !== overlay) return;
    if (overlay.dataset.sticky) {
      const box = document.getElementById('modal-container');
      box.classList.remove('nudge');
      void box.offsetWidth;
      box.classList.add('nudge');
      return;
    }
    closeModal();
  });
});

// ---- Achievement Definitions ----
// Each award has a group, a name and description (plain strings, or functions
// when the wording depends on units or streak mode), and a progress(stats)
// that returns { value, target }. The award is earned when value >= target.
// Locked awards use the same numbers to show how close you are.
const _lbs = () => Store.data.settings.units === 'lbs';
const _w = (kg, lbs) => _lbs() ? lbs : kg;                    // weight threshold by unit
const _wl = (kg, lbs) => _lbs() ? `${lbs.toLocaleString()}lb` : `${kg.toLocaleString()}kg`;
const _weekly = stats => stats.streakMode === 'rolling-average';

function _count(id, group, name, desc, key, target) {
  return { id, group, name, desc, progress: s => ({ value: Number(s[key]) || 0, target }) };
}
function _streak(id, n) {
  return {
    id, group: 'Consistency',
    name: s => `${n} ${_weekly(s) ? 'Week' : 'Day'} Streak`,
    desc: s => _weekly(s) ? `Hit your weekly target ${n} weeks running` : `Train ${n} training days in a row`,
    progress: s => ({ value: s.longestStreak || 0, target: n })
  };
}
function _volume(id, kg, lbs) {
  return {
    id, group: 'Volume',
    name: () => `${_wl(kg, lbs)} Club`,
    desc: () => `Lift ${_wl(kg, lbs)} total volume`,
    progress: s => ({ value: Math.round(s.totalVolume), target: _w(kg, lbs) })
  };
}
function _lift(id, kg, lbs, name) {
  return {
    id, group: 'Strength',
    name: () => name || `First ${_wl(kg, lbs)} Lift`,
    desc: () => `Lift ${_wl(kg, lbs)} in a single set`,
    progress: s => ({ value: Math.round(s.heaviestLift), target: _w(kg, lbs) })
  };
}

const ACHIEVEMENT_GROUPS = ['Milestones', 'Consistency', 'Volume', 'Strength', 'Work done', 'Variety and habits'];

const ACHIEVEMENTS = [
  // Milestones
  _count('first_workout', 'Milestones', 'First Lift', 'Complete your first workout', 'totalWorkouts', 1),
  _count('workouts_10',  'Milestones', '10 Workouts',  'Complete 10 workouts',  'totalWorkouts', 10),
  _count('workouts_25',  'Milestones', '25 Workouts',  'Complete 25 workouts',  'totalWorkouts', 25),
  _count('workouts_50',  'Milestones', '50 Workouts',  'Complete 50 workouts',  'totalWorkouts', 50),
  _count('workouts_100', 'Milestones', '100 Workouts', 'Complete 100 workouts', 'totalWorkouts', 100),
  _count('workouts_250', 'Milestones', '250 Workouts', 'Complete 250 workouts', 'totalWorkouts', 250),
  _count('workouts_500', 'Milestones', '500 Workouts', 'Complete 500 workouts', 'totalWorkouts', 500),

  // Consistency
  _streak('streak_3', 3),
  _streak('streak_7', 7),
  _streak('streak_14', 14),
  _streak('streak_30', 30),
  _streak('streak_60', 60),
  _count('month_8',  'Consistency', 'Solid Month',   'Complete 8 workouts in one calendar month',  'bestMonthWorkouts', 8),
  _count('month_16', 'Consistency', 'Machine Month', 'Complete 16 workouts in one calendar month', 'bestMonthWorkouts', 16),

  // Volume
  _volume('volume_10k',  10000, 22000),
  _volume('volume_50k',  50000, 110000),
  _volume('volume_100k', 100000, 220000),
  _volume('volume_250k', 250000, 550000),
  _volume('volume_500k', 500000, 1100000),
  _volume('volume_1m',   1000000, 2200000),

  // Strength
  _lift('first_60kg',  60, 135),
  _lift('first_100kg', 100, 225),
  _lift('first_140kg', 140, 315),
  _lift('first_180kg', 180, 405),
  _count('pr_5',  'Strength', 'Record Setter', 'Hold personal records on 5 exercises',  'prCount', 5),
  _count('pr_15', 'Strength', 'Record Keeper', 'Hold personal records on 15 exercises', 'prCount', 15),

  // Work done
  _count('sets_250',  'Work done', '250 Sets',    'Log 250 sets',    'totalSets', 250),
  _count('sets_1000', 'Work done', '1,000 Sets',  'Log 1,000 sets',  'totalSets', 1000),
  _count('reps_1000',  'Work done', '1,000 Reps',  'Log 1,000 reps',  'totalReps', 1000),
  _count('reps_10000', 'Work done', '10,000 Reps', 'Log 10,000 reps', 'totalReps', 10000),
  _count('hours_10', 'Work done', '10 Hours Under Load', 'Train for 10 hours in total', 'trainingHours', 10),
  _count('hours_50', 'Work done', '50 Hours Under Load', 'Train for 50 hours in total', 'trainingHours', 50),

  // Variety and habits
  _count('variety_10', 'Variety and habits', 'Well Rounded',  'Log 10 different exercises',  'distinctExercises', 10),
  _count('variety_25', 'Variety and habits', 'Full Toolbox',  'Log 25 different exercises',  'distinctExercises', 25),
  _count('long_session', 'Variety and habits', 'Long Haul', 'Finish a session of 90 minutes or more', 'longestSessionMin', 90),
  _count('bodyweight_5', 'Variety and habits', 'On the Scale', 'Log your body weight 5 times', 'bodyWeightLogs', 5),
  _count('custom_ex', 'Variety and habits', 'Your Own Move', 'Add a custom exercise', 'customExercises', 1),
  _count('backed_up', 'Variety and habits', 'Safe and Sound', 'Export a backup of your data', 'hasBackup', 1)
];

// name/desc can be either a plain string or a function of stats (for
// achievements whose wording depends on the detected streak mode). This
// helper resolves either form so callers don't need to care which.
function resolveAchievementText(achievement, stats, field) {
  const value = achievement[field];
  return typeof value === 'function' ? value(stats) : value;
}

// { value, target, done, pct } for one award.
function achievementProgress(a, stats) {
  const p = a.progress(stats);
  return { value: p.value, target: p.target, done: p.value >= p.target, pct: Math.min(100, Math.round((p.value / p.target) * 100)) };
}

function checkAchievements() {
  const stats = Store.getStats();
  const newlyUnlocked = [];
  ACHIEVEMENTS.forEach(a => {
    if (!Store.hasAchievement(a.id) && achievementProgress(a, stats).done) {
      Store.unlockAchievement(a.id);
      newlyUnlocked.push(a);
    }
  });
  return newlyUnlocked;
}
