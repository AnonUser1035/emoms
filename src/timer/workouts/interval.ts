// Interval / tabata workouts: rounds of timed work and rest.
// Imported from David's training log — results stripped.

import type { IntervalWorkout } from './types';

const intervals10x2: IntervalWorkout = {
  mode: 'interval',
  slug: 'intervals-10x2',
  origin: 'original',
  title: '10 × 2:00 Intervals',
  summary:
    'Ten rounds of two minutes on, one minute off: air squats, situps, pushups, then max alternating snatches in whatever time is left.',
  rounds: 10,
  workSec: 120,
  restSec: 60,
  stations: [
    {
      movement: 'Squats / situps / pushups / max snatches',
      circuit: [
        { movement: 'Air squats', measure: { kind: 'reps', count: 25 } },
        { movement: 'Situps', measure: { kind: 'reps', count: 20 } },
        { movement: 'Pushups', measure: { kind: 'reps', count: 15 } },
        {
          movement: 'Alternating DB snatch',
          measure: { kind: 'max' },
          load: '40 lb',
        },
      ],
    },
  ],
};

const tabataPushPull: IntervalWorkout = {
  mode: 'interval',
  slug: 'tabata-push-pull',
  origin: 'original',
  title: 'Tabata · Push/Pull',
  summary:
    'Eight rounds of 20 on, 10 off, rotating pushups, heavy rows each arm, and air squats — pair it with a second cleans-and-Tyson-pushups tabata after a four-minute rest.',
  rounds: 8,
  workSec: 20,
  restSec: 10,
  stations: [
    { movement: 'Pushups', measure: { kind: 'max' } },
    { movement: 'Heavy row (right)', measure: { kind: 'max' }, load: '50 lb' },
    { movement: 'Heavy row (left)', measure: { kind: 'max' }, load: '50 lb' },
    { movement: 'Air squats', measure: { kind: 'max' } },
  ],
};

export const intervalWorkouts: IntervalWorkout[] = [
  intervals10x2,
  tabataPushPull,
];
