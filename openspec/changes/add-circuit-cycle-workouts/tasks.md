# Tasks: add-circuit-cycle-workouts

## 1. Model + data

- [x] 1.1 Add `dist` measure kind to `Measure` and its `measureLabel` case ("200 m")
- [x] 1.2 Add `CircuitPart` and `Station.circuit?: CircuitPart[]` to `src/timer/workouts.ts`
- [x] 1.3 Define `6×5 Cycles` as data (30-min block, `intervalSec: 300`, three circuit stations via a `cycle(erg)` helper: DB squats, med ball throw downs, situps, pushups + bike 12 cal / ski 200 m / row 250 m) and register it
- [x] 1.4 Unit tests: registry has four workouts; 6×5 expands to six 300s segments with ergs rotating bike/ski/row twice; `dist` label

## 2. Audio

- [x] 2.1 Add `AudioCues.tick()` — softer, lower, shorter than `start()`

## 3. Player

- [x] 3.1 Render circuit segments as a tappable checklist (whole-row targets, checked state as `Set<number>` reset on segment change); non-circuit segments render exactly as today
- [x] 3.2 Fire minute ticks at whole minutes of segment-elapsed inside circuit segments only, with tag-dedupe against re-renders
- [x] 3.3 Nest circuit parts in the idle overview station list
- [x] 3.4 Component tests: tap toggles a part, boundary resets checks, checking all parts early does not end the segment, ticks fire at minute marks (mockable cues), reload-resume restores cycle but not checks

## 4. Verify

- [x] 4.1 Full test suite, typecheck, lint, build
