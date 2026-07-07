// EMOM workout library.
//
// A workout is authored the way it's written on paper: an ordered list of
// blocks, each a rotation of stations played one per interval, with optional
// trailing breaks/holds. A pure `expand()` (see ./expand.ts) flattens this
// into a flat Segment[] timeline that the timer plays — so adding a new
// workout is a data-only change here.

/** How a station's work is measured. Exactly one kind per station. */
export type Measure =
  | { kind: 'reps'; count: number }
  /** Unilateral, performed on each side — "10/10". */
  | { kind: 'perSide'; count: number }
  /** Machine calories, optionally with an equivalent distance in metres. */
  | { kind: 'cal'; count: number; meters?: number }
  /** Static hold, e.g. a 50-second plank. */
  | { kind: 'hold'; seconds: number };

/** Optional pacing target, always expressed per 60 seconds. */
export interface Pace {
  /** Target machine rate for erg stations, e.g. 18 → "hold ≥ 18 cal/min". */
  calPerMin?: number;
}

export interface Station {
  movement: string;
  measure: Measure;
  /** Load cue shown inline, e.g. "45 lb". */
  load?: string;
  /** Override the block's default interval (seconds) for this station only. */
  interval?: number;
  /** Per-minute pacing target (erg stations). Omitted → no pace line shown. */
  pace?: Pace;
  notes?: string;
}

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

export interface Workout {
  slug: string;
  title: string;
  summary: string;
  blocks: Block[];
}

// ── Runtime timeline (produced by expand()) ──────────────────────────────
// The timer knows nothing about blocks or rotations — it just plays segments.

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

const emom30: Workout = {
  slug: 'emom-30',
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

const workouts: Workout[] = [emom30];

export function getWorkout(slug: string): Workout | undefined {
  return workouts.find((w) => w.slug === slug);
}

export default workouts;
