## 1. Schedule hook (read-only pace reference)

- [x] 1.1 Add `useSchedule(segments)` in `src/timer/useSchedule.ts`, adapting the `ends`/`total` cumulative-duration math from `useIntervalClock` — expose `scheduleIndex`, `scheduleElapsed`, `scheduleRemaining` (time left in the current schedule segment), `totalDuration`, and `startOf(index)`.
- [x] 1.2 Keep whole-run `pause`/`resume`/`start` on this hook (unchanged semantics from today's `useIntervalClock`) — pausing still stops both the schedule's and the athlete's wall-clock anchors.
- [x] 1.3 Delete `src/timer/useIntervalClock.ts` and its test once `EmomPlayer` no longer imports it (task 4).

## 2. Athlete pointer hook (tap-driven advancement)

- [x] 2.1 Add `useAthletePointer(segments, startedAtMs)` in `src/timer/useAthletePointer.ts` — owns `athleteIndex` and `athleteSegmentStartedAtMs`, exposes `advance()` (increments the index, stamps `athleteSegmentStartedAtMs = Date.now()`, and signals workout-complete when advancing past the last segment) and `athleteSegmentElapsed` (count-up, wall-clock anchored and ticked the same way `useCountUpClock` is, not accumulated).
- [x] 2.2 Support initializing from a restored snapshot's `athleteIndex`/`athleteSegmentStartedAtMs` (mirrors how `RepPlayer` seeds from `snapshot.targetIndex` etc.).

## 3. Audio cue split

- [x] 3.1 Add `beacon()` to `AudioCues` in `src/timer/audio.ts` — a tone audibly distinct from `start()`, reusing the `countdown()` tone family per design.md.
- [x] 3.2 Repurpose `countdown()`'s call site to key off the schedule's remaining time in its current segment (not the athlete's), so the 3-2-1 lead-in tracks the schedule pointer.
- [x] 3.3 Repurpose `tick()`'s call site (circuit per-minute pacing) to key off `athleteSegmentElapsed` instead of the old gating `segmentElapsed`.

## 4. EmomPlayer rewrite

- [x] 4.1 Replace the single `useIntervalClock(segments)` call with `useSchedule(segments)` + `useAthletePointer(segments, startedAtMs)`.
- [x] 4.2 Drive the current-segment display (station/break/hold, "next" label, block/round text) off the athlete pointer's index, not the schedule's.
- [x] 4.3 Replace the countdown display (`segmentRemaining`) with the athlete pointer's count-up (`athleteSegmentElapsed`), showing the segment's nominal `durationSec` as a reference label rather than a deadline.
- [x] 4.4 Add the persistent pace-delta readout: `startOf(athleteIndex + 1) − scheduleElapsed` (corrected during implementation — see design.md's Decisions section; anchoring to the segment's nominal *end*, not its start, is what makes "behind" begin only once the schedule has actually passed the segment), formatted as ahead/behind with `mmss`.
- [x] 4.5 Add a "Done" tap control that calls `advance()` on the athlete pointer — replaces the auto-clearing behavior for every segment type (work, break, hold, circuit-as-a-whole). Renders as "Ready" for break segments.
- [x] 4.6 Rewire `cues.start()` to fire from the athlete pointer's `advance()`; wire the new `cues.beacon()` to fire when `scheduleIndex` changes (detected the same way the old segment-change effect worked, just off the schedule hook now).
- [x] 4.7 Wire workout completion (`onComplete`) to fire when `advance()` reports "past the last segment," not from any schedule condition. `onComplete` now carries the true elapsed seconds (`schedule.scheduleElapsed`) since the duration is emergent — `WorkoutPlayer.handleClockComplete` updated to use it instead of `expand(w)`'s nominal sum.
- [x] 4.8 Remove the old force-advance effect and the "circuit checklist never gates" comment/behavior distinction — the whole-station tap now serves that role; keep the per-part checklist as a non-gating visual aid that resets on athlete-index change.

## 5. Persistence

- [x] 5.1 Extend `ActiveRunSnapshot`'s `emom`/`interval` variants in `src/timer/activeRun.ts` with `athleteIndex: number` and `athleteSegmentStartedAtMs: number`.
- [x] 5.2 Update `isValidSnapshot` to validate the new fields for `mode: 'emom' | 'interval'`.
- [x] 5.3 Update `isStaleActiveRun`'s emom/interval bound to use the uncapped-style multi-hour window (`UNCAPPED_BOUND_SEC`) instead of `expand(workout)`'s total + `SLACK_SEC`, since the run's real end is athlete-determined.
- [x] 5.4 Save the snapshot from `EmomPlayer` on every `advance()` (and on schedule pause/resume, if that's currently persisted), mirroring `RepPlayer`'s persist-on-every-mutation effect.

## 6. Tests

- [x] 6.1 Rewrite `src/timer/__tests__/EmomPlayer.test.tsx` for the new model: tap-driven advancement, no auto-advance on elapsed time, delta readout, tap-gated breaks, circuit whole-station tap, emergent end, reload restore from the new snapshot fields.
- [x] 6.2 Add unit tests for `useSchedule` (pure schedule math, unchanged from today's `useIntervalClock` behavior minus gating) and `useAthletePointer` (advance semantics, count-up accuracy across background throttling, past-the-end completion signal).
- [x] 6.3 Update `src/timer/__tests__/activeRun.test.ts` for the new `emom`/`interval` snapshot shape and staleness bound.
- [x] 6.4 Manually verify in the browser per the `verify` skill: start an EMOM workout, tap done early on a station and confirm immediate advance + "ahead" delta, let a station run past its nominal interval without tapping and confirm it does not auto-advance and the delta reads "behind," take a break and confirm it requires a tap to resume, reload mid-run and confirm the athlete's station and count-up survive. Verified live via a Playwright smoke script (dev server + headless Chromium): count-up display, correct ahead-delta banking across a Done tap, the separate "Schedule: station N/M" ghost line, pause/resume freezing, and mid-run reload restore all confirmed with no console errors. The "behind" and break/"Ready" cases were exercised via the automated test suite (fake timers) rather than waiting out real wall-clock minutes in the live check.
