## Why

The EMOM/interval player currently force-advances every station on the wall clock alone: when a station's interval elapses, the athlete is cut to the next segment whether or not they finished, and the existing per-part circuit checklist is explicitly a non-gating memory aid. There is zero slack for an athlete who falls behind or wants to push ahead. The player should keep the EMOM pacing feel (still shows where the schedule says you should be, still plays a per-minute audible beacon) without the hard cutoff — the athlete's own tap becomes what actually advances the workout, and the schedule becomes a visible, non-enforcing reference.

## What Changes

- **BREAKING**: `EmomPlayer` no longer force-advances segments off the wall clock. The athlete pointer (current station) advances only when the athlete taps "done" — this replaces the current behavior wholesale for every EMOM and interval workout; there is no per-workout toggle back to the old hard-cut behavior.
- A read-only "schedule pointer" is retained, computed with the same wall-clock math `useIntervalClock` uses today, but it no longer gates anything — it's a ghost representing where the buzzer would be under strict enforcement.
- A persistent delta readout shows the athlete's position relative to the schedule (e.g. "1:18 behind" / "0:32 ahead"), computed from the schedule's start time for the athlete's current segment vs. now.
- The big countdown display becomes a count-up since the athlete's last tap into the current station, with the station's nominal interval shown as a reference rather than a deadline.
- Trailing break/hold segments become tap-gated ("rest until you tap ready") instead of fixed-duration waits, consistent with taps being the only thing that advances the workout.
- Circuit stations keep their existing per-part checklist as a non-gating memory aid; the athlete pointer still advances at whole-station granularity.
- The workout's end becomes emergent: it ends when the athlete taps through the last segment in the timeline, not when the wall clock reaches the schedule's original total. If the schedule finishes first, it freezes at "done" and the delta reads as pure overtime.
- Audio cues split: the "start" tone fires on the athlete's own tap-advance; the old segment-boundary buzzer becomes an independent "pace beacon" tied to the schedule pointer crossing into its next segment, so the audible every-minute cadence survives without cutting anyone off.
- The active-run snapshot for `mode: 'emom'` / `mode: 'interval'` gains fields to persist the athlete pointer (it can no longer be recomputed purely from `startedAtMs`), and the staleness bound accounts for runs that are legitimately still going past the schedule's original total.

## Capabilities

### New Capabilities

- `emom-workout-player`: runtime behavior of the EMOM/interval player — the two-pointer (schedule vs. athlete) model, tap-driven advancement, the pace delta readout, tap-gated breaks, emergent workout end, the count-up display, audio cue split, and reload persistence. No spec currently governs this player's runtime behavior (only the authoring/compile side lives in code, unspec'd); this is its first formal spec.

### Modified Capabilities

_None._ `run-lifecycle` (server-of-record run start/complete) and `rep-workout-player` (unrelated player) are unaffected — the run-lifecycle requirements only reference the existence of an active-run snapshot and a run id within it, not the EMOM snapshot's internal shape.

## Impact

- `src/timer/EmomPlayer.tsx` — advancement logic, display, cue wiring rewritten.
- `src/timer/useIntervalClock.ts` — repurposed or replaced by a hook exposing the schedule pointer as read-only plus a new athlete-pointer hook (design.md decides the exact split).
- `src/timer/audio.ts` — cue methods split/renamed for the athlete-advance vs. schedule-beacon distinction.
- `src/timer/activeRun.ts` — `ActiveRunSnapshot`'s `emom`/`interval` variants gain persisted athlete-pointer fields; `isValidSnapshot` and `isStaleActiveRun` updated accordingly.
- `src/timer/expand.ts`, `src/timer/workouts/*` — unchanged (authoring/compile format is untouched).
- `src/timer/RepPlayer.tsx`, `src/timer/AmrapPlayer.tsx` — unchanged.
- Existing tests for `EmomPlayer` and `useIntervalClock` will need rewriting to match the new model.
