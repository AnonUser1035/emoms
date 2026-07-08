// Thin client for the runs Worker. Every call is best-effort: a failed run
// event, heatmap, or results fetch degrades silently rather than blocking the
// timer — the Worker is the system of record for shared state, but the local
// workout never depends on it.

export interface HeatmapDay {
  date: string; // YYYY-MM-DD, fixed-timezone (see worker/src/index.ts)
  /** Runs finished that day (legacy check-ins included). */
  completed: number;
  /** Runs started that day and never completed — the "half" state. */
  started: number;
}

export interface WhiteboardIdentity {
  name: string | null;
  deviceId: string | null;
}

/** What the player measured, in the Worker's payload shape. */
export interface RunResultPayload {
  durationSec: number;
  totalReps: number | null;
  breaks: number | null;
  completedAll: boolean;
}

export interface WorkoutResult {
  name: string;
  day: string;
  durationSec: number | null;
  totalReps: number | null;
  breaks: number | null;
  completedAll: boolean;
  notes: string | null;
}

function workerUrl(): string | null {
  const url = import.meta.env.VITE_CHECKIN_WORKER_URL as string | undefined;
  return url && url.length > 0 ? url : null;
}

async function post(path: string, body: unknown): Promise<Response | null> {
  const base = workerUrl();
  if (!base) return null;
  try {
    return await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Offline or the Worker is unreachable — the local run still counts for
    // the person doing it; shared state just misses the event.
    return null;
  }
}

/** Record a workout start. Resolves to the server run id, or null. */
export async function startRun(
  slug: string,
  identity: WhiteboardIdentity,
): Promise<string | null> {
  const res = await post('/runs', {
    slug,
    name: identity.name,
    deviceId: identity.deviceId,
  });
  if (!res || !res.ok) return null;
  try {
    const data = (await res.json()) as { runId?: string };
    return typeof data.runId === 'string' ? data.runId : null;
  } catch {
    return null;
  }
}

/**
 * Record a workout completion. With a run id this completes the started run;
 * without one (the start event never made it) the Worker creates a run
 * directly in the completed state.
 */
export async function completeRun(
  runId: string | null,
  slug: string,
  result: RunResultPayload,
  identity: WhiteboardIdentity,
  notes?: string,
): Promise<void> {
  const path = runId
    ? `/runs/${encodeURIComponent(runId)}/complete`
    : '/runs/complete';
  await post(path, {
    slug,
    name: identity.name,
    deviceId: identity.deviceId,
    notes: notes || undefined,
    ...result,
  });
}

/** Fetch the past-month shared heatmap. Returns null if unavailable. */
export async function fetchHeatmap(): Promise<HeatmapDay[] | null> {
  const base = workerUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/heatmap`);
    if (!res.ok) return null;
    const data = (await res.json()) as { days: HeatmapDay[] };
    return data.days;
  } catch {
    return null;
  }
}

/** Fetch a workout's whiteboard, newest first. Returns null if unavailable. */
export async function fetchResults(
  slug: string,
): Promise<WorkoutResult[] | null> {
  const base = workerUrl();
  if (!base) return null;
  try {
    const res = await fetch(
      `${base}/results?workout=${encodeURIComponent(slug)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { results: WorkoutResult[] };
    return data.results;
  } catch {
    return null;
  }
}
