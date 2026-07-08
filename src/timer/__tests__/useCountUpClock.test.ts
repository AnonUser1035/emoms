import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCountUpClock } from '../useCountUpClock';

describe('useCountUpClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts up from zero', () => {
    const start = Date.now();
    const { result } = renderHook(() => useCountUpClock(start));
    expect(result.current.elapsedSec).toBe(0);
    expect(result.current.remainingToCapSec).toBeNull();

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.elapsedSec).toBe(5);
    expect(result.current.capReached).toBe(false);
  });

  it('resumes from a start timestamp in the past', () => {
    const start = Date.now() - 90_000;
    const { result } = renderHook(() => useCountUpClock(start));
    expect(result.current.elapsedSec).toBe(90);
  });

  it('derives elapsed from wall clock, not tick count (throttling-safe)', () => {
    const start = Date.now();
    const { result } = renderHook(() => useCountUpClock(start));

    // Jump the system clock two minutes with only a single 200ms tick fired,
    // as a backgrounded tab would experience.
    act(() => {
      vi.setSystemTime(Date.now() + 120_000);
      vi.advanceTimersByTime(200);
    });
    expect(result.current.elapsedSec).toBeGreaterThanOrEqual(120);
  });

  it('reaches the cap exactly once and pins elapsed there', () => {
    const start = Date.now();
    const { result } = renderHook(() => useCountUpClock(start, 1));

    act(() => {
      vi.advanceTimersByTime(59_000);
    });
    expect(result.current.capReached).toBe(false);
    expect(result.current.remainingToCapSec).toBe(1);

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(result.current.capReached).toBe(true);
    expect(result.current.elapsedSec).toBe(60);
    expect(result.current.remainingToCapSec).toBe(0);

    // Ticking has stopped; state stays pinned.
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current.elapsedSec).toBe(60);
    expect(result.current.capReached).toBe(true);
  });

  it('is capped immediately when restored past the cap', () => {
    const start = Date.now() - 40 * 60_000;
    const { result } = renderHook(() => useCountUpClock(start, 35));
    expect(result.current.capReached).toBe(true);
    expect(result.current.elapsedSec).toBe(35 * 60);
  });
});
