## Context

`EmomPlayer` (`src/timer/EmomPlayer.tsx`) plays a flat `Segment[]` produced by `expand()` (`src/timer/expand.ts`) on `useIntervalClock` (`src/timer/useIntervalClock.ts`). Today there is exactly one pointer: `clock.segmentIndex`, derived purely from wall-clock elapsed vs. each segment's `durationSec`. It both displays the current station and gates advancement — when elapsed crosses a segment boundary, the athlete is moved on regardless of what they've done. The existing circuit per-part checklist (`checked` state in `EmomPlayer.tsx`) is a deliberate non-gate: it resets every segment and never affects `clock`.

This change makes the schedule non-gating: an independent, tap-driven pointer becomes the source of truth for "what the athlete is doing right now," while the schedule stays visible as a pace reference. `expand()`, `Block`, `Station`, and all authoring shapes in `src/timer/workouts/types.ts` are untouched — this is entirely a player/runtime change, scoped to `EmomPlayer` and its supporting hooks, mirroring how `RepPlayer` already relates to `useCountUpClock` as a sibling, athlete-paced runtime next to the clock-paced one.

## Goals / Non-Goals

**Goals:**
- Replace forced segment advancement with tap-driven advancement for every EMOM and interval workout, with no per-workout opt-out.
- Keep a visible, non-gating schedule pointer computed with the same math as today's `useIntervalClock`, so the pacing reference is exactly as accurate as the old enforced clock was.
- Surface a persistent ahead/behind delta as the primary new piece of UI.
- Preserve the audible per-minute cadence that makes EMOM feel like EMOM, decoupled from cutting the athlete off.
- Survive reloads with the same timestamp-anchored-recompute discipline used everywhere else in this codebase (`useCountUpClock`, `useIntervalClock`, `RepPlayer`'s snapshot restore) — never accumulate tick deltas, always re-derive from a stored wall-clock timestamp.

**Non-Goals:**
- No changes to `RepPlayer`, `AmrapPlayer`, or their workout shapes.
- No changes to the authoring/compile side (`expand.ts`, `Block`, `Station`, rotation logic).
- No per-workout or in-app toggle between "classic hard EMOM" and this model — this fully replaces the old behavior.
- No change to how `pace` (cal/min erg targets) is displayed on a station — that's an unrelated per-station label, unaffected by which pointer drives advancement.

## Decisions

### Two pointers, two hooks

Split `useIntervalClock` into:

- **`useSchedule(segments)`** — a read-only version of today's `useIntervalClock` math (the `ends`/`total` array, wall-clock anchored via `start`/`pause`/`resume` the same way). It exposes `scheduleIndex`, `scheduleElapsed`, `totalDuration`, and — critically — `startOf(index)`, the cumulative seconds at which segment `index` begins, needed for the delta calculation. It has no `segmentRemaining`-as-gate concept; nothing reads it to decide when to move the athlete. Pause/resume stays, since pausing the whole run (not an individual station) is still a real feature.
- **`useAthletePointer(segments, startedAtMs)`** — new hook owning `athleteIndex` and `athleteSegmentStartedAtMs`. `advance()` moves to `athleteIndex + 1` and stamps `athleteSegmentStartedAtMs = Date.now()`. Exposes `athleteSegmentElapsed`, a count-up computed the same timestamp-anchored way as `useCountUpClock` (ticked on a 200ms interval, recomputed from `Date.now() - athleteSegmentStartedAtMs`, not accumulated).

Rejected alternative: keep one hook and add a `manualIndex` field to its return. Two hooks are preferred because the schedule and the athlete pointer have genuinely different lifecycles (the schedule pauses/resumes with the whole-run pause button; the athlete pointer only ever changes on `advance()`) and mixing both into one state object makes the "nothing here gates anything" invariant harder to see at a glance in a single hook body.

### Delta calculation

```
delta = schedule.startOf(athleteIndex + 1) − schedule.scheduleElapsed
```

`startOf(athleteIndex + 1)` is the schedule's cumulative nominal time through the *end* of the athlete's current segment (equivalently `ends[athleteIndex]`) — not the segment's nominal *start*. This is the correct reference: it's what makes "behind" begin only once the schedule has fully passed the athlete's current segment without a tap, matching the literal requirement ("when the buzzer passes and you haven't tapped yet, say you're behind — not before"). Anchoring to the segment's start instead would read "behind" from the first second of every segment, which is wrong — the athlete has that segment's whole nominal duration to work with before falling behind on it. The formula also telescopes correctly across taps: tapping done 15s early banks +15s, which folds into the next segment's own full nominal allotment the instant the athlete arrives there, so "ahead" accumulates properly across the run rather than resetting each segment.

Positive → athlete is ahead (banked time, or just arrived with their current segment's full nominal allotment still open). Negative → behind. Displayed as `mmss(abs(delta))` with an "ahead"/"behind" label and a color (a dedicated `--color-behind` token for the negative case, `text-fg-muted` otherwise — exact token left to implementation, matching existing `SEGMENT_TEXT_CLASS` conventions).

`scheduleElapsed` is **not** clamped to `totalDuration` (see the schedule hook below) — it keeps growing indefinitely past the nominal total, which is what makes the delta keep growing more negative for as long as the athlete remains behind a finished schedule, rather than freezing at whatever value it had the instant the schedule ran out.

### Tap-gated breaks and holds

`Trailing` segments (`break`, `hold`) become just another entry in the same flat sequence the athlete pointer walks — `advance()` doesn't distinguish segment type. A break is displayed with a "Resume" tap (renamed from today's fixed-timer break screen) instead of auto-clearing when its `durationSec` elapses. The schedule still assigns break/hold segments a `durationSec` (unchanged from `expand()`), so they still occupy their normal share of `startOf()`'s cumulative math — the schedule doesn't know or care that the athlete controls the pace of a break same as a work segment.

### Emergent end

The run ends when `advance()` is called on the last segment (`athleteIndex === segments.length - 1`), the same "advance past the end" moment `RepPlayer.logReps` uses today to call `finish()`. `useSchedule`'s own completion (`scheduleElapsed >= totalDuration`) does not end the run by itself — it only means the ghost has nothing further to show, which surfaces as "schedule already finished" framing in the delta, not as a forced end. This means `EmomPlayer`'s `onComplete` fires from the same place `RepPlayer`'s `onFinish` does conceptually: an explicit advance-past-last-segment, not a clock condition.

### Display: count-up replaces countdown

The large number becomes `athleteSegmentElapsed`, counting up from the moment of the last `advance()` (or run start, for segment 0) — same shape as `RepPlayer`'s elapsed display. The station's nominal `durationSec` (from `stationSeconds()` in `expand.ts`, unchanged) is shown as a smaller reference label (e.g. "target: 60s"), and a style change (not a cutoff) once `athleteSegmentElapsed` exceeds it — mirroring how `RepPlayer` shows `remainingToCapSec` as informational text next to the elapsed display rather than gating it.

### Audio cue split

`AudioCues` (`src/timer/audio.ts`) gains a distinction between the athlete's own transition and the schedule's ambient beacon:

- `cues.start()` (existing tone) fires from `EmomPlayer` on the athlete pointer's `advance()` — this is the "you moved on" sound the athlete caused directly.
- A **new** method, e.g. `cues.beacon()`, fires when the *schedule* pointer crosses into a new segment (detected the same way `EmomPlayer` already detects schedule transitions today, just re-wired to `scheduleIndex` instead of the old gating `segmentIndex`). This needs a tone distinguishable from `start()` so the athlete can tell "that was the buzzer" from "that was my own tap" without looking — reusing the existing `countdown()` tone family (660Hz ticks) as the beacon's base, scaled up, is preferred over inventing a new frequency, to keep the palette in `audio.ts` small and intentional.
- The old 3-2-1 `countdown()` behavior (ticks in the final 3 seconds of a segment) is repurposed as a lead-in to the *schedule's* next transition, not the athlete's — it fires against `scheduleRemaining` (derivable from `useSchedule`), independent of where the athlete actually is. It plays whether or not the athlete is anywhere near tapping "done."
- The per-minute circuit `tick()` stays as-is conceptually but now ticks against `athleteSegmentElapsed` (the athlete's own time-on-station) rather than the old gating `segmentElapsed`, since circuits are now athlete-paced like every other station.

### Persistence schema

`ActiveRunSnapshot`'s `emom`/`interval` variants (`src/timer/activeRun.ts`) change from `BaseSnapshot`-only to:

```ts
{ mode: 'emom' | 'interval'; athleteIndex: number; athleteSegmentStartedAtMs: number } & BaseSnapshot
```

`athleteSegmentStartedAtMs` is a separate wall-clock timestamp from `startedAtMs` (which continues to anchor the schedule pointer / whole-run elapsed) — it anchors only the current station's count-up, exactly the same timestamp-anchoring principle already used throughout this codebase. `isValidSnapshot` gains a branch validating both new fields (`Number.isInteger(athleteIndex)`, `Number.isFinite(athleteSegmentStartedAtMs)`) analogous to the existing `rep` branch. `isStaleActiveRun`'s emom/interval bound (currently `expand(workout)`'s total + `SLACK_SEC`) needs to account for a run that is legitimately still active past the schedule's total — the athlete may be genuinely behind, not abandoned. Proposed: reuse the existing uncapped-rep bound (`UNCAPPED_BOUND_SEC`, 4 hours) for emom/interval too, since "ended" is now athlete-determined rather than clock-determined, the same way an uncapped rep workout already has no clock-derived bound to lean on.

## Risks / Trade-offs

- **[Risk]** Removing the hard cutoff removes the training-discipline value some athletes want from EMOM specifically (the whole point, for some, is that the clock doesn't care). → Mitigation: the schedule pointer, delta readout, and schedule beacon together keep the pacing pressure fully visible and audible — nothing is hidden, only the forced cutoff is removed. This was an explicit, deliberate product decision (see proposal), not an oversight.
- **[Risk]** Two independent wall-clock-anchored hooks (`useSchedule`, `useAthletePointer`) both ticking on their own 200ms timers is marginally more render churn than one shared clock. → Mitigation: both already exist in spirit today (`useIntervalClock` and `useCountUpClock` are already separate hooks with separate timers, used by different players); this isn't new complexity, just the same pattern applied within one player.
- **[Risk]** Existing `EmomPlayer.test.tsx` and `useIntervalClock.test.ts` assert the old forced-advance behavior and will fail outright. → Mitigation: tasks.md includes rewriting these tests as part of the change; this is expected breakage, not a regression to guard against.
- **[Risk]** A snapshot schema change means any snapshot captured under the old shape is invalid under the new `isValidSnapshot`. → Mitigation: `loadActiveRun` already silently discards mis-shaped snapshots (that's the documented behavior for any schema change, per the comment in `activeRun.ts`); an in-flight EMOM run across a deploy simply isn't resumed, same as any prior schema bump.

## Migration Plan

No data migration needed — `activeRun.ts` is client `localStorage`, single-run, and already designed to discard incompatible snapshots silently (see Risk above). Roll out is a single deploy: `EmomPlayer`, its hooks, and `audio.ts` change together; there is no flag or staged rollout since there's no dual-mode to stage between.

## Open Questions

- Exact color/token choice for the ahead/behind delta readout — left to implementation to match existing `SEGMENT_TEXT_CLASS`/`SEGMENT_PILL_CLASS` conventions.
- Exact frequency/envelope for the new `cues.beacon()` tone — left to implementation, constrained only to "audibly distinct from `start()`."
