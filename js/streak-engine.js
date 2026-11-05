/* ============================================
   ARSA — Streak Detection Engine
   Auto-detects training pattern from history and
   computes a forgiving, pattern-aware streak.
   Tested standalone before integration — see the
   streak-test/ scenarios this logic was verified against.
   ============================================ */

const MS_PER_DAY = 86400000;

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(a, b) {
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * Detects training pattern from history.
 * history: array of {date: ISOString} sorted or unsorted, any order.
 * windowDays: how far back to look for pattern detection (default 42 = 6 weeks)
 * minSessions: minimum sessions needed before we trust a detected pattern
 *
 * Returns one of:
 *  { mode: 'bootstrap' }                          -- not enough data yet
 *  { mode: 'fixed-days', days: [1,3,5] }          -- strong weekday pattern found
 *  { mode: 'rolling-average', sessionsPerWeek: 3.2 } -- no fixed days, but a frequency pattern
 */
function detectPattern(history, windowDays = 42, minSessions = 4) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowDays * MS_PER_DAY);

  const recent = history
    .map(h => new Date(h.date))
    .filter(d => d >= cutoff && d <= now)
    .sort((a, b) => a - b);

  if (recent.length < minSessions) {
    return { mode: 'bootstrap', sessionCount: recent.length };
  }

  // Count sessions per weekday (0=Sun..6=Sat)
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  recent.forEach(d => weekdayCounts[d.getDay()]++);

  const totalSessions = recent.length;
  const weeksSpanned = Math.max(1, windowDays / 7);
  const avgSessionsPerWeek = totalSessions / weeksSpanned;

  // A weekday "counts" as a fixed training day if the person trained on it
  // in at least 60% of the weeks within the window. This tolerates the
  // occasional missed day without losing the pattern entirely.
  const weeksInWindow = Math.max(1, Math.floor(windowDays / 7));
  const fixedDays = [];
  for (let day = 0; day < 7; day++) {
    const ratio = weekdayCounts[day] / weeksInWindow;
    if (ratio >= 0.6) fixedDays.push(day);
  }

  // If we found a reasonably consistent set of weekdays, use it.
  // Require at least 2 fixed days worth of signal, otherwise the "pattern"
  // is too thin to be useful (e.g. one single Tuesday over 6 weeks isn't a
  // real pattern, it's noise).
  if (fixedDays.length >= 2) {
    return { mode: 'fixed-days', days: fixedDays.sort(), avgSessionsPerWeek };
  }

  // No clean weekday pattern — fall back to a rolling average target.
  // This covers people who train "whenever," not on fixed days.
  return { mode: 'rolling-average', sessionsPerWeek: Math.round(avgSessionsPerWeek * 10) / 10 };
}

/**
 * Checks whether today is one of the person's detected fixed training
 * days. Only meaningful in 'fixed-days' mode — rolling-average and
 * bootstrap modes don't have specific calendar days to check against, so
 * this returns false for those (callers like the reminder system should
 * simply not fire a reminder in that case, rather than guess).
 */
function isTodayATrainingDay(pattern, today = new Date()) {
  if (pattern.mode !== 'fixed-days') return false;
  return pattern.days.includes(today.getDay());
}

/**
 * Computes current + longest streak given a detected pattern and history.
 * This is intentionally separate from detection so we can test each piece
 * independently.
 */
function computeStreak(history, pattern, today = new Date()) {
  const completedDates = new Set(history.map(h => dateKey(new Date(h.date))));
  const earliestDate = history.length
    ? new Date(Math.min(...history.map(h => new Date(h.date).getTime())))
    : null;

  if (pattern.mode === 'bootstrap') {
    return computeDailyStreak(completedDates, today);
  }

  if (pattern.mode === 'fixed-days') {
    return computeFixedDayStreak(completedDates, pattern.days, today, earliestDate);
  }

  // rolling-average mode: streak = consecutive weeks where session count
  // met or exceeded the rolling target (rounded down, minimum 1).
  return computeRollingAverageStreak(history, pattern.sessionsPerWeek, today);
}

function computeDailyStreak(completedDates, today) {
  let current = 0;
  let cursor = new Date(today);
  // Allow "today" to be uncompleted yet without breaking the streak —
  // only start counting backwards from yesterday if today has nothing.
  if (!completedDates.has(dateKey(cursor))) {
    cursor = new Date(cursor.getTime() - MS_PER_DAY);
  }
  while (completedDates.has(dateKey(cursor))) {
    current++;
    cursor = new Date(cursor.getTime() - MS_PER_DAY);
  }
  return { current, mode: 'bootstrap' };
}

function computeFixedDayStreak(completedDates, fixedDays, today, earliestDate = null) {
  let current = 0;
  let cursor = new Date(today);
  let forgivenessUsedAt = []; // dates (as Date objects) where a miss was forgiven

  const todayKey = dateKey(cursor);
  const todayIsTrainingDay = fixedDays.includes(cursor.getDay());
  const todayDone = completedDates.has(todayKey);

  if (todayIsTrainingDay && !todayDone) {
    cursor = new Date(cursor.getTime() - MS_PER_DAY);
  }

  // Walk backwards day by day. Rest days are skipped (don't count either
  // way). A missed training day normally breaks the streak — but we allow
  // ONE forgiven miss per rolling 30-day window, so a single sick day or
  // one-off skip doesn't wipe out weeks of consistency. A second miss
  // within the same 30-day window still breaks it.
  //
  // We stop once we reach earliestDate (the person's first-ever logged
  // workout) so the walker never mistakes "no account history yet" for a
  // missed training day — that's a data-boundary issue, not a real miss.
  for (let i = 0; i < 365; i++) {
    if (earliestDate && cursor < earliestDate) break;

    const isTrainingDay = fixedDays.includes(cursor.getDay());
    if (!isTrainingDay) {
      cursor = new Date(cursor.getTime() - MS_PER_DAY);
      continue;
    }
    const key = dateKey(cursor);
    if (completedDates.has(key)) {
      current++;
      cursor = new Date(cursor.getTime() - MS_PER_DAY);
      continue;
    }

    // Missed a training day. Check whether a forgiveness is available:
    // no other forgiven miss within 30 days of this one.
    const hasNearbyForgiveness = forgivenessUsedAt.some(d => Math.abs(daysBetween(d, cursor)) < 30);
    if (!hasNearbyForgiveness) {
      forgivenessUsedAt.push(new Date(cursor));
      // The missed day itself doesn't add to the streak count, but it
      // doesn't break the chain either — keep walking backward.
      cursor = new Date(cursor.getTime() - MS_PER_DAY);
      continue;
    }

    // Second miss within 30 days of a prior forgiveness — streak ends here.
    break;
  }

  return {
    current,
    mode: 'fixed-days',
    days: fixedDays,
    forgivenessUsed: forgivenessUsedAt.length
  };
}

function computeRollingAverageStreak(history, targetPerWeek, today) {
  // Floor, not round — rounding an average like 2.8/week up to 3 creates a
  // target that most individual weeks won't hit even with fully consistent
  // behavior, since weekly counts naturally bounce around the average.
  // Flooring means "meet or beat your typical week," which is achievable.
  const target = Math.max(1, Math.floor(targetPerWeek));
  let current = 0;
  let weekEnd = new Date(today);
  let forgivenessUsedAt = []; // week-end dates where a miss was forgiven

  for (let w = 0; w < 52; w++) {
    const weekStart = new Date(weekEnd.getTime() - 6 * MS_PER_DAY);
    const count = history.filter(h => {
      const d = new Date(h.date);
      return d >= weekStart && d <= weekEnd;
    }).length;

    // The current (in-progress) week gets a pass if it doesn't yet meet
    // target — same "don't punish an unfinished week" logic as daily mode.
    const isCurrentWeek = w === 0;
    if (count >= target) {
      current++;
    } else if (isCurrentWeek) {
      // in-progress week, don't break yet, don't increment either
    } else {
      // Under target for a completed week — one forgiveness per rolling
      // 30 days, same policy as fixed-day mode, so a single off week
      // doesn't erase a long streak.
      const hasNearbyForgiveness = forgivenessUsedAt.some(d => Math.abs(daysBetween(d, weekEnd)) < 30);
      if (!hasNearbyForgiveness) {
        forgivenessUsedAt.push(new Date(weekEnd));
      } else {
        break;
      }
    }
    weekEnd = new Date(weekStart.getTime() - MS_PER_DAY);
  }

  return {
    current,
    mode: 'rolling-average',
    targetPerWeek: target,
    forgivenessUsed: forgivenessUsedAt.length
  };
}
