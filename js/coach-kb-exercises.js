/* ============================================
   ARSA — Coach knowledge: exercises and muscle groups
   One record per exercise. The Coach turns each record into answers for
   "how do I do it", "what muscles does it work", "common mistakes",
   "breathing" and "beginner tips", so a fact is written once.

   Exercise record:
     id, name, al (names people use), grp (muscle group id)
     pri / sec  muscles worked
     eq         equipment
     setup      steps before the first rep
     steps      the movement itself
     br         breathing
     mist       common mistakes
     safe       safety note
     tips       beginner-friendly tips
     v          { dumbbell, barbell, machine, cable, bodyweight }: what changes
   ============================================ */

const COACH_EXERCISES = [

  // ------------------------------------------------------------ Chest
  {
    id: 'bench', name: 'Bench press', grp: 'chest',
    al: ['bench press', 'bench', 'flat bench', 'barbell bench', 'barbell bench press', 'flat bench press'],
    pri: ['Chest'], sec: ['Front shoulders', 'Triceps'], eq: 'Barbell, flat bench and a rack (ideally with safety arms)',
    setup: [
      'Lie on the bench with your eyes under the bar. Plant your feet flat on the floor.',
      'Pull your shoulder blades back and down, like squeezing a pencil between them, and keep a small natural arch in your upper back.',
      'Grip the bar just wider than shoulder width, wrapping your thumbs around it. Unrack it with straight arms over your shoulders.'
    ],
    steps: [
      'Lower the bar with control to the lower part of your chest, with elbows about 45 to 70 degrees from your body (not flared straight out).',
      'Touch lightly, keeping your wrists stacked over your elbows.',
      'Press the bar back up and slightly toward your face until your arms are straight.'
    ],
    br: 'Breathe in at the top, brace your stomach, lower the bar, then breathe out as you press up (or hold your breath briefly through the hardest part and exhale at the top).',
    mist: ['Bouncing the bar off your chest', 'Lifting your hips or head off the bench', 'Flaring the elbows straight out to the sides', 'Wrists bent back so the bar sits in your fingers', 'Going too heavy with a short half rep'],
    safe: 'Use safety arms or a spotter for heavy sets. Never put clips on the bar to "lock" a lift without a spotter, and never lift alone to failure with no safeties.',
    tips: ['Start with just the bar to learn the path.', 'Film a set from the side to check the bar path.', 'If it feels like only your shoulders work, lower the weight and focus on the squeeze between your shoulder blades.'],
    v: {
      dumbbell: 'Dumbbells let each arm move on its own and allow a deeper stretch. Keep the dumbbells over your elbows, lower until your upper arms are about level with the bench, and press up in a slight arc. Use lighter weight than the barbell and sit them on your thighs to kick them up into position.',
      machine: 'A chest press machine guides the path, so it is a good way to learn the movement and train close to failure safely. Set the seat so the handles line up with the middle of your chest.',
      bodyweight: 'The push-up is the bodyweight version of the bench press. See push-up.'
    }
  },
  {
    id: 'incline', name: 'Incline press', grp: 'chest',
    al: ['incline press', 'incline bench', 'incline bench press', 'incline dumbbell press', 'incline', 'upper chest press'],
    pri: ['Upper chest'], sec: ['Front shoulders', 'Triceps'], eq: 'Adjustable bench plus barbell or dumbbells',
    setup: [
      'Set the bench to a low incline, about 15 to 30 degrees. A steeper angle shifts the work to your shoulders.',
      'Sit back, pull your shoulder blades back and down, and plant your feet.',
      'Get the weight into position over your upper chest.'
    ],
    steps: [
      'Lower the weight with control to your upper chest.',
      'Keep your elbows at about 45 to 70 degrees from your body.',
      'Press up until your arms are straight, without shrugging your shoulders.'
    ],
    br: 'Breathe in as you lower, breathe out as you press.',
    mist: ['Bench set too steep, so it turns into a shoulder press', 'Shrugging the shoulders up toward the ears', 'Arching the lower back off the bench', 'Bouncing the weight'],
    safe: 'Dumbbells are easier to bail out of than a barbell on an incline. Lower them to your sides if a rep fails.',
    tips: ['Start lighter than your flat press.', 'Dumbbells are friendlier for beginners.'],
    v: { dumbbell: 'Dumbbells let you press in a natural arc and are easy to put down if a rep fails.', machine: 'An incline machine press keeps the path steady while you learn.' }
  },
  {
    id: 'pushup', name: 'Push-up', grp: 'chest',
    al: ['push up', 'pushup', 'push ups', 'pushups', 'press up', 'press ups'],
    pri: ['Chest'], sec: ['Front shoulders', 'Triceps', 'Core'], eq: 'None (bodyweight)',
    setup: [
      'Place your hands on the floor slightly wider than your shoulders, fingers pointing forward.',
      'Step your feet back so your body forms a straight line from head to heels.',
      'Tighten your stomach and glutes.'
    ],
    steps: [
      'Lower your chest toward the floor with elbows about 45 degrees from your body.',
      'Stop just above the floor.',
      'Push the floor away until your arms are straight.'
    ],
    br: 'Breathe in as you lower, breathe out as you push up.',
    mist: ['Hips sagging or piking up', 'Flaring the elbows out wide', 'Only moving through a small range', 'Head dropping forward'],
    safe: 'Stop if your wrists hurt and try the version on your fists or on parallel bars. Do not push through sharp joint pain.',
    tips: ['Too hard? Do them with your hands on a bench or a wall height you can control.', 'Aim for clean reps, then add reps before making them harder.'],
    v: { bodyweight: 'To make it easier, raise your hands on a bench. To make it harder, raise your feet or slow the lowering down.' }
  },
  {
    id: 'fly', name: 'Cable fly', grp: 'chest',
    al: ['cable fly', 'cable flies', 'chest fly', 'pec fly', 'fly', 'flies', 'dumbbell fly', 'pec deck'],
    pri: ['Chest'], sec: ['Front shoulders'], eq: 'Cable machine, dumbbells or a pec deck machine',
    setup: [
      'Set the pulleys around chest height and stand in a staggered stance with a slight lean forward.',
      'Hold the handles with a soft bend in your elbows.'
    ],
    steps: [
      'Open your arms out to the sides until you feel a stretch across your chest.',
      'Keep the same elbow bend throughout, like hugging a big tree.',
      'Squeeze your hands together in front of your chest, then return slowly.'
    ],
    br: 'Breathe in as you open, breathe out as you bring the handles together.',
    mist: ['Straightening and bending the elbows (turns it into a press)', 'Going too heavy and swinging the body', 'Stretching further than your shoulders are comfortable with'],
    safe: 'Stop the stretch where you feel it in your chest, not as pain at the front of your shoulder.',
    tips: ['Use light weight and slow reps.', 'This is a finishing exercise, not your main chest lift.']
  },

  // ------------------------------------------------------------ Back
  {
    id: 'pullup', name: 'Pull-up', grp: 'back',
    al: ['pull up', 'pullup', 'pull ups', 'pullups', 'chin up', 'chinup', 'chin ups', 'chinups'],
    pri: ['Lats (upper back)'], sec: ['Biceps', 'Rear shoulders', 'Forearms', 'Core'], eq: 'Pull-up bar (a band or assisted machine helps beginners)',
    setup: [
      'Hold the bar slightly wider than your shoulders with palms facing away (a chin-up uses palms facing you).',
      'Start from a hang with your shoulders pulled down away from your ears.'
    ],
    steps: [
      'Pull your elbows down toward your ribs until your chin is over the bar.',
      'Keep your chest up and avoid kicking your legs.',
      'Lower all the way down under control to a full hang.'
    ],
    br: 'Breathe out as you pull up, breathe in as you lower.',
    mist: ['Swinging or kipping to get up', 'Half reps that stop short of a full hang', 'Shrugging the shoulders up at the top', 'Craning the neck to reach the bar'],
    safe: 'Step down from the bar rather than dropping. Stop if you feel sharp pain in your shoulder or elbow.',
    tips: ['Cannot do one yet? Use an assisted machine, a band, or lower yourself slowly from the top (3 to 5 seconds).', 'Lat pulldowns build the same strength while you work toward your first pull-up.'],
    v: { bodyweight: 'Chin-ups (palms facing you) use a bit more biceps and are usually easier than pull-ups.' }
  },
  {
    id: 'pulldown', name: 'Lat pulldown', grp: 'back',
    al: ['lat pulldown', 'lat pull down', 'pulldown', 'pulldowns', 'lat pulldowns', 'pull down'],
    pri: ['Lats (upper back)'], sec: ['Biceps', 'Rear shoulders', 'Middle back'], eq: 'Lat pulldown machine with a bar',
    setup: [
      'Adjust the thigh pad so your legs are held firmly in place.',
      'Take a grip just wider than your shoulders and sit tall.',
      'Lean back very slightly and lift your chest.'
    ],
    steps: [
      'Start by pulling your shoulder blades down.',
      'Drive your elbows down and slightly back until the bar reaches your upper chest.',
      'Return the bar up slowly until your arms are straight and you feel the lats stretch.'
    ],
    br: 'Breathe out as you pull down, breathe in as the bar rises.',
    mist: ['Leaning far back and swinging', 'Pulling the bar behind the neck', 'Using the arms only and shrugging', 'Letting the weight yank your arms up'],
    safe: 'Pull to the front of your body, not behind your head, to protect your shoulders and neck.',
    tips: ['Think "elbows to hips", not "hands to chest".', 'Choose a weight that lets you control the way up.']
  },
  {
    id: 'row', name: 'Barbell row', grp: 'back',
    al: ['barbell row', 'bent over row', 'bent row', 'bent over barbell row', 'row', 'rows', 'dumbbell row', 'one arm row'],
    pri: ['Middle back', 'Lats'], sec: ['Rear shoulders', 'Biceps', 'Lower back', 'Forearms'], eq: 'Barbell or dumbbells',
    setup: [
      'Stand with feet about hip width apart with the bar over your mid-foot.',
      'Hinge at your hips (push them back) until your torso is leaning forward, with a flat, neutral back and soft knees.',
      'Grip the bar just outside your knees and lift it so your arms hang straight.'
    ],
    steps: [
      'Pull the bar toward your lower ribs, leading with your elbows.',
      'Squeeze your shoulder blades together at the top without leaning back.',
      'Lower the bar slowly until your arms are straight again.'
    ],
    br: 'Breathe in and brace before each rep, breathe out as you pull (or at the top).',
    mist: ['Jerking the weight up with the whole body', 'Rounding the lower back', 'Standing too upright', 'Pulling to the stomach with shrugged shoulders'],
    safe: 'Keep your back flat and stop the set when your torso starts to rise to move the weight. A supported row machine is a back-friendly option.',
    tips: ['Start light and film from the side.', 'If your lower back tires first, try a chest-supported or seated row.'],
    v: { dumbbell: 'A one-arm dumbbell row braced with a hand and knee on a bench is simpler to learn and lets you train each side separately.' }
  },
  {
    id: 'seatedrow', name: 'Seated cable row', grp: 'back',
    al: ['seated row', 'cable row', 'seated cable row', 'low row'],
    pri: ['Middle back', 'Lats'], sec: ['Rear shoulders', 'Biceps'], eq: 'Cable row machine',
    setup: [
      'Sit with your feet on the plates and knees slightly bent.',
      'Take the handle and sit tall with your chest up and a neutral back.'
    ],
    steps: [
      'Pull the handle to your stomach, driving your elbows back.',
      'Pause and squeeze your shoulder blades together.',
      'Let your arms straighten slowly, stretching your back without rounding it.'
    ],
    br: 'Breathe out as you pull, breathe in as you return.',
    mist: ['Rocking the torso back and forward to move the weight', 'Shrugging', 'Rounding over on the way forward'],
    safe: 'Keep your torso mostly still. If you must swing to finish the rep, the weight is too heavy.',
    tips: ['Think "elbows back", not "hands back".']
  },

  // ------------------------------------------------------------ Shoulders
  {
    id: 'ohp', name: 'Overhead press', grp: 'shoulders',
    al: ['overhead press', 'shoulder press', 'military press', 'ohp', 'dumbbell shoulder press', 'standing press'],
    pri: ['Front and side shoulders'], sec: ['Triceps', 'Upper chest', 'Core'], eq: 'Barbell or dumbbells (can be done seated or standing)',
    setup: [
      'Hold the weight at shoulder height with your forearms vertical and wrists straight.',
      'Squeeze your glutes and brace your stomach so your lower back does not arch.',
      'Tuck your chin slightly to let the bar path clear your face.'
    ],
    steps: [
      'Press the weight straight up and move your head forward under it once it passes your forehead.',
      'Finish with your arms straight, the weight over the middle of your feet.',
      'Lower it back to shoulder height under control.'
    ],
    br: 'Take a breath and brace before pressing, exhale at the top.',
    mist: ['Leaning back and turning it into an incline press', 'Flaring the ribs and arching the lower back', 'Pressing the bar in front of the body instead of overhead'],
    safe: 'Use a weight you can control without leaning back. Seated with back support is easier on the lower back.',
    tips: ['Start with dumbbells seated and light.', 'Stop a rep or two before form breaks down.'],
    v: { dumbbell: 'Dumbbells let your arms find a comfortable path. Press them up and slightly together.', machine: 'A shoulder press machine is a stable way to learn the movement.' }
  },
  {
    id: 'lateral', name: 'Lateral raise', grp: 'shoulders',
    al: ['lateral raise', 'lateral raises', 'side raise', 'side raises', 'side delt raise'],
    pri: ['Side shoulders (lateral delts)'], sec: ['Upper traps'], eq: 'Dumbbells or cables',
    setup: [
      'Stand tall with a dumbbell in each hand at your sides and a slight bend in your elbows.',
      'Lean forward just a little and keep your shoulders relaxed.'
    ],
    steps: [
      'Raise your arms out to the sides until your hands are about shoulder height.',
      'Lead with your elbows, not your hands.',
      'Lower slowly under control.'
    ],
    br: 'Breathe out as you raise, breathe in as you lower.',
    mist: ['Using momentum and swinging the body', 'Shrugging the shoulders up', 'Going far above shoulder height', 'Using weights that are too heavy'],
    safe: 'Light weights are enough. Stop if you feel pinching at the top of your shoulder.',
    tips: ['Start with very light dumbbells. This is a small muscle.', 'Think of pouring water out of a jug at the top.']
  },
  {
    id: 'reardelt', name: 'Rear delt fly', grp: 'shoulders',
    al: ['rear delt fly', 'reverse fly', 'face pull', 'face pulls'],
    pri: ['Rear shoulders'], sec: ['Upper back'], eq: 'Dumbbells, cables, or a reverse pec deck machine',
    setup: [
      'Hinge forward at the hips until your torso is nearly parallel to the floor (or sit on the machine facing the pad).',
      'Hold light weights with a soft bend in your elbows.'
    ],
    steps: [
      'Raise your arms out to the sides, leading with your elbows.',
      'Stop around shoulder height and squeeze your upper back.',
      'Lower slowly.'
    ],
    br: 'Breathe out as you lift, breathe in as you lower.',
    mist: ['Swinging the torso to lift', 'Using the traps and shrugging', 'Going too heavy'],
    safe: 'Keep the weights light and the movement smooth.',
    tips: ['The reverse pec deck is the easiest way to feel this muscle.', 'Face pulls with a rope also hit this area and the upper back.']
  },

  // ------------------------------------------------------------ Legs
  {
    id: 'squat', name: 'Squat', grp: 'quads',
    al: ['squat', 'squats', 'back squat', 'barbell squat', 'bodyweight squat', 'goblet squat', 'front squat'],
    pri: ['Quads', 'Glutes'], sec: ['Hamstrings', 'Lower back', 'Core', 'Calves'], eq: 'Barbell and a squat rack (or a dumbbell for goblet squats, or just bodyweight)',
    setup: [
      'Set the bar on your upper back (not your neck), with hands just outside your shoulders and elbows down.',
      'Step back with the bar and place your feet about shoulder width apart with toes turned out slightly.',
      'Take a breath, brace your stomach and keep your chest up.'
    ],
    steps: [
      'Sit down and back, bending your knees and hips together.',
      'Lower until your thighs are about parallel to the floor, or as low as you can go with a neutral back and your heels flat.',
      'Keep your knees tracking in line with your toes, then drive up through your whole foot.'
    ],
    br: 'Breathe in and brace before you go down, hold through the hardest part, and breathe out near the top.',
    mist: ['Knees collapsing inward', 'Heels lifting off the floor', 'Rounding the lower back at the bottom', 'Leaning too far forward', 'Bouncing out of the bottom', 'Cutting depth short with too much weight'],
    safe: 'Always set the safety arms in the rack just below your bottom position. Learn to bail the lift forward or back before you go heavy.',
    tips: ['Start with a goblet squat (holding one dumbbell at your chest) to learn the pattern.', 'Squat to a box or bench at a comfortable depth if you struggle with balance.'],
    v: { dumbbell: 'The goblet squat holds one dumbbell at your chest, which helps you stay upright. It is the best way to learn.', machine: 'A hack squat or leg press lets you train legs hard without balancing a bar.', bodyweight: 'Bodyweight squats are the best place to start. Add pauses at the bottom to build control.' }
  },
  {
    id: 'legpress', name: 'Leg press', grp: 'quads',
    al: ['leg press', 'leg press machine', '45 degree leg press'],
    pri: ['Quads', 'Glutes'], sec: ['Hamstrings', 'Calves'], eq: 'Leg press machine',
    setup: [
      'Sit with your back and hips flat against the pad.',
      'Place your feet about shoulder width apart in the middle of the platform.'
    ],
    steps: [
      'Release the safety and lower the platform until your knees are bent to about 90 degrees or a bit more, without your hips lifting off the seat.',
      'Press through your whole foot until your legs are almost straight.',
      'Do not lock your knees hard at the top.'
    ],
    br: 'Breathe in as you lower, breathe out as you press.',
    mist: ['Letting the lower back peel off the pad at the bottom', 'Locking the knees at the top', 'Knees caving inward', 'Putting hands on the knees to push'],
    safe: 'Re-engage the safety stops before getting out. Do not go lower than your lower back allows.',
    tips: ['Feet higher on the platform shifts work to glutes and hamstrings. Feet lower shifts to quads.']
  },
  {
    id: 'deadlift', name: 'Deadlift', grp: 'hamstrings',
    al: ['deadlift', 'deadlifts', 'conventional deadlift', 'barbell deadlift', 'dead lift'],
    pri: ['Hamstrings', 'Glutes', 'Lower and upper back'], sec: ['Quads', 'Forearms', 'Core', 'Traps'], eq: 'Barbell and weight plates',
    setup: [
      'Stand with the bar over your mid-foot and feet about hip width apart.',
      'Hinge down and grip the bar just outside your legs. Your shins should be near the bar, hips higher than your knees and lower than your shoulders.',
      'Pull the slack out of the bar, brace your stomach and keep your back flat with your chest up.'
    ],
    steps: [
      'Push the floor away with your legs while keeping the bar close to your body.',
      'As the bar passes your knees, push your hips forward to stand tall.',
      'Stand up straight without leaning back, then lower by pushing your hips back and bending your knees once the bar passes them.'
    ],
    br: 'Take a big breath into your belly and brace before you pull. Hold it through the lift and breathe out at the top, then reset each rep.',
    mist: ['Rounding the back as the bar leaves the floor', 'Letting the bar drift away from the body', 'Jerking the bar off the floor', 'Hips shooting up before the bar moves', 'Leaning back at the top'],
    safe: 'Start light, film your set from the side, and add weight slowly. Stop the set when your back position changes. If you feel sharp pain, stop.',
    tips: ['Learn the hip hinge first with a Romanian deadlift or a kettlebell/dumbbell deadlift.', 'Use a lighter weight and perfect form before going heavy.'],
    v: { dumbbell: 'Dumbbell deadlifts are a gentler way to learn the pattern.', barbell: 'Barbell deadlifts let you load the most weight, so respect the setup.' }
  },
  {
    id: 'rdl', name: 'Romanian deadlift', grp: 'hamstrings',
    al: ['romanian deadlift', 'rdl', 'rdls', 'stiff leg deadlift', 'stiff legged deadlift'],
    pri: ['Hamstrings', 'Glutes'], sec: ['Lower back', 'Forearms'], eq: 'Barbell or dumbbells',
    setup: [
      'Stand tall with the weight in front of your thighs and your knees slightly bent.',
      'Brace your stomach and keep your chest up.'
    ],
    steps: [
      'Push your hips back as if closing a car door with them, letting the weight slide down your thighs.',
      'Lower until you feel a strong stretch in your hamstrings, usually around mid-shin, keeping your back flat.',
      'Squeeze your glutes to drive your hips forward and stand tall.'
    ],
    br: 'Breathe in as you hinge down, breathe out as you stand.',
    mist: ['Bending the knees too much so it becomes a squat', 'Rounding the lower back', 'Letting the weight drift away from your legs', 'Going lower than your flexibility allows'],
    safe: 'Stop lowering when your back starts to round. The stretch in the hamstrings is your range limit.',
    tips: ['Start with dumbbells.', 'Think of it as a hip hinge, not a bend with your back.']
  },
  {
    id: 'lunge', name: 'Lunge', grp: 'quads',
    al: ['lunge', 'lunges', 'split squat', 'bulgarian split squat', 'walking lunge', 'walking lunges', 'reverse lunge'],
    pri: ['Quads', 'Glutes'], sec: ['Hamstrings', 'Calves', 'Core'], eq: 'Dumbbells or bodyweight',
    setup: [
      'Stand tall with feet together or hip width apart, holding dumbbells at your sides if you use them.',
      'Take a long step forward (or back for a reverse lunge) and keep your torso upright.'
    ],
    steps: [
      'Lower your back knee toward the floor until your front thigh is about parallel.',
      'Keep your front heel flat and your front knee tracking over your toes.',
      'Push through the front foot to return to standing.'
    ],
    br: 'Breathe in as you lower, breathe out as you push up.',
    mist: ['Taking too short a step so your knee goes far past your toes', 'Letting the front knee cave in', 'Leaning forward from the waist', 'Rushing the reps'],
    safe: 'Hold a rack or wall if balance is hard at first. Reverse lunges are easier on the knees for many people.',
    tips: ['Start with bodyweight split squats holding a support.', 'Keep your reps controlled and the same on both legs.']
  },
  {
    id: 'hipthrust', name: 'Hip thrust', grp: 'glutes',
    al: ['hip thrust', 'hip thrusts', 'glute bridge', 'glute bridges', 'barbell hip thrust'],
    pri: ['Glutes'], sec: ['Hamstrings', 'Quads', 'Core'], eq: 'Bench, plus a barbell or dumbbell (or bodyweight for a glute bridge)',
    setup: [
      'Sit on the floor with your upper back against the edge of a bench and your knees bent.',
      'Roll the weight over your hips (use a pad) and plant your feet about hip width apart.'
    ],
    steps: [
      'Push through your heels and lift your hips until your body is straight from shoulders to knees.',
      'Tuck your chin and ribs down so you do not arch your lower back.',
      'Squeeze your glutes at the top, then lower slowly.'
    ],
    br: 'Breathe out as you lift, breathe in as you lower.',
    mist: ['Arching the lower back at the top', 'Pushing through the toes instead of the heels', 'Letting the knees collapse in', 'Using too much weight with a short range'],
    safe: 'Use a thick pad on your hips and keep the weight controlled.',
    tips: ['Start with a bodyweight glute bridge on the floor.', 'Pause at the top for one second.']
  },
  {
    id: 'legcurl', name: 'Leg curl', grp: 'hamstrings',
    al: ['leg curl', 'leg curls', 'hamstring curl', 'hamstring curls', 'lying leg curl', 'seated leg curl'],
    pri: ['Hamstrings'], sec: ['Calves'], eq: 'Leg curl machine',
    setup: [
      'Adjust the machine so your knees line up with the pivot and the pad rests just above your heels.',
      'Hold the handles and keep your hips down.'
    ],
    steps: [
      'Curl your heels toward your glutes.',
      'Squeeze at the end of the movement.',
      'Return slowly until your legs are almost straight.'
    ],
    br: 'Breathe out as you curl, breathe in as you return.',
    mist: ['Lifting the hips to cheat', 'Dropping the weight quickly', 'Cutting the range short'],
    safe: 'Stop if you feel a sharp pull behind the knee.',
    tips: ['Take 2 to 3 seconds to lower the weight.']
  },
  {
    id: 'legext', name: 'Leg extension', grp: 'quads',
    al: ['leg extension', 'leg extensions', 'quad extension'],
    pri: ['Quads'], sec: [], eq: 'Leg extension machine',
    setup: [
      'Adjust the seat so your knees line up with the pivot and the pad sits just above your ankles.',
      'Hold the handles and sit back firmly.'
    ],
    steps: [
      'Straighten your legs until they are almost fully extended.',
      'Squeeze your quads for a moment.',
      'Lower slowly under control.'
    ],
    br: 'Breathe out as you extend, breathe in as you lower.',
    mist: ['Using momentum and swinging the weight up', 'Slamming the weight stack', 'Going so heavy that your hips lift'],
    safe: 'If your knees hurt, lower the weight or shorten the range and talk to a professional if it continues.',
    tips: ['This is an isolation exercise, so keep reps controlled.']
  },
  {
    id: 'calf', name: 'Calf raise', grp: 'calves',
    al: ['calf raise', 'calf raises', 'standing calf raise', 'seated calf raise'],
    pri: ['Calves'], sec: [], eq: 'Step, calf raise machine, or just the floor',
    setup: [
      'Stand with the balls of your feet on a step or plate, heels hanging off.',
      'Hold something for balance if you need to.'
    ],
    steps: [
      'Lower your heels for a full stretch.',
      'Rise as high as you can on your toes.',
      'Pause at the top, then lower slowly.'
    ],
    br: 'Breathe out as you rise, breathe in as you lower.',
    mist: ['Bouncing quickly with a short range', 'Bending the knees to help', 'Skipping the pause at the top and bottom'],
    safe: 'Hold a support if you use heavy weight.',
    tips: ['Calves respond well to a full stretch and a pause. Work in the 10 to 20 rep range.']
  },

  // ------------------------------------------------------------ Arms
  {
    id: 'curl', name: 'Biceps curl', grp: 'arms',
    al: ['bicep curl', 'bicep curls', 'biceps curl', 'biceps curls', 'curl', 'curls', 'barbell curl', 'dumbbell curl', 'ez bar curl', 'preacher curl'],
    pri: ['Biceps'], sec: ['Forearms', 'Front shoulders'], eq: 'Dumbbells, barbell, EZ bar, or cables',
    setup: [
      'Stand tall with feet about hip width apart, holding the weight with palms facing forward.',
      'Pin your elbows at your sides and keep your shoulders back.'
    ],
    steps: [
      'Curl the weight up by bending only at the elbows.',
      'Squeeze your biceps at the top without letting your elbows drift forward.',
      'Lower slowly until your arms are almost straight.'
    ],
    br: 'Breathe out as you curl, breathe in as you lower.',
    mist: ['Swinging the torso to throw the weight up', 'Elbows drifting forward', 'Dropping the weight quickly', 'Not straightening the arms at the bottom'],
    safe: 'If you can only lift the weight by leaning back, it is too heavy.',
    tips: ['Stand with your back close to a wall to stop yourself swinging.', 'Lower the weight in about 2 to 3 seconds.']
  },
  {
    id: 'hammer', name: 'Hammer curl', grp: 'arms',
    al: ['hammer curl', 'hammer curls'],
    pri: ['Biceps', 'Brachialis (under the biceps)'], sec: ['Forearms'], eq: 'Dumbbells',
    setup: ['Stand tall holding the dumbbells with palms facing each other (like holding hammers), elbows at your sides.'],
    steps: [
      'Curl the dumbbells up, keeping your palms facing each other.',
      'Stop at the top without letting the elbows drift forward.',
      'Lower slowly.'
    ],
    br: 'Breathe out as you curl, breathe in as you lower.',
    mist: ['Swinging the body', 'Elbows moving forward', 'Rushing the lowering phase'],
    safe: 'Use weights you can control for the full rep.',
    tips: ['Works great together with regular curls for arm size and forearm thickness.']
  },
  {
    id: 'pushdown', name: 'Triceps pushdown', grp: 'arms',
    al: ['tricep pushdown', 'triceps pushdown', 'pushdown', 'pushdowns', 'cable pushdown', 'tricep extension', 'triceps extension', 'rope pushdown'],
    pri: ['Triceps'], sec: [], eq: 'Cable machine with a rope or bar',
    setup: [
      'Stand close to the cable with a slight forward lean.',
      'Hold the attachment with your elbows pinned at your sides.'
    ],
    steps: [
      'Push the handle down until your arms are straight.',
      'Squeeze your triceps for a moment.',
      'Let the handle rise slowly until your forearms are about parallel to the floor or a little higher.'
    ],
    br: 'Breathe out as you push down, breathe in as the handle rises.',
    mist: ['Elbows flaring out or drifting forward', 'Leaning over the bar to push with body weight', 'Cutting the range short'],
    safe: 'Keep your wrists straight and avoid a violent lockout.',
    tips: ['Keep your upper arms still. Only your forearms should move.']
  },
  {
    id: 'skull', name: 'Skull crusher', grp: 'arms',
    al: ['skull crusher', 'skull crushers', 'skullcrusher', 'lying tricep extension', 'lying triceps extension'],
    pri: ['Triceps'], sec: [], eq: 'EZ bar or dumbbells and a bench',
    setup: [
      'Lie on a bench holding the weight above your chest with straight arms.',
      'Keep your upper arms still and angled slightly back.'
    ],
    steps: [
      'Bend only at the elbows to lower the weight toward your forehead or just behind your head.',
      'Stop before it touches your head.',
      'Extend your arms to return.'
    ],
    br: 'Breathe in as you lower, breathe out as you press.',
    mist: ['Elbows flaring wide', 'Letting the shoulders do the work', 'Using too much weight for the elbows'],
    safe: 'Start light. If your elbows hurt, switch to cable pushdowns.',
    tips: ['Use a spotter or light weight for your first few sessions.']
  },

  // ------------------------------------------------------------ Core
  {
    id: 'plank', name: 'Plank', grp: 'core',
    al: ['plank', 'planks', 'forearm plank'],
    pri: ['Abs and deep core'], sec: ['Shoulders', 'Glutes'], eq: 'None (bodyweight)',
    setup: [
      'Place your forearms on the floor with elbows under your shoulders.',
      'Step your feet back so your body forms a straight line from head to heels.'
    ],
    steps: [
      'Tighten your stomach and squeeze your glutes.',
      'Keep your hips level, not sagging or piking.',
      'Hold for the target time, breathing steadily.'
    ],
    br: 'Breathe steadily. Do not hold your breath.',
    mist: ['Hips sagging toward the floor', 'Hips too high', 'Holding your breath', 'Looking up and straining the neck'],
    safe: 'Stop when your form breaks down, not when the clock ends.',
    tips: ['Several shorter, clean holds beat one long sloppy one.', 'Start with 20 to 30 seconds.']
  },
  {
    id: 'crunch', name: 'Cable crunch', grp: 'core',
    al: ['cable crunch', 'crunch', 'crunches', 'ab crunch', 'sit up', 'situp', 'sit ups', 'situps'],
    pri: ['Abs'], sec: [], eq: 'Cable machine with a rope, or just the floor for regular crunches',
    setup: [
      'Kneel under a high cable and hold the rope beside your head.',
      'Sit your hips back slightly.'
    ],
    steps: [
      'Round your upper back and bring your ribs toward your hips.',
      'Keep your hips still, moving only the spine.',
      'Return slowly to the start.'
    ],
    br: 'Breathe out as you crunch down, breathe in as you return.',
    mist: ['Pulling with the arms', 'Sitting back and forth with the hips instead of curling the spine', 'Going too heavy'],
    safe: 'If you feel it in your neck or lower back, lower the weight.',
    tips: ['Regular floor crunches work too. Focus on slow, controlled reps.']
  },
  {
    id: 'legraise', name: 'Hanging leg raise', grp: 'core',
    al: ['hanging leg raise', 'leg raise', 'leg raises', 'hanging knee raise', 'knee raise', 'knee raises'],
    pri: ['Lower abs', 'Hip flexors'], sec: ['Forearms'], eq: 'Pull-up bar (or a captain\'s chair)',
    setup: ['Hang from a bar with your shoulders pulled down and your body still.'],
    steps: [
      'Bring your knees up toward your chest by curling your pelvis up.',
      'Pause at the top.',
      'Lower slowly without swinging.'
    ],
    br: 'Breathe out as you lift, breathe in as you lower.',
    mist: ['Swinging to get up', 'Using only the hip flexors without curling the pelvis', 'Dropping the legs fast'],
    safe: 'Stop if your grip or shoulders hurt. Knee raises are the easier version.',
    tips: ['Start with bent knees, then progress to straight legs.']
  }
];

// ------------------------------------------------------------------ Muscle groups
// id, name, aliases, what it does, exercises, and a beginner plan.
const COACH_MUSCLES = [
  {
    id: 'chest', name: 'Chest', al: ['chest', 'pecs', 'pec', 'pectorals', 'upper chest', 'lower chest'],
    fn: 'The chest (pectorals) pushes your arms forward and across your body, like pushing a door or doing a push-up.',
    comp: ['Bench press', 'Incline press', 'Push-up', 'Dips'], iso: ['Cable fly', 'Pec deck'],
    beg: 'Two chest exercises, 2 times a week, 3 sets each. For example: a bench or machine press, plus an incline press or fly.',
    first: 'bench'
  },
  {
    id: 'back', name: 'Back', al: ['back', 'lats', 'lat', 'upper back', 'middle back', 'traps', 'trapezius'],
    fn: 'The back pulls your arms down and back toward your body, and keeps your shoulders and spine strong and upright. The lats are the big wing-shaped muscles on the sides.',
    comp: ['Pull-up', 'Lat pulldown', 'Barbell row', 'Seated cable row'], iso: ['Straight-arm pulldown', 'Face pull'],
    beg: 'One pull-down or pull-up and one row, 2 times a week, 3 sets each. Pull more than you push if your shoulders feel rounded.',
    first: 'pulldown'
  },
  {
    id: 'shoulders', name: 'Shoulders', al: ['shoulders', 'shoulder', 'delts', 'delt', 'deltoids', 'rear delts', 'side delts', 'front delts'],
    fn: 'The shoulders (deltoids) lift your arms forward, out to the side and back. They have three parts: front, side and rear.',
    comp: ['Overhead press', 'Incline press'], iso: ['Lateral raise', 'Rear delt fly', 'Face pull'],
    beg: 'One overhead press, plus lateral raises. Add rear delt work (face pulls or reverse fly) because most people neglect it.',
    first: 'ohp'
  },
  {
    id: 'arms', name: 'Arms', al: ['arms', 'arm', 'biceps', 'bicep', 'triceps', 'tricep'],
    fn: 'The biceps (front of the upper arm) bend your elbow. The triceps (back of the upper arm) straighten it, and they make up about two thirds of your upper arm size.',
    comp: ['Chin-up', 'Dips', 'Close-grip bench press'], iso: ['Biceps curl', 'Hammer curl', 'Triceps pushdown', 'Skull crusher'],
    beg: 'After your main lifts, do 2 to 3 sets of one biceps and one triceps exercise, 2 times a week.',
    first: 'curl'
  },
  {
    id: 'quads', name: 'Quadriceps', al: ['quads', 'quad', 'quadriceps', 'thighs', 'thigh', 'legs', 'leg'],
    fn: 'The quads on the front of your thigh straighten your knee. They help you stand up, climb stairs and squat.',
    comp: ['Squat', 'Leg press', 'Lunge'], iso: ['Leg extension'],
    beg: 'One squat or leg press, plus a lunge or leg extension. 2 times a week, 3 sets each.',
    first: 'squat'
  },
  {
    id: 'hamstrings', name: 'Hamstrings', al: ['hamstrings', 'hamstring', 'hams', 'back of legs', 'back of thighs'],
    fn: 'The hamstrings on the back of your thigh bend your knee and help your hips extend. They are used in running, jumping and deadlifting.',
    comp: ['Romanian deadlift', 'Deadlift', 'Good morning'], iso: ['Leg curl'],
    beg: 'One hip hinge (Romanian deadlift) and one leg curl. 2 times a week, 2 to 3 sets each.',
    first: 'rdl'
  },
  {
    id: 'glutes', name: 'Glutes', al: ['glutes', 'glute', 'butt', 'booty', 'buttocks'],
    fn: 'The glutes extend your hips, pushing your body forward when you stand up, climb or sprint. They are the largest muscle in your body.',
    comp: ['Squat', 'Romanian deadlift', 'Lunge', 'Hip thrust'], iso: ['Glute bridge', 'Cable kickback'],
    beg: 'A squat or lunge, plus a hip thrust or glute bridge. 2 times a week, 3 sets each.',
    first: 'hipthrust'
  },
  {
    id: 'calves', name: 'Calves', al: ['calves', 'calf'],
    fn: 'The calves lift your heels and help with walking, running and jumping. They are used all day, so they take higher reps and a full stretch.',
    comp: [], iso: ['Standing calf raise', 'Seated calf raise'],
    beg: 'Calf raises 2 to 3 times a week, 3 sets of 10 to 20 reps, with a pause at the top and bottom.',
    first: 'calf'
  },
  {
    id: 'core', name: 'Core', al: ['core', 'abs', 'ab', 'abdominals', 'abdominal', 'six pack', 'obliques', 'lower abs'],
    fn: 'The core (abs, obliques and deep muscles) keeps your spine stable, transfers force between your upper and lower body, and lets you bend and twist.',
    comp: ['Plank', 'Squat', 'Deadlift', 'Overhead press'], iso: ['Cable crunch', 'Hanging leg raise'],
    beg: 'Heavy compound lifts already train your core. Add 2 to 3 sets of one ab exercise (plank or crunch) 2 times a week.',
    first: 'plank'
  }
];
