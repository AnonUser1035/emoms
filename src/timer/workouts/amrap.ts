// AMRAP workouts: a fixed clock, one round repeated, count your rounds.
// Imported from David's training log — results (HR, times, per-athlete
// weights) stripped; only the prescription kept.

import type { AmrapWorkout } from './types';

const amrapKneelingPress: AmrapWorkout = {
  mode: 'amrap',
  slug: 'amrap-kneeling-press',
  origin: 'original',
  title: 'AMRAP · Kneeling Press',
  summary:
    'Thirty-minute AMRAP: kneeling press, step lunges, inchworm pushups, split-stance rows, and DB jacks — count your rounds.',
  capMin: 30,
  round: [
    { movement: 'Half-kneeling press', count: 10, load: '40 lb', notes: 'each side' },
    {
      movement: 'Elevated reverse lunge',
      count: 10,
      load: '40 lb',
      notes: 'each side, off a step',
    },
    { movement: 'Inchworm pushups', count: 5 },
    { movement: 'Split-stance DB row', count: 10, load: '45 lb', notes: 'each side' },
    { movement: 'DB jacks', count: 30, load: '40 lb' },
  ],
};

const amrapAscendingTriplet: AmrapWorkout = {
  mode: 'amrap',
  slug: 'amrap-ascending-triplet',
  origin: 'original',
  title: 'AMRAP +1 Triplet',
  summary:
    'Thirty-minute AMRAP that climbs: one rep each of pushup renegade row, KB sumo high pull, and ab wheel in round one, adding a rep every round.',
  capMin: 30,
  roundStep: 1,
  round: [
    { movement: 'Pushup renegade row', count: 1, load: '35 lb' },
    { movement: 'KB sumo high pull', count: 1, load: '53 lb' },
    { movement: 'Ab wheel', count: 1, notes: 'or Russian twist' },
  ],
};

const amrapCurlsSnatches: AmrapWorkout = {
  mode: 'amrap',
  slug: 'amrap-curls-snatches',
  origin: 'original',
  title: 'AMRAP · Curls & Snatches',
  summary:
    'Thirty-five-minute AMRAP: hammer curls, alternating snatches, lunges, rows, shin huggers, and burpees — count your rounds.',
  capMin: 35,
  round: [
    { movement: 'Hammer curls', count: 10, load: '35 lb' },
    { movement: 'Alternating DB snatch', count: 10, notes: 'each side' },
    {
      movement: 'Reverse lunge',
      count: 10,
      load: '65 lb',
      notes: 'alternating, 20 total',
    },
    { movement: 'Bent-over row', count: 10, load: '50 lb' },
    { movement: 'Shin huggers', count: 15 },
    { movement: 'Double-pushup burpee', count: 5 },
  ],
};

const amrapPushupsSwings: AmrapWorkout = {
  mode: 'amrap',
  slug: 'amrap-pushups-swings',
  origin: 'original',
  title: 'AMRAP +5 Pushups & Swings',
  summary:
    'Thirty-minute AMRAP that climbs: five pushups and ten KB swings in round one, adding five reps to each every round.',
  capMin: 30,
  roundStep: 5,
  round: [
    { movement: 'Pushups', count: 5 },
    { movement: 'KB swings', count: 10 },
  ],
};

const amrapSealJacks: AmrapWorkout = {
  mode: 'amrap',
  slug: 'amrap-seal-jacks',
  origin: 'original',
  title: 'AMRAP · Seal Jacks',
  summary:
    'Thirty-minute AMRAP: inchworm pushups, arnold press, seal jacks, skater hops, hammer curls, reverse lunges, and spider steps.',
  capMin: 30,
  round: [
    { movement: 'Inchworm', count: 2, notes: '5 pushups each' },
    { movement: 'Arnold press', count: 10 },
    { movement: 'Seal jacks', count: 50 },
    { movement: 'Skater hops', count: 50 },
    { movement: 'Hammer curls', count: 15 },
    { movement: 'DB reverse lunges', count: 20 },
    { movement: 'Spider steps', count: 10 },
  ],
};

const amrapJacksThrusters: AmrapWorkout = {
  mode: 'amrap',
  slug: 'amrap-jacks-thrusters',
  origin: 'original',
  title: 'AMRAP · Jacks & Thrusters',
  summary:
    'Five rounds, or a thirty-minute AMRAP: jumping jacks, thrusters, bear shoulder taps, renegade rows, and DB skaters.',
  capMin: 30,
  round: [
    { movement: 'Jumping jacks', count: 50 },
    { movement: 'Thrusters', count: 5 },
    { movement: 'Bear shoulder taps', count: 50 },
    { movement: 'Renegade row with pushup', count: 5 },
    { movement: 'DB skaters', count: 50 },
  ],
};

const amrapClimbSix: AmrapWorkout = {
  mode: 'amrap',
  slug: 'amrap-climb-six',
  origin: 'original',
  title: 'AMRAP · Six-Move Circuit',
  summary:
    'Thirty-minute AMRAP over six movements — squats, curl-press-extension, lunges, rows, press, and dive-bombers — ten reps each, count your rounds.',
  capMin: 30,
  round: [
    { movement: 'Rack squats', count: 10 },
    { movement: 'Curl-press-extension', count: 10 },
    { movement: 'Reverse lunge', count: 10, notes: 'or Romanian deadlift' },
    { movement: 'Renegade row with pushup', count: 10 },
    { movement: 'Shoulder press', count: 10 },
    { movement: 'Dive-bomber pushups', count: 10 },
  ],
};

export const amrapWorkouts: AmrapWorkout[] = [
  amrapKneelingPress,
  amrapAscendingTriplet,
  amrapCurlsSnatches,
  amrapPushupsSwings,
  amrapSealJacks,
  amrapJacksThrusters,
  amrapClimbSix,
];
