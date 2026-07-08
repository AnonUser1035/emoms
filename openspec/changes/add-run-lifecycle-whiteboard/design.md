# Design: add-run-lifecycle-whiteboard

## Context

The Worker (`worker/src/index.ts`) is deliberately identity-free: `POST /checkin` upserts a per-day counter in `daily_checkins`, `GET /heatmap` reads the past 30 days. The client (`src/heatmap/api.ts`) is fire-and-forget best-effort — the timer never depends on the network. Two new needs break the aggregate-counter model: a started workout must appear immediately as a half-filled contribution that fills on completion (requires per-run state), and friends want per-person results per workout (requires identity).

Governing constraint from the user: **as little as possible on the frontend.** The Worker becomes the system of record; the client posts two events per run and renders server responses. A second constraint inherited from the existing design: the timer must remain fully functional offline — every network interaction stays best-effort.

## Goals / Non-Goals

**Goals:**
- One `runs` resource from which both the heatmap (with half states) and the whiteboard are derived server-side.
- Gym-whiteboard identity: zero-friction, no accounts, good-faith trust within a friend group.
- Preserve legacy heatmap history; keep offline degradation exactly as forgiving as today.

**Non-Goals:**
- Real authentication, sessions, or spoofing prevention (Cloudflare Access can be bolted in front later without code changes).
- Editing or deleting posted results from the UI (device id is stored to make this possible later).
- Live-updating boards/heatmap (fetch on view, as today).
- Resuming an interrupted run after reload — the half state on the graph *is* the record of an interrupted run.

## Decisions

### 1. One `runs` table; heatmap and whiteboard are queries over it

```sql
CREATE TABLE runs (
  id TEXT PRIMARY KEY,            -- server-generated UUID
  workout_slug TEXT NOT NULL,
  day TEXT NOT NULL,              -- YYYY-MM-DD, server-computed (existing tz pattern)
  started_at INTEGER NOT NULL,    -- unix ms, server clock
  completed_at INTEGER,           -- null = still "started" (half state)
  athlete_name TEXT,              -- null = anonymous (heatmap only)
  device_id TEXT,
  duration_sec INTEGER,           -- summary fields, null until completed
  total_reps INTEGER,
  breaks INTEGER,
  completed_all INTEGER,          -- 1 = finished targets, 0 = capped out
  notes TEXT                      -- free text, length-capped server-side
);
```

Heatmap: `count(completed_at IS NOT NULL)` and `count(completed_at IS NULL)` grouped by day, merged with legacy `daily_checkins` counts as completed. Whiteboard: completed runs with a name for a slug, newest first. Alternative considered: separate `results` table beside the existing counter — rejected; two sources of truth for "a workout happened" is exactly the frontend/backend split smell this change is trying to avoid.

### 2. Endpoints

- `POST /runs` `{slug, name?, deviceId?}` → `{runId}` — creates a started run; day and timestamps server-side.
- `POST /runs/:id/complete` `{summary, name?, deviceId?, notes?}` — idempotent: completing an already-completed run is a no-op returning the stored state.
- `POST /runs/complete` (no id) — creates a run directly in completed state; the recovery path when the start event never reached the server. The run contributes to today, not the (unknown) start day — acceptable for a workout app.
- `GET /heatmap` — same shape as today plus a `started` count per day.
- `GET /results?workout=<slug>` — the board.
- `POST /checkin` is removed. **Migration**: deploy Worker first (new endpoints additive), then the client; remove `/checkin` once the client no longer calls it. Legacy `daily_checkins` table is kept read-only and merged into heatmap reads — no data migration.

### 3. Identity: name-once + device UUID, trusted as-is

First finish prompts for a display name; name and a generated UUID land in localStorage and ride along on every subsequent event. The server stores them verbatim (with length limits) and never verifies. Rationale: the threat model is friends teasing each other; the alternative (accounts) taxes every user forever to solve a problem this group doesn't have. The device id is not used for anything in v1 beyond being stored — it is the hook for later edit/delete-own-results without a breaking schema change. Client persistence is exactly two things: this identity, and the companion change's active-run snapshot (see decision 5).

### 4. Half-state rendering

Heatmap cells currently encode a single count. New encoding: completed count drives the existing intensity scale; a day with started-only runs additionally renders a half-fill treatment (e.g. diagonal split or hollow ring — pick during implementation, must be legible in both themes). A started-only day with zero completions must be visibly "someone showed up" without reading as a full workout. The client does no aggregation — it renders the `{completed, started}` pairs the Worker returns.

### 5. Client stays a two-event renderer

`src/heatmap/api.ts` grows `startRun(slug, identity)`, `completeRun(runId | null, summary, identity, notes?)`, `fetchResults(slug)` — all with the existing silent-failure contract. The run id rides in the companion change's active-run snapshot, so it survives reloads and completion after a reload targets the original run. Both players call `startRun` on start; on finish, the interval player posts a minimal summary (duration; reps/breaks null) and the rep player posts the full `RunSummary` from the companion change. No retry queue, no offline buffer: a lost completion leaves an honest half mark, which is the feature working as designed, not a bug to engineer away.

### 6. Sequencing with `add-athlete-paced-workouts`

The lifecycle covers the existing EMOM player too, so this change is implementable before, after, or interleaved with the companion — only the rep player's finish hook and `RunSummary` shape come from there. Recommended order: companion first (it defines the summary type), then this change wires both players.

## Risks / Trade-offs

- [Anyone can post as anyone] → Accepted for a friend group; Cloudflare Access in front of the Worker is the later escape hatch if the audience widens.
- [Abandoned runs accumulate permanent half marks] → Accepted and intended — "started, didn't finish" is honest signal. If it ever gets noisy, a server-side policy (e.g. started runs older than N hours stop counting) is a query change, no schema change.
- [Complete-without-start attributes the run to completion day] → Accepted; only reachable when the start event never made it to the server (offline start), so there is no half mark to orphan. Reload-mid-run no longer loses the run id — it persists in the active-run snapshot, and a resumed finish completes the original run.
- [Unauthenticated write endpoints invite junk data] → Same exposure the counter already has; mitigate cheaply: strict payload validation, length caps, and the existing CORS allowlist. Not a security boundary, just hygiene.
- [Two-step deploy (Worker before client) can strand a version skew] → Old client + new Worker keeps working only until `/checkin` is removed; remove it in a follow-up deploy after the client ships.

## Open Questions

- Board size/pagination: start with "latest N (≈50) per workout" and revisit if history grows.
- Whether the finish screen should offer "post as <name>" vs auto-post once identity exists — lean auto-post with a visible undo, decide during implementation.
