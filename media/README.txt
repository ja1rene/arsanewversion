Arsa exercise animations
========================

Drop your GIFs in this folder using EXACTLY these names:

  ex_bench_press.gif   (Bench Press)
  ex_incline_bench.gif   (Incline Bench Press)
  ex_machine_chest_press.gif   (Machine Chest Press)
  ex_cable_fly.gif   (Cable Fly)
  ex_push_up.gif   (Push Up)
  ex_pull_up.gif   (Pull Up)
  ex_lat_pulldown.gif   (Lat Pulldown)
  ex_barbell_row.gif   (Barbell Row)
  ex_seated_row.gif   (Seated Row)
  ex_shoulder_press.gif   (Shoulder Press)
  ex_lateral_raise.gif   (Lateral Raise)
  ex_rear_delt_fly.gif   (Rear Delt Fly)
  ex_squat.gif   (Squat)
  ex_leg_press.gif   (Leg Press)
  ex_romanian_deadlift.gif   (Romanian Deadlift)
  ex_leg_curl.gif   (Leg Curl)
  ex_leg_extension.gif   (Leg Extension)
  ex_calf_raise.gif   (Calf Raise)
  ex_bicep_curl.gif   (Bicep Curl)
  ex_hammer_curl.gif   (Hammer Curl)
  ex_tricep_pushdown.gif   (Tricep Pushdown)
  ex_skull_crusher.gif   (Skull Crusher)

Tips
- Keep each file under about 500 KB (short loop, around 400 px wide) so the app stays light and loads fast on mobile data.
- Use files you made yourself or have permission to use.
- After adding or changing files, open service-worker.js and raise APP_VERSION (for example 1.13.0 to 1.13.1) before pushing to GitHub. Installed phones then download the new files and keep them for offline use.
- A missing file is fine: that exercise shows a placeholder until you add it.
- To use .webp or .mp4 instead of .gif, change the extension on that exercise's line in js/media-map.js.
