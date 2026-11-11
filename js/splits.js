/* ============================================
   ARSA — Training splits
   Starter programs built only from exercises in the Library, so every one
   of them works out of the box. days: 0 = Sunday ... 6 = Saturday.
   ============================================ */

const SPLITS = [
  {
    id: 'full-body',
    name: 'Full Body',
    level: 'Beginner',
    freq: '3 days a week',
    blurb: 'Train everything each session, three times a week, with a rest day between. Practice each lift often and build a base. The simplest way to start and still works for years.',
    tip: 'When you hit the top of the rep range on every set, add a little weight next time and start again at the bottom of the range.',
    variants: [{ label: '3 days', days: { 'Full Body A': [1, 5], 'Full Body B': [3] } }],
    workouts: [
      { name: 'Full Body A', exercises: [
        { id: 'ex_squat', sets: 3, reps: '6-8', rest: 120 },
        { id: 'ex_bench_press', sets: 3, reps: '6-8', rest: 120 },
        { id: 'ex_seated_row', sets: 3, reps: '8-12', rest: 90 },
        { id: 'ex_lateral_raise', sets: 2, reps: '12-15', rest: 60 },
        { id: 'ex_tricep_pushdown', sets: 2, reps: '10-12', rest: 60 }
      ] },
      { name: 'Full Body B', exercises: [
        { id: 'ex_leg_press', sets: 3, reps: '8-12', rest: 120 },
        { id: 'ex_shoulder_press', sets: 3, reps: '6-10', rest: 90 },
        { id: 'ex_lat_pulldown', sets: 3, reps: '8-12', rest: 90 },
        { id: 'ex_romanian_deadlift', sets: 3, reps: '8-10', rest: 120 },
        { id: 'ex_bicep_curl', sets: 2, reps: '10-12', rest: 60 }
      ] }
    ]
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    level: 'Beginner to intermediate',
    freq: '4 days a week',
    blurb: 'Two upper-body days and two lower-body days. Each muscle is trained twice a week with more volume per session than full body, and you still get three rest days.',
    tip: 'Day A of each pair is heavier and lower in reps, day B is lighter and higher in reps. Keep that difference.',
    variants: [{ label: '4 days', days: { 'Upper A': [1], 'Lower A': [2], 'Upper B': [4], 'Lower B': [5] } }],
    workouts: [
      { name: 'Upper A', exercises: [
        { id: 'ex_bench_press', sets: 4, reps: '5-8', rest: 150 },
        { id: 'ex_barbell_row', sets: 4, reps: '6-10', rest: 120 },
        { id: 'ex_shoulder_press', sets: 3, reps: '8-10', rest: 90 },
        { id: 'ex_lat_pulldown', sets: 3, reps: '8-12', rest: 90 },
        { id: 'ex_tricep_pushdown', sets: 3, reps: '10-12', rest: 60 },
        { id: 'ex_bicep_curl', sets: 3, reps: '10-12', rest: 60 }
      ] },
      { name: 'Lower A', exercises: [
        { id: 'ex_squat', sets: 4, reps: '5-8', rest: 150 },
        { id: 'ex_romanian_deadlift', sets: 3, reps: '8-10', rest: 120 },
        { id: 'ex_leg_press', sets: 3, reps: '10-12', rest: 90 },
        { id: 'ex_leg_curl', sets: 3, reps: '10-12', rest: 60 },
        { id: 'ex_calf_raise', sets: 4, reps: '10-15', rest: 60 }
      ] },
      { name: 'Upper B', exercises: [
        { id: 'ex_incline_bench', sets: 3, reps: '8-12', rest: 90 },
        { id: 'ex_pull_up', sets: 3, reps: '6-10', rest: 120 },
        { id: 'ex_lateral_raise', sets: 3, reps: '12-15', rest: 60 },
        { id: 'ex_cable_fly', sets: 3, reps: '12-15', rest: 60 },
        { id: 'ex_hammer_curl', sets: 3, reps: '10-12', rest: 60 },
        { id: 'ex_skull_crusher', sets: 3, reps: '10-12', rest: 60 }
      ] },
      { name: 'Lower B', exercises: [
        { id: 'ex_leg_press', sets: 4, reps: '8-12', rest: 120 },
        { id: 'ex_romanian_deadlift', sets: 3, reps: '8-10', rest: 120 },
        { id: 'ex_leg_extension', sets: 3, reps: '10-15', rest: 60 },
        { id: 'ex_leg_curl', sets: 3, reps: '10-15', rest: 60 },
        { id: 'ex_calf_raise', sets: 4, reps: '12-15', rest: 60 }
      ] }
    ]
  },
  {
    id: 'ppl',
    name: 'Push Pull Legs',
    level: 'Beginner to intermediate',
    freq: '3 or 6 days a week',
    blurb: 'Pushing muscles (chest, shoulders, triceps), pulling muscles (back, biceps) and legs each get their own day. Run it once through for 3 days a week, or twice through for 6 once you recover well.',
    tip: 'Start with the 3-day version. Move to 6 days only when you finish sessions feeling you had more in the tank.',
    variants: [
      { label: '3 days', days: { Push: [1], Pull: [3], Legs: [5] } },
      { label: '6 days', days: { Push: [1, 4], Pull: [2, 5], Legs: [3, 6] } }
    ],
    workouts: [
      { name: 'Push', exercises: [
        { id: 'ex_bench_press', sets: 4, reps: '6-10', rest: 120 },
        { id: 'ex_shoulder_press', sets: 3, reps: '8-10', rest: 90 },
        { id: 'ex_incline_bench', sets: 3, reps: '8-12', rest: 90 },
        { id: 'ex_lateral_raise', sets: 3, reps: '12-15', rest: 60 },
        { id: 'ex_tricep_pushdown', sets: 3, reps: '10-12', rest: 60 }
      ] },
      { name: 'Pull', exercises: [
        { id: 'ex_pull_up', sets: 3, reps: '6-10', rest: 120 },
        { id: 'ex_barbell_row', sets: 4, reps: '6-10', rest: 120 },
        { id: 'ex_lat_pulldown', sets: 3, reps: '8-12', rest: 90 },
        { id: 'ex_rear_delt_fly', sets: 3, reps: '12-15', rest: 60 },
        { id: 'ex_bicep_curl', sets: 3, reps: '10-12', rest: 60 },
        { id: 'ex_hammer_curl', sets: 3, reps: '10-12', rest: 60 }
      ] },
      { name: 'Legs', exercises: [
        { id: 'ex_squat', sets: 4, reps: '6-8', rest: 150 },
        { id: 'ex_romanian_deadlift', sets: 3, reps: '8-10', rest: 120 },
        { id: 'ex_leg_press', sets: 3, reps: '10-12', rest: 90 },
        { id: 'ex_leg_curl', sets: 3, reps: '10-12', rest: 60 },
        { id: 'ex_leg_extension', sets: 3, reps: '12-15', rest: 60 },
        { id: 'ex_calf_raise', sets: 4, reps: '10-15', rest: 60 }
      ] }
    ]
  },
  {
    id: 'body-part',
    name: '5-Day Body Part',
    level: 'Intermediate',
    freq: '5 days a week',
    blurb: 'One muscle group gets a whole day: lots of sets, then a week to recover. Popular for the focus and the variety, but each muscle is only trained once a week, so it suits people who already have a base.',
    tip: 'Each muscle gets one big session a week, so make every set count and keep your form strict.',
    variants: [{ label: '5 days', days: { Chest: [1], Back: [2], Legs: [3], Shoulders: [4], Arms: [5] } }],
    workouts: [
      { name: 'Chest', exercises: [
        { id: 'ex_bench_press', sets: 4, reps: '6-10', rest: 120 },
        { id: 'ex_incline_bench', sets: 3, reps: '8-12', rest: 90 },
        { id: 'ex_machine_chest_press', sets: 3, reps: '10-12', rest: 90 },
        { id: 'ex_cable_fly', sets: 3, reps: '12-15', rest: 60 },
        { id: 'ex_push_up', sets: 2, reps: '10-20', rest: 60 }
      ] },
      { name: 'Back', exercises: [
        { id: 'ex_pull_up', sets: 4, reps: '6-10', rest: 120 },
        { id: 'ex_barbell_row', sets: 4, reps: '6-10', rest: 120 },
        { id: 'ex_lat_pulldown', sets: 3, reps: '8-12', rest: 90 },
        { id: 'ex_seated_row', sets: 3, reps: '10-12', rest: 90 }
      ] },
      { name: 'Legs', exercises: [
        { id: 'ex_squat', sets: 4, reps: '6-8', rest: 150 },
        { id: 'ex_leg_press', sets: 3, reps: '10-12', rest: 90 },
        { id: 'ex_romanian_deadlift', sets: 3, reps: '8-10', rest: 120 },
        { id: 'ex_leg_extension', sets: 3, reps: '12-15', rest: 60 },
        { id: 'ex_leg_curl', sets: 3, reps: '10-12', rest: 60 },
        { id: 'ex_calf_raise', sets: 4, reps: '10-15', rest: 60 }
      ] },
      { name: 'Shoulders', exercises: [
        { id: 'ex_shoulder_press', sets: 4, reps: '6-10', rest: 120 },
        { id: 'ex_lateral_raise', sets: 4, reps: '12-15', rest: 60 },
        { id: 'ex_rear_delt_fly', sets: 3, reps: '12-15', rest: 60 }
      ] },
      { name: 'Arms', exercises: [
        { id: 'ex_bicep_curl', sets: 3, reps: '8-12', rest: 60 },
        { id: 'ex_hammer_curl', sets: 3, reps: '10-12', rest: 60 },
        { id: 'ex_tricep_pushdown', sets: 3, reps: '10-12', rest: 60 },
        { id: 'ex_skull_crusher', sets: 3, reps: '8-12', rest: 60 }
      ] }
    ]
  }
];
