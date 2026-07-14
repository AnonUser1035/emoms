import { useEffect, useState } from 'react';

export interface CountUpClock {
  /** Whole seconds elapsed since the start timestamp (pinned to the cap). */
  elapsedSec: number;
  /** Whole seconds until the cap (ceil'd for display), or null when uncapped. */
  remainingToCapSec: number | null;
  /** True from the instant the cap is reached; never reverts. */
  capReached: boolean;
}

/**
 * Count-up sibling of useSchedule, for athlete-paced workouts: elapsed
 * time is derived from a wall-clock start timestamp rather than accumulated
 * tick deltas, so it stays exact through background throttling — and through
 * page reloads, since the caller can pass a start timestamp from a restored
 * snapshot. Ticking stops once the cap is reached; elapsed pins to the cap.
 */
export function useCountUpClock(
  startedAtMs: number,
  capMin?: number,
): CountUpClock {
  const capSec = capMin != null ? capMin * 60 : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let timer: number;
    const tick = () => {
      const ts = Date.now();
      setNow(ts);
      const elapsed = (ts - startedAtMs) / 1000;
      if (capSec != null && elapsed >= capSec) return; // capped — stop ticking
      timer = window.setTimeout(tick, 200);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [startedAtMs, capSec]);

  const rawElapsed = Math.max(0, (now - startedAtMs) / 1000);
  const capReached = capSec != null && rawElapsed >= capSec;

  return {
    elapsedSec: Math.floor(capReached ? capSec : rawElapsed),
    remainingToCapSec:
      capSec != null ? Math.max(0, Math.ceil(capSec - rawElapsed)) : null,
    capReached,
  };
}
