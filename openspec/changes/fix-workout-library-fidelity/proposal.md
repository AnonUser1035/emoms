## Why

A structural sweep of the workout library (`src/timer/workouts/*.ts`) found several entries where the coded structure doesn't match what the workout's own `summary` claims — the kind of quiet misinterpretation that's easy to introduce when translating a training-log entry into the EMOM block / rep-target data model. In each case the summary reads as a reasonable prescription but the actual `blocks`/`targets` either drop part of it, misrepresent its timing, or never encode reps that were supposed to climb. There's no spec today that says a workout's data must match its own summary, so nothing would catch a new instance of this later.

## What Changes

- Fix eight workout entries across `emom.ts`/`emomLibrary.ts`, `repLibrary.ts`, and `amrap.ts` so their coded structure matches what their summaries describe (see Impact for the full list and each specific fix).
- Add a new capability spec, `workout-library-fidelity`, that states the correctness properties every workout entry must hold (round-count arithmetic must be exact when claimed, every summary-described element must appear in the data, breaks/rest must be modeled at the granularity the summary implies), so future entries can be checked against it.
- No changes to the workout type system (`types.ts`) or the runtime compiler (`expand.ts`) — every fix is expressed as data using patterns already established elsewhere in the library (rest-as-rotating-station, repeated circuit parts, explicit per-round station sequences).

## Capabilities

### New Capabilities
- `workout-library-fidelity`: correctness properties for workout data — summary/data consistency, exact round-count arithmetic, and rest/break granularity matching what's described.

## Impact

Affected files: `src/timer/workouts/emom.ts` is unaffected; fixes land in `src/timer/workouts/emomLibrary.ts`, `src/timer/workouts/repLibrary.ts`, and `src/timer/workouts/amrap.ts`, plus new/updated tests in `src/timer/__tests__/workouts.test.ts`.

1. **`kbThen12Min`** (`emom-e3-kb-then-12min`) — the "5 rounds of 3-min circuit, 2-min break" first block currently runs as one continuous 15-minute rotation (no rest) followed by a single one-time trailing break. Fix: bake the 2-minute rest into the rotation as a second station (`rest(120)`), remove the trailing break, and adjust `durationMin` from 15 to 25 so each of the 5 rounds is followed by its own rest.
2. **`ballisticRowsKb`** (`emom-35-ballistic-rows-kb`) — summary claims "five rounds of six kettlebell stations" but `durationMin: 35` with 6 stations × 60s doesn't divide evenly (produces 5 full rounds plus a partial 6th missing the last station). Fix: `durationMin` 35 → 30, the exact duration for 5 clean rounds.
3. **`ladder14`** (`rep-14-ladder-burpee-press`) — summary promises "50 Russian twists (25 lb) after every round" but no Russian twists target exists anywhere in `targets`. Fix: add the Russian-twists target after every rung of the ladder.
4. **`superset5rft`** (`rep-5rft-split-squat-press`) — summary promises "finishing with a 4-minute bear crawl" but no such target exists. Fix: append a bear-crawl finisher target (using `notes` to carry the duration, since `RepTarget` has no time-based measure).
5. **`pyr5010`** (`rep-50-10-pyramid`) — summary promises "10 pushups after each round" in addition to the ladder's own descending pushup counts, but only the ladder's pushups exist. Fix: add the fixed 10-rep pushup target after every rung, clearly noted to distinguish it from the ladder's own pushup rung.
6. **`amrapClimbSix`** (`amrap-climb-six`) — summary says "climbing the reps as you go" but no `roundStep` is set, so reps never climb. The real per-round increment isn't recoverable from the stripped source log. Fix: rewrite the summary to describe it as a flat (non-climbing) AMRAP rather than fabricate an increment.
7. **`climbingGobletSwing`** (`emom-36-climbing-goblet-swing-thruster`) and **`climbingKb`** (`emom-30-climbing-kb`) — the ascending-reps scheme described in the summary is only a text `notes` string; the actual station `Measure.count` is static all the way through, so reps never actually climb in the data. Fix: expand each into the explicit sequence of per-round stations (one static-count station per rung per repeat), matching how `singleMovementBlocks` and similar entries already do sequential, explicit blocks — no changes to `types.ts`/`expand.ts` needed.
8. **`kbComplexAlternating`** (`emom-30-kb-complex-alternating`) — "3 rounds of the complex" / "2 rounds of the complex" are only `notes` strings on a circuit that lists the complex once. Fix: repeat the `CircuitPart` list 3× and 2× respectively so the checklist itself reflects the full prescribed work.
