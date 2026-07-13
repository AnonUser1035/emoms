# Design: expand-workout-library

## Context

Four workouts, three shapes, one file. The log adds two runtime contracts the model can't express (AMRAP, interval/tabata) and multiplies the count ~10×, which breaks the tab-wall picker. The house philosophy holds: workouts are code-authored, typed, tested data; there is no runtime AI and no workout table in the DB. This change extends the model and the picker, then imports the log as data.

Decisions fixed in explore: definitions only (results stripped); add AMRAP and interval as real shapes plus a ladder helper; the gym has bench + dumbbells + mats at minimum (barbell not assumed); the picker becomes featured-workout + dropdown; every imported workout is `origin: 'original'` (it is all David's own programming).

## Goals / Non-Goals

**Goals**
- Two new shapes that reuse the existing clocks, not new timing machinery.
- Pyramids authored by a helper, not by hand, without a new mode.
- A picker that scales to dozens of workouts on a phone.
- The log's distinct prescriptions as clean, typed data.

**Non-Goals**
- Recording per-athlete scaling or historical results in the model (results are stripped; the `runs` table is unchanged).
- A workout table / admin UI / runtime fetch — definitions stay in the bundle.
- Faithfully preserving every duplicate log entry — the library is the deduped set of distinct prescriptions.
- New audio cues (AMRAP and interval reuse existing start/tick/countdown).

## Decisions

### 1. AMRAP is a new mode, not a flag on `rep`

The runtime contract is inverted. `rep`: fixed work, count-up clock, ends when targets done (or `capMin`). `amrap`: fixed `capMin` clock, one round repeated, athlete counts *rounds* — no per-target completion, no "done" short of the buzzer. Bolting a `rounds` flag onto `RepWorkout` would fork every `rep` consumer on a boolean. A distinct shape keeps each player honest.

```ts
export interface AmrapWorkout {
  mode: 'amrap';
  slug; title; summary; origin: WorkoutOrigin;
  capMin: number;            // the clock; the only thing that ends it
  round: RepTarget[];        // one round's work, in order
  roundStep?: number;        // reps added to every count each round (+1, +5); default 0
}
```

`AmrapPlayer` runs on the existing `useCountUpClock`, bounded at `capMin`. A big round counter with tap +/− is the only interaction; the round's movements render as a static reference list (with `roundStep`, the list shows the *current* round's scaled counts). Snapshot: `{ mode: 'amrap', slug, startedAtMs, rounds }` — reload restores the count. On finish, the run summary reports `totalReps` = reps implied by completed rounds, `breaks: null`, `completed: true` (the buzzer, not the athlete, ends it).

Alternative considered — reuse `RepPlayer` with a "repeat targets" flag: rejected, its per-target reps-logged model and completion detection are the wrong mental model for round-counting.

### 2. Interval compiles to segments — no new player

An interval workout is rounds of work-then-rest. `expand()` already emits `work` and `break` segments and `EmomPlayer` already plays both (emom-30 has breaks). So interval needs **no new runtime** — only an authoring shape and an `expand()` branch:

```ts
export interface IntervalWorkout {
  mode: 'interval';
  slug; title; summary; origin: WorkoutOrigin;
  rounds: number;
  workSec: number;
  restSec: number;           // 0 → no rest segment emitted
  stations: Station[];       // rotated one per work interval (len 1 → same every round)
}
```

`expand(interval)` → for each round `r`: a `work` segment (`workSec`, `stations[r % len]`, `round: r+1`) then, if `restSec > 0`, a `break` segment. Tabata 20:10 × 8 = `{rounds:8, workSec:20, restSec:10, stations:[oneCircuit]}`. "2 on / 1 off × 10, max reps" = `{rounds:10, workSec:120, restSec:60, stations:[circuitEndingInMaxSnatches]}`. The interval snapshot shares the emom snapshot shape (clock-driven, resumes by `startedAtMs`); `WorkoutPlayer` dispatches `interval` straight into `EmomPlayer`.

New measure `{ kind: 'max' }` → label "max reps", for the count-yourself final station.

Alternative considered — per-interval `restSec` on `Block`: rejected, it complicates `expand()`'s block/rotation/`then` logic for every emom workout to serve a shape whose rounds are uniform.

### 3. `ladder()` helper — pyramids stay `rep`

A pyramid is a rep scheme (a list of counts) applied to a movement list, each rung a pass. `rep` mode already models "an ordered list of targets"; the only pain is typing the rungs. A pure helper generates them:

```ts
// counts([12,1],'down') → 12,11,…,1 ; ladder([5,20,20,5]) literal ; pyramid(5,20,5) → 5..20..5
ladder(scheme: number[], movements: Array<{movement; load?; notes?}>): RepTarget[]
```

For each count in `scheme`, emit one target per movement at that count. `12-1 pyramid` of 4 movements → `ladder(range(12,1), moves)`. No model change; the workout is `mode: 'rep'`, optionally with `capMin`.

### 4. Picker: featured + dropdown

Replace the `role="tablist"` pill row with:
- The daily `dailyPick()` workout as the default selection, badged "★ Today's EMOM" (already rendered below the title — keep it).
- A single labelled `<select>` listing all workouts, `value` = slug; the selected `<option>` reflects the current workout, and each option label is `title`. The one-sentence `summary` shows in the body below the title as it does today, so switching options refreshes it.

A native `<select>` is the correct primitive on a phone (OS picker, searchable, accessible for free) and collapses ~40 entries into one control. Selecting never starts a run; `Start` still does.

### 5. File split preserves the import surface

`src/timer/workouts.ts` becomes `src/timer/workouts/`:
- `index.ts` — assembles the registry array, exports `default`, `getWorkout`, and re-exports all types (unchanged import paths for `./workouts`).
- `emom.ts`, `rep.ts`, `amrap.ts`, `interval.ts` — workouts by shape.
- `builders.ts` — `round()`, `cycle()`, `ladder()`, `range()`.

Types (`Measure`, `Station`, `Workout`, …) move to `index.ts` (or a `types.ts` it re-exports) so every consumer's `from './workouts'` still resolves.

## Import method

Each log entry → classify shape → strip results (HR/time/date/per-person) → normalize load to on-hand kit → dedup against already-imported prescriptions → author. Loads: a bare number is dumbbells (e.g. "chest press 65" → `65 lb` DBs, matching the goblet-65 cue); kettlebell entries keep kg; "empty bb"/barbell-specific lifts become the dumbbell equivalent unless the movement is bench-specific. Ambiguous or unclassifiable entries are dropped, not bent — logged in the change notes, not silently.

## Risks

- **Import fidelity**: freeform log text is lossy to parse; the mitigation is dedup-and-normalize with drops surfaced, plus tests asserting registry size and a spot-check of representative workouts per shape.
- **Snapshot union growth**: adding two modes touches `activeRun` validation; the defensive mode/shape check in `WorkoutPlayer` (already present) stays the backstop.
- **Registry size vs. daily pick**: `dailyPick` is O(n) and deterministic; ~40 entries is fine, and a larger pool only lengthens the shuffle cycle.
