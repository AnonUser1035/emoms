import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Segment } from '../workouts';
import { useSchedule } from '../useSchedule';

const segments: Segment[] = [
  {
    type: 'work',
    durationSec: 60,
    station: { movement: 'A', measure: { kind: 'reps', count: 10 } },
    blockIndex: 0,
    round: 1,
  },
  {
    type: 'work',
    durationSec: 60,
    station: { movement: 'B', measure: { kind: 'reps', count: 10 } },
    blockIndex: 0,
    round: 1,
  },
  { type: 'break', durationSec: 30, blockIndex: 0 },
];

describe('useSchedule', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts idle and reports cumulative segment starts', () => {
    const { result } = renderHook(() => useSchedule(segments));
    expect(result.current.status).toBe('idle');
    expect(result.current.startOf(0)).toBe(0);
    expect(result.current.startOf(1)).toBe(60);
    expect(result.current.startOf(2)).toBe(120);
    expect(result.current.totalDuration).toBe(150);
  });

  it('advances the schedule index on wall-clock elapsed alone', () => {
    const { result } = renderHook(() => useSchedule(segments));
    act(() => result.current.start());
    expect(result.current.scheduleIndex).toBe(0);

    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(result.current.scheduleIndex).toBe(1);
  });

  it('keeps counting past the nominal total instead of freezing', () => {
    const { result } = renderHook(() => useSchedule(segments));
    act(() => result.current.start());

    act(() => {
      vi.advanceTimersByTime(200_000); // 50s past the 150s total
    });
    expect(result.current.scheduleElapsed).toBeGreaterThanOrEqual(200);
    expect(result.current.scheduleIndex).toBe(2); // pinned to the last segment
  });

  it('pause freezes elapsed; resume continues from there', () => {
    const { result } = renderHook(() => useSchedule(segments));
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    act(() => result.current.pause());
    const pausedElapsed = result.current.scheduleElapsed;

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current.scheduleElapsed).toBe(pausedElapsed);

    act(() => result.current.resume());
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.scheduleElapsed).toBe(pausedElapsed + 5);
  });

  it('can start partway in, for a restored run', () => {
    const { result } = renderHook(() => useSchedule(segments));
    act(() => result.current.start(90));
    expect(result.current.scheduleIndex).toBe(1);
    expect(result.current.scheduleElapsed).toBe(90);
  });
});
