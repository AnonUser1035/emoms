// Athlete-paced rep workouts: chippers, rep-goals, and pyramids/ladders.

import type { RepTarget, RepWorkout } from './types';

// Round two swaps diamond pushups for regular — otherwise the same six
// movements at half the reps, so the twelve targets are written out in full.
const round = (count: number, pushupVariant: string): RepTarget[] => [
  { movement: pushupVariant, count },
  { movement: 'Goblet squats', count, load: '65 lb' },
  { movement: 'Overhead press', count, load: '40 lb', notes: 'seated' },
  { movement: 'Curls', count },
  { movement: 'Reverse lunges', count, load: '45 lb' },
  { movement: 'Full-body extensions', count, load: '25 lb' },
];

const chipper6030: RepWorkout = {
  mode: 'rep',
  slug: 'chipper-60-30',
  origin: 'original',
  title: '60/30 Chipper',
  summary:
    'Six movements, 60 reps each, then 30 reps each — diamond pushups become regular in round two. For time.',
  targets: [...round(60, 'Diamond pushups'), ...round(30, 'Pushups')],
};

const pushups300: RepWorkout = {
  mode: 'rep',
  slug: 'pushups-300',
  origin: 'original',
  title: '300 Pushups',
  summary:
    '300 pushups or 35 minutes, whichever comes first. Every break: 15 goblet squats and 15 tuck jumps.',
  targets: [{ movement: 'Pushups', count: 300 }],
  capMin: 35,
  onBreak: [
    { movement: 'Goblet squats', count: 15 },
    { movement: 'Tuck jumps', count: 15 },
  ],
};

export const repWorkouts: RepWorkout[] = [chipper6030, pushups300];
