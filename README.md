# emoms — David Rosen's EMOMs

An interval timer for EMOM ("every minute on the minute") workouts. A running
clock rotates through movements each minute, with audio cues, per-minute
pacing targets for the ergs, and a screen wake lock so it stays readable
across the gym — plus a shared community heatmap of who trained today.

Live at [emoms.ryanbohluli.com](https://emoms.ryanbohluli.com). Spun out of
[ryanbohluli.com](https://ryanbohluli.com) into its own repo, subdomain, and
visual identity — see `openspec/changes/spinout-emoms-app/` in that repo for
the proposal, design, specs, and task history behind the split.

## Stack

Vite + React 19 + TypeScript + Tailwind v4 · vitest · GitHub Actions → GitHub
Pages, mirroring the deploy pattern already proven by
[ankibot](https://ankibot.ryanbohluli.com).

## Development

```sh
npm install
npm run dev      # http://localhost:3001
npm test
npm run build
```

## Community heatmap

The past-month grid and the `POST /checkin` on workout completion are backed
by a small Cloudflare Worker + D1 database — see `worker/README.md`. Both are
optional: with `VITE_CHECKIN_WORKER_URL` unset, the timer works unchanged and
the heatmap simply doesn't render.

## Structure

```
src/timer/     the ported EMOM timer (workout model, segment compiler,
               interval clock, audio cues, wake lock, player UI)
src/heatmap/   the shared community heatmap UI + Worker client
worker/        the Cloudflare Worker + D1 backend for the heatmap
```
