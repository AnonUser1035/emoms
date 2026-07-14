import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Segment } from './workouts';

export type ScheduleStatus = 'idle' | 'running' | 'paused';

export interface ScheduleState {
  status: ScheduleStatus;
  /** Index of the segment the schedule would be on right now — a ghost, not
   *  a gate. Pins to the last segment once elapsed exceeds the total. */
  scheduleIndex: number;
  /** Seconds remaining in the schedule's current segment (ceil'd); 0 once
   *  the schedule has run past its total. */
  scheduleRemaining: number;
  /** Total seconds elapsed since the schedule started — NOT clamped to the
   *  workout's nominal total, so it keeps growing to reflect real overtime
   *  (the pace delta depends on this never freezing). */
  scheduleElapsed: number;
  /** The workout's nominal (authored) total duration. */
  totalDuration: number;
  /** Cumulative nominal seconds at which segment `index` begins. */
  startOf: (index: number) => number;
  start: (atElapsedSec?: number) => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Read-only pace reference for the tap-paced EMOM/interval player: derives
 * "where the buzzer would be" from wall-clock elapsed vs. each segment's
 * nominal duration, timestamp-anchored so it stays accurate through
 * background tab throttling. It never gates anything — see useAthletePointer
 * for what actually advances the workout.
 */
export function useSchedule(segments: Segment[]): ScheduleState {
  const { starts, ends, total } = useMemo(() => {
    const s: number[] = [];
    const e: number[] = [];
    let acc = 0;
    for (const seg of segments) {
      s.push(acc);
      acc += seg.durationSec;
      e.push(acc);
    }
    return { starts: s, ends: e, total: acc };
  }, [segments]);

  const [status, setStatus] = useState<ScheduleStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const anchor = useRef<{ ts: number; base: number } | null>(null);

  useEffect(() => {
    if (status !== 'running') return;
    let timer: number;
    const tick = () => {
      const a = anchor.current;
      if (!a) return;
      setElapsed(a.base + (Date.now() - a.ts) / 1000);
      timer = window.setTimeout(tick, 200);
    };
    timer = window.setTimeout(tick, 200);
    return () => window.clearTimeout(timer);
  }, [status]);

  const start = useCallback(
    (atElapsedSec = 0) => {
      if (total === 0) return;
      const base = Math.max(0, atElapsedSec);
      anchor.current = { ts: Date.now(), base };
      setElapsed(base);
      setStatus('running');
    },
    [total],
  );

  const pause = useCallback(() => {
    setStatus((prev) => {
      if (prev !== 'running') return prev;
      const a = anchor.current;
      if (a) setElapsed(a.base + (Date.now() - a.ts) / 1000);
      return 'paused';
    });
  }, []);

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

  // Which segment "elapsed" falls into, pinned to the last one past the
  // total — the schedule has nothing further to say once it's run out.
  const clampedForIndex = Math.min(elapsed, total);
  let scheduleIndex = ends.findIndex((end) => clampedForIndex < end);
  if (scheduleIndex === -1) scheduleIndex = Math.max(0, segments.length - 1);
  const scheduleRemaining = Math.max(
    0,
    Math.ceil((ends[scheduleIndex] ?? total) - clampedForIndex),
  );

  const startOf = useCallback(
    (index: number) => {
      if (index <= 0) return 0;
      if (index >= starts.length) return total;
      return starts[index];
    },
    [starts, total],
  );

  return {
    status,
    scheduleIndex,
    scheduleRemaining,
    scheduleElapsed: Math.floor(elapsed),
    totalDuration: total,
    startOf,
    start,
    pause,
    resume,
  };
}
