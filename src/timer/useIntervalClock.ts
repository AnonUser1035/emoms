import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Segment } from './workouts';

export type ClockStatus = 'idle' | 'running' | 'paused' | 'done';

export interface ClockState {
  status: ClockStatus;
  /** Index of the current segment (0-based; last segment when done). */
  segmentIndex: number;
  /** Seconds remaining in the current segment (ceil'd for display). */
  segmentRemaining: number;
  /** Whole seconds elapsed within the current segment. */
  segmentElapsed: number;
  /** Total seconds elapsed across the whole workout. */
  totalElapsed: number;
  /** Total workout duration in seconds. */
  totalDuration: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

/**
 * Drives playback of a flat Segment[] on a timestamp-anchored clock: remaining
 * time is derived from wall-clock elapsed since the last anchor rather than by
 * accumulating tick deltas, so it stays accurate even when the tab is
 * throttled in the background.
 */
export function useIntervalClock(segments: Segment[]): ClockState {
  // Cumulative end time (seconds) of each segment.
  const { ends, total } = useMemo(() => {
    const e: number[] = [];
    let acc = 0;
    for (const s of segments) {
      acc += s.durationSec;
      e.push(acc);
    }
    return { ends: e, total: acc };
  }, [segments]);

  const [status, setStatus] = useState<ClockStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  // Anchor: wall-clock timestamp + the elapsed value at that instant.
  const anchor = useRef<{ ts: number; base: number } | null>(null);

  useEffect(() => {
    if (status !== 'running') return;
    let timer: number;
    const tick = () => {
      const a = anchor.current;
      if (!a) return;
      const next = a.base + (Date.now() - a.ts) / 1000;
      if (next >= total) {
        setElapsed(total);
        setStatus('done');
        return;
      }
      setElapsed(next);
      timer = window.setTimeout(tick, 200);
    };
    timer = window.setTimeout(tick, 200);
    return () => window.clearTimeout(timer);
  }, [status, total]);

  const start = useCallback(() => {
    if (total === 0) return;
    anchor.current = { ts: Date.now(), base: 0 };
    setElapsed(0);
    setStatus('running');
  }, [total]);

  const pause = useCallback(() => {
    setStatus((prev) => {
      if (prev !== 'running') return prev;
      const a = anchor.current;
      if (a) setElapsed(Math.min(total, a.base + (Date.now() - a.ts) / 1000));
      return 'paused';
    });
  }, [total]);

  const resume = useCallback(() => {
    setStatus((prev) => {
      if (prev !== 'paused') return prev;
      setElapsed((e) => {
        anchor.current = { ts: Date.now(), base: e };
        return e;
      });
      return 'running';
    });
  }, []);

  const reset = useCallback(() => {
    anchor.current = null;
    setElapsed(0);
    setStatus('idle');
  }, []);

  // Derive current segment from elapsed. `done` pins to the last segment.
  const clamped = Math.min(elapsed, total);
  let segmentIndex = ends.findIndex((end) => clamped < end);
  if (segmentIndex === -1) segmentIndex = Math.max(0, segments.length - 1);
  const segStart = segmentIndex > 0 ? ends[segmentIndex - 1] : 0;
  const segDuration = segments[segmentIndex]?.durationSec ?? 0;
  const segElapsedRaw = clamped - segStart;
  const segmentRemaining =
    status === 'done' ? 0 : Math.max(0, Math.ceil(segDuration - segElapsedRaw));

  return {
    status,
    segmentIndex,
    segmentRemaining,
    segmentElapsed: Math.max(0, Math.floor(segElapsedRaw)),
    totalElapsed: Math.floor(clamped),
    totalDuration: total,
    start,
    pause,
    resume,
    reset,
  };
}
