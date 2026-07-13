# Tasks: expand-workout-library

## 1. Model + expand + builders

- [x] 1.1 Split `src/timer/workouts.ts` into `src/timer/workouts/` (`types.ts`, `index.ts` with registry + `getWorkout`; `emom.ts`, `rep.ts`, `builders.ts`) with the existing four workouts intact and `from './workouts'` unchanged
- [x] 1.2 Add `AmrapWorkout` (`mode:'amrap'`, `capMin`, `round: RepTarget[]`, `roundStep?`) to the `Workout` union
- [x] 1.3 Add `IntervalWorkout` (`mode:'interval'`, `rounds`, `workSec`, `restSec`, `stations: Station[]`) and the `max` measure kind
- [x] 1.4 `expand()` gains an `interval` branch: per round a `work` segment (+ `break` when `restSec>0`); `measureLabel` gains "max reps"
- [x] 1.5 `builders.ts`: `range(from,to)`, `ladder(scheme, movements)`, `rounds(n, targets)`
- [x] 1.6 Unit tests: interval expands to the right work/rest segment sequence and total duration; `ladder()`/`range()`/`rounds()` generation; `max` label

## 2. Players + snapshot + dispatch

- [x] 2.1 `activeRun.ts`: snapshot union gains `amrap` (`rounds`) and `interval` (emom-shaped); validation + staleness unchanged
- [x] 2.2 `AmrapPlayer.tsx`: count-up clock bounded at `capMin`, round counter with tap +/−, round reference list (scaled by `roundStep`), finish reports the run summary
- [x] 2.3 `WorkoutPlayer.tsx`: `freshSnapshot` + dispatch for `amrap` (→ `AmrapPlayer`) and `interval` (→ `EmomPlayer`); interval completion computes duration from `expand()`
- [x] 2.4 Component tests: AMRAP counter increments/decrements and can't go negative, resumes from snapshot, ends at cap; interval plays through `EmomPlayer` (work/rest segments)

## 3. Picker UI

- [x] 3.1 Replace the `role="tablist"` pill row with a labelled `<select>` (value = slug) + keep the featured/origin badges and summary
- [x] 3.2 Component tests: default selection is the daily pick; changing the select swaps the overview and summary; a single workout hides the select

## 4. Library import (data only)

- [x] 4.1 Import EMOM / cycle entries into `emomLibrary.ts` (results stripped, loads normalized, deduped) — 29 workouts
- [x] 4.2 Import rep / chipper / rep-goal / pyramid entries into `repLibrary.ts` (pyramids via `ladder()`) — 38 workouts
- [x] 4.3 Import AMRAP entries into `amrap.ts` — 7 workouts
- [x] 4.4 Import interval / tabata entries into `interval.ts` — 2 workouts
- [x] 4.5 All entries `origin: 'original'`, kebab-case slugs, one-sentence summaries; register all; note any dropped/unclassifiable entries (see Import notes)
- [x] 4.6 Registry test: expected slug set present, all slugs unique, every workout has title/summary/origin

## 5. Conventions

- [x] 5.1 `new-workout/SKILL.md`: three shapes → five (add AMRAP, interval); equipment core = bench + dumbbells + mats + ergs + KBs + med ball; drop blanket "no barbell"
- [x] 5.2 `rep-workout-model` spec: note the `ladder()` helper and the grown registry (spec delta)

## 6. Verify

- [x] 6.1 `npm test` (95 pass), `npx tsc -b`, `npm run lint`, `npm run build` all green
- [x] 6.2 `openspec validate expand-workout-library --strict`

## Import notes

Registry grew from 4 → 80 workouts (2 seed EMOM + 29 EMOM library + 2 seed rep +
38 rep library + 7 AMRAP + 2 interval). Everything `origin: 'original'` — the
whole log is David's own programming. Results (HR, times, dates, per-athlete
weights) were stripped; per-run results already have a home in the finish-screen
notes field.

**Dropped (1):** "Pyramid: 30 pushups / 5 goblet squats, then 30 kb swings / 5
russian twists" — no discernible rung scheme or loads; too ambiguous to model
without inventing structure.

**Merged (1):** the 5-round + curls "thrusters/renegade/goblet/devils/spiderman"
variant folded into the canonical 6-round `rep-6rft-thrusters-goblet`.

**Modeling notes:** E2M/E3M headers → circuit station at `intervalSec` N×60;
ascending-rep EMOMs → representative start reps + progression in the summary;
in-rotation rest minutes → a `Rest` hold station; row-metre ladders and
"after every round" accessory work with no model slot → described in the
summary. A few duration-less entries were modeled as a representative 5 rounds
and flagged in their summaries.
