/* ============================================
   ARSA — Coach knowledge: real gym situations, planning and the gym dictionary
   ============================================ */

// ============================================================ F. Gym problems

coachKb('problems', 'pb-not-growing', 'Why am I not seeing muscle growth?',
  ['my chest is not growing', 'my muscles are not growing', 'why am i not gaining muscle', 'no muscle growth', 'my arms are not growing', 'i am not getting bigger', 'why is my muscle not growing', 'not building muscle', 'no gains', 'why am i not growing', 'how come i am not getting bigger'],
  (ctx) => {
    const m = Coach._conv.muscle;
    const what = m ? `your ${m}` : 'your muscles';
    return [
      `There are a few common reasons ${what} may not be growing: **not enough hard sets**, **no steady progression**, **poor recovery**, or **not eating enough**. It is also slow. Visible changes usually take 8 to 12 weeks or more.`,
      m ? `Let's look at your training first. How many times per week do you train your ${m}?` : "Let's look at your training first. How many times per week do you train that muscle?"
    ];
  },
  {
    plan: [
      'Here is a simple plan:',
      '1. **Train each muscle twice a week**, with about 10 to 15 hard sets in total.\n2. **Add a rep or a little weight** each week and write it down.\n3. **Eat enough**: about 1.6 to 2.2 g of protein per kg and a small surplus if you want to gain.\n4. **Sleep 7 to 9 hours.**\n5. **Be patient for 8 to 12 weeks**, then compare your numbers and photos.'
    ],
    simple: ['Most often it is not enough hard sets, not enough progress, not enough sleep or not enough food. Fix those one at a time.'],
    ask: {
      key: 'freq', text: null, perMuscle: true,
      opts: [
        { l: 'Once a week', v: 1, re: /\b(1|once|one|one time|1x)\b/, a: ['Once a week is likely too little for most people. Try **2 sessions a week** for that muscle, with 3 to 4 hard sets in each. That alone often restarts progress.'] },
        { l: 'Twice a week', v: 2, re: /\b(2|twice|two|2x)\b/, a: ['Twice a week is a good frequency. Next, check three things: are you adding a rep or small weight each week, are the sets hard (1 to 3 reps left), and are you eating enough protein and sleeping 7 hours or more? If all are yes, add 2 to 3 sets per week for a few weeks.'] },
        { l: '3 or more', v: 3, re: /\b(3|three|4|four|5|five|daily|every day|a lot)\b/, a: ['That is a lot of frequency, so check your recovery. Make sure the total weekly sets stay around 10 to 20, and that you are not too tired to push each session. Sometimes fewer, harder sets beat more sets.'] }
      ]
    },
    rel: ['sr-weekly-sets', 'nut-protein', 'rec-sleep']
  });

coachKb('problems', 'pb-equipment-busy', 'What if the gym equipment I need is occupied?',
  ['machine is busy', 'someone is using the equipment', 'the bench is taken', 'the rack is occupied', 'what to do when the gym is crowded', 'gym is full', 'equipment not available', 'machine is taken', 'bench is taken', 'machine is taken what now', 'someone is on the machine i need'],
  [
    'Do not stand around waiting. Options:',
    '- **Swap the order.** Do another exercise from your workout first and come back.\n- **Pick a similar exercise.** Barbell bench busy? Use dumbbells or a machine. Squat rack busy? Try leg press or goblet squats.\n- **Ask to work in.** It is normal to ask "can I work in between sets?"\n- **Superset** with a nearby exercise while you wait.',
    'Keep the same muscle group and rep range so your progress still counts.'
  ],
  { rel: ['pb-change-exercises', 'pb-machines'] });

coachKb('problems', 'pb-weaker-today', 'What if I cannot lift the weight I used last week?',
  ['i cant lift what i did last week', 'weaker than last week', 'my lifts went down', 'i feel weak today', 'i cant lift the same weight as before', 'why am i weaker than last week', 'lifting less than last time', 'strength dropped'],
  [
    'That happens to everyone and one bad day does not undo your progress. Strength changes from day to day with sleep, stress, food and recovery.',
    '- **Do what you can today.** Drop the weight 5 to 10% and keep your form.\n- **Check the basics:** sleep, food and water yesterday.\n- **Warm up properly.**\n- **Try again next session.** If you miss for 2 or 3 sessions in a row, take an easier week.'
  ],
  {
    ask: {
      key: 'sleptWell', text: 'Did you sleep well last night?',
      opts: [
        { l: 'Yes', v: 'yes', re: /\b(yes|yeah|yep|slept well|good)\b/, a: ['Then it is probably just a normal off day, or lack of food or water. Keep the same weight next session and try for the same reps.'] },
        { l: 'No', v: 'no', re: /\b(no|nope|bad|not really|poorly|barely|little)\b/, a: ['That likely explains it. Go lighter today, and aim for an earlier night. Poor sleep lowers strength noticeably.'] }
      ]
    },
    rel: ['rec-weaker', 'pb-plateau']
  });

coachKb('problems', 'pb-tired', 'What should I do if I feel tired halfway through my workout?',
  ['i feel tired during my workout', 'i run out of energy at the gym', 'no energy while training', 'i am exhausted halfway through my workout', 'tired during workout', 'low energy in the gym', 'tired at the gym'],
  [
    'Some fatigue is normal. If it is more than usual:',
    '- **Eat something** with carbs 1 to 2 hours before.\n- **Drink water** and sip during the session.\n- **Take longer rests** between sets (2 to 3 minutes on hard lifts).\n- **Do your most important lift first.**\n- **Trim the session.** Dropping a set or two is better than grinding through.',
    'If you ever feel dizzy, faint or have chest pain, stop right away and see the safety advice.'
  ],
  {
    ask: {
      key: 'sleptWell', text: 'Did you sleep well before your workout?',
      opts: [
        { l: 'Yes', v: 'yes', re: /\b(yes|yeah|yep|slept well|good)\b/, a: ['Then look at food and water. A meal with carbs and protein 1 to 3 hours before training, and sipping water during it, usually helps a lot.'] },
        { l: 'No', v: 'no', re: /\b(no|nope|bad|not really|poorly|barely|little)\b/, a: ['That is probably why. Lower your weights by 5 to 10% today, cut a set or two, and prioritize sleep tonight.'] }
      ]
    },
    rel: ['rec-weaker', 'rec-sleep']
  });

coachKb('problems', 'pb-missed', 'What if I miss a workout?',
  ['i missed a workout', 'skipped the gym', 'missed gym', 'i fell off my routine', 'missed a week', 'been away from the gym', 'took a break from lifting', 'coming back after a break', 'should i make up a missed workout'],
  [
    'One missed workout changes nothing. Do the next one on your plan and **do not double up** to catch up.',
    'After 2 or more weeks off, restart at about 80 to 90% of your old weights for a week and build back up. Strength returns quickly (it is called muscle memory).'
  ],
  { rel: ['pb-routine', 'rec-rest-day'] });

coachKb('problems', 'pb-no-chest-feel', 'What if I do not feel my chest working during bench press?',
  ['i cant feel my chest on bench press', 'bench press hits my shoulders and arms', 'bench press only works my triceps', 'no chest activation', 'how to feel my chest more', 'mind muscle connection chest', 'bench press not working my chest'],
  [
    'This is very common. Try these:',
    '- **Shoulder blades back and down** before you unrack, and keep them there.\n- **Elbows at 45 to 70 degrees**, not flared and not tucked tight.\n- **Lower slowly** (2 to 3 seconds) to your lower chest and press up and slightly in.\n- **Use a lighter weight** than you think. Ego lifting moves work to your shoulders and arms.\n- **Add other chest work:** dumbbell press, push-ups, cable flies or a chest press machine.',
    'It also helps to pre-fatigue your chest with a fly before pressing.'
  ],
  { rel: ['tech-bench-hands', 'ex-bench', 'pb-not-growing'] });

coachKb('problems', 'pb-asymmetry', 'Why is one arm stronger than the other?',
  ['one side is stronger', 'uneven strength', 'one arm bigger', 'left arm weaker than right', 'imbalance between my arms', 'one side lifts more', 'muscle imbalance'],
  [
    'Almost everyone has a stronger side, usually the dominant one. It is normal and a small difference is fine.',
    '- **Use dumbbells and one-arm exercises** so each side works alone.\n- **Start with the weaker side** and match the same reps on the stronger side.\n- **Do not let the strong side take over** on barbell lifts.\n- **Check your form** for uneven shoulders or hips.',
    'If the difference is large, sudden, or comes with pain, numbness or weakness, have a doctor or physiotherapist look at it.'
  ],
  { rel: ['tech-db-vs-bb'] });

coachKb('problems', 'pb-plateau', 'What should I do if I reach a plateau?',
  ['i am stuck', 'my lift is not going up', 'not progressing', 'no progress', 'stalled', 'hit a wall', 'progress stopped', 'how to break a plateau', 'training plateau', 'plateau'],
  [
    'When a lift stalls, check these in order:',
    '1. **Sleep and food.** Short sleep and low protein or calories are the most common cause.\n2. **Tracking.** Are you really matching last time and adding a rep or small weight?\n3. **Smaller jumps.** Add 1 kg or a rep instead of 5 kg.\n4. **Change something.** A different rep range, one extra set, or a variation for 4 to 6 weeks.\n5. **A deload week** if you have trained hard for 6 or more weeks.'
  ],
  { simple: ['Check sleep and food, use smaller weight jumps, change the rep range or exercise for a few weeks, then take an easy week if you are worn out.'], rel: ['gl-deload', 'sr-add-weekly'] });

coachKb('problems', 'pb-change-exercises', 'Is it okay to change exercises?',
  ['should i switch exercises', 'how often should i change my workout', 'can i swap exercises', 'do i need variety', 'muscle confusion', 'is it ok to change my routine', 'when should i change exercises'],
  [
    '**Yes, but not too often.** Stick with the same exercises for **4 to 8 weeks** so you can track progress. Changing every workout makes it hard to improve.',
    'Good reasons to swap: the exercise hurts or feels wrong for your body, you are stuck for several weeks, equipment is not available, or you are bored. Swap for a similar movement that works the same muscle.',
    'You do not need "muscle confusion". Progressive overload on a few good exercises works.'
  ],
  { rel: ['pb-plateau', 'pb-equipment-busy'] });

coachKb('problems', 'pb-30min', 'What if I only have 30 minutes to work out?',
  ['short workout', 'quick workout', 'not enough time to work out', 'i only have 30 minutes', '30 minute workout', 'time efficient workout', 'i am busy what should i do', 'how to train when i have little time', 'only 30 mins to train', 'short on time workout', '30 min workout'],
  [
    '30 minutes is enough. Here is how to use it well:',
    '- **Pick 4 to 5 compound exercises** for the main muscles.\n- **Skip long warm-ups**: 1 or 2 light sets of your first lift.\n- **Rest 60 to 90 seconds** between sets and keep your phone away.\n- **Use supersets**: two exercises back to back for different muscles (push and pull, for example).\n- **Do 2 to 3 sets** each.',
    'A good quick full body: squat or leg press, bench or push-up, row, overhead press, plus an ab exercise.'
  ],
  { rel: ['pb-routine', 'gl-superset'] });

coachKb('problems', 'pb-machines', 'Should I use machines or free weights?',
  ['machines or free weights', 'free weights vs machines', 'are machines better than free weights', 'dumbbells or machines', 'are machines worse', 'machines vs barbell'],
  [
    'Use both. They build muscle well when you push hard and progress.',
    '**Machines:** easy to learn, safe to train close to failure, and good for beginners or isolating a muscle.',
    '**Free weights:** work balance and stabilizer muscles, let you move more naturally, and are great for big lifts.',
    'A simple mix: free weight or heavy compound lift first, then machines and cables for volume.'
  ],
  { rel: ['tech-db-vs-bb'] });

coachKb('problems', 'pb-starting-weight', 'How do I choose the right starting weight?',
  ['what weight should i start with', 'how heavy should i lift', 'how do i pick a weight', 'what weight should i use', 'starting weights', 'how much weight should i lift as a beginner', 'how to choose weight', 'what weight do i begin with'],
  [
    'Pick a weight you can lift for about **10 to 12 controlled reps with 2 or 3 reps left**. It should feel challenging near the end of the set, but never ugly.',
    'If you are not sure, start too light. Test it with a few reps and add weight between sets until the last reps feel hard but clean.'
  ],
  {
    simple: ['Choose a weight you can lift 10 to 12 times with good form, with 2 or 3 reps left at the end.'],
    ask: {
      key: 'repsAtWeight', text: 'How many repetitions can you currently do with that weight?',
      opts: [
        { l: 'Fewer than 6', v: 5, re: /\b(1|2|3|4|5|five|four|three|two|one|few|barely)\b/, a: ['That is too heavy for a starting weight. Drop it by about 10 to 20% so you can do 8 to 12 clean reps.'] },
        { l: '6 to 12', v: 9, re: /\b(6|7|8|9|10|11|12|six|seven|eight|nine|ten|eleven|twelve)\b/, a: ['That is in the right zone. If you have about 2 to 3 reps left at the end, keep it. If you could do 3 or more extra reps, add a small amount.'] },
        { l: 'More than 15', v: 16, re: /\b(1[3-9]|[2-9][0-9]|thirteen|fourteen|fifteen|twenty|lots|many)\b/, a: ['That is too light to build much. Increase the weight until you reach about 8 to 12 reps with the last few being hard.'] }
      ]
    },
    rel: ['sr-when-increase', 'tech-warmup']
  });

coachKb('problems', 'pb-struggle', 'I am struggling with an exercise. What should I do?',
  ['i cant do this exercise', 'this exercise is too hard', 'i struggle with squats', 'i have trouble with the movement', 'exercise feels awkward', 'i cannot do a pull up', 'cant do push ups', 'i struggle to balance'],
  [
    'That is a normal part of learning. Lower the difficulty and build up.',
    '- **Weight:** use a lighter weight or a machine version.\n- **Balance:** use a supported version (goblet squat, seated press, machine).\n- **Technique:** film your set and compare it to the form guide.'
  ],
  {
    ask: {
      key: 'struggle', text: 'Is the difficulty related to weight, balance, or technique?',
      opts: [
        { l: 'Weight', v: 'weight', re: /\b(weight|heavy|strength|too hard|strong)\b/, a: ['Drop to a weight you can do for 8 to 12 clean reps, or use an easier variation (assisted pull-ups, incline push-ups, machine presses). Build up with small jumps.'] },
        { l: 'Balance', v: 'balance', re: /\b(balance|wobbl|stab|fall|unstable)\b/, a: ['Use a more stable version: a machine, seated version, a rack or wall for light support, or dumbbells instead of a barbell. Balance improves with practice.'] },
        { l: 'Technique', v: 'technique', re: /\b(technique|form|movement|pattern|awkward|dont know|how)\b/, a: ['Slow down and practice with very light weight or bodyweight. Film yourself, and tell me which exercise you are working on for specific steps.'] }
      ]
    },
    rel: ['tech-form-check', 'pb-starting-weight']
  });

coachKb('problems', 'pb-beginner-mistakes', 'What are common beginner mistakes at the gym?',
  ['beginner mistakes', 'what mistakes do beginners make', 'new to the gym what should i avoid', 'common gym mistakes', 'tips for beginners', 'first day at the gym', 'i am new to lifting', 'where do i start', 'getting started', 'just started lifting', 'never lifted before'],
  [
    'Start simple. **3 full body workouts a week**, with a rest day between them. Learn a squat, a push, a pull and a hinge, use weights you can control, and add small amounts when reps feel easy.',
    'Common mistakes:',
    '- Lifting too heavy too soon, with poor form\n- Changing the routine every week\n- Skipping legs or back\n- Not tracking workouts\n- Not eating or sleeping enough\n- Comparing yourself to others',
    'Expect the first 2 to 3 months to be about technique and building the habit. Strength comes fast early on, so do not rush.'
  ],
  { act: [{ label: 'See training splits', type: 'nav', screen: 'workouts' }], rel: ['pb-routine', 'pb-starting-weight'] });

coachKb('problems', 'pb-workout-length', 'How long should a workout take?',
  ['how long should i train', 'workout length', 'how long should my workout be', 'workout duration', 'my workouts take too long', 'how long should i be in the gym'],
  (ctx) => {
    const out = ['Most good sessions take **45 to 75 minutes**. If you regularly pass 90 minutes, rest times and phone breaks are usually why, not the number of exercises.'];
    if (ctx.avgMinutes) out.push(`Your own sessions average about **${ctx.avgMinutes} minutes**.`);
    return out;
  },
  { rel: ['pb-30min'] });

coachKb('problems', 'pb-time-of-day', 'What is the best time of day to work out?',
  ['best time to workout', 'morning or evening workout', 'should i train in the morning', 'train at night', 'best time to lift', 'what time should i train'],
  ['The best time is the one you will keep. Strength is often a little higher in the late afternoon, but the difference is small. Eat something 1 to 3 hours before if you can.']);

coachKb('problems', 'pb-cardio', 'Does cardio hurt muscle gain?',
  ['cardio and lifting', 'does cardio kill gains', 'should i do cardio', 'running and lifting', 'walking for fat loss', 'hiit and weights'],
  ['Cardio and lifting work well together. Two or three easy cardio sessions a week will not hurt your gains, and walking helps recovery. If you do both in one session, lift first. Eat enough to cover the extra activity.']);

coachKb('problems', 'pb-bulky', 'Will lifting make me bulky?',
  ['will i get too big', 'lifting for women', 'will weights make me bulky', 'afraid of getting too muscular', 'do women get bulky from lifting', 'toning'],
  ['No. Building a lot of muscle takes years of hard training and eating in a surplus, and it is slow for everyone. Most people who lift end up stronger and more defined. Lifting also supports bone density and long-term health.']);

// ============================================================ G. Gym dictionary

const COACH_GLOSSARY = [
  { id: 'pr', t: 'PR (Personal Record)', alt: ['what is a pr', 'what does pr mean', 'personal record', 'personal best', 'pb in the gym', 'new pr'],
    d: ['A **PR (personal record)** is your best ever result on a lift: the heaviest weight, the most reps, or the most total volume.', 'Example: if your best bench was 60 kg for 5 reps and today you did 60 kg for 6, that is a new rep PR. Arsa tracks these automatically.'] },
  { id: '1rm', t: '1RM (One-Rep Maximum)', alt: ['what is 1rm', 'one rep max', 'what does 1rm mean', 'how is 1rm calculated', 'how do i calculate my one rep max', 'estimated 1rm', 'epley formula'],
    d: ['Your **1RM** is the heaviest weight you could lift for a single rep with good form.', 'You do not have to test it. Arsa estimates it from a set using the Epley formula: weight × (1 + reps ÷ 30). Example: 60 kg for 8 reps is about 76 kg. It is most accurate for sets of 10 reps or fewer.'] },
  { id: 'rir', t: 'RIR (Reps in Reserve)', alt: ['what is rir', 'what does rir mean', 'reps left in the tank', 'reps in reserve', 'how many reps should i leave in the tank', 'how close to failure should i train'],
    d: ['**RIR** is how many more good reps you could have done when you stop a set.', 'Example: if you stop at 10 reps and could have done 2 more, that set was "2 RIR". For muscle growth, most sets should end at **1 to 3 RIR**.'] },
  { id: 'rpe', t: 'RPE (Rate of Perceived Exertion)', alt: ['what is rpe', 'what does rpe mean', 'rate of perceived exertion', 'rpe scale', 'how hard should a set feel'],
    d: ['**RPE** rates how hard a set felt on a 1 to 10 scale, with 10 meaning nothing left (failure).', 'It lines up with RIR: **RPE 10 = 0 reps left, RPE 9 = 1 left, RPE 8 = 2 left, RPE 7 = 3 left.** Most working sets land at RPE 7 to 9.'] },
  { id: 'hypertrophy', t: 'Hypertrophy', alt: ['what is hypertrophy', 'muscle hypertrophy meaning', 'what does hypertrophy mean', 'hypertrophy training', 'hypertrophy vs strength'],
    d: ['**Hypertrophy** is the scientific word for muscle growth.', '"Hypertrophy training" usually means sets of about 6 to 20 reps taken close to failure with moderate rest. Strength training uses heavier weights and lower reps.'] },
  { id: 'overload', t: 'Progressive overload', alt: ['what is progressive overload', 'progressive overload explained', 'explain progressive overload', 'how does progressive overload work', 'overload principle', 'how do i progressively overload'],
    d: ['Progressive overload simply means gradually making your workouts more challenging. You can do this by lifting more weight, performing more reps, doing more sets, or improving your technique over time.', 'Example: last week you did 40 kg for 8 reps. This week try 40 kg for 9 reps, or 42.5 kg for 8.'],
    simple: ['Make your workouts a little harder over time: a bit more weight, one more rep or one more set.'] },
  { id: 'superset', t: 'Superset', alt: ['what is a superset', 'what does superset mean', 'supersets', 'giant set', 'super sets'],
    d: ['A **superset** is two exercises done back to back with no rest between them.', 'Example: a biceps curl followed straight away by a triceps pushdown, then you rest. It saves time. Straight sets with rest work just as well for most people.'] },
  { id: 'dropset', t: 'Drop set', alt: ['what is a drop set', 'what does drop set mean', 'drop sets', 'dropset'],
    d: ['A **drop set** is when you take a set to failure, drop the weight by about 20 to 30%, and keep going right away.', 'Example: 20 kg lateral raises to failure, then 15 kg to failure. It adds fatigue quickly, so use it sparingly on the last set of safe exercises.'] },
  { id: 'volume', t: 'Training volume', alt: ['what is training volume', 'what does volume mean in lifting', 'how do i calculate volume', 'volume in lifting', 'workout volume', 'total volume'],
    d: ['**Training volume** is the total amount of work you do. It can be counted as hard sets per muscle per week, or as weight × reps × sets.', 'Example: 3 sets of 10 at 50 kg is 1,500 kg of volume. For growth, about 10 to 20 hard sets per muscle per week is a good range.'] },
  { id: 'intensity', t: 'Training intensity', alt: ['what is training intensity', 'what does intensity mean in lifting', 'what is intensity', 'workout intensity', 'percent of 1rm'],
    d: ['**Intensity** in lifting means how heavy the weight is compared with your max (like 80% of your 1RM). In everyday talk it can also mean how hard a set feels.', 'Heavier weight with lower reps is higher intensity. Lighter weight with higher reps is lower intensity, but can still be hard if you go near failure.'] },
  { id: 'eccentric', t: 'Eccentric phase', alt: ['what is eccentric', 'eccentric phase', 'what is the negative phase', 'negative reps', 'eccentric contraction', 'lowering phase meaning'],
    d: ['The **eccentric phase** is the lowering part of a rep, when the muscle lengthens under tension.', 'Example: lowering the bar to your chest on bench press. Controlling it for 2 to 3 seconds is great for muscle growth.'] },
  { id: 'concentric', t: 'Concentric phase', alt: ['what is concentric', 'concentric phase', 'concentric contraction', 'lifting phase meaning'],
    d: ['The **concentric phase** is the lifting part of a rep, when the muscle shortens as it overcomes the weight.', 'Example: pressing the bar up on the bench, or curling a dumbbell up.'] },
  { id: 'isometric', t: 'Isometric exercise', alt: ['what is isometric', 'isometric exercise', 'what does isometric mean', 'isometric hold', 'static hold'],
    d: ['An **isometric exercise** is when the muscle works but the joint does not move. You hold a position.', 'Example: a plank, a wall sit, or pausing at the bottom of a squat.'] },
  { id: 'deload', t: 'Deload', alt: ['what is a deload', 'what does deload mean', 'deload week', 'how to deload', 'when should i deload', 'how often should i deload'],
    d: ['A **deload** is an easier week that lets fatigue clear. Cut your sets roughly in half or use about 10 to 20% less weight, keep the same exercises, and stop well short of failure.', 'Most people benefit from one every 4 to 8 weeks, or sooner if lifts keep dropping, joints ache, or sleep and motivation fall.'],
    f: ['Do I need a deload?'] },
  { id: 'tut', t: 'Time under tension', alt: ['what is time under tension', 'tut', 'what does time under tension mean', 'time under tension meaning'],
    d: ['**Time under tension (TUT)** is how long your muscle works during a set.', 'Example: 10 reps at 4 seconds each is 40 seconds of TUT. Controlled reps add tension, but the effort and progression matter more than counting seconds.'] },
  { id: 'double-progression', t: 'Double progression', alt: ['what is double progression', 'double progression method', 'how does double progression work'],
    d: ['**Double progression** means you progress in two steps: first reps, then weight.', 'Example: your range is 8 to 12. Start at 20 kg for 8, 8, 8. Next time try 9, 8, 8, and keep adding reps. When you reach 12, 12, 12, move to 22.5 kg and start again near 8.'] },
  { id: 'frequency', t: 'Training frequency', alt: ['what is training frequency', 'what does frequency mean in lifting'],
    d: ['**Training frequency** is how often you train a muscle or do a lift each week.', 'Example: bench press on Monday and Thursday is a frequency of 2. Two times a week per muscle is a good default.'] },
  { id: 'compound', t: 'Compound exercise', alt: ['what does compound mean', 'compound exercise meaning'], ref: 'mus-compound' },
  { id: 'failure', t: 'Failure', alt: ['what does failure mean', 'muscle failure meaning'], ref: 'sr-failure' },
  { id: 'doms', t: 'DOMS', alt: ['what is doms', 'what does doms mean', 'doms meaning', 'delayed onset muscle soreness'], ref: 'rec-doms' }
];

COACH_GLOSSARY.forEach(g => {
  if (g.ref) {
    // The entry already exists; make sure dictionary-style questions reach it.
    const e = COACH_KB2.find(x => x.id === g.ref);
    if (e) { e.alt.push(...g.alt); e.cats = (e.cats || []).concat('glossary'); e.term = g.t; }
    return;
  }
  coachKb('glossary', 'gl-' + g.id, 'What is ' + g.t + '?', g.alt, g.d, { term: g.t, simple: g.simple, f: g.f, rel: ['gl-rir', 'gl-overload'].filter(x => x !== 'gl-' + g.id).slice(0, 1) });
});
