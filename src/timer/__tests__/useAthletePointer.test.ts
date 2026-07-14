import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAthletePointer } from '../useAthletePointer';

describe('useAthletePointer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts up on the current segment from the seeded timestamp', () => {
    const start = Date.now();
    const { result } = renderHook(() =>
      useAthletePointer({ athleteIndex: 0, athleteSegmentStartedAtMs: start }),
    );
    expect(result.current.athleteSegmentElapsed).toBe(0);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.athleteSegmentElapsed).toBe(5);
  });

  it('advance() moves the index and resets the per-segment count-up', () => {
    const start = Date.now();
    const { result } = renderHook(() =>
      useAthletePointer({ athleteIndex: 0, athleteSegmentStartedAtMs: start }),
    );
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    act(() => result.current.advance());

    expect(result.current.athleteIndex).toBe(1);
    expect(result.current.athleteSegmentElapsed).toBe(0);
  });

  it('derives elapsed from wall clock, not tick count (throttling-safe)', () => {
    const start = Date.now();
    const { result } = renderHook(() =>
      useAthletePointer({ athleteIndex: 0, athleteSegmentStartedAtMs: start }),
    );
    act(() => {
      vi.setSystemTime(Date.now() + 120_000);
      vi.advanceTimersByTime(200);
    });
    expect(result.current.athleteSegmentElapsed).toBeGreaterThanOrEqual(120);
  });

  it('pause freezes the count-up; resume continues from there', () => {
    const start = Date.now();
    const { result } = renderHook(() =>
      useAthletePointer({ athleteIndex: 0, athleteSegmentStartedAtMs: start }),
    );
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    act(() => result.current.pause());
    expect(result.current.athleteSegmentElapsed).toBe(10);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current.athleteSegmentElapsed).toBe(10);

    act(() => result.current.resume());
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.athleteSegmentElapsed).toBe(15);
  });

  it('resumes from a restored index and timestamp', () => {
    const start = Date.now() - 40_000;
    const { result } = renderHook(() =>
      useAthletePointer({ athleteIndex: 3, athleteSegmentStartedAtMs: start }),
    );
    expect(result.current.athleteIndex).toBe(3);
    expect(result.current.athleteSegmentElapsed).toBe(40);
  });
});
