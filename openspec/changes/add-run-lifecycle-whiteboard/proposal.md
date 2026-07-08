# Proposal: add-run-lifecycle-whiteboard

## Why

The Worker today is a pure aggregate counter (`daily_checkins`: one shared count per day, incremented on completion, identity-free by design). That can't express two things the group now wants: a started workout showing up immediately as a "half workout" on the heatmap that fills in when finished, and per-person results ("35 min brian - 276 pushups") that are currently kept by hand. Multiple people do these workouts; the app should be the shared whiteboard.

## What Changes

- Introduce a **run** as a server-side resource with a lifecycle: starting a workout creates a run (`started`); finishing it completes the run with a result payload. The Worker is the system of record; the frontend only posts two events and renders server responses.
- The heatmap derives from runs: completed runs render as full contribution, runs started but never completed render as a visibly distinct half state that fills in when the run completes. Historical `daily_checkins` counts are preserved and merged in as completed.
- **BREAKING (worker API)**: `POST /checkin` is replaced by the run lifecycle endpoints; the app is the only client and migrates in the same change.
- Add a **results whiteboard** per workout: gym-whiteboard identity (athlete types a name once, stored client-side, sent with events; a generated device id accompanies it as a stable key). No accounts, no passwords. Each workout's page shows its board of past results.
- Results carry what the player measured (elapsed time, total reps, breaks, completed flag — the `RunSummary` from `add-athlete-paced-workouts`) plus free-text notes for the long tail (heart rate, load used).
- All network calls remain best-effort: the timer never blocks on the Worker; a run that couldn't be started can still be completed (the server accepts a self-contained completed run), and an offline finish degrades silently as today.

## Capabilities

### New Capabilities

- `run-lifecycle`: the run resource on the Worker (start/complete endpoints, D1 schema, server-computed days, idempotent completion), the app posting start/finish events from both players, and heatmap aggregation with half (started-only) vs full (completed) day contributions.
- `results-whiteboard`: whiteboard identity (name-once + device id) and per-workout results boards — posting a result on finish and listing results per workout.

### Modified Capabilities

_None — no main specs exist in this repo yet; the community-heatmap spec referenced by the worker README lives in the parent project this app was spun out of._

## Impact

- `worker/`: new `runs` migration; `index.ts` gains run endpoints and a runs-based heatmap query merging legacy `daily_checkins`; `/checkin` removed.
- `src/heatmap/api.ts`: checkin client becomes a runs client (start, complete, results list); heatmap response gains started/completed split.
- `src/heatmap/Heatmap.tsx`: half-state rendering.
- Both players (existing interval player and the rep player from the companion change): fire run-start on start, run-complete with the summary on finish.
- New small UI: one-time name prompt on first finish, per-workout results board on the idle screen.
- Depends on `add-athlete-paced-workouts` only for the `RunSummary` shape and the rep player's finish hook; the lifecycle itself also covers the existing EMOM player.
