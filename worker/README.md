# emoms checkin Worker (Cloudflare)

A tiny, **stateless** Worker backing the shared community heatmap: a single
global, identity-free count of EMOM completions per day. No accounts, no
per-user data — see `openspec/changes/spinout-emoms-app/` in the site repo
for the full spec and design rationale.

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
POST /checkin
→ { "day": "2026-07-07", "count": 3 }

GET /heatmap
→ { "days": [ { "date": "2026-06-08", "count": 0 }, ..., { "date": "2026-07-07", "count": 3 } ] }
```

`heatmap` always returns exactly 30 days, oldest first, including zero-count
days — the client should not have to infer gaps.
