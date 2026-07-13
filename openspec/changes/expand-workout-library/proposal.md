# Proposal: expand-workout-library

## Why

The registry holds four workouts across three shapes (`emom`, `rep`, circuit `cycle`). David's training log holds ~90 entries — the real library. Two structural gaps and one UI limit block importing it:

1. **AMRAP** ("30 min AMRAP, count your rounds") is the *inverse* of a `rep` workout: the clock is fixed and the athlete counts rounds, rather than the work being fixed and the clock counting up. No current mode expresses it.
2. **Interval / tabata** ("20:10 × 8", "2 min on / 1 min off × 10, max reps") needs a rest sub-interval *inside* each round and max-effort stations. The `emom` block model has one station per interval and rest only at block end.
3. **Pyramids / ladders** (`12-1`, `5-20-5`, `50/40/30/20/10`) are expressible in `rep` mode today only by writing every rung out by hand — and the log has ~15 of them.
4. The idle **picker is a tab-wall** (one pill per workout). At 40+ workouts it is unusable.

The log entries also carry results (HR, times, dates, per-athlete weights). Those are run history, not prescription — they are **stripped on import**; only the clean prescriptions enter the library.

## What Changes

- **AMRAP mode** (`mode: 'amrap'`): a fixed `capMin` and one `round` of rep targets the athlete repeats, counting completed rounds on a count-up clock. Optional `roundStep` adds reps per round for ascending schemes (`+1`, `+5`). New `AmrapPlayer` on the existing count-up clock; a round counter with tap +/−.
- **Interval mode** (`mode: 'interval'`): `rounds` of `workSec` on / `restSec` off over a rotating station list. It **compiles to the existing `Segment[]`** (work + break) via `expand()`, so it plays through the current `EmomPlayer` and interval clock with no new runtime. Max-effort stations use a new `max` measure ("max reps").
- **`ladder()` authoring helper**: generates `RepTarget[]` for a movement list across a rep scheme (descending, ascending, pyramid, ladder). No model change — pyramids stay `mode: 'rep'`.
- **Picker overhaul**: replace the tab-wall with the daily featured workout (badged, default-selected) plus a labelled `<select>` of the rest, each option showing its one-sentence summary. `dailyPick()` is unchanged.
- **The library as data**: the log's distinct prescriptions, deduped, results stripped, loads normalized to on-hand kit (bench, dumbbells, kettlebells, ergs, med ball, mat; barbell not assumed). All `origin: 'original'`. `src/timer/workouts.ts` splits into a `workouts/` directory by shape.
- **Equipment convention update**: the `new-workout` skill and `rep-workout-model` conventions gain bench + dumbbells + mats as the guaranteed core and drop the blanket "no barbell" claim (barbell is occasional; normalize to dumbbells when substituting).

## Capabilities

### New Capabilities

- `amrap-workouts`: the AMRAP model shape, round-counting count-up player, snapshot/resume, and its registry entries.
- `interval-workouts`: the interval/tabata model shape, its `expand()` compilation to work/rest segments, the `max` measure, and its registry entries.
- `workout-picker`: featured-plus-dropdown idle selection replacing the tab-wall.

### Modified Capabilities

- `rep-workout-model`: the `ladder()` helper for pyramid/ladder rep schemes; the registry grows to the full imported library; equipment conventions updated.

_`rep-workout-player`, `run-lifecycle`, `results-whiteboard`, and `circuit-stations` are untouched — AMRAP and interval report the same run-summary shape the lifecycle already records._

## Impact

- `src/timer/workouts.ts` → `src/timer/workouts/` (`index.ts`, `emom.ts`, `rep.ts`, `amrap.ts`, `interval.ts`, `builders.ts`). Public import surface (`workouts`, `getWorkout`, types) preserved.
- `src/timer/expand.ts`: an `interval` branch emitting work/rest segments.
- `src/timer/format.ts`: `max` measure label.
- `src/timer/activeRun.ts`: snapshot union gains `amrap` and `interval` modes.
- `src/timer/WorkoutPlayer.tsx`: dispatch adds `amrap` (→ `AmrapPlayer`) and `interval` (→ `EmomPlayer`); idle picker replaced.
- `src/timer/AmrapPlayer.tsx`: new.
- `.claude/skills/new-workout/SKILL.md`: three shapes → five; equipment core updated.
- `expand`/`useIntervalClock`/`useCountUpClock`/Worker: no timing or server changes.
