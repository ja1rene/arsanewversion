/* ============================================
   ARSA — Coach knowledge: technique, sets, reps and progression
   Entries use coachKb(cat, id, question, otherWays, answer, options).
   See the schema at the top of coach-kb.js.
   ============================================ */

// ============================================================ A. Technique and form

coachKb('exercise', 'tech-bench-hands', 'Where should I position my hands during bench press?',
  ['bench press grip width', 'how wide should my grip be on bench', 'hand placement bench press', 'where do i grip the bar on bench', 'right grip for bench press', 'bench press grip', 'whats the right grip for bench'],
  [
    'Grip the bar **just wider than shoulder width**. A simple check: at the bottom of the rep, your forearms should be vertical when viewed from the front, with your wrists stacked over your elbows.',
    'Wrap your thumbs around the bar, and keep the bar low in your palm over your forearm bones, not back in your fingers.',
    '- Too narrow: more triceps, more elbow and wrist strain.\n- Too wide: more shoulder strain and a shorter range.'
  ],
  { simple: ['Hold the bar a little wider than your shoulders. At the bottom of the rep your forearms should point straight up.'], rel: ['tech-db-vs-bb', 'tech-elbows'] });

coachKb('exercise', 'tech-squat-depth', 'How deep should I squat?',
  ['squat depth', 'how low should i go in a squat', 'do i need to squat to parallel', 'ass to grass squat', 'is half squat ok', 'how far down should i squat'],
  [
    'A good target is **thighs about parallel to the floor or a little lower**. Go as deep as you can while keeping your heels flat, your back neutral (no tucking under at the bottom) and your knees tracking over your toes.',
    'Deeper squats work more of your glutes and quads through a larger range and are fine if you control them. If your depth is limited, it is usually ankle or hip mobility. Lower the weight, widen your stance a little, or raise your heels on small plates, and work on it over time.',
    'Quarter squats with heavy weight skip most of the benefit, so use a weight that lets you reach a consistent depth.'
  ],
  { simple: ['Squat until your thighs are about parallel to the floor, or lower if you stay controlled with your heels down and your back neutral.'], rel: ['ex-squat', 'tech-back-straight'] });

coachKb('exercise', 'tech-back-straight', 'Should my back be straight when lifting?',
  ['keep back straight lifting', 'is rounding my back bad', 'neutral spine', 'back position when lifting', 'rounded back deadlift'],
  [
    'Aim for a **neutral spine**, which means your back keeps its natural shape: not rounded forward and not over-arched. It does not mean stiff like a board.',
    'Bend at the hips and knees, brace your stomach before the rep and keep your chest up. If your back rounds as the weight gets hard, the weight is too heavy for now. Lower it and rebuild.',
    'A little movement in your upper back is normal on some lifts. A rounding lower back under heavy load is the thing to avoid.'
  ],
  { simple: ['Keep your back in its natural shape, brace your stomach, and bend at the hips. If your back rounds, lower the weight.'], rel: ['ex-deadlift', 'tech-breathing'] });

coachKb('exercise', 'tech-breathing', 'How do I breathe when lifting weights?',
  ['breathing while lifting', 'when do i breathe in and out', 'should i hold my breath when lifting', 'breathe during squat', 'breathing technique lifting', 'exhale on the way up'],
  [
    'A simple rule: **breathe out on the effort** (pushing or pulling), **breathe in on the way back**. Never stop breathing for long.',
    'On heavy squats, deadlifts and presses, many lifters take a big breath into the belly, brace the stomach and hold it through the hardest part of the rep, then exhale at the top. That bracing keeps your spine stable.',
    'If you have high blood pressure, a heart condition or you feel dizzy, skip the breath-holding and breathe out through the effort. Ask a doctor if you are unsure.'
  ],
  { simple: ['Breathe out when you push or pull, breathe in when you lower. Do not hold your breath for long.'], rel: ['tech-back-straight', 'tech-control'] });

coachKb('exercise', 'tech-elbows', 'Should I lock my elbows during exercises?',
  ['do i lock out my elbows', 'lockout elbows bench press', 'locking elbows hyperextend', 'should i fully extend my arms', 'is locking out bad'],
  [
    'You can **straighten your arms fully** at the top, but do not slam into the lockout or hyperextend. Keep the muscle in control at the end of the rep.',
    'On isolation moves like curls, pushdowns and flyes, keep a **slight bend** at the top so tension stays on the muscle and the joint is not forced.',
    'Stop a hair before straight if you feel a pinch in the elbow.'
  ],
  { simple: ['Straighten smoothly, never snap into the lockout. On isolation exercises keep a soft bend.'], rel: ['tech-control'] });

coachKb('exercise', 'tech-form-check', 'How do I know if my form is correct?',
  ['am i doing this right', 'is my form good', 'how to check my form', 'form check', 'how do i know i am lifting correctly', 'bad form signs'],
  [
    'Four quick checks:',
    '- **Film yourself** from the side and from the front, and compare to the form guide.\n- **Control:** you can lower the weight slowly and stop at any point.\n- **Range:** the same full range on every rep, with no bouncing or swinging.\n- **Feel:** you feel the target muscle working, with no sharp or joint pain.',
    'If the last reps get sloppy, the weight is too heavy. Lower it and earn it back.'
  ],
  {
    ask: {
      key: 'equip', text: 'Which equipment are you using?',
      opts: [
        { l: 'Barbell', v: 'barbell', re: /\b(barbell|bar|rack)\b/, a: ['With a barbell, film from the side and check that the bar travels in a straight line over your mid-foot (squat, deadlift) or stays over your elbows and wrists (bench). Use safety arms for squats and bench.'] },
        { l: 'Dumbbells', v: 'dumbbell', re: /\b(dumbbell|dumbbells|db)\b/, a: ['With dumbbells, check that both sides move at the same speed and range. Start with a lighter weight than a barbell, and do not let the weights swing.'] },
        { l: 'Machine', v: 'machine', re: /\b(machine|cable|cables|smith)\b/, a: ['Machines guide the path, so set the seat so the joint lines up with the machine pivot, and control the way back. Your focus is feeling the right muscle work.'] }
      ]
    },
    rel: ['tech-control', 'tech-back-straight']
  });

coachKb('exercise', 'tech-db-vs-bb', 'What is the difference between dumbbell and barbell bench press?',
  ['dumbbell vs barbell bench', 'barbell or dumbbell bench press', 'which is better dumbbell or barbell bench', 'dumbbells or barbell for chest', 'db bench vs bb bench'],
  [
    '**Barbell:** lets you lift the heaviest weight, is easy to add small jumps to, and is good for tracking strength.',
    '**Dumbbells:** each arm works on its own (which helps balance out a stronger side), allow a deeper stretch and a more natural arm path, and are often easier on the shoulders. You can also put them down safely if you fail.',
    'You do not have to pick one. Many people use the barbell for strength and dumbbells for extra volume. Dumbbells need about 10 to 20% less weight in each hand than the equivalent barbell.'
  ],
  { simple: ['Barbell: heavier, easier to progress. Dumbbells: deeper stretch, each side works alone. Both build chest well.'], rel: ['tech-bench-hands', 'ex-bench'] });

coachKb('exercise', 'tech-curl-swing', 'How do I avoid swinging when doing bicep curls?',
  ['stop swinging during curls', 'cheating on bicep curls', 'my body swings when i curl', 'curls momentum', 'how to stop using momentum curls', 'strict curl form'],
  [
    'Swinging usually means the weight is too heavy. Try these:',
    '- **Drop the weight** by 10 to 20% and keep every rep strict.\n- **Pin your elbows** to your sides and keep them there.\n- **Stand with your back against a wall**, or sit on a bench, so you cannot lean.\n- **Squeeze your stomach and glutes** to hold your torso still.\n- **Lower slowly** over 2 to 3 seconds.',
    'A little body English on the last rep or two of a set is fine as an advanced technique, but not on every rep.'
  ],
  { simple: ['Use a lighter weight, keep your elbows at your sides, and put your back against a wall so you cannot swing.'], rel: ['ex-curl'] });

coachKb('exercise', 'tech-control', 'Should I control the weight when lowering it?',
  ['lowering phase', 'how fast should i lift', 'negatives', 'tempo for lifting', 'should i lower slowly', 'how long should a rep take', 'slow reps'],
  [
    'Yes. Lower the weight **under control, about 2 to 3 seconds**, then lift with a firm, smooth push. The lowering part is where a lot of muscle growth happens, and controlling it protects your joints.',
    'Do not drop the weight or bounce out of the bottom. A rep should take roughly 3 to 5 seconds in total for most exercises.'
  ],
  { simple: ['Lower slowly over 2 to 3 seconds, then lift smoothly. Do not drop or bounce the weight.'], rel: ['tech-form-check', 'gl-eccentric'] });

coachKb('exercise', 'tech-warmup', 'How do I warm up before lifting?',
  ['warm up', 'warmup routine', 'what is a good warm up', 'do i need to warm up', 'warm up sets', 'warming up before lifting'],
  [
    'Spend 3 to 5 minutes on light cardio or easy movement, then do **2 or 3 ramp-up sets** on your first lift with fewer reps each time, for example about 50%, 70% and 85% of your working weight.',
    'Later exercises need little or no warm-up. Warm-up sets should feel easy and never tire you out.'
  ],
  { simple: ['A few minutes of easy movement, then a couple of lighter sets of your first lift before the real weight.'], rel: ['tech-form-check', 'sr-sets-per-exercise'] });

coachKb('exercise', 'tech-spotter', 'Can I train alone safely? Do I need a spotter?',
  ['do i need a spotter', 'train alone', 'what if i fail a rep', 'safe to lift alone', 'stuck under the bar', 'how to bail out of a squat', 'safety bars'],
  [
    'Training alone is fine if you set up safely. Use the **safety arms or pins** in a rack for squats and bench, and learn how to bail out of a failed rep before you need to. Heavy bench with no safeties or spotter is the riskiest.',
    'On machines and with dumbbells you can usually just put the weight down.'
  ],
  { rel: ['ex-bench', 'ex-squat'] });

coachKb('exercise', 'tech-gear', 'Do I need a lifting belt, straps or special shoes?',
  ['lifting belt', 'wrist wraps', 'lifting straps', 'lifting shoes', 'knee sleeves', 'chalk', 'gym gloves', 'what gear do i need'],
  [
    'Most gear is optional. A **belt** can help on very heavy squats and hinges. **Straps** help when your grip fails before your back does. **Flat, firm shoes** are better than cushioned running shoes for squats.',
    'Build technique first and add gear only when something specific is limiting you.'
  ]);

coachKb('exercise', 'tech-stretching', 'Should I stretch before or after lifting?',
  ['stretching', 'mobility work', 'flexibility', 'static stretching', 'dynamic stretching'],
  ['Dynamic movement before lifting (leg swings, arm circles, light sets) is more useful than long static stretches. Static stretching after training is optional. Lifting through a full range of motion also builds flexibility.']);

// ============================================================ B. Sets, reps and progression

coachKb('sets_reps', 'sr-sets-per-exercise', 'How many sets should I do per exercise?',
  ['how many sets per exercise', 'how many sets should i do', 'sets per exercise', 'number of sets', 'how many sets is enough'],
  [
    'For most exercises, **2 to 4 hard sets** is a good range. Your first exercise for a muscle can take 3 to 4, and later ones 2 to 3.',
    'What counts is the total per muscle per week (see the weekly sets answer), not any single number. If your sets are hard and you can still recover, you are doing enough.'
  ],
  { simple: ['Do 2 to 4 hard sets of each exercise. Start with 3.'], rel: ['sr-weekly-sets', 'sr-3x10'] });

coachKb('sets_reps', 'sr-reps-growth', 'How many repetitions are best for muscle growth?',
  ['how many reps should i do', 'best rep range for muscle', 'how many reps to build muscle', 'rep range for hypertrophy', 'how many reps for muscle growth', 'what reps are best', 'low reps or high reps', 'reps for strength', 'what rep range should i use'],
  [
    'For muscle growth, **8 to 12 reps** is a useful starting range. Choose a weight that lets you keep good form and finish each set with about **1 to 3 reps left in reserve**.',
    'You can also build muscle with lower reps (like 5 to 6) and higher reps (like 15 to 30), as long as the sets are close enough to failure. Heavy sets of 1 to 5 are best for pure strength.',
    'A practical mix: main lifts around 5 to 10 reps, accessories and isolation around 10 to 15.'
  ],
  { simple: ['8 to 12 reps is a good place to start. Pick a weight that leaves you 1 to 3 reps short of failure.'], rel: ['gl-rir', 'sr-weight-or-reps', 'sr-sets-per-exercise'] });

coachKb('sets_reps', 'sr-sets-vs-reps', 'What is the difference between sets and reps?',
  ['sets and reps', 'what is a rep', 'what is a set', 'what do 3x10 mean', 'what does 3 sets of 10 mean', 'reps vs sets'],
  [
    'A **rep** (repetition) is one full movement, like one squat down and up. A **set** is a group of reps done in a row before you rest.',
    'Example: "3 sets of 10 reps" means you do 10 reps, rest, do 10 more, rest, and do 10 more, for 30 reps in total.'
  ],
  { rel: ['sr-sets-per-exercise', 'sr-reps-growth'] });

coachKb('sets_reps', 'sr-weekly-sets', 'How many sets per muscle should I do each week?',
  ['sets per muscle per week', 'weekly sets', 'how much volume per muscle', 'how many sets per week', 'volume per muscle group', 'how many sets per muscle'],
  [
    'A good target for most people is about **10 to 20 hard sets per muscle group per week**. Beginners grow well on 6 to 10. More is not better if you cannot recover from it.',
    'Spread the sets over 2 or more sessions, rather than all in one day.',
    'Ask me "which muscles am I neglecting?" and I will count your own sets per muscle.'
  ],
  { rel: ['sr-frequency', 'gl-volume'] });

coachKb('sets_reps', 'sr-add-weekly', 'How much weight should I add every week?',
  ['how much should i increase weight each week', 'weight jumps', 'how much weight to add', 'how fast should i progress', 'how much to add to the bar', 'smallest weight increase'],
  [
    'There is no fixed number. A common guide is **2.5 kg (5 lb) for upper body lifts and 5 kg (10 lb) for lower body lifts** when you hit the top of your rep range. Smaller jumps (1 to 1.25 kg) are fine for isolation lifts, or use micro-plates.',
    'You will not be able to add weight every week for long. Beginners can often add small amounts each session at first, and progress slows over time. Adding one rep counts as progress too.'
  ],
  { plan: ['Pick a rep range, stay at one weight until you hit the top of it on every set, then add the smallest jump and start again.'], rel: ['sr-weight-or-reps', 'gl-double-progression'] });

coachKb('sets_reps', 'sr-weight-or-reps', 'Should I increase weight or repetitions first?',
  ['weight or reps first', 'add reps or weight', 'increase reps before weight', 'what should i progress first', 'more reps or more weight'],
  [
    'Reps first, then weight. This is called **double progression**: stay at one weight and add reps each session until you reach the top of your rep range on every set. Then increase the weight a little and drop back to the bottom of the range.',
    'Example: 3 sets of 8 to 12 at 20 kg. When you hit 12, 12, 12, move to 22.5 kg and aim for 8 again.'
  ],
  { simple: ['Add reps first. When you hit the top of your rep range on every set, add a little weight.'], rel: ['gl-double-progression', 'sr-when-increase'] });

coachKb('sets_reps', 'sr-when-increase', 'How do I know when to increase the weight?',
  ['when should i increase my weight', 'when should i lift heavier', 'should i add more weight', 'am i ready for more weight', 'when to go up in weight', 'should i go heavier', 'when should i add weight', 'when do i add weight', 'when to add weight', 'when do i go up in weight'],
  (ctx) => {
    const out = [
      'Increase the weight when you can **complete all your target reps on every set with good form and still have 1 to 2 reps in reserve**, and this happens for a session or two in a row.',
      'If the last rep was slow, shaky or sloppy, stay at that weight. If the weight felt easy and your reps were smooth, go up a small step.'
    ];
    out.push(...Coach._recorded(ctx.ex || (Coach._conv && Coach._conv.ex)));
    return out;
  },
  { simple: ['If you hit all your reps with good form and have a couple reps left, add a small amount of weight next time.'], dataIntent: 'next', dataWhen: /^(should i|can i|am i ready|is it time|do i)\b|\bmy\b/, rel: ['sr-add-weekly', 'gl-rir'] });

coachKb('sets_reps', 'sr-failure', 'What does training to failure mean?',
  ['what is failure', 'train to failure', 'what is muscle failure', 'should i train to failure', 'should i go to failure on every set', 'lift until failure', 'failure on every set'],
  [
    '**Failure** means you cannot complete another rep with good form, even though you try.',
    'You do not need to hit failure on every set. Most sets should stop about **1 to 3 reps before failure**, which is hard enough to grow and easier to recover from. Save sets close to failure for the last set of safer exercises like machines, cables and dumbbells.',
    'Avoid failure on heavy barbell squats, deadlifts and bench unless you have safety bars or a spotter.'
  ],
  { simple: ['Failure is when you cannot do another good rep. Stop most sets 1 to 3 reps short of it.'], rel: ['gl-rir', 'sr-rest'] });

coachKb('sets_reps', 'sr-rest', 'How long should I rest between sets?',
  ['rest between sets', 'rest time between sets', 'how long to rest', 'rest period', 'how many minutes rest between sets', 'rest timer'],
  [
    'About **2 to 3 minutes** for heavy compound lifts like squats and presses, and **60 to 90 seconds** for isolation work like curls and raises. Longer rests usually let you do more reps on the next set.',
    'In Arsa you can set the rest time for each exercise in the workout builder, and adjust it with the minus 15, plus 15 and Skip buttons during a rest.'
  ],
  { simple: ['Rest 2 to 3 minutes on big lifts and about 1 minute on small ones.'], rel: ['sr-3x10'] });

coachKb('sets_reps', 'sr-3x10', 'Is doing 3 sets of 10 reps enough?',
  ['3 sets of 10', 'is 3x10 enough', 'is 3 sets enough', '3x10 good', 'are 3 sets of 10 reps enough to build muscle'],
  [
    '3 sets of 10 is a **great starting point**, and it is enough for beginners if the sets are hard (you finish with 1 to 3 reps in reserve) and you add weight or reps over time.',
    'As you get more advanced, you will probably need more total sets per muscle per week. The number matters less than effort and steady progress.'
  ],
  { rel: ['sr-weekly-sets', 'sr-when-increase'] });

coachKb('sets_reps', 'sr-cant-finish', 'What should I do if I cannot complete all my reps?',
  ['cant finish my reps', 'failing reps', 'i cannot hit my target reps', 'missing reps', 'not finishing my sets', 'unable to complete reps', 'what if i miss reps'],
  [
    'That is normal and not a failure. Here is what to do:',
    '1. **Finish with the reps you can do** with good form. Do not cheat to hit the number.\n2. **Rest a bit longer** between sets (2 to 3 minutes).\n3. **Drop the weight 5 to 10%** for the next set if needed.\n4. **Next session**, try the same weight again and aim for one more rep before changing anything.',
    'If you miss reps for 2 or 3 sessions in a row, lower the weight or check your sleep and food.'
  ],
  { rel: ['pb-weaker-today', 'pb-plateau'] });

coachKb('sets_reps', 'sr-frequency', 'How many times per week should I train each muscle?',
  ['training frequency', 'how often should i train a muscle', 'how many days a week should i train', 'how often should i work out', 'how many times a week should i hit each muscle', 'how many days should i lift', 'how often to train'],
  [
    'Training each muscle about **2 times a week** is a solid default. Three to five workout days a week works for most people.',
    'Consistency beats the perfect plan: the best schedule is the one you actually keep. If you are unsure, start with 3 full body days with a rest day between them.'
  ],
  { act: [{ label: 'See training splits', type: 'nav', screen: 'workouts' }], rel: ['pb-routine', 'rec-rest-between'] });

coachKb('sets_reps', 'sr-strength', 'How do I get stronger?',
  ['how do i increase my strength', 'how to get stronger', 'increase strength', 'gain strength', 'build strength fast'],
  [
    'Get stronger by **practicing the lifts often and adding a little more over time**. That is progressive overload.',
    '- Train the main lifts 2 times a week or more.\n- Use sets of about 3 to 8 reps on your main lifts with good form.\n- Add small amounts of weight or one more rep when you can.\n- Sleep 7 to 9 hours and eat enough protein and calories.'
  ],
  {
    simple: ['Do your main lifts twice a week, add a little weight or a rep when you can, and sleep and eat well.'],
    ask: {
      key: 'workingWeight', text: 'What is your current working weight on the lift you want to improve? (a number, like 40)',
      opts: [
        {
          l: 'I will type it', v: 'ask', re: /(\d+(?:\.\d+)?)/, num: true,
          a: (m) => {
            const w = parseFloat(m[1]); const kg = Store.data.settings.units === 'kg';
            const step = kg ? 2.5 : 5;
            return [`At ${Coach._n(w)} ${Store.data.settings.units}, a good next step is **${Coach._n(w + step)} ${Store.data.settings.units}** once you can do all your target reps with good form and about 2 reps left over.`, 'Until then, add a rep at a time at the same weight.'];
          }
        }
      ]
    },
    rel: ['sr-when-increase', 'sr-add-weekly']
  });

coachKb('sets_reps', 'pb-routine', 'Can you give me a workout routine?',
  ['what routine should i follow', 'make me a program', 'what workout plan should i do', 'best workout routine', 'which split is best', 'which program should i follow', 'ppl or upper lower', 'full body or split', 'best training split'],
  [
    'Sure. The best split is the one you can follow for months.',
    '**Full body, 3 days:** simplest, great for beginners.\n**Upper / Lower, 4 days:** each muscle twice a week.\n**Push Pull Legs, 3 or 6 days:** lots of volume but needs more days.\n**Body part, 5 days:** each muscle once a week, better once you have a base.'
  ],
  {
    act: [{ label: 'See training splits', type: 'nav', screen: 'workouts' }],
    ask: {
      key: 'days', text: 'How many days a week can you train?',
      opts: [
        { l: '2 days', v: 2, re: /\b(2|two)\b/, a: ['With 2 days, do **full body** both days. Pick one squat or leg press, one push, one pull, one hinge, plus an ab or arm exercise. 3 sets each.'] },
        { l: '3 days', v: 3, re: /\b(3|three)\b/, a: ['3 days is ideal for beginners. Do **Full Body** (A/B/A one week, B/A/B the next) with a rest day between workouts. Arsa has a ready-made one.'] },
        { l: '4 days', v: 4, re: /\b(4|four)\b/, a: ['With 4 days, **Upper / Lower** is a great fit: upper, lower, rest, upper, lower. Each muscle gets trained twice a week.'] },
        { l: '5 days', v: 5, re: /\b(5|five)\b/, a: ['With 5 days, try **Upper / Lower plus a fifth day** for weak points, or a **Push / Pull / Legs / Upper / Lower** mix. Make sure at least 2 rest days are spread across the week.'] },
        { l: '6 days', v: 6, re: /\b(6|six|every day|daily)\b/, a: ['6 days works with **Push Pull Legs twice**, but needs good sleep and food. Keep the sets per workout moderate and take a deload when you feel run down.'] }
      ]
    },
    rel: ['sr-frequency', 'pb-30min']
  });
