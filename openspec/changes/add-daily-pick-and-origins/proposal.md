# Proposal: add-daily-pick-and-origins

## Why

The workout pool is growing beyond David Rosen's originals (a generator skill will produce more), so two things are needed: a visible marker of what's an original versus generated, and a shared "Today's EMOM" that gives the group one default workout per day — randomly chosen, the same for everyone, but never forced.

## What Changes

- **Origin marker**: every workout declares `origin: 'original' | 'generated'`. Originals (created by David Rosen) get a badge; generated workouts get a distinct one. All four current workouts are originals (per explore: the 6×5 Cycles included).
- **Daily pick**: one workout per day is featured as "Today's EMOM" — deterministic from the calendar date so every device agrees with no server involvement, day-bucketed at America/New_York midnight (matching the Worker's heatmap day), never the same workout two days in a row, drawn from all registered workouts. It is pre-selected on the idle screen and badged, but the athlete can switch to any workout freely (featured, not forced). Snapshot restore still wins over the daily default.
- **Generator skill**: a repo skill (`.claude/skills/new-workout/`) encoding the house patterns — equipment, loads, measure kinds, the three timing shapes (EMOM blocks / rep targets / circuit cycles), pace conventions, origin field, registry + test checklist — so future Claude sessions produce on-pattern data PRs.

## Capabilities

### New Capabilities

- `workout-origins`: the origin field on the workout model and its badge display.
- `daily-pick`: deterministic shared daily featured workout — selection algorithm, day bucketing, no-consecutive-repeat rule, featured-not-forced UI.

### Modified Capabilities

_None — no requirement changes to rep-workout-*, run-lifecycle, or results-whiteboard; the daily pick only changes which workout is selected by default._

## Impact

- `src/timer/workouts.ts`: `origin` field (required) on both workout shapes; all four set to `'original'`.
- New `src/timer/dailyPick.ts`: pure date→slug function.
- `src/timer/WorkoutPlayer.tsx`: default selection from the daily pick (when not restoring a snapshot); "Today's EMOM" badge; origin badge on the overview.
- `.claude/skills/new-workout/SKILL.md`: generator skill (tooling, not app code).
- Worker, heatmap, whiteboard, snapshot: no changes.
