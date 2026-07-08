// Workout library.
//
// Two authoring shapes, discriminated by `mode`:
//  - 'emom': an ordered list of blocks, each a rotation of stations played one
//    per interval, with optional trailing breaks/holds. A pure `expand()`
//    (see ./expand.ts) flattens this into a flat Segment[] timeline that the
//    interval clock plays.
//  - 'rep': an ordered list of rep targets the athlete works through at their
//    own pace on a count-up clock, optionally bounded by a time cap and with
//    an optional prescription to perform on every break.
// Adding a new workout is a data-only change here.

/** How a station's work is measured. Exactly one kind per station. */
export type Measure =
  | { kind: 'reps'; count: number }
  /** Unilateral, performed on each side — "10/10". */
  | { kind: 'perSide'; count: number }
  /** Machine calories, optionally with an equivalent distance in metres. */
  | { kind: 'cal'; count: number; meters?: number }
  /** Machine distance, for erg work prescribed by metres rather than cals. */
  | { kind: 'dist'; meters: number }
  /** Static hold, e.g. a 50-second plank. */
  | { kind: 'hold'; seconds: number };

/** Optional pacing target, always expressed per 60 seconds. */
export interface Pace {
  /** Target machine rate for erg stations, e.g. 18 → "hold ≥ 18 cal/min". */
  calPerMin?: number;
}

/** One exercise inside a circuit station. Bodyweight parts omit measure. */
export interface CircuitPart {
  movement: string;
  measure?: Measure;
  load?: string;
  notes?: string;
}

interface StationBase {
  movement: string;
  /** Load cue shown inline, e.g. "45 lb". */
  load?: string;
  /** Override the block's default interval (seconds) for this station only. */
  interval?: number;
  /** Per-minute pacing target (erg stations). Omitted → no pace line shown. */
  pace?: Pace;
  notes?: string;
}

/** The common case: one movement, one measure, one interval. */
export interface MovementStation extends StationBase {
  measure: Measure;
  circuit?: never;
}

/**
 * A circuit station: an ordered list of parts done at the athlete's pace
 * inside one timed segment. Timing is identical to any other station (the
 * interval clock neither knows nor cares); only the display differs — the
 * parts render as a tappable checklist that never gates the clock.
 */
export interface CircuitStation extends StationBase {
  circuit: CircuitPart[];
  measure?: never;
}

export type Station = MovementStation | CircuitStation;

/** A segment appended after a block's rotation, in authoring order. */
export type Trailing =
  | { kind: 'break'; seconds: number }
  /** A one-off station played once (not rotated), e.g. a finisher plank. */
  | { kind: 'station'; station: Station };

export interface Block {
  /** Optional heading, e.g. "Block 1". */
  label?: string;
  /** Block length in minutes — drives run-to-the-clock expansion. */
  durationMin: number;
  /** Default seconds per station turn (usually 60). */
  intervalSec: number;
  /** Stations rotated one per interval. */
  stations: Station[];
  /** Breaks / one-off stations appended after the rotation. */
  then?: Trailing[];
}

/** Who made a workout: a David Rosen original, or generated/community.
 *  Required so attribution can't be forgotten when authoring new entries. */
export type WorkoutOrigin = 'original' | 'generated';

export interface EmomWorkout {
  mode: 'emom';
  slug: string;
  title: string;
  summary: string;
  origin: WorkoutOrigin;
  blocks: Block[];
}

// ── Athlete-paced (rep) workouts ──────────────────────────────────────────
// No timeline is compiled: the athlete advances by logging reps, the clock
// only counts up (see ./useCountUpClock.ts and ./RepPlayer.tsx).

/** One chunk of prescribed work, completed at the athlete's own pace. */
export interface RepTarget {
  movement: string;
  count: number;
  /** Load cue shown inline, e.g. "65 lb". */
  load?: string;
  notes?: string;
}

export interface RepWorkout {
  mode: 'rep';
  slug: string;
  title: string;
  summary: string;
  origin: WorkoutOrigin;
  /** Worked through in order; a chipper has many, a rep-goal workout one. */
  targets: RepTarget[];
  /** Time cap in minutes. Absent → the workout runs until all targets done. */
  capMin?: number;
  /** Work owed every time the athlete takes a break, e.g. penalty squats. */
  onBreak?: RepTarget[];
}

export type Workout = EmomWorkout | RepWorkout;

/** What a finished rep run measured — the hand-off point for any recorder. */
export interface RunSummary {
  slug: string;
  elapsedSec: number;
  totalReps: number;
  breaks: number;
  /** True when every target was finished (vs. capped out). */
  completed: boolean;
}

// ── Runtime timeline (produced by expand()) ──────────────────────────────
// The interval clock knows nothing about blocks or rotations — it just plays
// segments.

export type Segment =
  | {
      type: 'work';
      durationSec: number;
      station: Station;
      blockIndex: number;
      blockLabel?: string;
      /** 1-based round number within the block. */
      round: number;
    }
  | { type: 'break'; durationSec: number; blockIndex: number }
  | {
      type: 'hold';
      durationSec: number;
      station: Station;
      blockIndex: number;
    };

// ── Library ───────────────────────────────────────────────────────────────
// Pace targets on erg stations are starting estimates — tune to taste.

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

// Round two swaps diamond pushups for regular — otherwise the same six
// movements at half the reps, so the twelve targets are written out in full.
const round = (
  count: number,
  pushupVariant: string,
): RepTarget[] => [
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

const workouts: Workout[] = [emom30, chipper6030, pushups300, cycles6x5];

export function getWorkout(slug: string): Workout | undefined {
  return workouts.find((w) => w.slug === slug);
}

export default workouts;
