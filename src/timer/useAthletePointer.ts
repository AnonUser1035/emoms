import { useCallback, useEffect, useRef, useState } from 'react';

export interface AthletePointerState {
  /** The segment the athlete is actually on — the only index that's ever
   *  displayed as "current." Advances only via `advance()`. */
  athleteIndex: number;
  /** Wall-clock timestamp of the athlete's last advance (or run start) —
   *  persisted so a reload can recompute `athleteSegmentElapsed` exactly. */
  athleteSegmentStartedAtMs: number;
  /** Whole seconds on the current segment, counting up from the last
   *  advance, wall-clock anchored (accurate across background throttling). */
  athleteSegmentElapsed: number;
  /** Move to the next segment now, stamping the moment of the tap. Whether
   *  this is the last segment (and the run should end instead) is the
   *  caller's decision, mirroring RepPlayer's own target-advance logic. */
  advance: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Tap-driven sibling of useSchedule: nothing here moves on its own. Only an
 * explicit `advance()` call changes `athleteIndex`; elapsed time on the
 * current segment is purely informational (a count-up, not a countdown).
 */
export function useAthletePointer(init: {
  athleteIndex: number;
  athleteSegmentStartedAtMs: number;
}): AthletePointerState {
  const [athleteIndex, setAthleteIndex] = useState(init.athleteIndex);
  const [segmentStartedAtMs, setSegmentStartedAtMs] = useState(
    init.athleteSegmentStartedAtMs,
  );
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (paused) return;
    let timer: number;
    const tick = () => {
      setNow(Date.now());
      timer = window.setTimeout(tick, 200);
    };
    timer = window.setTimeout(tick, 200);
    return () => window.clearTimeout(timer);
  }, [paused]);

  const pausedAt = useRef<number | null>(null);

  const pause = useCallback(() => {
    setPaused((prev) => {
      if (prev) return prev;
      pausedAt.current = Date.now();
      return true;
    });
  }, []);

  const resume = useCallback(() => {
    setPaused((prev) => {
      if (!prev) return prev;
      const pausedSince = pausedAt.current;
      if (pausedSince != null) {
        const pausedMs = Date.now() - pausedSince;
        setSegmentStartedAtMs((s) => s + pausedMs);
      }
      pausedAt.current = null;
      return false;
    });
  }, []);

  const advance = useCallback(() => {
    const startedAtMs = Date.now();
    setAthleteIndex((i) => i + 1);
    setSegmentStartedAtMs(startedAtMs);
    setNow(startedAtMs);
  }, []);

  const athleteSegmentElapsed = Math.floor(
    Math.max(0, (now - segmentStartedAtMs) / 1000),
  );

  return {
    athleteIndex,
    athleteSegmentStartedAtMs: segmentStartedAtMs,
    athleteSegmentElapsed,
    advance,
    pause,
    resume,
  };
}
