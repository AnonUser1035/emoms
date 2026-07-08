# Proposal: add-circuit-cycle-workouts

## Why

The new 6×5 workout (six 5-minute cycles of dumbbell squats, med ball throw downs, situps, pushups, and a rotating erg) enforces only the 5-minute cycle boundary — the ~1-minute-per-exercise pacing is advisory. The EMOM machinery already expresses the timing (a 30-minute block with `intervalSec: 300` and three rotating erg-variant stations), but a `Station` can only hold one movement and one measure, so a cycle's five-exercise contents can't be represented or displayed.

## What Changes

- **Circuit stations**: a station may carry an ordered list of parts (movement, optional measure/load/notes). The interval clock, `expand()`, and segment timing are untouched — a circuit station is a normal timed segment whose *display* is a list.
- **Distance measure**: a new `dist` measure kind (meters) for erg parts prescribed by distance (ski 200 m, row 250 m) rather than calories.
- **Tap-to-check display**: during a circuit segment the player shows the parts as a tappable checklist. Checks are a memory aid only — the clock never waits for them; the next cycle starts at the boundary with a fresh list; checking everything early ends nothing. Checks are ephemeral (not persisted in the active-run snapshot).
- **Minute ticks**: inside a circuit segment, a soft tick sounds at each whole minute as a pacing cue; the full start beep and 3-2-1 countdown remain reserved for segment boundaries.
- **The workout as data**: `6×5 Cycles` — one 30-minute block, `intervalSec: 300`, three rotating circuit stations differing only in their erg part (bike 12 cal → ski 200 m → row 250 m), giving each erg two appearances across six cycles. A David Rosen original.
- Idle overview renders circuit stations' parts as a nested list.

## Capabilities

### New Capabilities

- `circuit-stations`: circuit parts on stations (model), the distance measure kind, the checklist display with tap-to-check, minute-tick audio, and the 6×5 Cycles workout definition.

### Modified Capabilities

_None — the EMOM block model and interval clock predate the spec set here and their requirements don't change; `rep-workout-*`, `run-lifecycle`, and `results-whiteboard` are untouched._

## Impact

- `src/timer/workouts.ts`: `Measure` gains `dist`; `Station` gains optional `circuit` parts; new workout registered (registry grows to four).
- `src/timer/format.ts`: label for `dist`.
- `src/timer/audio.ts`: a soft `tick()` cue.
- `src/timer/EmomPlayer.tsx`: circuit checklist rendering + minute-tick effect; non-circuit segments render exactly as today.
- `src/timer/WorkoutPlayer.tsx`: idle overview nests circuit parts.
- `expand.ts`, `useIntervalClock.ts`, snapshot, Worker: no changes.
