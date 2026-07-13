// Workout model — the authoring shapes and the runtime timeline.
//
// Five authoring shapes, discriminated by `mode`:
//  - 'emom': an ordered list of blocks, each a rotation of stations played one
//    per interval, with optional trailing breaks/holds. A pure `expand()`
//    (see ../expand.ts) flattens this into a flat Segment[] timeline that the
//    interval clock plays. Circuit stations give the "5-minute cycle" shape.
//  - 'rep': an ordered list of rep targets the athlete works through at their
//    own pace on a count-up clock, optionally bounded by a time cap and with
//    an optional prescription to perform on every break. Chippers, rep-goals,
//    and pyramids/ladders (via the `ladder()` builder) all use this shape.
//  - 'amrap': a fixed time cap and one round of rep targets repeated for the
//    duration — the athlete counts rounds, the clock ends it. The inverse of
//    'rep': there the work is fixed and the clock counts up; here the clock is
//    fixed and the work is open-ended.
//  - 'interval': rounds of timed work and rest (tabata, "2 on / 1 off"). It
//    compiles through the same `expand()` into work/rest Segment[] and plays
//    on the same interval clock as 'emom' — no separate runtime.
// Adding a new workout is a data-only change in the shape files.

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
  | { kind: 'hold'; seconds: number }
  /** Worked to failure — no fixed count. Labeled "max reps". */
  | { kind: 'max' };

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
// only counts up (see ../useCountUpClock.ts and ../RepPlayer.tsx).

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

// ── AMRAP workouts ─────────────────────────────────────────────────────────
// A fixed clock and one round repeated; the athlete counts rounds. Played on
// the count-up clock, bounded by capMin (see ../AmrapPlayer.tsx).

export interface AmrapWorkout {
  mode: 'amrap';
  slug: string;
  title: string;
  summary: string;
  origin: WorkoutOrigin;
  /** The clock — the only thing that ends the workout. */
  capMin: number;
  /** One round's work, in order; repeated until the cap. */
  round: RepTarget[];
  /** Reps added to every target's count each successive round (+1, +5
   *  ascending schemes). Absent/0 → every round is identical. */
  roundStep?: number;
}

// ── Interval workouts ──────────────────────────────────────────────────────
// Rounds of work-then-rest. Compiles to the same Segment[] as an EMOM (a work
// segment per round, a break segment when restSec > 0) and plays on the same
// interval clock — no separate runtime.

export interface IntervalWorkout {
  mode: 'interval';
  slug: string;
  title: string;
  summary: string;
  origin: WorkoutOrigin;
  rounds: number;
  workSec: number;
  /** Rest after each work interval; 0 → no break segment emitted. */
  restSec: number;
  /** Rotated one per work interval; a single-station list repeats it. */
  stations: Station[];
}

export type Workout =
  | EmomWorkout
  | RepWorkout
  | AmrapWorkout
  | IntervalWorkout;

/** What a finished rep/AMRAP run measured — the hand-off point for a recorder. */
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
