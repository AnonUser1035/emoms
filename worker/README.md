# emoms runs Worker (Cloudflare)

A tiny Worker that is the system of record for workout **runs**: a run is
created when a workout starts (rendering as a half-filled day on the shared
heatmap) and completed when it finishes. The heatmap and each workout's
results whiteboard are both queries over the same `runs` table. Identity is
gym-whiteboard trust — an optional display name plus a client-generated
device id, stored verbatim, never verified. See
`openspec/changes/add-run-lifecycle-whiteboard/` for the spec and design.

Fully isolated from ankibot's Worker/KV — separate Cloudflare Worker script,
separate D1 database, no shared bindings.

## One-time setup (Ryan)

```sh
cd worker
npm install
npx wrangler login   # if not already authenticated

# Create the D1 database, then paste the printed database_id into
# wrangler.toml (replace REPLACE_WITH_D1_DATABASE_ID)
npx wrangler d1 create emoms-checkins

# Apply the schema (remote = the live database, not local dev)
npx wrangler d1 migrations apply emoms-checkins --remote

npm run deploy   # note the printed URL: https://emoms-checkin.<subdomain>.workers.dev
```

Then point the frontend at it: set `VITE_CHECKIN_WORKER_URL` to the deployed
URL (see the repo root `.env.example`, and the `VITE_CHECKIN_WORKER_URL`
Actions repo Variable for production builds).

## Local development

```sh
npx wrangler d1 migrations apply emoms-checkins --local
npm run dev   # serves on http://localhost:8787
```

Run the frontend with `VITE_CHECKIN_WORKER_URL=http://localhost:8787` to test
end to end against the local Worker.

## Day bucketing

`CHECKIN_TIMEZONE` in `wrangler.toml` is a single fixed IANA timezone
(`America/New_York`) used to compute "today" for every check-in and every
heatmap read, server-side — never from a client-supplied timestamp. Every
visitor sees the identical grid regardless of where they are; see the design
doc for why this was chosen over per-visitor local time or UTC.

## CORS allow-list

`ALLOWED_ORIGINS` in `wrangler.toml` lists the origins permitted to call the
Worker (prod domain + localhost dev). The Worker also handles the `OPTIONS`
preflight.

## Request contract

```
POST /runs                       { slug, name?, deviceId? }
→ { "runId": "<uuid>", "day": "2026-07-07" }

POST /runs/:id/complete          { slug, durationSec, totalReps?, breaks?,
                                   completedAll, name?, deviceId?, notes? }
→ { "runId": "<id>", "day": "2026-07-07" }   # idempotent

POST /runs/complete              same body — creates a run directly in the
                                 completed state when the start event never
                                 reached the server

GET /heatmap
→ { "days": [ { "date": "2026-06-08", "completed": 0, "started": 1 }, ... ] }

GET /results?workout=<slug>
→ { "results": [ { "name", "day", "durationSec", "totalReps", "breaks",
                   "completedAll", "notes" } ] }   # newest first, max 50
```

`heatmap` always returns exactly 30 days, oldest first, including zero-count
days — the client should not have to infer gaps. Historical `daily_checkins`
counts are merged into `completed`, so pre-runs history is preserved.

`POST /checkin` was removed when the run lifecycle landed (the app is the
only client and migrated in the same change); deploy the Worker before or
together with the frontend — a stale cached frontend degrades silently.
