/* ============================================
   ARSA — Coach knowledge: muscles, anatomy, recovery and soreness
   ============================================ */

// ============================================================ C. Muscles

coachKb('muscles', 'mus-chest-vs-shoulder', 'What is the difference between chest and shoulder exercises?',
  ['chest vs shoulder exercises', 'chest or shoulders bench press', 'does bench press work shoulders', 'chest exercises and shoulder exercises difference', 'is bench press a chest or shoulder exercise'],
  [
    '**Chest exercises** push your arms forward and across your body: bench press, push-ups, flyes. Your elbows move in front of or in line with your torso.',
    '**Shoulder exercises** lift your arms up and out: overhead press, lateral raises, rear delt flyes. The weight moves overhead or out to the sides.',
    'They overlap. Presses like the bench also use your front shoulders and triceps. Overhead pressing uses your shoulders most and the upper chest a bit.'
  ],
  { rel: ['mus-upper-chest', 'mus-wider-shoulders'] });

coachKb('muscles', 'mus-upper-chest', 'What exercises target the upper chest?',
  ['upper chest exercises', 'how to build upper chest', 'incline press for upper chest', 'best exercise for upper pecs', 'how do i grow my upper chest', 'upper pecs'],
  [
    'Pressing at an incline hits the upper chest well. Good options:',
    '- **Incline dumbbell or barbell press** at a low angle (15 to 30 degrees).\n- **Low-to-high cable fly** (cables start low, finish up in front of your face).\n- **Incline machine press.**\n- **Push-ups with your feet raised.**',
    'Keep the bench angle low. A steep incline shifts work to the shoulders. Pair this with a flat press so the whole chest grows.'
  ],
  { rel: ['ex-incline', 'mus-chest-vs-shoulder'] });

coachKb('muscles', 'mus-arms', 'How do I grow bigger arms?',
  ['how can i grow my biceps', 'best way to increase arm size', 'how do i develop my arms', 'how to build bigger biceps', 'how to get bigger arms', 'arm workout for size', 'build bigger arms', 'bigger biceps and triceps', 'arm size'],
  [
    'Arms respond to simple, hard work. The triceps make up about two thirds of your upper arm, so train both.',
    '- **Biceps:** curls (barbell or dumbbell) plus a hammer or incline curl.\n- **Triceps:** a pushdown plus an overhead extension or skull crusher.\n- **Volume:** about 8 to 12 hard sets per week for each, spread over 2 days.\n- **Progress:** add reps or small weight over time, with a full range and slow lowering.',
    'Your presses and rows also work the arms, so do not skip those. Eat enough protein and calories, since muscle needs food.'
  ],
  {
    simple: ['Do curls for biceps and pushdowns for triceps, twice a week, and add reps or weight over time. Triceps are most of your arm.'],
    ask: {
      key: 'stage', text: 'Are you currently bulking, cutting, or maintaining your weight?',
      opts: [
        { l: 'Bulking', v: 'bulking', re: /\b(bulk|bulking|surplus|gaining)\b/, a: ['Bulking is the best time to grow. Keep the surplus small (about 250 to 500 kcal over maintenance) so most of the gain is muscle.'] },
        { l: 'Cutting', v: 'cutting', re: /\b(cut|cutting|deficit|losing|lose)\b/, a: ['In a deficit, aim to keep your muscle and keep lifting heavy. Growth is slower. Keep protein high (1.6 to 2.2 g per kg).'] },
        { l: 'Maintaining', v: 'maintaining', re: /\b(maintain|maintaining|maintenance|neither|recomp)\b/, a: ['At maintenance, beginners can still build muscle slowly. Make sure you train hard and get enough protein.'] }
      ]
    },
    plan: ['Pick 1 biceps and 1 triceps exercise, do 3 sets each after your main lifts, 2 times a week, and add a rep each session.'],
    rel: ['mus-bi-vs-tri', 'ex-curl', 'nut-protein']
  });

coachKb('muscles', 'mus-rear-delts', 'What exercises target the rear delts?',
  ['rear delt exercises', 'how to train rear delts', 'rear shoulder exercises', 'back of shoulders exercises', 'best rear delt exercise'],
  [
    'Good rear delt exercises:',
    '- **Reverse pec deck** (easiest to feel)\n- **Rear delt fly** with dumbbells or cables\n- **Face pulls**\n- **Rows** with elbows flared out to about 45 to 90 degrees',
    'Use light weights and slow reps. 2 to 3 sets, 2 times a week, with a squeeze at the top.'
  ],
  { rel: ['ex-reardelt', 'mus-wider-shoulders'] });

coachKb('muscles', 'mus-bi-vs-tri', 'What is the difference between biceps and triceps?',
  ['biceps vs triceps', 'biceps and triceps difference', 'what do biceps do', 'what do triceps do', 'which muscle is bigger biceps or triceps'],
  [
    '**Biceps** (front of the upper arm) bend your elbow and help turn your palm up. You use them when you pull or curl.',
    '**Triceps** (back of the upper arm) straighten your elbow. You use them when you push or press.',
    'The triceps are bigger, so training them is the fastest route to bigger arms.'
  ],
  { rel: ['mus-arms'] });

coachKb('muscles', 'mus-lats', 'How do I train my lats?',
  ['best exercises for lats', 'how to build a wider back', 'lat exercises', 'how to grow lats', 'wide back workout', 'how do i get a v taper'],
  [
    'The lats are the big wing-shaped muscles on the sides of your back. They respond to **pulling your elbows down**:',
    '- **Pull-ups or chin-ups** (use an assisted machine or band if needed)\n- **Lat pulldowns** (wide or neutral grip)\n- **One-arm dumbbell rows** and **seated cable rows**\n- **Straight-arm pulldowns** to finish',
    'Think "elbows to hips" instead of "hands to chest", and control the way up. 10 to 15 hard sets per week works well.'
  ],
  { rel: ['ex-pulldown', 'ex-pullup'] });

coachKb('muscles', 'mus-compound', 'What are compound exercises?',
  ['compound lifts', 'compound movements', 'what is a compound exercise', 'examples of compound exercises'],
  [
    '**Compound exercises** use more than one joint and several muscles at once, like squats, deadlifts, bench presses, rows and pull-ups.',
    'They let you lift the most weight, work a lot of muscle in less time, and should be the base of your workout. Do them first, when you are fresh.'
  ],
  { rel: ['mus-isolation'] });

coachKb('muscles', 'mus-isolation', 'What are isolation exercises?',
  ['isolation lifts', 'what is an isolation exercise', 'examples of isolation exercises', 'isolation vs compound', 'compound vs isolation'],
  [
    '**Isolation exercises** use one joint and mostly one muscle, like biceps curls, leg extensions, lateral raises and cable flyes.',
    'They are great for adding extra sets to a muscle without a lot of fatigue, and for targeting weak spots. Do them after your compound lifts.'
  ],
  { rel: ['mus-compound'] });

coachKb('muscles', 'mus-hamstrings', 'Which exercises target the hamstrings?',
  ['hamstring exercises', 'how to train hamstrings', 'best hamstring exercise', 'how do i grow my hamstrings', 'exercises for the back of my legs'],
  [
    'The hamstrings do two jobs: they bend your knee and extend your hip. A good routine covers both:',
    '- **Hip hinge:** Romanian deadlift, good morning, deadlift\n- **Knee bend:** lying or seated leg curl\n- Glute-ham raises and Nordic curls are tougher options',
    '2 to 3 sets of each, 2 times a week, with a slow lowering phase and a stretch at the bottom.'
  ],
  { rel: ['ex-rdl', 'ex-legcurl'] });

coachKb('muscles', 'mus-wider-shoulders', 'How do I build wider shoulders?',
  ['wider shoulders', 'bigger shoulders', 'how to get broader shoulders', 'shoulder width exercises', 'how do i get capped delts', 'best shoulder exercises for width'],
  [
    'Width comes mostly from the **side delts** (and your lats). Train:',
    '- **Lateral raises**, the main width builder (3 to 4 sets, 12 to 20 reps)\n- **Overhead press** for overall shoulder size\n- **Rear delt work** to balance the shoulder\n- **Pull-ups and pulldowns** for lat width',
    'Lateral raises respond to high reps, a full stretch and a slow lowering phase. Use light weights and keep your shoulders away from your ears.'
  ],
  { rel: ['ex-lateral', 'mus-rear-delts'] });

// ============================================================ D. Rest and recovery

coachKb('recovery', 'rec-rest-between', 'How long should I rest between workouts?',
  ['rest between workouts', 'how many rest days do i need', 'how many days off a week', 'how long to recover between sessions', 'rest day frequency', 'how long before i train the same muscle again'],
  [
    'Give a muscle about **48 hours (2 days)** before training it hard again. That is why splits rotate muscles.',
    'Most people do well with **1 to 3 rest days a week**. If you train 5 or more days, spread the rest days out, and make some of the sessions lighter.'
  ],
  { rel: ['rec-same-muscle', 'rec-rest-day'] });

coachKb('recovery', 'rec-doms', 'Why are my muscles sore after working out?',
  ['why am i sore', 'delayed onset muscle soreness', 'sore muscles after workout', 'is soreness normal', 'why do my muscles hurt the next day', 'muscle soreness', 'why am i so sore', 'sore after workout', 'why do my muscles ache the day after', 'muscles hurt the day after a workout'],
  [
    'This is called **DOMS** (delayed onset muscle soreness). It is small stress in the muscle fibers from new or harder exercise, especially the lowering part of lifts. It usually peaks **1 to 3 days** after the workout and fades.',
    'It is normal, especially when you start, return from a break or try a new exercise. You do not need to be sore to grow, and no soreness does not mean a bad workout.'
  ],
  {
    simple: ['Soreness after a hard or new workout is normal. It peaks 1 to 3 days later and fades.'],
    ask: {
      key: 'soreType', text: 'Is it normal muscle soreness, or sharp pain?',
      opts: [
        { l: 'Normal soreness', v: 'sore', re: /\b(normal|dull|achy|ache|stiff|sore)\b/, a: ['Good. Dull, achy soreness in the muscle that eases as you move is typical. Light movement like walking can help you feel better, and you can train other muscles in the meantime. Lower the weight if you are very sore.'] },
        { l: 'Sharp pain', v: 'sharp', re: /\b(sharp|stabbing|shooting|joint|burning|sudden|severe|pain)\b/, a: () => Coach._safeReply('sharp').p }
      ]
    },
    rel: ['rec-train-sore', 'rec-sore-vs-injury']
  });

coachKb('recovery', 'rec-train-sore', 'Should I exercise when I am still sore?',
  ['can i work out while sore', 'train sore muscles', 'should i work out if i am sore', 'is it ok to train when sore', 'working out sore'],
  [
    'If it is mild to moderate soreness, **yes**. Light movement often helps. If a muscle is so sore it limits your range or you cannot control the weight, train something else that day or lower the weight.',
    'Sharp pain, joint pain, or pain that is getting worse is not normal soreness. Stop and see the safety guidance.'
  ],
  { rel: ['rec-doms', 'rec-sore-vs-injury'] });

coachKb('recovery', 'rec-sleep', 'How much sleep do I need for muscle recovery?',
  ['sleep and muscle growth', 'how many hours of sleep to build muscle', 'does sleep matter for gains', 'poor sleep and training', 'sleep for recovery', 'recover faster'],
  [
    'Aim for **7 to 9 hours a night**. Muscle is built while you recover, not while you lift. Short sleep makes workouts feel harder, hurts strength and slows recovery.',
    'Keep a steady bedtime, avoid caffeine late in the day, and put your phone away. If you can only get 5 to 6 hours for a while, lower your workout volume a little.'
  ],
  { rel: ['rec-signs', 'rec-overtraining'] });

coachKb('recovery', 'rec-rest-day', 'What is a rest day?',
  ['rest days', 'do i need rest days', 'what should i do on a rest day', 'is it ok to skip the gym', 'active recovery'],
  [
    'A **rest day** is a day with no lifting. Your muscles repair and adapt to training on those days, so they are part of the program.',
    '**Active recovery** is easy movement like a walk, a bike ride or gentle stretching. It is fine and can help you feel better, as long as it does not leave you tired for your next workout.'
  ],
  { rel: ['rec-rest-between', 'rec-sleep'] });

coachKb('recovery', 'rec-same-muscle', 'Can I train the same muscle two days in a row?',
  ['train same muscle back to back', 'chest two days in a row', 'training the same muscle consecutive days', 'can i do legs two days in a row'],
  [
    'It is usually better not to. Hard training of the same muscle needs about **48 hours** to recover. Training it on back-to-back days can cut your performance and recovery.',
    'If you want to train every day, split the body so different muscles get worked (push, pull, legs, for example).'
  ],
  { rel: ['rec-rest-between', 'sr-frequency'] });

coachKb('recovery', 'rec-sore-vs-injury', 'What is the difference between muscle soreness and an injury?',
  ['soreness or injury', 'how do i know if it is an injury', 'is this pain or soreness', 'sore or hurt', 'am i injured or just sore', 'sore vs hurt', 'how can i tell if i am hurt'],
  [
    '**Normal soreness:** dull, achy, spread across a muscle, shows up 12 to 48 hours after training, and gets better with gentle movement. Both sides are usually sore.',
    '**Warning signs of something else:** sharp, stabbing or sudden pain; pain in a joint, tendon or bone; pain on only one side that stays; pain during the movement; swelling, bruising, numbness or tingling, or weakness; pain that gets worse or does not fade over a few days.',
    'I cannot tell you which one it is. If you have any of the warning signs, stop that exercise and have a doctor or physiotherapist check it.'
  ],
  { rel: ['rec-doms'] });

coachKb('recovery', 'rec-weaker', 'Why am I getting weaker during my workout?',
  ['getting weaker as the workout goes on', 'my strength drops during the workout', 'why do my reps drop each set', 'weak by the end of my workout', 'losing strength mid workout', 'why am i weaker on later sets'],
  [
    'Some drop is normal: each set tires the muscle, so reps usually fall a little from set 1 to set 3. A big drop is a sign that something is off.',
    '- **Rest more** (2 to 3 minutes on heavy lifts).\n- **Lower the first set weight** slightly so you do not burn out early.\n- **Eat something** 1 to 3 hours before and stay hydrated.\n- **Check your sleep** and how much volume you do before the lift.\n- **Order matters:** do your most important lift first.'
  ],
  {
    ask: {
      key: 'sleptWell', text: 'Did you sleep well before your workout?',
      opts: [
        { l: 'Yes', v: 'yes', re: /\b(yes|yeah|yep|slept well|good sleep|7|8|9)\b/, a: ['Then look at food, rest times and total volume. Having a meal with carbs and protein 1 to 3 hours before, and resting longer between hard sets, often fixes it.'] },
        { l: 'No', v: 'no', re: /\b(no|nope|bad|not really|poorly|barely|little|didnt)\b/, a: ['That is probably the main reason. Poor sleep lowers strength and makes sets feel harder. Lift a little lighter today, cut a set or two if needed, and make sleep a priority tonight.'] }
      ]
    },
    rel: ['pb-tired', 'rec-sleep']
  });

coachKb('recovery', 'rec-overtraining', 'What is overtraining?',
  ['am i overtraining', 'signs of overtraining', 'too much training', 'overtrained', 'training too much', 'overreaching', 'fatigue management'],
  [
    '**Overtraining** means doing more training than you can recover from, for a long time. It is less common than people think. Short-term tiredness after a hard block is normal and is called overreaching.',
    'Signs you may need more recovery: lifts dropping for 2 weeks or more, aching joints, poor sleep, low motivation, getting sick often, and resting heart rate that stays up.',
    'Fixes: sleep more, eat enough, cut volume by about half for a week (a **deload**), and take extra rest days. If tiredness lasts for weeks despite this, see a doctor.'
  ],
  { rel: ['gl-deload', 'rec-signs'] });

coachKb('recovery', 'rec-signs', 'What are signs of poor recovery?',
  ['signs of inadequate recovery', 'how do i know if i am recovering', 'do i need more rest', 'am i recovering enough', 'recovery signs', 'do i need a rest week'],
  [
    'Look for patterns that last more than a week or two:',
    '- Your lifts are stalling or going down.\n- You dread workouts or have low motivation.\n- Your sleep is poor even though you are tired.\n- Joints ache or you are sore for days.\n- You get sick more often.',
    'If you see several of these, cut volume for a week, sleep more and eat enough. Ask me "do I need a deload?" to check your own numbers.'
  ],
  { rel: ['gl-deload', 'rec-overtraining'] });
