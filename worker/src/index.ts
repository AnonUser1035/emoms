// Stateless Cloudflare Worker: a shared, identity-free daily check-in
// counter and a past-month heatmap read. No accounts, no per-visitor state —
// see openspec/changes/spinout-emoms-app/specs/emom-community-heatmap for
// the requirements this implements.

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  CHECKIN_TIMEZONE: string;
}

const HEATMAP_WINDOW_DAYS = 30;

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

async function handleCheckin(env: Env, cors: HeadersInit): Promise<Response> {
  const day = todayInTimezone(env.CHECKIN_TIMEZONE);
  // Atomic upsert — correct under concurrent check-ins, no read-modify-write
  // race (see design.md's D1-over-KV/Durable-Object decision).
  const row = await env.DB.prepare(
    `INSERT INTO daily_checkins (day, count) VALUES (?, 1)
     ON CONFLICT(day) DO UPDATE SET count = count + 1
     RETURNING count`,
  )
    .bind(day)
    .first<{ count: number }>();

  return json({ day, count: row?.count ?? 1 }, { status: 200 }, cors);
}

async function handleHeatmap(env: Env, cors: HeadersInit): Promise<Response> {
  const today = todayInTimezone(env.CHECKIN_TIMEZONE);
  const days = lastNDays(HEATMAP_WINDOW_DAYS, today);

  const { results } = await env.DB.prepare(
    `SELECT day, count FROM daily_checkins WHERE day >= ? AND day <= ? ORDER BY day ASC`,
  )
    .bind(days[0], days[days.length - 1])
    .all<{ day: string; count: number }>();

  const counts = new Map(results.map((r) => [r.day, r.count]));
  const series = days.map((date) => ({ date, count: counts.get(date) ?? 0 }));

  return json({ days: series }, { status: 200 }, cors);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const { pathname } = new URL(request.url);

    try {
      if (pathname === '/checkin' && request.method === 'POST') {
        return await handleCheckin(env, cors);
      }
      if (pathname === '/heatmap' && request.method === 'GET') {
        return await handleHeatmap(env, cors);
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
