# Tasks: add-run-lifecycle-whiteboard

## 1. Worker: runs resource

- [x] 1.1 Add migration `0002_runs.sql` with the `runs` table per design (server-generated id, slug, server-computed day, started/completed timestamps, identity, summary fields, length-capped notes); keep `daily_checkins` read-only
- [x] 1.2 Implement `POST /runs` (create started run, return id) with payload validation and the existing timezone/day pattern
- [x] 1.3 Implement `POST /runs/:id/complete` (idempotent) and `POST /runs/complete` (self-contained completed run for the missed-start recovery path)
- [x] 1.4 Rework `GET /heatmap` to aggregate runs into per-day `{completed, started}` counts, merging legacy `daily_checkins` counts into completed
- [x] 1.5 Implement `GET /results?workout=<slug>`: completed, named runs, newest first, capped at ~50
- [x] 1.6 Remove `POST /checkin` (after client migration lands; see 4.3); update worker README
- [x] 1.7 Worker tests: run creation, idempotent completion, complete-without-start, heatmap merge with legacy data, results filtering (nameless excluded), validation rejects junk payloads

## 2. Client: runs API + identity

- [x] 2.1 Extend `src/heatmap/api.ts`: `startRun`, `completeRun`, `fetchResults`, updated heatmap type — all preserving the silent-failure best-effort contract
- [x] 2.2 Implement whiteboard identity: localStorage name + generated device UUID, a `useIdentity` helper, and the one-time name prompt component (with decline path)

## 3. Player integration

- [x] 3.1 Fire `startRun` when either player starts; store the returned run id in the active-run snapshot (companion change) so it survives reloads
- [x] 3.2 On finish: interval player posts a minimal summary (duration only), rep player posts its full `RunSummary`; finish screen collects optional notes and posts the result; falls back to `POST /runs/complete` when no run id exists
- [x] 3.3 Verify offline behavior end-to-end: no Worker URL configured and Worker-unreachable cases run the full workout without errors or blocked UI

## 4. Heatmap + whiteboard UI

- [x] 4.1 Render half-state days in `Heatmap.tsx`: completed count drives existing intensity; started-only contribution renders as a distinct half treatment, legible in light and dark themes
- [x] 4.2 Add the per-workout results board to the idle screen (name, date, time/reps/breaks, notes)
- [x] 4.3 Deploy sequencing: ship Worker (additive endpoints) → ship client → remove `/checkin` (task 1.6); confirm legacy heatmap history renders unchanged in production
- [x] 4.4 Full test suite + typecheck; manual pass: start a run, see today's half mark, finish, see it fill and the board entry appear
