# Proposal: add-athlete-paced-workouts

## Why

The app can only express clock-driven workouts (EMOM blocks compiled to fixed-duration segments), but two of the three workouts in the current program are athlete-paced: a chipper (60 reps of six exercises, then 30 reps of each) and a rep-goal workout (300 pushups or 35 minutes, whichever comes first, with a prescribed penalty on every break). Neither can be represented — segments today are strictly time-terminated with no rep tracking or user input.

## What Changes

- Extend the workout model to a discriminated union: the existing block-based EMOM shape stays untouched, and a new rep-based shape is added for athlete-paced workouts.
- One rep-based runtime covers both new workouts: a count-up stopwatch plus an ordered sequence of rep targets advanced by athlete taps, with an optional time cap and an optional on-break prescription.
  - Chipper = many targets in sequence, no cap (result is total time).
  - Rep-goal = one target with a time cap and a break rule (result is reps + time + breaks).
- New rep-workout player screen with tap-to-log rep increments, running total, current/next target, and a finish summary (reps, time, break count). The existing interval clock (`useIntervalClock`) is not modified.
- Add the two workouts as data: the 60/30 chipper (diamond pushups → regular pushups in round two) and the 300-pushup rep-goal workout.
- Workout selection UI handles mixed modes (the dormant tab list activates now that there are multiple workouts).
- Frontend stays thin: the player keeps only in-run state (current target, logged reps, clock anchor). The single exception is an **active-run snapshot** cached client-side so an in-progress workout survives page reloads — restored on load (elapsed time recomputed from the stored wall-clock start), cleared on finish. No client-side history beyond that; the finish summary is handed off to whatever records it (see the companion `add-run-lifecycle-whiteboard` change).

## Capabilities

### New Capabilities

- `rep-workout-model`: authoring shape for athlete-paced workouts (rep targets, optional time cap, optional break prescription) as a union alongside the existing EMOM shape, plus the two concrete workout definitions.
- `rep-workout-player`: runtime behavior for athlete-paced workouts — count-up clock, tap-to-log progression, break handling, cap enforcement, finish summary.

### Modified Capabilities

_None — no main specs exist yet; the EMOM model and interval clock are unchanged._

## Impact

- `src/timer/workouts.ts`: `Workout` becomes a union; new rep-workout definitions added. Existing `emom-30` untouched.
- `src/timer/EmomPlayer.tsx`: mode dispatch — routes EMOM workouts to the existing player, rep workouts to the new one; tab list now renders (already built, dormant).
- New player component + a small count-up clock hook (separate from `useIntervalClock`, which stays time-only).
- `src/timer/expand.ts`, `useIntervalClock.ts`: no changes.
- Companion change `add-run-lifecycle-whiteboard` consumes the finish summary; this change does not depend on it.
