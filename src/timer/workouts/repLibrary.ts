// Rep / chipper / pyramid workouts imported from David's training log — results stripped.

import { ladder, range, rounds } from './builders';
import type { RepTarget, RepWorkout } from './types';

// 1) 3 rounds for time — bike, swings, and an empty-bar circuit.
const bikeSwings3rft: RepWorkout = {
  mode: 'rep',
  slug: 'rep-3rft-bike-swings-press',
  origin: 'original',
  title: '3 Rounds · Bike & Barbell',
  summary:
    'Three rounds for time: 40-cal bike, kettlebell swings, and a bodyweight-and-empty-bar circuit.',
  targets: rounds(3, [
    { movement: 'Bike', count: 40, notes: 'calories' },
    { movement: 'Kettlebell swings', count: 20 },
    { movement: 'Pushups', count: 20 },
    { movement: 'Barbell curls', count: 20, load: 'empty bar' },
    { movement: 'Strict press', count: 20, load: 'empty bar' },
    { movement: 'Lunges', count: 20 },
  ]),
};

// 2) Descending chipper with a per-station break penalty at each rung.
const descChipperPenalties: RepWorkout = {
  mode: 'rep',
  slug: 'rep-descending-press-chipper',
  origin: 'original',
  title: 'Descending Chipper · Press to Curls',
  summary:
    'Chipper from 100 down to 40 reps — each station carries its own break penalty.',
  targets: [
    { movement: 'Strict press', count: 100, load: '40 lb', notes: '5 pushups every break' },
    { movement: 'Front squats', count: 80, load: '50 lb', notes: '10 jumping lunges every break' },
    { movement: 'American swings', count: 60, load: '32 kg', notes: '10 wide air squats every break' },
    { movement: 'Curls', count: 40, load: '30 lb', notes: '10 dips every break' },
  ],
};

// 3) 14-2-14 ladder by twos; 50 Russian twists after every round (see summary).
const scheme14 = [...range(7, 1).map((n) => n * 2), ...range(2, 7).map((n) => n * 2)];
const ladder14: RepWorkout = {
  mode: 'rep',
  slug: 'rep-14-ladder-burpee-press',
  origin: 'original',
  title: '14-2-14 Ladder · Burpees & Press',
  summary:
    'Burpees and military press descending 14 to 2 by twos then back up to 14, with 50 Russian twists (25 lb) after every round.',
  targets: ladder(scheme14, [
    { movement: 'Burpees' },
    { movement: 'Military press', load: '40 lb' },
  ]),
};

// 4) 5-20-5 pyramid (the 20 rung is hit twice at the peak).
const pyr520: RepWorkout = {
  mode: 'rep',
  slug: 'rep-5-20-pyramid-navy-seals',
  origin: 'original',
  title: '5-20-5 Pyramid · Navy Seals',
  summary:
    'Navy seals, swings, and shin huggers climbing 5 up to 20 then back down to 5, hitting the 20 twice at the top.',
  targets: ladder([...range(5, 20), ...range(20, 5)], [
    { movement: 'Navy seals' },
    { movement: 'Kettlebell swings', load: '28 kg' },
    { movement: 'Shin huggers' },
  ]),
};

// 5) 20-2 by twos, then a 10-1 ladder.
const ladder202: RepWorkout = {
  mode: 'rep',
  slug: 'rep-20-2-then-10-1-barbell',
  origin: 'original',
  title: '20-2 & 10-1 · Barbell Ladders',
  summary:
    'A 20-down-to-2-by-twos ladder of pressing and rowing, then a 10-to-1 ladder of hinge and squat work.',
  targets: [
    ...ladder(range(10, 1).map((n) => n * 2), [
      { movement: 'Bench press', load: '65 lb' },
      { movement: 'Rows', load: '45 lb' },
      { movement: 'Seated shoulder press', load: '40 lb' },
    ]),
    ...ladder(range(10, 1), [
      { movement: 'Romanian deadlifts', load: '45 lb' },
      { movement: 'Squats', load: '45 lb' },
      { movement: 'Alternating lunges', notes: 'each side' },
    ]),
  ],
};

// 6) 50 then 25 of each movement.
const fifty25: RepWorkout = {
  mode: 'rep',
  slug: 'rep-50-25-five-movements',
  origin: 'original',
  title: '50/25 · Five Movements',
  summary: 'Five movements for 50 reps each, then 25 reps each, for time.',
  targets: ladder([50, 25], [
    { movement: 'Pushups' },
    { movement: 'Thrusters', load: '40 lb' },
    { movement: 'Rows', load: '50 lb' },
    { movement: 'Halos', load: '40 lb' },
    { movement: 'Walking lunges', load: '50 lb' },
  ]),
};

// 7) 3 rounds for time.
const boxjump3rft: RepWorkout = {
  mode: 'rep',
  slug: 'rep-3rft-box-jumps-press',
  origin: 'original',
  title: '3 Rounds · Box Jumps & Burpees',
  summary:
    'Three rounds for time of box jumps, pressing, arm work, burpees, and situps.',
  targets: rounds(3, [
    { movement: 'Box jumps', count: 50 },
    { movement: 'Chest press', count: 15, load: '65 lb' },
    { movement: 'Skull crushers', count: 15, load: '30 lb' },
    { movement: 'Curls', count: 15, load: '30 lb' },
    { movement: 'Burpees', count: 25 },
    { movement: 'Situps', count: 20 },
  ]),
};

// 8) 12-1 pyramid.
const pyr121snatch: RepWorkout = {
  mode: 'rep',
  slug: 'rep-12-1-pyramid-snatches',
  origin: 'original',
  title: '12-1 Pyramid · Snatches',
  summary:
    'Snatches, overhead swings, burpees, and shin huggers descending 12 down to 1.',
  targets: ladder(range(12, 1), [
    { movement: 'Snatches', notes: 'each side' },
    { movement: 'Overhead kettlebell swings' },
    { movement: 'Burpees' },
    { movement: 'Shin huggers' },
  ]),
};

// 9) 20-2 by twos then 10-1, read as a ladder over the movements.
const pyr202then101: RepWorkout = {
  mode: 'rep',
  slug: 'rep-20-2-10-1-mixed',
  origin: 'original',
  title: '20-2 & 10-1 · Mixed Pyramid',
  summary: 'A ladder over six movements: 20 down to 2 by twos, then 10 down to 1.',
  targets: ladder([...range(10, 1).map((n) => n * 2), ...range(10, 1)], [
    { movement: 'Diamond pushups' },
    { movement: 'Box jumps' },
    { movement: 'Pull-ups' },
    { movement: 'Burpee thrusts' },
    { movement: 'Shoulder press', load: '35 lb' },
    { movement: 'Shin huggers' },
  ]),
};

// 10) 20-2 by twos, read as a ladder over the movements.
const pyr202goblet: RepWorkout = {
  mode: 'rep',
  slug: 'rep-20-2-pyramid-goblet',
  origin: 'original',
  title: '20-2 Pyramid · Goblet Squats',
  summary: 'A ladder over six movements descending 20 to 2 by twos.',
  targets: ladder(range(10, 1).map((n) => n * 2), [
    { movement: 'Goblet squats', load: '65 lb' },
    { movement: 'Alternating reverse lunges', load: '40 lb', notes: 'alternating' },
    { movement: 'Air squats' },
    { movement: 'Chest press' },
    { movement: 'Rows', load: '50 lb' },
    { movement: 'Overhead press', load: '45 lb' },
  ]),
};

// 11) 5 rounds for time, plus a bear-crawl finisher (see summary).
const superset5rft: RepWorkout = {
  mode: 'rep',
  slug: 'rep-5rft-split-squat-press',
  origin: 'original',
  title: '5 Rounds · Split-Squat Press',
  summary:
    'Five rounds for time of split-squat press, renegade rows, swings, and skater hops, finishing with a 4-minute bear crawl.',
  targets: rounds(5, [
    { movement: 'Split-squat press', count: 10, load: '30 lb', notes: 'each side, 20 total' },
    { movement: 'Renegade row with pushup', count: 10, load: '40 lb' },
    { movement: 'Kneeling curl-press-extension', count: 10, load: '40 lb' },
    { movement: 'Skier swings', count: 30, load: '30 lb' },
    { movement: 'Skater hops', count: 30, load: '35 lb' },
  ]),
};

// 12) 3 rounds with jump rope after each exercise (60 / 40 / 20 by round).
const jrRound = (jr: number): RepTarget[] => [
  { movement: '1.5 pushups', count: 10 },
  { movement: 'Jump rope', count: jr },
  { movement: 'Kneeling Arnold press', count: 15, load: '35 lb' },
  { movement: 'Jump rope', count: jr },
  { movement: 'Goblet squats', count: 15, load: '65 lb' },
  { movement: 'Jump rope', count: jr },
  { movement: 'Prone rows', count: 10, load: '45 lb', notes: 'each side' },
  { movement: 'Jump rope', count: jr },
  { movement: 'Goblet lateral squats', count: 10 },
  { movement: 'Jump rope', count: jr },
  { movement: 'Spiderman steps', count: 10 },
  { movement: 'Jump rope', count: jr },
];
const jrChipper: RepWorkout = {
  mode: 'rep',
  slug: 'rep-jump-rope-3-rounds',
  origin: 'original',
  title: '3 Rounds · Jump-Rope Intervals',
  summary:
    'Three rounds of six movements with jump rope after each exercise — 60 skips in round one, 40 in round two, 20 in round three.',
  targets: [...jrRound(60), ...jrRound(40), ...jrRound(20)],
};

// 13) Four rounds descending by ten, movements staggered.
const highPullRound = (a: number, b: number, c: number): RepTarget[] => [
  { movement: 'Kettlebell high pulls', count: a, load: '64 lb' },
  { movement: 'Situps', count: b },
  { movement: 'Burpees', count: c },
];
const highPullPyramid: RepWorkout = {
  mode: 'rep',
  slug: 'rep-descending-high-pulls',
  origin: 'original',
  title: 'Descending Pyramid · High Pulls',
  summary:
    'Four rounds descending by ten — kettlebell high pulls, situps, and burpees staggered from 60/50/40 down to 30/20/10.',
  targets: [
    ...highPullRound(60, 50, 40),
    ...highPullRound(50, 40, 30),
    ...highPullRound(40, 30, 20),
    ...highPullRound(30, 20, 10),
  ],
};

// 15) Single-pass chipper.
const chipperKneeling: RepWorkout = {
  mode: 'rep',
  slug: 'rep-chipper-kneeling-press',
  origin: 'original',
  title: 'Chipper · Press to Climbers',
  summary:
    'A single-pass chipper of dumbbell pressing, rows, lunges, and 100 each of mountain climbers and jumping jacks.',
  targets: [
    { movement: 'Kneeling press', count: 20, load: '35 lb' },
    { movement: 'Floor chest press', count: 10, load: '65 lb' },
    { movement: 'Renegade rows with pushup', count: 10, load: '40 lb' },
    { movement: 'Reverse lunges', count: 20, load: '40 lb' },
    { movement: 'Mountain climbers', count: 100 },
    { movement: 'Jumping jacks', count: 100 },
  ],
};

// 16) Single-DB complex chipper with jump-over burpees between.
const chipperHangSnatch: RepWorkout = {
  mode: 'rep',
  slug: 'rep-chipper-single-db-complex',
  origin: 'original',
  title: 'Chipper · Single-DB Complex',
  summary:
    'A dumbbell complex chipper alternating single-arm snatch, clean-press, thruster, and clean-squat work with jump-over burpees between.',
  targets: [
    { movement: 'Single-DB hang snatch', count: 20, load: '35 lb', notes: 'each side, 40 total' },
    { movement: 'Jump-over-weight burpees', count: 20 },
    { movement: 'DB hang clean-press', count: 20, load: '35 lb', notes: 'each side, 40 total' },
    { movement: 'Jump-over burpees', count: 20 },
    { movement: 'Single-DB thrusters', count: 20, load: '35 lb', notes: 'each side, 40 total' },
    { movement: 'Jump-over burpees', count: 20 },
    { movement: 'Hang clean squat', count: 20, load: '35 lb', notes: 'each side, 40 total' },
    { movement: 'Burpees', count: 20 },
    { movement: 'Devils press', count: 20, load: '35 lb' },
  ],
};

// 17) 4 rounds for time.
const upperBody4rft: RepWorkout = {
  mode: 'rep',
  slug: 'rep-4rft-upper-body',
  origin: 'original',
  title: '4 Rounds · Upper Body',
  summary: 'Four rounds for time of pressing, arm work, and 100 jumping jacks.',
  targets: rounds(4, [
    { movement: 'Chest press', count: 10, load: '65 lb' },
    { movement: 'Pushups', count: 15 },
    { movement: 'Shoulder press', count: 10, load: '45 lb', notes: 'each side' },
    { movement: 'Lateral raises', count: 15, load: '20 lb' },
    { movement: 'Curls', count: 10, load: '30 lb' },
    { movement: 'Skull crushers', count: 10, load: '30 lb' },
    { movement: 'Jumping jacks', count: 100 },
  ]),
};

// 18) 4 rounds of three supersets.
const supersets4: RepWorkout = {
  mode: 'rep',
  slug: 'rep-4-rounds-supersets',
  origin: 'original',
  title: '4 Rounds · Supersets',
  summary:
    'Four rounds of three dumbbell supersets: bench and pushups, rows and split squats, Arnold press and DB jacks.',
  targets: rounds(4, [
    { movement: 'DB bench', count: 10, load: '65 lb' },
    { movement: 'Pushups', count: 20 },
    { movement: 'DB rows', count: 10, load: '65 lb', notes: 'each arm' },
    { movement: 'DB split squats', count: 20, load: '35 lb', notes: '20 total' },
    { movement: 'Arnold press', count: 10, load: '35 lb' },
    { movement: 'DB jacks', count: 20 },
  ]),
};

// 19) Ascending row/pushup ladder, then a 5-10-15 ladder.
const rowRung = (i: number): RepTarget[] => [
  { movement: 'Row', count: 160 * i, notes: 'metres' },
  { movement: 'Pushups', count: 10 * i },
];
const rowLadder: RepWorkout = {
  mode: 'rep',
  slug: 'rep-row-pushup-ladder',
  origin: 'original',
  title: 'Row & Pushup Ladder',
  summary:
    'An ascending ladder pairing 160-to-800m rows with 10-to-50 pushups, then a 5-10-15 ladder of squats, press, and rows.',
  targets: [
    ...range(1, 5).flatMap(rowRung),
    ...ladder([5, 10, 15], [
      { movement: 'Squats' },
      { movement: 'Press' },
      { movement: 'Rows' },
    ]),
  ],
};

// 20) Two 15-3-by-twos ladders (snatch right, then snatch left).
const scheme153 = range(7, 1).map((n) => n * 2 + 1); // 15,13,...,3
const ladder153: RepWorkout = {
  mode: 'rep',
  slug: 'rep-15-3-double-ladder',
  origin: 'original',
  title: '15-3 · Double Ladder',
  summary:
    'Two 15-down-to-3-by-twos ladders, the first snatching right, the second snatching left.',
  targets: [
    ...ladder(scheme153, [
      { movement: 'Heavy squats', notes: 'heavy' },
      { movement: 'DB snatches', load: '50 lb', notes: 'right side' },
      { movement: 'Clap pushups' },
      { movement: 'Single-DB curl-press-tri', load: '50 lb' },
    ]),
    ...ladder(scheme153, [
      { movement: 'V-ups' },
      { movement: 'DB snatches', load: '50 lb', notes: 'left side' },
      { movement: 'Hand-release pushups' },
      { movement: 'Rows', load: '50 lb' },
    ]),
  ],
};

// 21) 50 burpees, a 5-25 ladder, then a 50-burpee finisher.
const burpeeLadder: RepWorkout = {
  mode: 'rep',
  slug: 'rep-burpee-bookend-ladder',
  origin: 'original',
  title: 'Burpee-Bookend Ladder',
  summary:
    'Fifty burpees, then a 5-10-15-20-25 ladder of push press, goblet squats, pushups, and situps, capped by a 50-burpee finisher.',
  targets: [
    { movement: 'Burpees', count: 50 },
    ...ladder(range(1, 5).map((n) => n * 5), [
      { movement: 'DB push press', load: '20 lb' },
      { movement: 'Goblet squats', load: '30 lb' },
      { movement: 'Pushups' },
      { movement: 'Situps' },
    ]),
    { movement: 'Burpees', count: 50 },
  ],
};

// 22) 4 rounds for time.
const devils4rft: RepWorkout = {
  mode: 'rep',
  slug: 'rep-4rft-devils-press',
  origin: 'original',
  title: '4 Rounds · Devils Press',
  summary:
    'Four rounds for time of alternating devils press, pushup pull-throughs, box jumps, and situps.',
  targets: rounds(4, [
    { movement: 'Devils press', count: 30, load: '35 lb', notes: 'single-arm alternating' },
    { movement: 'Pushup weight pull-through', count: 20, load: '35 lb' },
    { movement: 'Box jumps', count: 30 },
    { movement: 'Situps', count: 30 },
  ]),
};

// 23) 9-1 pyramid.
const pyr91: RepWorkout = {
  mode: 'rep',
  slug: 'rep-9-1-pyramid',
  origin: 'original',
  title: '9-1 Pyramid',
  summary:
    'Split-squat press each side, curl-press-extension, king-kong pushups, and underhand rows descending 9 to 1.',
  targets: ladder(range(9, 1), [
    { movement: 'Split-squat press', notes: 'right side' },
    { movement: 'Split-squat press', notes: 'left side' },
    { movement: 'Curl-press-extension' },
    { movement: 'King-kong pushup' },
    { movement: 'DB underhand rows' },
  ]),
};

// 24) 6 rounds for time (canonical; the 5-round + 10-curls variant is merged here).
const goblet6rft: RepWorkout = {
  mode: 'rep',
  slug: 'rep-6rft-thrusters-goblet',
  origin: 'original',
  title: '6 Rounds · Thrusters & Goblets',
  summary:
    'Six rounds for time of thrusters, renegade rows, heavy goblet squats, devils press, and spiderman steps.',
  targets: rounds(6, [
    { movement: 'Thrusters', count: 10, load: '40 lb' },
    { movement: 'Renegade row pushups', count: 10, load: '40 lb' },
    { movement: 'Goblet squats', count: 10, load: '65 lb', notes: 'heavy' },
    { movement: 'Devils press', count: 10, load: '40 lb', notes: 'single-arm alternating' },
    { movement: 'Spiderman steps', count: 10 },
  ]),
};

// 25) 10 rounds for time.
const dt10: RepWorkout = {
  mode: 'rep',
  slug: 'rep-10rft-db-complex',
  origin: 'original',
  title: '10 Rounds · DB Complex',
  summary:
    'Ten rounds for time of 12 deadlifts, 9 hang cleans, 6 push press, and 3 devils press.',
  targets: rounds(10, [
    { movement: 'DB deadlifts', count: 12, load: '40 lb' },
    { movement: 'Hang clean', count: 9, load: '40 lb' },
    { movement: 'Push press', count: 6, load: '40 lb' },
    { movement: 'Devils press', count: 3, load: '40 lb' },
  ]),
};

// 26) 16 rounds per side.
const swings16: RepWorkout = {
  mode: 'rep',
  slug: 'rep-16-rounds-single-arm',
  origin: 'original',
  title: '16 Rounds · Single-Arm',
  summary:
    'Sixteen rounds per side of single-arm swings, single-DB pushups, and burpees.',
  targets: rounds(16, [
    { movement: 'Single-arm swings', count: 7, load: '24 kg', notes: 'each side' },
    { movement: 'Single-DB pushups', count: 5, load: '24 kg', notes: 'each side' },
    { movement: 'Burpees', count: 3 },
  ]),
};

// 27) Single-pass chipper of 50s.
const chipper50: RepWorkout = {
  mode: 'rep',
  slug: 'rep-chipper-50s',
  origin: 'original',
  title: 'Chipper · 50s',
  summary:
    'A single-pass chipper of 50 reps each: archer pushups, thrusters, split squats, rows, curls, and ball slams.',
  targets: [
    { movement: 'Archer pushups', count: 50 },
    { movement: 'Thrusters', count: 50, load: '40 lb' },
    { movement: 'Split squats', count: 50, load: '40 lb' },
    { movement: 'Rows', count: 50, load: '40 lb' },
    { movement: 'Close-grip curls', count: 50, load: '25 lb' },
    { movement: 'Ball slams', count: 50, load: '30 lb' },
  ],
};

// 28) 5 rounds of push work, then 5 rounds of legs.
const twoBlocks5: RepWorkout = {
  mode: 'rep',
  slug: 'rep-5-and-5-rounds',
  origin: 'original',
  title: '5 & 5 Rounds · Push then Legs',
  summary:
    'Five rounds of pushups, rows, and press, then five rounds of squats, lunges, and lateral lunges.',
  targets: [
    ...rounds(5, [
      { movement: 'Pushups', count: 15 },
      { movement: 'Rows', count: 10 },
      { movement: 'Press', count: 5 },
    ]),
    ...rounds(5, [
      { movement: 'Squats', count: 15 },
      { movement: 'Lunges', count: 10, notes: 'left and right' },
      { movement: 'Lateral lunges', count: 10, notes: 'each side' },
    ]),
  ],
};

// 29) Big chipper alternating 50-rep sets with 13-rep burpee variations.
const bigChipper: RepWorkout = {
  mode: 'rep',
  slug: 'rep-big-swing-burpee-chipper',
  origin: 'original',
  title: 'Big Chipper · Swings & Burpees',
  summary:
    'A long chipper alternating 50-rep kettlebell and dumbbell sets with 13 burpee variations between each.',
  targets: [
    { movement: 'Hand-to-hand swings', count: 50, load: '24 kg' },
    { movement: 'Pushups', count: 13 },
    { movement: 'Goblet squats', count: 50, load: '28 kg' },
    { movement: 'Half burpees', count: 13 },
    { movement: 'Clean-press', count: 25, load: '20 kg', notes: 'each arm, 50 total' },
    { movement: 'Burpees', count: 13 },
    { movement: 'Snatches', count: 25, load: '45 lb', notes: 'each arm, 50 total' },
    { movement: 'Low-squat burpees', count: 13 },
    { movement: 'Thrusters', count: 25, load: '45 lb', notes: 'each arm, 50 total' },
    { movement: 'Lateral burpees', count: 13 },
    { movement: 'Two-hand swings', count: 50, load: '28 kg' },
    { movement: '180 burpees', count: 13 },
    { movement: 'Tuck situps', count: 50 },
  ],
};

// 30) Rep-goal.
const manmakers: RepWorkout = {
  mode: 'rep',
  slug: 'rep-100-manmakers',
  origin: 'original',
  title: '100 Manmakers',
  summary: 'One hundred manmakers for time.',
  targets: [{ movement: 'Manmakers', count: 100, load: '25 lb' }],
};

// 31) ~4 rounds for time (bodyweight rounds).
const bwRounds4: RepWorkout = {
  mode: 'rep',
  slug: 'rep-4rft-bodyweight-legs',
  origin: 'original',
  title: '4 Rounds · Squats & Lunges',
  summary: 'Four rounds for time of squats, walking lunges, rows, and pushups.',
  targets: rounds(4, [
    { movement: 'Squats', count: 20 },
    { movement: 'Walking lunges', count: 40 },
    { movement: 'DB rows', count: 20 },
    { movement: 'Pushups', count: 20 },
  ]),
};

// 32) Single-pass chipper of 60s.
const chipper60: RepWorkout = {
  mode: 'rep',
  slug: 'rep-chipper-60s',
  origin: 'original',
  title: 'Chipper · 60s',
  summary: 'A single-pass chipper of 60 reps each across seven movements.',
  targets: [
    { movement: 'Double-pushup burpees', count: 60 },
    { movement: 'Goblet squats', count: 60, load: '50 lb' },
    { movement: 'Rows', count: 60, load: '40 lb' },
    { movement: 'Overhead press', count: 60, load: '40 lb' },
    { movement: 'Skier swings', count: 60, load: '30 lb' },
    { movement: 'DB jacks', count: 60 },
    { movement: 'Chest press', count: 60, load: '45 lb' },
  ],
};

// 33) 15 rounds for time.
const snatch15rft: RepWorkout = {
  mode: 'rep',
  slug: 'rep-15rft-snatch-press',
  origin: 'original',
  title: '15 Rounds · Snatch & Press',
  summary:
    'Fifteen rounds for time of snatches, push press, lunges, pop squats, and pushups.',
  targets: rounds(15, [
    { movement: 'DB snatches', count: 5 },
    { movement: 'Push press', count: 5 },
    { movement: 'Lunges', count: 10 },
    { movement: 'Pop squats', count: 5 },
    { movement: 'Pushups', count: 10 },
  ]),
};

// 34) Ascending single-pass chipper.
const ascChipper: RepWorkout = {
  mode: 'rep',
  slug: 'rep-ascending-chipper',
  origin: 'original',
  title: 'Ascending Chipper',
  summary:
    'A single-pass chipper climbing from 10 up to 50 reps across eight movements.',
  targets: [
    { movement: 'Double-pushup burpees', count: 10 },
    { movement: 'Up-down planks', count: 20 },
    { movement: 'Kneeling curls', count: 30 },
    { movement: 'Tri extensions', count: 30 },
    { movement: 'DB bent rows', count: 40 },
    { movement: 'Lateral mountain climbers', count: 40 },
    { movement: 'Split-squat press', count: 50, notes: 'each leg, 100 total' },
    { movement: 'Predator jacks', count: 50 },
  ],
};

// 35) 2-20 ascending ladder by twos.
const ascLadder220: RepWorkout = {
  mode: 'rep',
  slug: 'rep-2-20-ascending-ladder',
  origin: 'original',
  title: '2-20 Ascending Ladder',
  summary: 'Devils press, squats, and weighted jacks climbing from 2 up to 20 by twos.',
  targets: ladder(range(1, 10).map((n) => n * 2), [
    { movement: 'Devils press', load: '35 lb' },
    { movement: 'Squats' },
    { movement: 'Weighted jumping jacks', load: '35 lb' },
  ]),
};

// 36) Descending chipper, a different movement at every rung.
const descChipper100: RepWorkout = {
  mode: 'rep',
  slug: 'rep-100-10-descending-chipper',
  origin: 'original',
  title: '100-10 Descending Chipper',
  summary:
    'A descending chipper from 100 down to 10 reps, a different movement at every rung.',
  targets: [
    { movement: 'Jumping jacks', count: 100 },
    { movement: 'Split squats', count: 45, load: '35 lb', notes: 'each side, 90 total' },
    { movement: 'DB curl-press', count: 80, load: '25 lb' },
    { movement: 'Lateral extensions', count: 35, load: '20 lb', notes: 'each side, 70 total' },
    { movement: 'T-pushups', count: 60 },
    { movement: 'Kneeling DB tri extensions', count: 50, load: '35 lb' },
    { movement: 'Bear-crawl taps', count: 40 },
    { movement: 'Thrusters', count: 30, load: '35 lb' },
    { movement: 'Shin huggers', count: 20 },
    { movement: 'Burpees', count: 10 },
  ],
};

// 37) 50-10 pyramid; 10 pushups after each round (see summary).
const pyr5010: RepWorkout = {
  mode: 'rep',
  slug: 'rep-50-10-pyramid',
  origin: 'original',
  title: '50-10 Pyramid',
  summary:
    'Pushups, alternating snatches, and situps descending 50/40/30/20/10, with 10 pushups after each round.',
  targets: ladder(range(5, 1).map((n) => n * 10), [
    { movement: 'Pushups' },
    { movement: 'Alternating DB snatches', load: '50 lb' },
    { movement: 'Situps' },
  ]),
};

// 38) 35 rounds for time.
const fives35rft: RepWorkout = {
  mode: 'rep',
  slug: 'rep-35rft-burpee-squat',
  origin: 'original',
  title: '35 Rounds · Fives',
  summary:
    'Thirty-five rounds for time of 5 burpees, 5 air squats, 5 pushups, and 5 situps.',
  targets: rounds(35, [
    { movement: 'Burpees', count: 5 },
    { movement: 'Air squats', count: 5 },
    { movement: 'Pushups', count: 5 },
    { movement: 'Situps', count: 5 },
  ]),
};

// 39) 4 rounds for time.
const burpee4rft: RepWorkout = {
  mode: 'rep',
  slug: 'rep-4rft-burpees-bear-taps',
  origin: 'original',
  title: '4 Rounds · Burpees & Bear Taps',
  summary:
    'Four rounds for time of double-pushup burpees, shin huggers, superman steps, bear taps, and lunges.',
  targets: rounds(4, [
    { movement: 'Double-pushup burpees', count: 25 },
    { movement: 'Shin huggers', count: 25 },
    { movement: 'Superman steps', count: 25 },
    { movement: 'Bear shoulder taps', count: 25, notes: 'each side' },
    { movement: 'Lunges', count: 25, notes: 'each side, 50 total' },
  ]),
};

export const repLibrary: RepWorkout[] = [
  bikeSwings3rft,
  descChipperPenalties,
  ladder14,
  pyr520,
  ladder202,
  fifty25,
  boxjump3rft,
  pyr121snatch,
  pyr202then101,
  pyr202goblet,
  superset5rft,
  jrChipper,
  highPullPyramid,
  chipperKneeling,
  chipperHangSnatch,
  upperBody4rft,
  supersets4,
  rowLadder,
  ladder153,
  burpeeLadder,
  devils4rft,
  pyr91,
  goblet6rft,
  dt10,
  swings16,
  chipper50,
  twoBlocks5,
  bigChipper,
  manmakers,
  bwRounds4,
  chipper60,
  snatch15rft,
  ascChipper,
  ascLadder220,
  descChipper100,
  pyr5010,
  fives35rft,
  burpee4rft,
];
