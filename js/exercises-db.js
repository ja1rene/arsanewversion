/* ============================================
   ARSA — Preloaded Exercise Database
   Static reference data. Each exercise has form
   cues, common mistakes, and muscle groups.
   ============================================ */

const ExerciseDB = [
  // ===== CHEST =====
  {
    id: 'ex_bench_press', name: 'Bench Press', muscle: 'Chest', secondaryMuscles: ['Triceps', 'Front Deltoids'],
    icon: '🏋️',
    instructions: 'Lie flat on the bench with feet planted firmly on the floor. Grip the bar slightly wider than shoulder-width. Lower the bar to mid-chest with control, then press up until arms are extended.',
    formTips: ['Keep feet planted on the floor', 'Maintain a slight arch in your lower back', 'Control the bar on the way down', 'Keep wrists straight, not bent back'],
    mistakes: ['Bouncing the bar off the chest', 'Flaring elbows out to 90°', 'Lifting hips off the bench', 'Using a grip that is too narrow or too wide'],
    tips: 'Pause briefly at the chest to remove momentum and build raw strength.'
  },
  {
    id: 'ex_incline_bench', name: 'Incline Bench Press', muscle: 'Chest', secondaryMuscles: ['Front Deltoids', 'Triceps'],
    icon: '🏋️',
    instructions: 'Set the bench to a 30-45° incline. Lower the bar to your upper chest, then press up and slightly back over your face.',
    formTips: ['Keep the incline at 30-45°, steeper reduces chest activation', 'Drive elbows at roughly 45-60° from torso', 'Keep shoulder blades retracted'],
    mistakes: ['Setting the incline too steep, shifting work to shoulders', 'Bar path drifting toward the neck', 'Losing shoulder blade retraction mid-set'],
    tips: 'A slightly lower incline targets more chest; a steeper one shifts toward the shoulders.'
  },
  {
    id: 'ex_machine_chest_press', name: 'Machine Chest Press', muscle: 'Chest', secondaryMuscles: ['Triceps', 'Front Deltoids'],
    icon: '⚙️',
    instructions: 'Adjust the seat so handles align with mid-chest. Press the handles forward until arms are extended, then return with control.',
    formTips: ['Keep back flat against the pad', 'Adjust seat height so handles meet mid-chest', 'Press through a full range of motion'],
    mistakes: ['Seat set too high or too low', 'Using excessive momentum to push the weight', 'Locking out elbows aggressively'],
    tips: 'A great option for controlled volume work without stabilizer fatigue.'
  },
  {
    id: 'ex_cable_fly', name: 'Cable Fly', muscle: 'Chest', secondaryMuscles: ['Front Deltoids'],
    icon: '🔗',
    instructions: 'Stand between two cable towers with handles set at chest height. Bring hands together in front of your chest in a hugging motion, then return with control.',
    formTips: ['Keep a slight bend in the elbows throughout', 'Lead with your chest, not your hands', 'Squeeze at the point of contraction'],
    mistakes: ['Turning it into a press by bending elbows too much', 'Using too much weight and losing range of motion', 'Rounding shoulders forward at the start'],
    tips: 'Great finisher exercise for a deep chest stretch and peak contraction.'
  },
  {
    id: 'ex_push_up', name: 'Push Up', muscle: 'Chest', secondaryMuscles: ['Triceps', 'Front Deltoids', 'Core'],
    icon: '🤸',
    instructions: 'Start in a plank position with hands slightly wider than shoulders. Lower your chest to the floor, then press back up.',
    formTips: ['Keep your body in a straight line from head to heels', 'Keep core braced throughout', 'Lower until chest nearly touches the floor'],
    mistakes: ['Letting hips sag toward the floor', 'Flaring elbows out to 90°', 'Only completing half the range of motion'],
    tips: 'Elevate your feet to increase difficulty, or your hands on a bench to decrease it.'
  },

  // ===== BACK =====
  {
    id: 'ex_pull_up', name: 'Pull Up', muscle: 'Back', secondaryMuscles: ['Biceps', 'Rear Deltoids'],
    icon: '🧗',
    instructions: 'Hang from a bar with an overhand grip slightly wider than shoulders. Pull your chest toward the bar, then lower with control.',
    formTips: ['Initiate the pull by depressing your shoulder blades', 'Lead with your chest', 'Lower fully to a dead hang each rep'],
    mistakes: ['Using momentum to kip the body upward', 'Only achieving a partial range of motion', 'Shrugging shoulders up toward the ears'],
    tips: 'Use a resistance band or assisted machine to build toward your first unassisted rep.'
  },
  {
    id: 'ex_lat_pulldown', name: 'Lat Pulldown', muscle: 'Back', secondaryMuscles: ['Biceps', 'Rear Deltoids'],
    icon: '⚙️',
    instructions: 'Sit with thighs secured under the pads. Grip the bar wider than shoulders and pull it down to your upper chest.',
    formTips: ['Lean back slightly and drive elbows down and back', 'Squeeze shoulder blades together at the bottom', 'Control the weight on the way up'],
    mistakes: ['Pulling the bar to the stomach instead of the chest', 'Using body momentum to swing the weight down', 'Going too heavy and shortening range of motion'],
    tips: 'Focus on pulling with your elbows, not your hands, to better target the lats.'
  },
  {
    id: 'ex_barbell_row', name: 'Barbell Row', muscle: 'Back', secondaryMuscles: ['Biceps', 'Rear Deltoids'],
    icon: '🏋️',
    instructions: 'Hinge at the hips with a flat back, holding the bar with an overhand grip. Pull the bar to your lower ribcage, then lower with control.',
    formTips: ['Keep your back flat, never rounded', 'Pull the bar toward your belly button', 'Keep core braced to protect the spine'],
    mistakes: ['Rounding the lower back under load', 'Standing too upright, reducing back tension', 'Using momentum to jerk the weight up'],
    tips: 'A torso angle around 45° hits the mid-back hardest.'
  },
  {
    id: 'ex_seated_row', name: 'Seated Row', muscle: 'Back', secondaryMuscles: ['Biceps', 'Rear Deltoids'],
    icon: '⚙️',
    instructions: 'Sit with feet braced on the platform and knees slightly bent. Pull the handle to your torso, squeezing your shoulder blades together.',
    formTips: ['Keep your chest up and back straight', 'Pull elbows back past your torso', 'Avoid using your lower back to generate momentum'],
    mistakes: ['Rounding the shoulders forward during the stretch', 'Leaning back excessively to move more weight', 'Rushing through reps without a full squeeze'],
    tips: 'Pause for a one-second squeeze at the point of full contraction.'
  },

  // ===== SHOULDERS =====
  {
    id: 'ex_shoulder_press', name: 'Shoulder Press', muscle: 'Shoulders', secondaryMuscles: ['Triceps'],
    icon: '🏋️',
    instructions: 'Sit or stand with the bar or dumbbells at shoulder height. Press overhead until arms are extended, then lower with control.',
    formTips: ['Keep your core braced to protect your lower back', 'Press in a slight arc, not straight up', 'Avoid locking out elbows too aggressively'],
    mistakes: ['Excessive lower back arching to push the weight up', 'Flaring elbows fully out to the sides', 'Using leg drive to push the weight (unless intentional push press)'],
    tips: 'Seated variations reduce the need for core stability and let you focus on the shoulders.'
  },
  {
    id: 'ex_lateral_raise', name: 'Lateral Raise', muscle: 'Shoulders', secondaryMuscles: ['Traps'],
    icon: '🦾',
    instructions: 'Stand holding dumbbells at your sides. Raise your arms out to the sides until roughly shoulder height, then lower with control.',
    formTips: ['Lead with your elbows, not your hands', 'Keep a slight bend in the elbows', 'Stop at shoulder height to avoid shoulder impingement'],
    mistakes: ['Swinging the weight using momentum', 'Raising the arms above shoulder height', 'Shrugging the traps to lift heavier weight'],
    tips: 'Use lighter weight than you think — strict form matters far more than load here.'
  },
  {
    id: 'ex_rear_delt_fly', name: 'Rear Delt Fly', muscle: 'Shoulders', secondaryMuscles: ['Back'],
    icon: '🦾',
    instructions: 'Hinge forward at the hips holding dumbbells. Raise your arms out to the sides, squeezing your shoulder blades together.',
    formTips: ['Keep a soft bend in the elbows throughout', 'Lead the movement with your elbows', 'Keep your back flat, not rounded'],
    mistakes: ['Standing too upright and losing the hinge', 'Using momentum to jerk the weight up', 'Going too heavy and turning it into a row'],
    tips: 'An often-neglected exercise that balances out shoulder development and improves posture.'
  },

  // ===== LEGS =====
  {
    id: 'ex_squat', name: 'Squat', muscle: 'Legs', secondaryMuscles: ['Glutes', 'Core'],
    icon: '🏋️',
    instructions: 'Stand with the bar across your upper back, feet shoulder-width apart. Lower your hips down and back until thighs are parallel to the floor, then drive back up.',
    formTips: ['Keep your chest up throughout the movement', 'Track your knees in line with your toes', 'Push through your full foot, not just your toes'],
    mistakes: ['Letting knees cave inward', 'Rounding the lower back at the bottom', 'Rising onto the toes during the ascent'],
    tips: 'Depth matters more than load — prioritize a full range of motion before adding weight.'
  },
  {
    id: 'ex_leg_press', name: 'Leg Press', muscle: 'Legs', secondaryMuscles: ['Glutes'],
    icon: '⚙️',
    instructions: 'Sit in the machine with feet shoulder-width on the platform. Lower the platform toward you until knees reach about 90°, then press back up.',
    formTips: ['Keep your lower back flat against the pad', 'Avoid locking out knees aggressively at the top', 'Control the descent rather than dropping the weight'],
    mistakes: ['Letting the lower back round and lift off the pad', 'Going too deep and causing the hips to tuck under', 'Locking knees out hard at full extension'],
    tips: 'Foot placement changes emphasis: higher targets glutes and hamstrings, lower targets quads.'
  },
  {
    id: 'ex_romanian_deadlift', name: 'Romanian Deadlift', muscle: 'Legs', secondaryMuscles: ['Glutes', 'Back'],
    icon: '🏋️',
    instructions: 'Hold the bar in front of your thighs. Hinge at the hips, pushing them back while lowering the bar along your legs, then drive hips forward to stand.',
    formTips: ['Keep the bar close to your legs throughout', 'Maintain a soft bend in the knees', 'Push your hips back, not down'],
    mistakes: ['Rounding the lower back during the hinge', 'Bending the knees too much, turning it into a squat', 'Letting the bar drift away from the legs'],
    tips: 'You should feel a deep stretch in your hamstrings at the bottom, not your lower back.'
  },
  {
    id: 'ex_leg_curl', name: 'Leg Curl', muscle: 'Legs', secondaryMuscles: [],
    icon: '⚙️',
    instructions: 'Lie face down or sit in the machine with the pad against your lower calves. Curl your legs toward your glutes, then lower with control.',
    formTips: ['Keep your hips pressed into the pad', 'Move through a full range of motion', 'Control the negative on the way down'],
    mistakes: ['Lifting hips off the pad to use momentum', 'Using a partial range of motion', 'Letting the weight drop quickly on the way back'],
    tips: 'A slow eccentric here is excellent for hamstring injury prevention.'
  },
  {
    id: 'ex_leg_extension', name: 'Leg Extension', muscle: 'Legs', secondaryMuscles: [],
    icon: '⚙️',
    instructions: 'Sit in the machine with the pad against your shins. Extend your legs until straight, then lower with control.',
    formTips: ['Keep your back against the seat pad', 'Extend through a full range of motion', 'Pause briefly at full extension'],
    mistakes: ['Using momentum to kick the weight up', 'Only completing a partial range of motion', 'Gripping the handles too hard and tensing unrelated muscles'],
    tips: 'A great isolation finisher for the quads after compound leg work.'
  },
  {
    id: 'ex_calf_raise', name: 'Calf Raise', muscle: 'Legs', secondaryMuscles: [],
    icon: '🦵',
    instructions: 'Stand on the edge of a platform with heels hanging off. Rise onto your toes as high as possible, then lower until you feel a stretch.',
    formTips: ['Use a full range of motion, stretch to full contraction', 'Pause briefly at the top of each rep', 'Control the lowering phase'],
    mistakes: ['Bouncing quickly without a full stretch', 'Using a partial range of motion', 'Rushing through reps without control'],
    tips: 'Calves respond well to higher rep ranges and slower tempo.'
  },

  // ===== ARMS =====
  {
    id: 'ex_bicep_curl', name: 'Bicep Curl', muscle: 'Arms', secondaryMuscles: ['Forearms'],
    icon: '💪',
    instructions: 'Stand holding dumbbells at your sides with palms facing forward. Curl the weight up toward your shoulders, then lower with control.',
    formTips: ['Keep your elbows pinned to your sides', 'Avoid swinging your torso to assist the lift', 'Control the weight on the way down'],
    mistakes: ['Swinging the body to generate momentum', 'Letting elbows drift forward', 'Only using the top half of the range of motion'],
    tips: 'Squeeze hard at the top of the rep for a stronger peak contraction.'
  },
  {
    id: 'ex_hammer_curl', name: 'Hammer Curl', muscle: 'Arms', secondaryMuscles: ['Forearms'],
    icon: '💪',
    instructions: 'Stand holding dumbbells with palms facing each other. Curl the weight up while keeping your wrist neutral, then lower with control.',
    formTips: ['Keep your palms facing inward throughout', 'Pin your elbows to your sides', 'Control the descent rather than dropping the weight'],
    mistakes: ['Rotating the wrist mid-curl', 'Swinging the torso for momentum', 'Letting elbows flare away from the body'],
    tips: 'This grip emphasizes the brachialis, helping build overall arm thickness.'
  },
  {
    id: 'ex_tricep_pushdown', name: 'Tricep Pushdown', muscle: 'Arms', secondaryMuscles: [],
    icon: '🔗',
    instructions: 'Stand at a cable machine with a bar or rope attachment. Push the attachment down until arms are fully extended, then return with control.',
    formTips: ['Keep your elbows pinned at your sides', 'Only the forearms should move', 'Fully extend at the bottom of each rep'],
    mistakes: ['Letting elbows drift forward away from the torso', 'Using body weight to lean into the movement', 'Stopping short of full extension'],
    tips: 'A rope attachment allows you to flare your hands outward at the bottom for extra contraction.'
  },
  {
    id: 'ex_skull_crusher', name: 'Skull Crusher', muscle: 'Arms', secondaryMuscles: [],
    icon: '💪',
    instructions: 'Lie on a bench holding a bar or dumbbells above your chest. Lower the weight toward your forehead by bending only at the elbows, then extend back up.',
    formTips: ['Keep your upper arms stationary throughout', 'Lower with control to avoid hitting your head', 'Keep elbows pointed at the ceiling, not flared out'],
    mistakes: ['Letting elbows flare outward', 'Moving the upper arms instead of just the forearms', 'Using too much weight and losing control on the descent'],
    tips: 'Lowering the bar slightly past your head reduces shoulder strain.'
  }
];

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core', 'Other'];

function getExercisesByMuscle(muscle) {
  return Store.getAllExercises().filter(e => e.muscle === muscle);
}
