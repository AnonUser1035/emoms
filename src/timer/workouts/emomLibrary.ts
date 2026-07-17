// EMOM workouts imported from David's training log — results stripped.
//
// Every entry is one of David Rosen's own sessions (`origin: 'original'`).
// Heart-rate readings, finish times, dates, and per-person weight notes have
// all been dropped; only the primary prescription and its primary load remain.
// A handful of log entries gave reps/loads but no duration — those are modeled
// as a representative 5 rounds and flagged in their summary.

import type { Block, CircuitPart, EmomWorkout, Measure, Station } from './types';

// ── Small authoring helpers ────────────────────────────────────────────────
const reps = (count: number): Measure => ({ kind: 'reps', count });
const perSide = (count: number): Measure => ({ kind: 'perSide', count });
const cal = (count: number, meters?: number): Measure =>
  meters ? { kind: 'cal', count, meters } : { kind: 'cal', count };
const hold = (seconds: number): Measure => ({ kind: 'hold', seconds });
const MAX: Measure = { kind: 'max' };

const st = (
  movement: string,
  measure: Measure,
  load?: string,
  notes?: string,
): Station => ({
  movement,
  measure,
  ...(load ? { load } : {}),
  ...(notes ? { notes } : {}),
});

const circuit = (
  movement: string,
  parts: CircuitPart[],
  load?: string,
  notes?: string,
): Station => ({
  movement,
  circuit: parts,
  ...(load ? { load } : {}),
  ...(notes ? { notes } : {}),
});

const cp = (
  movement: string,
  measure?: Measure,
  load?: string,
  notes?: string,
): CircuitPart => ({
  movement,
  ...(measure ? { measure } : {}),
  ...(load ? { load } : {}),
  ...(notes ? { notes } : {}),
});

const rest = (seconds = 60): Station => st('Rest', hold(seconds));

// ── 1 ── E3M: devils press / bench sandwich ─────────────────────────────────
const devilsPressBench: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-e3-devils-press-bench',
  origin: 'original',
  title: 'EMOM 3 · Devils Press & Bench',
  summary:
    'Every 3 minutes for 10 rounds — devils press, bench press, more devils press, then a row for calories.',
  blocks: [
    {
      durationMin: 30,
      intervalSec: 180,
      stations: [
        circuit('Devils press → bench → row', [
          cp('Devils press', reps(2)),
          cp('Bench press', reps(10), '40 lb'),
          cp('Devils press', reps(2)),
          cp('Row', cal(10)),
        ]),
      ],
    },
  ],
};

// ── 2 ── 8-round rotation: bike / burpee / chest / curls ────────────────────
const bikeBurpeeChestCurl: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-8-bike-burpee-chest-curl',
  origin: 'original',
  title: 'EMOM · Bike, Burpee, Chest, Curl',
  summary:
    'Eight rounds, one movement a minute — bike calories, burpees, incline chest press, and empty-bar curls.',
  blocks: [
    {
      durationMin: 32,
      intervalSec: 60,
      stations: [
        st('Assault bike', cal(12)),
        st('Burpees', reps(10)),
        st('Incline chest press', reps(10), '50 lb'),
        st('Barbell curls', reps(15), 'empty bar'),
      ],
    },
  ],
};

// ── 3 ── 30-min rotation: bike / swing / thruster / pushup / hugger / curl ──
const bikeSwingThruster: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-30-bike-swing-thruster',
  origin: 'original',
  title: 'EMOM 30 · Bike, Swing, Thruster',
  summary:
    'Thirty minutes, a movement a minute — bike, overhead swings, thrusters, pushups, shin huggers, and hammer curls.',
  blocks: [
    {
      durationMin: 30,
      intervalSec: 60,
      stations: [
        st('Assault bike', cal(12)),
        st('Overhead KB swings', reps(10), '30 kg'),
        st('Thrusters', reps(10), '40 lb'),
        st('Pushups', reps(15), undefined, '15–20 reps'),
        st('Shin huggers', reps(15)),
        st('Hammer curls', reps(10), '30 lb'),
      ],
    },
  ],
};

// ── 4 ── E3M: bike / air squat / bench ──────────────────────────────────────
const bikeSquatBench: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-e3-bike-squat-bench',
  origin: 'original',
  title: 'EMOM 3 · Bike, Squat, Bench',
  summary:
    'Every 3 minutes for 10 rounds — assault bike calories, air squats, then bench press.',
  blocks: [
    {
      durationMin: 30,
      intervalSec: 180,
      stations: [
        circuit('Bike → squat → bench', [
          cp('Assault bike', cal(10)),
          cp('Air squats', reps(10)),
          cp('Bench press', reps(10), '50 lb'),
        ]),
      ],
    },
  ],
};

// ── 5 ── 35-min kettlebell rotation ─────────────────────────────────────────
const ballisticRowsKb: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-35-ballistic-rows-kb',
  origin: 'original',
  title: 'EMOM 35 · Kettlebell Six',
  summary:
    'Five rounds of six kettlebell stations — ballistic rows, bottoms-up squats, swings, curls, pullovers, and max pushups.',
  blocks: [
    {
      durationMin: 30,
      intervalSec: 60,
      stations: [
        st('Ballistic rows', reps(20), '28 kg'),
        st('Bottoms-up squat', reps(15), '32 kg'),
        st('Two-hand swings', reps(20), '32 kg'),
        st('Bicep curls', reps(20), '24 kg'),
        st('Pullovers', reps(15), '20 kg'),
        st('Pushups', MAX),
      ],
    },
  ],
};

// ── 6 ── 6-round rotation: box jump / bench / renegade / jacks / combo ───────
const boxJumpBench: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-6-box-jump-bench',
  origin: 'original',
  title: 'EMOM · Box Jump & Bench',
  summary:
    'Six rounds, a movement a minute — box jumps, bench, renegade rows, weighted jacks, a burpee-snatch combo, and shin huggers.',
  blocks: [
    {
      durationMin: 36,
      intervalSec: 60,
      stations: [
        st('Box jumps', reps(16)),
        st('Bench press', reps(10), '65 lb'),
        st('Pushup renegade row', reps(6), '35 lb'),
        st('Weighted jacks', reps(20), '35 lb', 'or 10 tuck jumps'),
        circuit(
          'Burpees + snatches',
          [
            cp('Burpees', reps(5)),
            cp('Snatch', perSide(3), '35 lb', '3–5 per arm'),
          ],
        ),
        st('Shin huggers', reps(15)),
      ],
    },
  ],
};

// ── 7 ── 30-min three-block session with finisher ───────────────────────────
const threeBlockFinisher: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-30-and-finisher',
  origin: 'original',
  title: 'EMOM 30 · Three Blocks + Finisher',
  summary:
    'Three rotation blocks — upper-body, legs, then arms — capped by a 150/150 jacks-and-climbers finisher.',
  blocks: [
    {
      label: 'Block 1',
      durationMin: 20,
      intervalSec: 60,
      stations: [
        st('Wide pushups', reps(10)),
        st('Shoulder taps', perSide(10)),
        st('Rows', reps(10), '50 lb'),
        st('Pull-throughs', reps(10), '50 lb'),
      ],
    },
    {
      label: 'Block 2',
      durationMin: 12,
      intervalSec: 60,
      stations: [
        st('Squats', reps(15), '50 lb'),
        st('Reverse lunges', perSide(10), '50 lb'),
        st('Goblet lateral lunges', reps(10), '35 lb'),
      ],
    },
    {
      label: 'Block 3',
      durationMin: 8,
      intervalSec: 60,
      stations: [
        st('Arnold press', reps(15)),
        st('Hammer curl', reps(15)),
      ],
      then: [
        {
          kind: 'station',
          station: circuit('Finisher', [
            cp('Jumping jacks', reps(150)),
            cp('Mountain climbers', reps(150)),
          ]),
        },
      ],
    },
  ],
};

// ── 8 ── 35-min rotation: seesaw rows / burpee / hugger / clean-press ───────
const seesawRowCleanPress: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-35-seesaw-row-swing-clean-press',
  origin: 'original',
  title: 'EMOM 35 · Seesaw Rows & Clean-Press',
  summary:
    'A movement a minute — seesaw rows, burpees, shin huggers, then swing-clean-press each side.',
  blocks: [
    {
      durationMin: 35,
      intervalSec: 60,
      stations: [
        st('Seesaw rows', reps(24), '40 lb', '24–30 (60 total)'),
        st('Burpees', reps(10), undefined, '10–12 reps'),
        st('Shin huggers', reps(20)),
        st('Swing-clean-press, right', reps(5), '53 lb'),
        st('Swing-clean-press, left', reps(5), '53 lb'),
      ],
    },
  ],
};

// ── 9 ── 30-min rotation: box jump / pushup / thruster / curl / burpee / v-up
const boxJumpThruster: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-30-box-jump-thruster',
  origin: 'original',
  title: 'EMOM 30 · Box Jump & Thruster',
  summary:
    'Thirty minutes, a movement a minute — box jumps, pushups, thrusters, hammer curls, burpees, and v-ups.',
  blocks: [
    {
      durationMin: 30,
      intervalSec: 60,
      stations: [
        st('Box jumps', reps(15)),
        st('Pushups', reps(15)),
        st('Thrusters', reps(15), '35 lb'),
        st('Hammer curls', reps(15), '30 lb'),
        st('Burpees', reps(10)),
        st('V-ups', reps(15)),
      ],
    },
  ],
};

// ── 10 ── 36-min ascending: goblet / swing / thruster ───────────────────────
// Reps actually climb each round rather than living only in a text note: one
// 3-minute block per round, each with that round's real counts baked in.
const gobletSwingRound = (
  goblet: number,
  swing: number,
  thruster: number,
): Block => ({
  durationMin: 3,
  intervalSec: 60,
  stations: [
    st('Goblet squats', reps(goblet)),
    st('KB swings', reps(swing)),
    st('Thrusters', reps(thruster)),
  ],
});
// One 4-rung climb (8/10/6 up to 14/25/12), three times through.
const gobletSwingClimb: [number, number, number][] = [
  [8, 10, 6],
  [10, 15, 8],
  [12, 20, 10],
  [14, 25, 12],
];
const climbingGobletSwing: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-36-climbing-goblet-swing-thruster',
  origin: 'original',
  title: 'EMOM 36 · Climbing Goblet, Swing, Thruster',
  summary:
    'Reps climb each round (goblet squats +2, swings +5, thrusters +2) — from 8/10/6 up to 14/25/12, three times through.',
  blocks: Array.from({ length: 3 }, () => gobletSwingClimb)
    .flat()
    .map(([goblet, swing, thruster]) => gobletSwingRound(goblet, swing, thruster)),
};

// ── 11 ── E2M dumbbell complex ───────────────────────────────────────────────
const e2DbComplex: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-e2-db-complex',
  origin: 'original',
  title: 'EMOM 2 · Dumbbell Complex',
  summary:
    'Every 2 minutes for 30 — dumbbell squats, snatches, push press, and clap pushups.',
  blocks: [
    {
      durationMin: 30,
      intervalSec: 120,
      stations: [
        circuit(
          'DB complex',
          [
            cp('DB squats', reps(8)),
            cp('DB snatches', perSide(4)),
            cp('DB push press', reps(8)),
            cp('Clap pushups', reps(5)),
          ],
          '35 lb',
        ),
      ],
    },
  ],
};

// ── 12 ── E3M kettlebell rounds, break, then a 12-min EMOM ───────────────────
const kbThen12Min: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-e3-kb-then-12min',
  origin: 'original',
  title: 'EMOM · Kettlebell E3M then 12',
  summary:
    'A 3-minute kettlebell circuit and a 2-minute break, five times through, then a 12-minute pushup-clean-press and snatch EMOM.',
  blocks: [
    {
      label: 'E3M · 5 rounds',
      durationMin: 25,
      intervalSec: 180,
      stations: [
        circuit('KB circuit', [
          cp('Swings', reps(20)),
          cp('KB thrusters', reps(15)),
          cp('KB deadlift', reps(10)),
          cp('Pushup burpee', reps(5)),
        ]),
        rest(120),
      ],
    },
    {
      label: '12-min EMOM',
      durationMin: 12,
      intervalSec: 60,
      stations: [
        st('KB pushup-clean-press, left', reps(5)),
        st('KB pushup-clean-press, right', reps(5)),
        st('KB snatch', perSide(5)),
      ],
    },
  ],
};

// ── 13 ── Sequential single-movement blocks ─────────────────────────────────
const singleMovementBlocks: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-single-movement-blocks',
  origin: 'original',
  title: 'EMOM · Single-Movement Blocks',
  summary:
    'Back-to-back one-movement EMOMs — pushups, heavy rows, chest press, goblet squats, curls, and clap pushups.',
  blocks: [
    {
      durationMin: 5,
      intervalSec: 60,
      stations: [st('Pushups', reps(25))],
    },
    {
      durationMin: 5,
      intervalSec: 60,
      stations: [st('Heavy rows', reps(15), '45 lb')],
    },
    {
      durationMin: 5,
      intervalSec: 60,
      stations: [st('Chest press', reps(12), '50 lb')],
    },
    {
      durationMin: 10,
      intervalSec: 60,
      stations: [st('Goblet squats', reps(10), '65 lb')],
    },
    {
      durationMin: 5,
      intervalSec: 60,
      stations: [st('Curls', reps(10), '25 lb')],
    },
    {
      durationMin: 5,
      intervalSec: 60,
      stations: [st('Clap pushups', reps(10))],
    },
  ],
};

// ── 14 ── Rotation: burpee / renegade / curl-press / goblet / combo ─────────
const burpeeRenegadeGoblet: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-burpee-renegade-goblet',
  origin: 'original',
  title: 'EMOM · Burpee, Renegade, Goblet',
  summary:
    'A movement a minute (modeled as 5 rounds) — burpees, renegade rows, kneeling curl-press, goblet squats, and a jacks-and-climbers combo.',
  blocks: [
    {
      durationMin: 25,
      intervalSec: 60,
      stations: [
        st('Burpees', reps(10)),
        st('Renegade row with pushup', reps(6), '35 lb'),
        st('Kneeling curl-press', reps(12), '25 lb'),
        st('Goblet squats', reps(15), '35 lb', 'or front squats'),
        circuit('Jacks + climbers', [
          cp('Jumping jacks', reps(20)),
          cp('Mountain climbers', reps(40)),
        ]),
      ],
    },
  ],
};

// ── 15 ── 7-round bodyweight-ish rotation ────────────────────────────────────
const diamondPushupGoblet: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-7-diamond-pushup-goblet',
  origin: 'original',
  title: 'EMOM · Diamond Pushup & Goblet',
  summary:
    'Seven rounds — diamond pushups, goblet squats, underhand rows, alternating overhead press, and skater hops.',
  blocks: [
    {
      durationMin: 35,
      intervalSec: 60,
      stations: [
        st('Diamond pushups', reps(15)),
        st('Goblet squats', reps(12)),
        st('Underhand rows', reps(10)),
        st('Alternating overhead press', reps(20)),
        st('Skater hops', reps(20), undefined, 'or clap pushups'),
      ],
    },
  ],
};

// ── 16 ── 7-round rotation: chest / renegade / curl-press / tri / plank ─────
const chestPressRenegade: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-7-chest-press-renegade',
  origin: 'original',
  title: 'EMOM · Chest Press & Renegade',
  summary:
    'Seven rounds — chest press, renegade rows with pushup, kneeling curl-press, tricep pushups, and up-down planks.',
  blocks: [
    {
      durationMin: 35,
      intervalSec: 60,
      stations: [
        st('Chest press', reps(10), '65 lb'),
        st('Renegade row with pushup', reps(5), '35 lb'),
        st('Kneeling curl-press', reps(10), '35 lb'),
        st('Tricep pushups', reps(15)),
        st('Up-down planks', reps(20), undefined, 'or 15–20 jump squats'),
      ],
    },
  ],
};

// ── 17 ── 7-round rotation with a KB complex station ────────────────────────
const swingPressSquatThruster: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-7-swing-press-squat-thruster',
  origin: 'original',
  title: 'EMOM · Swing, Complex, Chest',
  summary:
    'Seven rounds — kettlebell swings, a press-squat-thruster complex, heavy chest press, situps, and ball slams.',
  blocks: [
    {
      durationMin: 35,
      intervalSec: 60,
      stations: [
        st('KB swings', reps(20), '28 kg'),
        circuit(
          'Press + squats + thrusters',
          [
            cp('Press', reps(5)),
            cp('Squats', reps(5)),
            cp('Thrusters', reps(5)),
          ],
          '24 kg',
        ),
        st('Heavy chest press', reps(10), '65 lb'),
        st('Situps', reps(20)),
        st('Ball slams', reps(15), '40 lb'),
      ],
    },
  ],
};

// ── 18 ── 7-round rotation at 35 lb ──────────────────────────────────────────
const burpeeDeadliftPress: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-7-burpee-deadlift-press',
  origin: 'original',
  title: 'EMOM · Burpee Deadlift Rotation',
  summary:
    'Seven rounds at 35 lb — burpee deadlifts, shoulder press, DB front squats, chest press, and pushups.',
  blocks: [
    {
      durationMin: 35,
      intervalSec: 60,
      stations: [
        st('Burpee deadlift', reps(10), '35 lb'),
        st('Shoulder press', reps(10), '35 lb'),
        st('DB front squats', reps(10), '35 lb', 'or tricep extensions'),
        st('Chest press', reps(10), '57.2 lb'),
        st('Pushups', reps(10)),
      ],
    },
  ],
};

// ── 19 ── 30-min alternating kettlebell complex ─────────────────────────────
const kbComplexAlternating: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-30-kb-complex-alternating',
  origin: 'original',
  title: 'EMOM 30 · Alternating KB Complex',
  summary:
    'Alternating minutes of a 3-swing / 2-high-pull / 1-snatch complex — three times through one minute, twice the next.',
  blocks: [
    {
      durationMin: 30,
      intervalSec: 60,
      stations: [
        circuit(
          'Complex ×3',
          [
            cp('Swings', reps(3)),
            cp('High pulls', reps(2)),
            cp('Snatch', reps(1)),
            cp('Swings', reps(3)),
            cp('High pulls', reps(2)),
            cp('Snatch', reps(1)),
            cp('Swings', reps(3)),
            cp('High pulls', reps(2)),
            cp('Snatch', reps(1)),
          ],
          '20 kg',
        ),
        circuit(
          'Complex ×2',
          [
            cp('Swings', reps(3)),
            cp('High pulls', reps(2)),
            cp('Snatch', reps(1)),
            cp('Swings', reps(3)),
            cp('High pulls', reps(2)),
            cp('Snatch', reps(1)),
          ],
          '20 kg',
        ),
      ],
    },
  ],
};

// ── 20 ── 30-min, three alternating-pair blocks ─────────────────────────────
const threeBlocksAlt: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-30-three-blocks-alt',
  origin: 'original',
  title: 'EMOM 30 · Three Alternating Pairs',
  summary:
    'Three 10-minute blocks, each alternating a pair — push press/burpees, air squats/swings, then thrusters/burpees.',
  blocks: [
    {
      label: 'Minutes 0–10',
      durationMin: 10,
      intervalSec: 60,
      stations: [
        st('Push press', reps(12)),
        st('Burpees', reps(12)),
      ],
    },
    {
      label: 'Minutes 10–20',
      durationMin: 10,
      intervalSec: 60,
      stations: [
        st('Air squats', reps(20)),
        st('KB swings', reps(20)),
      ],
    },
    {
      label: 'Minutes 20–30',
      durationMin: 10,
      intervalSec: 60,
      stations: [
        st('Thrusters', reps(12)),
        st('Burpees', reps(12)),
      ],
    },
  ],
};

// ── 21 ── 30-min rotation with a built-in rest minute ───────────────────────
const gobletPushupSwingBurpee: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-30-goblet-pushup-swing-burpee',
  origin: 'original',
  title: 'EMOM 30 · Goblet, Pushup, Swing, Burpee',
  summary:
    'Six rounds — goblet squats, pushups, kettlebell swings, burpees, then a rest minute to close each round.',
  blocks: [
    {
      durationMin: 30,
      intervalSec: 60,
      stations: [
        st('Goblet squats', reps(20), '60 lb'),
        st('Pushups', reps(20)),
        st('KB swings', reps(25), '60 lb'),
        st('Burpees', reps(15)),
        rest(),
      ],
    },
  ],
};

// ── 22 ── E3M dumbbell rotation ──────────────────────────────────────────────
const renegadeLungePress: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-e3-renegade-lunge-press',
  origin: 'original',
  title: 'EMOM 3 · Renegade, Lunge, Press',
  summary:
    'Every 3 minutes for 12 rounds at 40 lb — renegade rows, DB lunges, overhead press, squats, and burpee-row pushups.',
  blocks: [
    {
      durationMin: 36,
      intervalSec: 180,
      stations: [
        circuit(
          'DB circuit',
          [
            cp('Renegade rows with pushup', reps(5)),
            cp('DB lunges', perSide(5)),
            cp('Overhead press', reps(5)),
            cp('Squats', reps(5)),
            cp('Burpee pushup DB rows', reps(5)),
          ],
          '40 lb',
        ),
      ],
    },
  ],
};

// ── 23 ── 35-min rotation with a rest minute every 5th ──────────────────────
const thrusterBurpeeLunge: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-35-thruster-burpee-lunge',
  origin: 'original',
  title: 'EMOM 35 · Thruster, Burpee, Lunge',
  summary:
    'A movement a minute — thrusters, bar-facing burpees, lunges, situps, then a rest minute every fifth.',
  blocks: [
    {
      durationMin: 35,
      intervalSec: 60,
      stations: [
        st('Thrusters', reps(8), '40 lb'),
        st('Bar-facing burpees', reps(12)),
        st('Lunges', reps(16), '45 lb'),
        st('Situps', reps(20)),
        rest(),
      ],
    },
  ],
};

// ── 24 ── 30-min ascending kettlebell rotation ──────────────────────────────
// Reps actually climb each round rather than living only in a text note: one
// 3-minute block per round, each with that round's real counts baked in.
const climbingKbRound = (
  goblet: number,
  swing: number,
  thruster: number,
): Block => ({
  durationMin: 3,
  intervalSec: 60,
  stations: [
    st('KB goblet squats', reps(goblet), '16–20 kg'),
    st('KB overhead swings', reps(swing), '16–20 kg'),
    st('KB thrusters', reps(thruster), '16–20 kg'),
  ],
});
const climbingKb: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-30-climbing-kb',
  origin: 'original',
  title: 'EMOM 30 · Climbing Kettlebell',
  summary:
    'Ten rounds with reps climbing each round — goblet squats +1, overhead swings +2, thrusters +1, at 16–20 kg.',
  blocks: Array.from({ length: 10 }, (_, i) =>
    climbingKbRound(8 + i, 10 + i * 2, 6 + i),
  ),
};

// ── 25 ── E3M dumbbell clean complex ─────────────────────────────────────────
const dbCleanComplex: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-e3-db-clean-complex',
  origin: 'original',
  title: 'EMOM 3 · DB Clean Complex',
  summary:
    'Every 3 minutes for 12 rounds at 40 lb — hang power clean, hang squat clean, front squat, thruster, push press.',
  blocks: [
    {
      durationMin: 36,
      intervalSec: 180,
      stations: [
        circuit(
          'DB clean complex',
          [
            cp('DB hang power clean', reps(5)),
            cp('Hang squat clean', reps(5)),
            cp('Front squats', reps(5)),
            cp('Thrusters', reps(5)),
            cp('Push press', reps(5)),
          ],
          '40 lb',
        ),
      ],
    },
  ],
};

// ── 26 ── Rotation of paired combos ──────────────────────────────────────────
const comboSwingLungeKnees: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-combo-swing-lunge-knees',
  origin: 'original',
  title: 'EMOM · Paired Combos',
  summary:
    'A paired combo a minute (modeled as 5 rounds) — swings+pushups, lunges+situps, high knees+rows, jacks+goblet squats.',
  blocks: [
    {
      durationMin: 20,
      intervalSec: 60,
      stations: [
        circuit('Swings + pushups', [
          cp('KB swings', reps(10)),
          cp('Pushups', reps(10)),
        ]),
        circuit('Lunges + situps', [
          cp('DB lunges', reps(20)),
          cp('Situps', reps(10)),
        ]),
        circuit('High knees + rows', [
          cp('High knees', reps(30)),
          cp('DB rows', reps(15)),
        ]),
        circuit('Jacks + squats', [
          cp('Jumping jacks', reps(40)),
          cp('Goblet squats', reps(20)),
        ]),
      ],
    },
  ],
};

// ── 27 ── 30-min rotation: snatch / pushup / press / pushup ─────────────────
const snatchPushupPress: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-30-snatch-pushup-press',
  origin: 'original',
  title: 'EMOM 30 · Snatch & Push Press',
  summary:
    'Thirty minutes at 50 lb — alternating DB snatches, pushups, DB push press, and more pushups.',
  blocks: [
    {
      durationMin: 30,
      intervalSec: 60,
      stations: [
        st('Alternating DB snatches', reps(10), '50 lb'),
        st('Pushups', reps(20)),
        st('DB push press', reps(12), '50 lb'),
        st('Pushups', reps(20)),
      ],
    },
  ],
};

// ── 28 ── Rotation of per-minute complexes ──────────────────────────────────
const deadliftSquatChest: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-deadlift-squat-chest-complex',
  origin: 'original',
  title: 'EMOM · Deadlift, Squat, Chest',
  summary:
    'A complex a minute (modeled as 10 rounds) — deadlift+burpees+swings, front squats+face burpees, then chest press.',
  blocks: [
    {
      durationMin: 30,
      intervalSec: 60,
      stations: [
        circuit('Deadlift + burpees + swings', [
          cp('Deadlift', reps(1), '65 lb'),
          cp('Burpees', reps(3)),
          cp('KB overhead swings', reps(5), '28 kg'),
        ]),
        circuit('Front squats + face burpees', [
          cp('Front squats', reps(4)),
          cp('Face burpees', reps(6)),
        ]),
        st('Chest press', reps(8), '65 lb'),
      ],
    },
  ],
};

// ── 29 ── Bodyweight rotation ────────────────────────────────────────────────
const bodyweight35: EmomWorkout = {
  mode: 'emom',
  slug: 'emom-35-bodyweight',
  origin: 'original',
  title: 'EMOM 35 · Bodyweight',
  summary:
    'Thirty-five minutes of bodyweight, a movement a minute — jacks, air squats, pushups, and situps.',
  blocks: [
    {
      durationMin: 35,
      intervalSec: 60,
      stations: [
        st('Jumping jacks', reps(15)),
        st('Air squats', reps(10)),
        st('Pushups', reps(5)),
        st('Situps', reps(5)),
      ],
    },
  ],
};

export const emomLibrary: EmomWorkout[] = [
  devilsPressBench,
  bikeBurpeeChestCurl,
  bikeSwingThruster,
  bikeSquatBench,
  ballisticRowsKb,
  boxJumpBench,
  threeBlockFinisher,
  seesawRowCleanPress,
  boxJumpThruster,
  climbingGobletSwing,
  e2DbComplex,
  kbThen12Min,
  singleMovementBlocks,
  burpeeRenegadeGoblet,
  diamondPushupGoblet,
  chestPressRenegade,
  swingPressSquatThruster,
  burpeeDeadliftPress,
  kbComplexAlternating,
  threeBlocksAlt,
  gobletPushupSwingBurpee,
  renegadeLungePress,
  thrusterBurpeeLunge,
  climbingKb,
  dbCleanComplex,
  comboSwingLungeKnees,
  snatchPushupPress,
  deadliftSquatChest,
  bodyweight35,
];
