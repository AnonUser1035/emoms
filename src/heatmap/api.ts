// Thin client for the checkin Worker. Both calls are best-effort: a failed
// checkin or heatmap fetch degrades silently rather than blocking the timer,
// since the shared counter is a bonus layer, not the app's core function.

export interface HeatmapDay {
  date: string; // YYYY-MM-DD, fixed-timezone (see worker/src/index.ts)
  count: number;
}

function workerUrl(): string | null {
  const url = import.meta.env.VITE_CHECKIN_WORKER_URL as string | undefined;
  return url && url.length > 0 ? url : null;
}

/** Record a completed workout. Fire-and-forget from the caller's perspective. */
export async function postCheckin(): Promise<void> {
  const base = workerUrl();
  if (!base) return;
  try {
    await fetch(`${base}/checkin`, { method: 'POST' });
  } catch {
    // Offline or the Worker is unreachable — the local run still counted for
    // the person doing it; the shared counter just misses this one.
  }
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
