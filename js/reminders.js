/* ============================================
   ARSA — Workout Reminders (best-effort, local)

   IMPORTANT HONEST LIMITATION, read before changing this file:
   A static PWA with no backend server cannot reliably wake itself up
   and notify someone while the app is fully closed — that requires a
   real push server (Apple/Google push infrastructure) which this app
   does not have. What this module actually does:

   1. Checks "should I remind this person?" once, each time the app is
      opened or brought to the foreground.
   2. If yes, fires a real OS-level Notification immediately.
   3. Registers a periodic background sync IF the browser supports it
      (Chrome/Android only, and only for installed PWAs) as a best-effort
      attempt to also run the check occasionally without the app open.

   On iOS Safari, step 3 does not work at all (no periodicSync support,
   and historically very limited or no Notification API for home-screen
   PWAs). Step 1 still works fine there whenever the person opens the app.
   The in-app copy in Settings says this plainly — don't oversell this
   feature in the UI.
   ============================================ */

const Reminders = {
  // Call once on app load (after Store.load()). Decides whether to fire
  // a reminder right now, based on today's training day + time of day.
  checkAndMaybeNotify() {
    const settings = Store.data.settings;
    if (!settings.notifications) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const todayKey = Store.todayStr();
    if (Store.data.meta.lastReminderDate === todayKey) return; // already reminded today

    const pattern = detectPattern(Store.data.exerciseHistory);
    if (!isTodayATrainingDay(pattern, new Date())) return; // not a training day, or pattern not confident yet

    // Already trained today, on any workout? No reminder needed. This is
    // a general check, not tied to a specific workout's manually-set
    // scheduledDays — the whole point of auto-detected reminders is that
    // they work even if the person never set up manual scheduling.
    if (Store.hasTrainedToday()) return;

    // Past the person's chosen reminder time?
    const [targetHour, targetMin] = (settings.notificationTime || '17:00').split(':').map(Number);
    const now = new Date();
    const targetMinutesOfDay = targetHour * 60 + targetMin;
    const nowMinutesOfDay = now.getHours() * 60 + now.getMinutes();
    if (nowMinutesOfDay < targetMinutesOfDay) return; // not time yet today

    // Optional nicety: if a workout happens to be manually scheduled for
    // today too, mention it by name in the notification. Not required —
    // the reminder fires either way based on the detected pattern above.
    const todaysWorkout = Store.getWorkouts().find(w => (w.scheduledDays || []).includes(new Date().getDay()));

    this._fireNotification(todaysWorkout);
    Store.data.meta.lastReminderDate = todayKey;
    Store.save();
  },

  _fireNotification(workout) {
    const title = 'Time to train 💪';
    const body = workout
      ? `${workout.name} is on today's schedule — don't break your streak.`
      : `It's a training day — open Arsa to log your workout.`;

    try {
      new Notification(title, {
        body,
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-192.png',
        tag: 'arsa-daily-reminder' // replaces any previous reminder notification instead of stacking
      });
    } catch (e) {
      console.warn('Arsa: notification failed to fire', e);
    }
  },

  // Called from Settings when the person turns reminders on. Requests OS
  // permission and gives honest feedback about what was actually granted.
  async requestPermission() {
    if (!('Notification' in window)) {
      showToast('Notifications are not supported in this browser');
      return false;
    }

    const result = await Notification.requestPermission();
    if (result === 'granted') {
      this._tryRegisterPeriodicSync();
      return true;
    }
    if (result === 'denied') {
      showToast('Notifications blocked — enable them in your browser/phone settings to use reminders');
    }
    return false;
  },

  // Best-effort attempt at running the check even when the app isn't
  // open. Only works on Chrome/Android for installed PWAs as of when
  // this was written, and even there it's throttled by the OS and not
  // guaranteed to run on any fixed schedule. This intentionally fails
  // silently on unsupported browsers — there is no good fallback for
  // "wake up and notify me" without a real backend.
  async _tryRegisterPeriodicSync() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      if ('periodicSync' in registration) {
        const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
        if (status.state === 'granted') {
          await registration.periodicSync.register('arsa-reminder-check', {
            minInterval: 12 * 60 * 60 * 1000 // ask the OS for roughly twice a day; it decides if/when it actually runs
          });
        }
      }
    } catch (e) {
      // Silently ignore — this is a bonus best-effort path, not a
      // required one. The foreground check in checkAndMaybeNotify()
      // still works regardless.
    }
  }
};
