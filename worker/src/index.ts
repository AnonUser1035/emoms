// Cloudflare Worker: system of record for workout runs.
//
// A run is created when a workout starts and completed when it finishes;
// the heatmap (completed vs still-started "half" contributions per day) and
// the per-workout results whiteboard are both queries over the runs table.
// Identity is gym-whiteboard trust — a display name and device id stored
// verbatim, never verified. Days are always computed server-side in a fixed
// timezone, never client-supplied. Legacy daily_checkins counts merge into
// heatmap reads as completed. See openspec/changes/add-run-lifecycle-whiteboard.

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  CHECKIN_TIMEZONE: string;
}

const HEATMAP_WINDOW_DAYS = 30;
const RESULTS_LIMIT = 50;

// Payload hygiene caps — not a security boundary, just junk resistance.
const MAX_SLUG = 64;
const MAX_NAME = 40;
const MAX_DEVICE_ID = 64;
const MAX_NOTES = 200;
const MAX_RUN_ID = 64;
const MAX_NUMBER = 10_000_000;

/** "YYYY-MM-DD" for "now" in the fixed timezone — never client-supplied. */
function todayInTimezone(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

/**
 * The most recent `n` calendar days (oldest first) ending on `anchor`
 * ("YYYY-MM-DD"). Arithmetic anchors on UTC noon so US-timezone DST
 * transitions never shift the resulting date labels by a day.
 */
function lastNDays(n: number, anchor: string): string[] {
  const [y, m, d] = anchor.split('-').map(Number);
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0) - i * 86_400_000);
    days.push(dt.toISOString().slice(0, 10));
  }
  return days;
}

function corsHeaders(origin: string | null, env: Env): HeadersInit {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(body: unknown, init: ResponseInit, cors: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...cors, ...init.headers },
  });
}

// ── Payload readers ────────────────────────────────────────────────────────

function readString(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim().slice(0, max);
  return s.length > 0 ? s : null;
}

function readCount(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return Math.min(Math.max(0, Math.round(v)), MAX_NUMBER);
}

interface RunEventBody {
  slug: string;
  name: string | null;
  deviceId: string | null;
  durationSec: number | null;
  totalReps: number | null;
  breaks: number | null;
  completedAll: boolean;
  notes: string | null;
}

/** Parse and sanitize a run event body; null when structurally unusable. */
async function readRunBody(request: Request): Promise<RunEventBody | null> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const b = raw as Record<string, unknown>;
  const slug = readString(b.slug, MAX_SLUG);
  if (!slug) return null;
  return {
    slug,
    name: readString(b.name, MAX_NAME),
    deviceId: readString(b.deviceId, MAX_DEVICE_ID),
    durationSec: readCount(b.durationSec),
    totalReps: readCount(b.totalReps),
    breaks: readCount(b.breaks),
    completedAll: b.completedAll === true,
    notes: readString(b.notes, MAX_NOTES),
  };
}

// ── Handlers ───────────────────────────────────────────────────────────────

/** POST /runs — create a run in the started state; returns its id. */
async function handleStartRun(
  request: Request,
  env: Env,
  cors: HeadersInit,
): Promise<Response> {
  const body = await readRunBody(request);
  if (!body) return json({ error: 'bad_request' }, { status: 400 }, cors);

  const id = crypto.randomUUID();
  const day = todayInTimezone(env.CHECKIN_TIMEZONE);
  await env.DB.prepare(
    `INSERT INTO runs (id, workout_slug, day, started_at, athlete_name, device_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, body.slug, day, Date.now(), body.name, body.deviceId)
    .run();

  return json({ runId: id, day }, { status: 200 }, cors);
}

/**
 * POST /runs/:id/complete (idempotent) and POST /runs/complete (no prior
 * start — the recovery path when the start event never reached the server).
 * One upsert covers all three cases: unknown id → created directly in the
 * completed state; started → completed; already completed → no-op (the
 * WHERE guard keeps the first summary).
 */
async function handleCompleteRun(
  request: Request,
  env: Env,
  cors: HeadersInit,
  runId: string | null,
): Promise<Response> {
  const body = await readRunBody(request);
  if (!body) return json({ error: 'bad_request' }, { status: 400 }, cors);
  if (runId !== null && (runId.length === 0 || runId.length > MAX_RUN_ID)) {
    return json({ error: 'bad_request' }, { status: 400 }, cors);
  }

  const id = runId ?? crypto.randomUUID();
  const day = todayInTimezone(env.CHECKIN_TIMEZONE);
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO runs (id, workout_slug, day, started_at, completed_at,
                       athlete_name, device_id, duration_sec, total_reps,
                       breaks, completed_all, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       completed_at = excluded.completed_at,
       athlete_name = excluded.athlete_name,
       device_id = excluded.device_id,
       duration_sec = excluded.duration_sec,
       total_reps = excluded.total_reps,
       breaks = excluded.breaks,
       completed_all = excluded.completed_all,
       notes = excluded.notes
     WHERE runs.completed_at IS NULL`,
  )
    .bind(
      id,
      body.slug,
      day,
      now,
      now,
      body.name,
      body.deviceId,
      body.durationSec,
      body.totalReps,
      body.breaks,
      body.completedAll ? 1 : 0,
      body.notes,
    )
    .run();

  const stored = await env.DB.prepare(`SELECT id, day FROM runs WHERE id = ?`)
    .bind(id)
    .first<{ id: string; day: string }>();

  return json(
    { runId: stored?.id ?? id, day: stored?.day ?? day },
    { status: 200 },
    cors,
  );
}

/** GET /heatmap — per-day completed/started counts, legacy merged in. */
async function handleHeatmap(env: Env, cors: HeadersInit): Promise<Response> {
  const today = todayInTimezone(env.CHECKIN_TIMEZONE);
  const days = lastNDays(HEATMAP_WINDOW_DAYS, today);
  const [first, last] = [days[0], days[days.length - 1]];

  const [runRows, legacyRows] = await Promise.all([
    env.DB.prepare(
      `SELECT day,
              SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) AS completed,
              SUM(CASE WHEN completed_at IS NULL THEN 1 ELSE 0 END) AS started
       FROM runs WHERE day >= ? AND day <= ? GROUP BY day`,
    )
      .bind(first, last)
      .all<{ day: string; completed: number; started: number }>(),
    env.DB.prepare(
      `SELECT day, count FROM daily_checkins WHERE day >= ? AND day <= ?`,
    )
      .bind(first, last)
      .all<{ day: string; count: number }>(),
  ]);

  const runs = new Map(runRows.results.map((r) => [r.day, r]));
  const legacy = new Map(legacyRows.results.map((r) => [r.day, r.count]));
  const series = days.map((date) => ({
    date,
    completed: (runs.get(date)?.completed ?? 0) + (legacy.get(date) ?? 0),
    started: runs.get(date)?.started ?? 0,
  }));

  return json({ days: series }, { status: 200 }, cors);
}

/** GET /results?workout=<slug> — the workout's whiteboard, newest first. */
async function handleResults(
  url: URL,
  env: Env,
  cors: HeadersInit,
): Promise<Response> {
  const slug = readString(url.searchParams.get('workout'), MAX_SLUG);
  if (!slug) return json({ error: 'bad_request' }, { status: 400 }, cors);

  const { results } = await env.DB.prepare(
    `SELECT athlete_name, day, duration_sec, total_reps, breaks,
            completed_all, notes
     FROM runs
     WHERE workout_slug = ? AND completed_at IS NOT NULL
       AND athlete_name IS NOT NULL AND athlete_name != ''
     ORDER BY completed_at DESC LIMIT ?`,
  )
    .bind(slug, RESULTS_LIMIT)
    .all<{
      athlete_name: string;
      day: string;
      duration_sec: number | null;
      total_reps: number | null;
      breaks: number | null;
      completed_all: number | null;
      notes: string | null;
    }>();

  return json(
    {
      results: results.map((r) => ({
        name: r.athlete_name,
        day: r.day,
        durationSec: r.duration_sec,
        totalReps: r.total_reps,
        breaks: r.breaks,
        completedAll: r.completed_all === 1,
        notes: r.notes,
      })),
    },
    { status: 200 },
    cors,
  );
}

const COMPLETE_PATH = /^\/runs\/([^/]+)\/complete$/;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const { pathname } = url;

    try {
      if (request.method === 'POST') {
        if (pathname === '/runs') return await handleStartRun(request, env, cors);
        if (pathname === '/runs/complete') {
          return await handleCompleteRun(request, env, cors, null);
        }
        const complete = COMPLETE_PATH.exec(pathname);
        if (complete) {
          return await handleCompleteRun(
            request,
            env,
            cors,
            decodeURIComponent(complete[1]),
          );
        }
      }
      if (request.method === 'GET') {
        if (pathname === '/heatmap') return await handleHeatmap(env, cors);
        if (pathname === '/results') return await handleResults(url, env, cors);
      }
    } catch (err) {
      return json(
        { error: 'internal_error', message: String(err) },
        { status: 500 },
        cors,
      );
    }

    return json({ error: 'not_found' }, { status: 404 }, cors);
  },
};
