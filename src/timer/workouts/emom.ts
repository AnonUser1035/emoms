// EMOM and circuit-cycle workouts.
// Pace targets on erg stations are starting estimates — tune to taste.

import type { CircuitPart, EmomWorkout, Station } from './types';

const emom30: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-30',
  origin: 'original',
  title: 'EMOM 30',
  summary:
    'Three 10-minute blocks, one movement every minute, with a break and a plank between rounds.',
  blocks: [
    {
      label: 'Block 1',
      durationMin: 10,
      intervalSec: 60,
      stations: [
        {
          movement: 'Front squat',
          measure: { kind: 'reps', count: 10 },
          load: '45 lb',
        },
        {
          movement: 'Row',
          measure: { kind: 'cal', count: 12, meters: 200 },
          pace: { calPerMin: 18 },
        },
      ],
      then: [
        { kind: 'break', seconds: 60 },
        {
          kind: 'station',
          station: {
            movement: 'Plank',
            measure: { kind: 'hold', seconds: 50 },
          },
        },
      ],
    },
    {
      label: 'Block 2',
      durationMin: 10,
      intervalSec: 60,
      stations: [
        {
          movement: 'Single-arm bent-over row',
          measure: { kind: 'perSide', count: 10 },
          load: '60 lb',
        },
        {
          movement: 'Ski erg',
          measure: { kind: 'cal', count: 12, meters: 180 },
          pace: { calPerMin: 18 },
        },
        { movement: 'Butterfly sit-ups', measure: { kind: 'reps', count: 20 } },
      ],
      then: [{ kind: 'break', seconds: 60 }],
    },
    {
      label: 'Block 3',
      durationMin: 10,
      intervalSec: 60,
      stations: [
        {
          movement: 'Kneeling shoulder press',
          measure: { kind: 'perSide', count: 8 },
          load: '45 lb',
        },
        {
          movement: 'Assault bike',
          measure: { kind: 'cal', count: 12 },
          pace: { calPerMin: 15 },
        },
        { movement: 'Mountain climbers', measure: { kind: 'reps', count: 30 } },
      ],
    },
  ],
};

// Six 5-minute cycles; each part paces to ~1 minute but only the 5:00
// boundary is enforced (checklist display, minute ticks — see EmomPlayer).
// Stations differ only in the erg, so rotation walks bike → ski → row twice.
const CYCLE_BASE: CircuitPart[] = [
  { movement: 'Dumbbell squats' },
  { movement: 'Med ball throw downs' },
  { movement: 'Situps' },
  { movement: 'Pushups' },
];

const cycle = (name: string, erg: CircuitPart): Station => ({
  movement: name,
  circuit: [...CYCLE_BASE, erg],
});

const cycles6x5: EmomWorkout = {
  mode: 'emom',
  slug: 'cycles-6x5',
  origin: 'original',
  title: '6×5 Cycles',
  summary:
    'Six 5-minute cycles — squats, throw downs, situps, pushups, and a rotating erg. Each paces to about a minute; only the 5:00 matters.',
  blocks: [
    {
      durationMin: 30,
      intervalSec: 300,
      stations: [
        cycle('Cycle (bike)', {
          movement: 'Assault bike',
          measure: { kind: 'cal', count: 12 },
        }),
        cycle('Cycle (ski)', {
          movement: 'Ski erg',
          measure: { kind: 'dist', meters: 200 },
        }),
        cycle('Cycle (row)', {
          movement: 'Row',
          measure: { kind: 'dist', meters: 250 },
        }),
      ],
    },
  ],
};

export const emomWorkouts: EmomWorkout[] = [emom30, cycles6x5];
