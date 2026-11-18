/* ============================================
   ARSA — Coach knowledge base
   "How do I use Arsa" answers, plus the exercise name lists the Coach uses to
   read your training log. General lifting knowledge lives in the
   coach-kb-*.js files (see COACH_KB2 below). Everything works offline.
   To teach the Coach something about the app, add an entry here:

     id      unique name
     k       phrases that should trigger it (lowercase; longer phrases score higher)
     a       the answer: an array of short paragraphs, or a function(ctx) that
             returns one. **double asterisks** make bold text.
     f       optional follow-up questions shown as tappable chips
     act     optional buttons: { label, type: 'nav', screen } etc.

   The questions the Coach could not answer are saved on the device
   (Settings > About) so you can see what to add next.
   ============================================ */

// Names a person might use for each library exercise. Custom exercises are
// matched by their own name automatically.
const EXERCISE_ALIASES = {
  ex_bench_press: ['bench', 'bench press', 'flat bench', 'barbell bench'],
  ex_incline_bench: ['incline bench', 'incline press', 'incline bench press', 'incline'],
  ex_machine_chest_press: ['machine chest press', 'chest press machine', 'chest press'],
  ex_cable_fly: ['cable fly', 'cable flies', 'fly', 'flies', 'pec fly', 'chest fly'],
  ex_push_up: ['push up', 'push ups', 'pushup', 'pushups', 'press up'],
  ex_pull_up: ['pull up', 'pull ups', 'pullup', 'pullups', 'chin up', 'chin ups', 'chinup'],
  ex_lat_pulldown: ['lat pulldown', 'lat pull down', 'pulldown', 'pulldowns', 'lat pulldowns'],
  ex_barbell_row: ['barbell row', 'bent over row', 'bent row', 'row', 'rows'],
  ex_seated_row: ['seated row', 'cable row', 'seated cable row'],
  ex_shoulder_press: ['shoulder press', 'overhead press', 'ohp', 'military press', 'overhead'],
  ex_lateral_raise: ['lateral raise', 'lateral raises', 'side raise', 'side raises', 'side delt'],
  ex_rear_delt_fly: ['rear delt fly', 'rear delt', 'rear delts', 'reverse fly'],
  ex_squat: ['squat', 'squats', 'back squat', 'barbell squat'],
  ex_leg_press: ['leg press'],
  ex_romanian_deadlift: ['romanian deadlift', 'rdl', 'rdls', 'stiff leg deadlift', 'deadlift', 'deadlifts'],
  ex_leg_curl: ['leg curl', 'leg curls', 'hamstring curl', 'hamstring curls'],
  ex_leg_extension: ['leg extension', 'leg extensions', 'quad extension'],
  ex_calf_raise: ['calf raise', 'calf raises', 'calves', 'calf'],
  ex_bicep_curl: ['bicep curl', 'bicep curls', 'biceps curl', 'curl', 'curls', 'barbell curl', 'dumbbell curl'],
  ex_hammer_curl: ['hammer curl', 'hammer curls'],
  ex_tricep_pushdown: ['tricep pushdown', 'triceps pushdown', 'pushdown', 'pushdowns', 'tricep extension', 'cable pushdown'],
  ex_skull_crusher: ['skull crusher', 'skull crushers', 'skullcrusher', 'lying tricep extension']
};

// Aliases that only approximate the exercise, so the Coach says so.
const EXERCISE_APPROX = {
  deadlift: 'ex_romanian_deadlift',
  deadlifts: 'ex_romanian_deadlift'
};

// General lifting knowledge (coach-kb-*.js) is added to this list. Each entry:
//   cat    category: exercise | sets_reps | muscles | recovery | nutrition | problems | glossary | app
//   id     unique name
//   q      the main question
//   alt    other ways people ask it
//   kw     keywords (optional)
//   a      the answer: array of short paragraphs, or function(ctx) returning one
//   simple optional shorter version, used for "explain that more simply"
//   more   optional extra paragraphs, used for "tell me more"
//   plan   optional action steps, used for "what should I do?"
//   ask    optional follow-up question { key, text, opts: [{ l, v, re, a }] }
//   rel    ids of related entries, shown as suggestion chips
//   lvl    beginner | intermediate
const COACH_KB2 = [];
const coachKb = (cat, id, q, alt, a, o) => COACH_KB2.push(Object.assign({ cat, id, q, alt: alt || [], a }, o || {}));

const COACH_KB = [

  // ------------------------------------------------------------------ Using Arsa
  {
    id: 'app-log',
    k: ['how do i log', 'how to log', 'log a set', 'log my workout', 'start a workout', 'how do i start a workout', 'track a workout', 'how to use arsa', 'how do i use'],
    a: [
      'Open Dashboard or Workouts and tap **Start**. In the live panel set your weight and reps with the plus and minus buttons, or tap **Same** or **Try** to fill them from last time, then tap **Log set**. The rest timer starts on its own. When you are done tap **Finish workout**.',
      'Tap a logged set to edit or undo it.'
    ]
  },
  {
    id: 'app-create-workout',
    k: ['create a workout', 'make a workout', 'new workout', 'build a workout', 'add a workout', 'edit a workout', 'reorder exercises'],
    a: ['Go to **Workouts** and tap **New workout**. Name it, pick training days, and add exercises. Use the arrows to reorder and tap an exercise to change sets, reps or rest. Or start from a ready-made split lower down on the same screen.'],
    act: [{ label: 'Open Workouts', type: 'nav', screen: 'workouts' }]
  },
  {
    id: 'app-custom-exercise',
    k: ['custom exercise', 'add an exercise', 'add exercise', 'my exercise is not there', 'exercise not in library', 'missing exercise'],
    a: ['Open **Library** and tap **Add exercise**. Give it a name and muscle group and it is available to add in any workout.'],
    act: [{ label: 'Open Library', type: 'nav', screen: 'library' }]
  },
  {
    id: 'app-backup',
    k: ['backup', 'export', 'export data', 'back up', 'save my data', 'restore', 'import', 'transfer data', 'new phone', 'move to another phone', 'lose my data'],
    a: [
      'Your data lives only on this device. Go to **Settings, Export backup** to save a file, and **Import backup** on any device to restore it. Back up regularly, and always before changing phones or clearing browser data.'
    ],
    act: [{ label: 'Open Settings', type: 'nav', screen: 'settings' }]
  },
  {
    id: 'app-units',
    k: ['change units', 'kg to lbs', 'lbs to kg', 'switch to kg', 'switch to lbs', 'pounds', 'kilograms', 'units'],
    a: ['Go to **Settings, Weight units**. Arsa converts every saved weight, including history and records, and rounds to the nearest 0.5 lbs or 0.25 kg, so switching back and forth can drift slightly.'],
    act: [{ label: 'Open Settings', type: 'nav', screen: 'settings' }]
  },
  {
    id: 'app-install',
    k: ['install', 'add to home screen', 'install the app', 'how do i install', 'home screen'],
    a: [
      '**Android (Chrome):** menu, then Install app.',
      '**iPhone (Safari):** tap Share, then Add to Home Screen.',
      'Once installed, Arsa opens full screen and works offline.'
    ]
  },
  {
    id: 'app-theme',
    k: ['dark mode', 'light mode', 'theme', 'change color', 'accent color', 'change the color', 'change theme'],
    a: ['Go to **Settings, Appearance** to switch between dark and light and pick your accent color.'],
    act: [{ label: 'Open Settings', type: 'nav', screen: 'settings' }]
  },
  {
    id: 'app-reset',
    k: ['reset', 'delete my data', 'delete all', 'start over', 'clear data', 'erase'],
    a: ['**Settings, Reset all data** deletes everything, and it cannot be undone. Export a backup first if you might want your history back.'],
    act: [{ label: 'Open Settings', type: 'nav', screen: 'settings' }]
  },
  {
    id: 'app-offline',
    k: ['offline', 'work offline', 'without internet', 'no internet', 'does it need internet'],
    a: ['Yes, Arsa works fully offline after the first load, and so do I. Your workouts, history and records are saved on this device. Nothing is sent anywhere.']
  },
  {
    id: 'app-privacy',
    k: ['privacy', 'is my data safe', 'who can see my data', 'is my data private', 'where is my data', 'data stored'],
    a: ['Everything stays on this device. Your workouts are saved in the browser storage of this phone, and I run on the phone too, so no question you ask me is sent to a server. Clearing your browser data would erase them, which is why backups matter.'],
    act: [{ label: 'Open Settings', type: 'nav', screen: 'settings' }]
  },
  {
    id: 'app-update',
    k: ['update', 'new version', 'update the app', 'whats new', "what's new", 'latest version'],
    a: ['When a new version is ready, a banner appears at the top with a **Reload** button. You can also check manually under **Settings, About, Check for updates**, and see changes under **What\'s new**.'],
    act: [{ label: 'Open Settings', type: 'nav', screen: 'settings' }]
  },
  {
    id: 'app-notifications',
    k: ['reminder', 'reminders', 'notification', 'notifications', 'remind me'],
    a: ['Turn reminders on under **Settings, Reminders**. Arsa notifies you on a training day if you have not trained yet by your chosen time, when you open the app. Phones do not reliably allow notifications from a fully closed web app, so opening Arsa regularly makes this work best.'],
    act: [{ label: 'Open Settings', type: 'nav', screen: 'settings' }]
  }
];
