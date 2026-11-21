/* ============================================
   ARSA — Built-in exercise animations
   Maps each built-in exercise to its GIF in the media/ folder.
   To add one: save the file in media/ with the name shown here,
   then bump APP_VERSION in service-worker.js so phones download it.
   Using a different format? Change the extension on that line
   (.gif, .webp or .mp4 all work). A missing file just shows a
   placeholder, so you can add them one at a time.
   ============================================ */

const EXERCISE_MEDIA = {
  ex_bench_press: 'media/ex_bench_press.gif',  // Bench Press
  ex_incline_bench: 'media/ex_incline_bench.gif',  // Incline Bench Press
  ex_machine_chest_press: 'media/ex_machine_chest_press.gif',  // Machine Chest Press
  ex_cable_fly: 'media/ex_cable_fly.gif',  // Cable Fly
  ex_push_up: 'media/ex_push_up.gif',  // Push Up
  ex_pull_up: 'media/ex_pull_up.gif',  // Pull Up
  ex_lat_pulldown: 'media/ex_lat_pulldown.gif',  // Lat Pulldown
  ex_barbell_row: 'media/ex_barbell_row.gif',  // Barbell Row
  ex_seated_row: 'media/ex_seated_row.gif',  // Seated Row
  ex_shoulder_press: 'media/ex_shoulder_press.gif',  // Shoulder Press
  ex_lateral_raise: 'media/ex_lateral_raise.gif',  // Lateral Raise
  ex_rear_delt_fly: 'media/ex_rear_delt_fly.gif',  // Rear Delt Fly
  ex_squat: 'media/ex_squat.gif',  // Squat
  ex_leg_press: 'media/ex_leg_press.gif',  // Leg Press
  ex_romanian_deadlift: 'media/ex_romanian_deadlift.gif',  // Romanian Deadlift
  ex_leg_curl: 'media/ex_leg_curl.gif',  // Leg Curl
  ex_leg_extension: 'media/ex_leg_extension.gif',  // Leg Extension
  ex_calf_raise: 'media/ex_calf_raise.gif',  // Calf Raise
  ex_bicep_curl: 'media/ex_bicep_curl.gif',  // Bicep Curl
  ex_hammer_curl: 'media/ex_hammer_curl.gif',  // Hammer Curl
  ex_tricep_pushdown: 'media/ex_tricep_pushdown.gif',  // Tricep Pushdown
  ex_skull_crusher: 'media/ex_skull_crusher.gif'   // Skull Crusher
};
