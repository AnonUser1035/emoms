# Tasks: add-athlete-paced-workouts

## 1. Workout model

- [x] 1.1 Add `mode` discriminant to the workout union in `src/timer/workouts.ts`: existing shape becomes `EmomWorkout` (`mode: 'emom'`), new `RepWorkout` / `RepTarget` / `RunSummary` types per design; `emom-30` definition otherwise unchanged
- [x] 1.2 Narrow `expand()` and interval-player call sites to `EmomWorkout` so the compiler enforces mode dispatch; no behavior changes to `expand.ts` or `useIntervalClock.ts`
- [x] 1.3 Define the 60/30 chipper as data: twelve ordered targets (60× diamond pushups, goblet squats 65 lb, seated overhead press 40 lb, curls, reverse lunges 45 lb, full-body extensions 25 lb; then 30× the same list with regular pushups), no cap, no break prescription
- [x] 1.4 Define the 300-pushup workout as data: single 300-pushup target, 35-minute cap, break prescription of 15 goblet squats + 15 tuck jumps
- [x] 1.5 Register both new workouts in the registry; unit-test registry contents and `getWorkout` lookups

## 2. Count-up clock

- [x] 2.1 Implement `useCountUpClock` in `src/timer/`: wall-clock-anchored elapsed seconds (accepts an existing start timestamp for resume), ~200ms tick, optional cap with `remainingToCapSec` and a cap-reached signal; reuse wake-lock pattern
- [x] 2.2 Unit-test the hook: counts up from zero, resumes from a given start timestamp, survives simulated background throttling (elapsed derives from timestamps, not ticks), fires cap-reached exactly once

## 3. Rep player

- [x] 3.1 Build the rep player component: current target (movement, load, progress) prominent, next target preview, elapsed clock, cap countdown when capped
- [x] 3.2 Implement chunked rep logging: increment buttons plus "target done"; completing a target advances without carrying overflow reps
- [x] 3.3 Implement break state for workouts with a break prescription: break button → prescription view + break count increment → resume; clock keeps running; no break button when no prescription
- [x] 3.4 Implement end conditions: all targets complete, or cap elapsed, whichever first; render finish summary (elapsed, total reps, breaks, completed flag) and expose `RunSummary` through a callback prop
- [x] 3.5 Unit-test player logic: target advancement, overflow handling, break counting, both end conditions, summary contents

## 4. Active-run snapshot (reload survival)

- [x] 4.1 Implement the snapshot module: single versioned localStorage key (`emoms.activeRun.v1`) with save/load/clear; silent discard on version mismatch or unparseable payload
- [x] 4.2 Wire snapshot writes into both players: on start, and on every rep-player state mutation (rep log, target advance, break toggle); EMOM snapshots carry only slug + start timestamp; clear on finish/discard
- [x] 4.3 Implement restore-on-load: fresh snapshot auto-resumes the right player with elapsed recomputed from the stored start; recomputed elapsed past a cap ends the run at the cap with snapshotted progress; stale snapshot (cap + slack, or ~4 h uncapped) shows resume-or-discard
- [x] 4.4 Unit-test snapshot module and restore paths: exact-elapsed resume, cap-passed-while-gone, stale prompt, version-mismatch discard, cleared-after-finish

## 5. Integration

- [x] 5.1 Mode dispatch in `EmomPlayer.tsx` (or a thin parent): EMOM workouts → existing player, rep workouts → rep player; idle overview renders rep workouts' target list sensibly
- [x] 5.2 Verify the dormant workout tab list activates with three registered workouts and switching modes works from the idle screen
- [x] 5.3 Confirm client persistence is exactly the active-run snapshot (reload mid-run resumes; reload after finish is clean with no stored history); run full test suite and typecheck
