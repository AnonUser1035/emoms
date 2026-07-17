## 1. `kbThen12Min` — bake rest into the rotation

- [x] 1.1 In `src/timer/workouts/emomLibrary.ts`, add a `rest(120)` station after the `circuit('KB circuit', ...)` station in block 1's `stations` array.
- [x] 1.2 Change block 1's `durationMin` from 15 to 25 (5 × (180s work + 120s rest)).
- [x] 1.3 Remove block 1's `then: [{ kind: 'break', seconds: 120 }]` — the rest is now part of the rotation.
- [x] 1.4 Re-read the summary against the new structure and tighten the wording if it still reads as a single one-time break rather than "circuit + rest, five times." (Reworded to "A 3-minute kettlebell circuit and a 2-minute break, five times through, then a 12-minute...".)

## 2. `ballisticRowsKb` — fix round-count arithmetic

- [x] 2.1 In `src/timer/workouts/emomLibrary.ts`, change `durationMin` from 35 to 30 so the six-station rotation completes exactly five full rounds.

## 3. `ladder14` — add the missing Russian twists

- [x] 3.1 In `src/timer/workouts/repLibrary.ts`, replace the `ladder(scheme14, [...])` call with a `scheme14.flatMap(...)` (or equivalent) that appends `{ movement: 'Russian twists', count: 50, load: '25 lb' }` after the Burpees/Military-press pair at every rung.

## 4. `superset5rft` — add the missing bear-crawl finisher

- [x] 4.1 In `src/timer/workouts/repLibrary.ts`, append `{ movement: 'Bear crawl', count: 1, notes: '4 minutes' }` (or similar) as the final target after `rounds(5, [...])`.

## 5. `pyr5010` — add the missing extra pushup target

- [x] 5.1 In `src/timer/workouts/repLibrary.ts`, replace the `ladder(...)` call with a hand-built `scheme.flatMap(...)` that appends a fixed `{ movement: 'Pushups', count: 10, notes: '...' }` (distinctly noted from the ladder's own descending Pushups rung) after every rung.

## 6. `amrapClimbSix` — correct the summary instead of fabricating a climb

- [x] 6.1 In `src/timer/workouts/amrap.ts`, rewrite `amrapClimbSix`'s summary to drop "climbing the reps as you go" and describe it as a flat AMRAP, since no `roundStep` exists and none can be recovered from the source. (Also renamed the title from "Six-Move Climb" to "Six-Move Circuit" for the same reason — the `slug` was left untouched since it's a durable key used by the whiteboard/heatmap.)

## 7. `climbingGobletSwing` / `climbingKb` — unroll the climb into explicit stations

- [x] 7.1 In `src/timer/workouts/emomLibrary.ts`, write a small local helper that generates the explicit per-round station sequence for `climbingGobletSwing`. (Implemented as one 3-minute `Block` per round rather than one block with 36 flat stations — a single 36-station block would have made every work segment report `round: 1`, since `expandBlock` derives `round` from `floor(i / stations.length)`; per-round blocks keep the block-index-based round/progress display meaningful.)
- [x] 7.2 Do the same for `climbingKb`'s 10-round climb (goblet squats/overhead swings/thrusters, +1/+2/+1 per round).
- [x] 7.3 Verify each block's `durationMin` still matches `intervalSec × station count` exactly after unrolling. (Each of the 12/10 per-round blocks is 3 stations × 60s = 3 min, summing to 36/30 min total — confirmed via the new expand() tests.)

## 8. `kbComplexAlternating` — repeat circuit parts instead of noting a multiplier

- [x] 8.1 In `src/timer/workouts/emomLibrary.ts`, replace the "Complex ×3" station's single-pass `CircuitPart` list plus "3 rounds of the complex" note with the list repeated 3 times in place (and drop the now-redundant note, or keep it as a label). (Dropped the note.)
- [x] 8.2 Do the same for the "Complex ×2" station: repeat its `CircuitPart` list 2 times in place.

## 9. New capability spec

- [x] 9.1 Confirm `specs/workout-library-fidelity/spec.md` (already drafted) reads correctly once the fixes above land — adjust wording only if implementation revealed the spec's phrasing needs tightening. (Re-read; the "explicit per-round stations for EMOM" phrasing in the climbing-scheme scenario already matches the per-round-block implementation. No changes needed.)

## 10. Tests

- [x] 10.1 Add a test verifying `kbThen12Min` expands to 5 circuit rounds each followed by a rest, with no trailing break. (Adjusted from the original plan of asserting `type: 'break'` — a rotating `rest()` station expands to `type: 'work'` with movement `'Rest'`, per existing precedent elsewhere in the library (`gobletPushupSwingBurpee`, `thrusterBurpeeLunge`); the test asserts on movement name and duration instead.)
- [x] 10.2 Add a test verifying `ballisticRowsKb` expands to exactly 5 complete rounds (30 work segments) with no partial round.
- [x] 10.3 Add a test verifying `ladder14`'s targets include a Russian-twists target (50 reps, 25 lb) after every rung.
- [x] 10.4 Add a test verifying `superset5rft`'s targets end with the bear-crawl finisher.
- [x] 10.5 Add a test verifying `pyr5010`'s targets include the extra fixed-10 pushup target after every rung, distinguishable from the ladder's own pushup rung.
- [x] 10.6 Add a test verifying `amrapClimbSix`'s summary no longer claims a climb (and/or that its `roundStep` remains unset/undefined).
- [x] 10.7 Add a test verifying `climbingGobletSwing` and `climbingKb` expand to stations whose rep counts actually climb round over round.
- [x] 10.8 Add a test verifying `kbComplexAlternating`'s two stations' circuit parts arrays have length 9 (3×3) and 6 (3×2) respectively.
- [x] 10.9 Run the full existing test suite to confirm none of the above changes regress existing coverage. (127/127 passing; `tsc --noEmit` clean.)
