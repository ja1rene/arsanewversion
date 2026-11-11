/* ============================================
   ARSA — Coach knowledge base
   General lifting answers and "how do I use Arsa" answers. Everything here
   works offline. To teach the Coach something new, add an entry:

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

const COACH_KB = [

  // ------------------------------------------------------------------ Training basics
  {
    id: 'progressive-overload',
    k: ['progressive overload', 'how to progress', 'how do i get stronger', 'get stronger', 'how to get stronger', 'make progress', 'overload'],
    a: [
      'Progressive overload means asking a little more of your muscles over time. The simplest way is **double progression**: pick a rep range, like 8 to 12. Stay at one weight until you hit the top of the range on every set, then add the smallest jump and start again at the bottom.',
      'Other ways to overload: one more set, cleaner form through a fuller range, or slightly shorter rests. Change one thing at a time and write it down. Arsa does the remembering for you.'
    ],
    f: ['Should I add weight?', 'What rep range should I use?']
  },
  {
    id: 'rep-ranges',
    k: ['rep range', 'rep ranges', 'how many reps', 'reps for muscle', 'reps for strength', 'what reps', 'hypertrophy', 'how many reps should i do', 'low reps or high reps'],
    a: [
      'Heavy sets of 1 to 5 build maximum strength most efficiently. Sets of 6 to 12 are the classic range for muscle. Sets of 12 to 30 also grow muscle if they end close to failure.',
      'In practice: main lifts around 5 to 10 reps, accessory and isolation work around 10 to 15. What matters most is that sets are hard and you add load or reps over time.'
    ],
    f: ['How do I progressive overload?', 'How long should I rest between sets?']
  },
  {
    id: 'rest',
    k: ['rest between sets', 'how long should i rest', 'rest time', 'rest period', 'rest timer', 'how long to rest'],
    a: [
      'About **2 to 3 minutes** for heavy compound lifts like squats and presses, and **60 to 90 seconds** for isolation work like curls and raises. Longer rests usually let you do more reps on the next set.',
      'In Arsa you can set the rest time for each exercise in the workout builder, and adjust it with the minus 15, plus 15 and Skip buttons during a rest.'
    ]
  },
  {
    id: 'sets-per-week',
    k: ['how many sets', 'sets per muscle', 'sets per week', 'weekly sets', 'volume per muscle', 'how much volume', 'how many sets per muscle'],
    a: [
      'A good target for most people is about **10 to 20 hard sets per muscle group per week**. Beginners grow well on 6 to 10. More is not better if you cannot recover from it.',
      'Ask me "which muscles am I neglecting?" and I will count your own sets per muscle.'
    ],
    f: ['Which muscles am I neglecting?']
  },
  {
    id: 'frequency',
    k: ['how often should i train', 'how many days a week', 'days per week', 'how many times a week', 'training frequency', 'how often should i work out', 'how many days should i train', 'how often to train'],
    a: [
      'Three to five days a week works for most people, and training each muscle about **twice a week** is a solid default. Consistency beats the perfect plan: the best schedule is the one you actually keep.',
      'If you are unsure, start with 3 full body days. Arsa has ready-made programs under Workouts, Training splits.'
    ],
    act: [{ label: 'See training splits', type: 'nav', screen: 'workouts' }]
  },
  {
    id: 'beginner',
    k: ['beginner', 'just started', 'new to lifting', 'where do i start', 'first time', 'getting started', 'start lifting', 'never lifted', 'how do i start'],
    a: [
      'Start simple: **3 full body workouts a week** with a rest day between them. Learn a squat, a push, a pull and a hinge, use weights you can control, and add small amounts when the reps feel easy.',
      'Expect the first 2 to 3 months to be about technique and building the habit. Strength comes fast early on, so do not rush heavy weights.'
    ],
    act: [{ label: 'See training splits', type: 'nav', screen: 'workouts' }],
    f: ['Which split is best?', 'How do I warm up?']
  },
  {
    id: 'which-split',
    k: ['which split', 'best split', 'ppl or upper lower', 'full body vs', 'push pull legs vs', 'upper lower vs', 'what split', 'split should i', 'which program', 'best program', 'ppl vs'],
    a: [
      '**Full body, 3 days:** simplest, great for beginners.',
      '**Upper / Lower, 4 days:** each muscle twice a week with more volume per session.',
      '**Push Pull Legs, 3 or 6 days:** lots of volume, but needs more days.',
      '**Body part, 5 days:** each muscle once a week, better once you already have a base.',
      'The best split is the one you can follow for months. Arsa can add any of these for you.'
    ],
    act: [{ label: 'See training splits', type: 'nav', screen: 'workouts' }]
  },

  // ------------------------------------------------------------------ Technique and safety
  {
    id: 'warmup',
    k: ['warm up', 'warmup', 'warming up', 'how do i warm up', 'warm up sets'],
    a: [
      'Spend a few minutes on light cardio or easy movement, then do **2 or 3 ramp-up sets** on your first lift with fewer reps each time, for example about 50%, 70% and 85% of your working weight. Later exercises need little or no warm-up.',
      'Warm-up sets should feel easy and never tire you out.'
    ]
  },
  {
    id: 'failure-rir',
    k: ['failure', 'train to failure', 'rir', 'rpe', 'reps in reserve', 'how hard should i train', 'close to failure', 'how close to failure'],
    a: [
      'Most sets should stop **1 to 3 reps before failure**. That is hard enough to grow and leaves you able to recover. Save sets close to failure for the last set of safer exercises like machines and cables.',
      '"RIR" means reps in reserve: how many more reps you could have done. RPE is the same idea on a 1 to 10 scale, so RPE 8 is about 2 reps left.'
    ]
  },
  {
    id: 'tempo',
    k: ['tempo', 'slow reps', 'eccentric', 'negatives', 'how fast should i lift', 'lowering'],
    a: ['Lift with control. A good rule is about 2 to 3 seconds lowering the weight and a firm but smooth push up. Do not bounce out of the bottom or use momentum to cheat reps.']
  },
  {
    id: 'safety-spotter',
    k: ['spotter', 'safety bars', 'fail a rep', 'safe to train alone', 'train alone', 'bail', 'stuck under the bar'],
    a: [
      'Training alone is fine if you set it up safely. Use the safety arms or pins in a rack for squats and bench, and learn how to bail out of a failed rep before you need to. Heavy bench without safeties or a spotter is the riskiest one.',
      'On machines and with dumbbells, you can usually just put the weight down.'
    ]
  },
  {
    id: 'pain-injury',
    k: ['pain', 'injury', 'injured', 'hurt', 'hurts', 'sharp pain', 'shoulder pain', 'knee pain', 'back pain', 'elbow pain', 'wrist pain', 'strained', 'pulled a muscle'],
    a: [
      'I cannot diagnose pain, so take this as general guidance. Muscle burn and tiredness are normal. **Sharp pain, joint pain, or pain that lasts** is a reason to stop that movement.',
      'See a doctor or physiotherapist if pain is sharp, getting worse, or lasts more than a few days. Get medical help right away for numbness, chest pain, dizziness or severe pain.'
    ]
  },
  {
    id: 'soreness',
    k: ['sore', 'doms', 'soreness', 'muscle soreness', 'why am i sore', 'sore after workout'],
    a: [
      'Soreness 1 to 3 days after a workout is normal, especially when you try something new or push harder than before. It fades as your body adapts.',
      'You do not need to be sore to grow. Light movement and walking help, and you can train other muscles while one is sore. Sharp or joint pain is different, see the pain answer.'
    ]
  },
  {
    id: 'gear',
    k: ['lifting belt', 'belt', 'straps', 'wrist wraps', 'lifting shoes', 'gloves', 'chalk', 'knee sleeves'],
    a: [
      'Most gear is optional. A **belt** can help on very heavy squats and hinges. **Straps** help when your grip fails before your back does on pulls. **Flat, firm shoes** are better than cushioned running shoes for squats.',
      'Build your technique first and add gear only when something specific is limiting you.'
    ]
  },
  {
    id: 'stretching',
    k: ['stretch', 'stretching', 'mobility', 'flexibility'],
    a: ['Dynamic movement before lifting (leg swings, arm circles, light sets) is more useful than long static stretches. Static stretching after training is optional. Lifting through a full range of motion also builds flexibility.']
  },

  // ------------------------------------------------------------------ Recovery and plateaus
  {
    id: 'deload',
    k: ['deload', 'de load', 'what is a deload', 'how to deload'],
    a: [
      'A deload is an easier week to let fatigue clear. Cut your sets roughly in half or use about 10 to 20% less weight, keep the same movements, and stop well short of failure.',
      'Most people benefit from one every 4 to 8 weeks, or sooner if lifts keep dropping, joints ache, or sleep and motivation fall.'
    ],
    f: ['Do I need a deload?']
  },
  {
    id: 'plateau',
    k: ['plateau', 'stuck', 'stalled', 'not progressing', 'not improving', 'cant progress', 'no progress', 'progress stopped', 'hit a wall'],
    a: [
      'When a lift stalls, check these in order:',
      '1. **Sleep and food.** Short sleep and low protein or calories are the most common cause.',
      '2. **Tracking.** Are you really matching last time and adding a rep or small weight?',
      '3. **Smaller jumps.** Add 1 kg or a rep instead of 5 kg.',
      '4. **Change something.** A different rep range, one extra set, or a variation for 4 to 6 weeks.',
      '5. **A deload week** if you have trained hard for 6 or more weeks.'
    ],
    f: ['Which of my lifts are stalling?', 'Do I need a deload?']
  },
  {
    id: 'sleep-recovery',
    k: ['sleep', 'recovery', 'rest day', 'rest days', 'overtraining', 'how much sleep', 'recover faster'],
    a: [
      'Muscle is built while you recover, not while you lift. Aim for **7 to 9 hours of sleep**, eat enough, and take 1 to 3 rest days a week. Poor sleep is one of the quickest ways to stall progress and feel flat in the gym.',
      'Signs you need more recovery: lifts dropping for 2 weeks, aching joints, poor sleep, and dreading sessions.'
    ],
    f: ['Do I need a deload?']
  },
  {
    id: 'missed-workout',
    k: ['missed a workout', 'skipped', 'missed gym', 'fell off', 'missed a week', 'missed workouts', 'took a break', 'been away', 'come back after'],
    a: [
      'One missed workout changes nothing. Do the next one on your plan and **do not double up** to catch up.',
      'After 2 or more weeks off, restart at about 80 to 90% of your old weights for a week and build back up. Strength returns quickly.'
    ]
  },

  // ------------------------------------------------------------------ Nutrition and supplements
  {
    id: 'protein',
    k: ['protein', 'how much protein', 'protein intake', 'protein per day', 'grams of protein'],
    a: (ctx) => {
      const out = ['For people who lift, the best-supported range is about **1.6 to 2.2 g of protein per kg of body weight per day** (0.7 to 1.0 g per lb). Spread across meals if you can, and do not worry about a precise "window" after training.'];
      if (ctx.bodyKg) {
        const lo = Math.round(ctx.bodyKg * 1.6), hi = Math.round(ctx.bodyKg * 2.2);
        out.push(`At your logged body weight (${ctx.bodyText}), that is about **${lo} to ${hi} g a day**.`);
      } else {
        out.push('Log your body weight on the Dashboard and I can give you a number for you.');
      }
      return out;
    }
  },
  {
    id: 'calories',
    k: ['bulk', 'bulking', 'cut', 'cutting', 'lose fat', 'gain muscle', 'calories', 'calorie deficit', 'calorie surplus', 'lose weight', 'fat loss', 'weight loss', 'maintenance calories'],
    a: [
      'Roughly: to **gain muscle**, eat a small surplus (about 250 to 500 kcal over maintenance). To **lose fat**, eat a moderate deficit (about 300 to 500 kcal under). Keep protein high and keep lifting heavy so you keep your muscle.',
      'Aim for slow, steady change, about 0.25 to 0.5% of body weight per week. This is general information, not personal medical advice. Ask a doctor or dietitian if you have a health condition.'
    ]
  },
  {
    id: 'spot-reduction',
    k: ['belly fat', 'lose belly fat', 'spot reduction', 'burn belly', 'abs fat', 'lose arm fat', 'tone'],
    a: ['You cannot choose where fat comes off, so crunches will not remove belly fat. Fat loss comes from a sustained calorie deficit across your whole body, and lifting protects your muscle while it happens.']
  },
  {
    id: 'creatine',
    k: ['creatine', 'is creatine safe', 'should i take creatine'],
    a: [
      'Creatine monohydrate is one of the best-researched supplements. The usual dose is **3 to 5 g a day**, at any time, no loading needed. It can add about 1 kg of water weight early on.',
      'It is optional, not a requirement. Check with a doctor first if you have kidney problems or take regular medication.'
    ]
  },
  {
    id: 'supplements',
    k: ['supplement', 'supplements', 'pre workout', 'preworkout', 'bcaa', 'whey', 'protein powder', 'fat burner', 'caffeine'],
    a: [
      'Food and training do the heavy lifting. Supplements worth considering: **protein powder** (just convenient protein), **creatine** (well researched), and **caffeine** for energy if you tolerate it. BCAAs and fat burners add little.',
      'Check labels, avoid taking several stimulants together, and ask a doctor if you have a health condition.'
    ]
  },
  {
    id: 'hydration',
    k: ['water', 'hydration', 'how much water', 'drink during workout', 'dehydrated'],
    a: ['Drink to thirst through the day, and have water with you during training. Pale yellow urine is a simple check. There is no special amount that boosts muscle growth.']
  },

  // ------------------------------------------------------------------ Planning and misc
  {
    id: 'workout-length',
    k: ['how long should a workout', 'workout length', 'how long should i train', 'how long should my workout', 'workout duration', 'too long'],
    a: (ctx) => {
      const out = ['Most good sessions take **45 to 75 minutes**. If you regularly pass 90 minutes, rest times and phone breaks are usually why, not the number of exercises.'];
      if (ctx.avgMinutes) out.push(`Your own sessions average about **${ctx.avgMinutes} minutes**.`);
      return out;
    }
  },
  {
    id: 'time-of-day',
    k: ['best time to workout', 'best time to train', 'morning or evening', 'morning workout', 'night workout', 'what time should i', 'train at night', 'before or after eating'],
    a: ['The best time is the one you will keep. Strength tends to be a little higher in the late afternoon for many people, but the difference is small. Eat something 1 to 3 hours before if you can, or train fasted if you feel fine that way.']
  },
  {
    id: 'cardio',
    k: ['cardio', 'running', 'does cardio kill gains', 'cardio and lifting', 'hiit', 'walking'],
    a: ['Cardio and lifting work well together. Two or three easy cardio sessions a week will not hurt your gains, and walking helps recovery. If you do both in one session, lift first. Eat enough to cover the extra activity.']
  },
  {
    id: 'supersets',
    k: ['superset', 'supersets', 'drop set', 'drop sets', 'giant set'],
    a: ['Supersets (two exercises back to back) save time. Drop sets (reducing the weight and continuing) add fatigue. Both are optional extras. Straight sets with good rest and steady progress work just as well for most people.']
  },
  {
    id: 'bulky',
    k: ['bulky', 'will lifting make me bulky', 'get too big', 'too muscular', 'lifting women', 'women lifting'],
    a: ['No. Building a lot of muscle takes years of hard training and eating in a surplus, and it is slow for everyone. Most people who lift end up stronger, leaner and more toned. Lifting also supports bone density and long-term health.']
  },
  {
    id: 'one-rm-explain',
    k: ['what is a 1rm', 'what is 1rm', 'what is one rep max', 'how is 1rm calculated', 'epley'],
    a: ['Your 1RM is the most weight you could lift once. Arsa estimates it from a set using the Epley formula: weight multiplied by (1 plus reps divided by 30). It is most accurate for sets of 10 reps or fewer.']
  },

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
