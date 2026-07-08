import { describe, expect, it } from 'vitest';

import { dailyPick, dailyPickIndex } from '../dailyPick';
import workouts from '../workouts';

/** Consecutive UTC-noon dates — unambiguous in America/New_York. */
function day(i: number): Date {
  return new Date(Date.UTC(2026, 0, 1, 17, 0, 0) + i * 86_400_000);
}

describe('dailyPickIndex', () => {
  it('is deterministic for a given date and pool size', () => {
    for (const n of [2, 3, 4, 7]) {
      expect(dailyPickIndex(n, day(123))).toBe(dailyPickIndex(n, day(123)));
    }
  });

  it('never repeats on consecutive days', () => {
    for (const n of [2, 3, 4, 7]) {
      let prev = dailyPickIndex(n, day(0));
      for (let i = 1; i < 500; i++) {
        const pick = dailyPickIndex(n, day(i));
        expect(pick, `n=${n} day=${i}`).not.toBe(prev);
        prev = pick;
      }
    }
  });

  it('covers the whole pool over time', () => {
    for (const n of [3, 4, 7]) {
      const seen = new Set<number>();
      for (let i = 0; i < 10 * n; i++) seen.add(dailyPickIndex(n, day(i)));
      expect(seen.size).toBe(n);
    }
  });

  it('is fair: every index appears equally often over a long window', () => {
    // Exactly once per internal n-day cycle → over 40n arbitrary days each
    // index appears 40 ± 1 times (window edges straddle two cycles).
    const n = 4;
    const counts = new Map<number, number>();
    for (let i = 0; i < 40 * n; i++) {
      const pick = dailyPickIndex(n, day(i));
      counts.set(pick, (counts.get(pick) ?? 0) + 1);
    }
    for (let idx = 0; idx < n; idx++) {
      expect(counts.get(idx) ?? 0).toBeGreaterThanOrEqual(39);
      expect(counts.get(idx) ?? 0).toBeLessThanOrEqual(41);
    }
  });

  it('buckets days at New York midnight, not UTC', () => {
    // 2026-07-08T03:59Z is still July 7 in New York (EDT, UTC-4);
    // 04:01Z is July 8. Consecutive NY days are guaranteed to differ.
    const lateJuly7 = new Date(Date.UTC(2026, 6, 8, 3, 59, 0));
    const midJuly7 = new Date(Date.UTC(2026, 6, 7, 16, 0, 0));
    const earlyJuly8 = new Date(Date.UTC(2026, 6, 8, 4, 1, 0));

    expect(dailyPickIndex(4, lateJuly7)).toBe(dailyPickIndex(4, midJuly7));
    expect(dailyPickIndex(4, earlyJuly8)).not.toBe(
      dailyPickIndex(4, lateJuly7),
    );
  });

  it('handles tiny pools', () => {
    expect(dailyPickIndex(1, day(5))).toBe(0);
    // n=2 alternates strictly.
    const a = dailyPickIndex(2, day(10));
    expect(dailyPickIndex(2, day(11))).toBe(1 - a);
    expect(dailyPickIndex(2, day(12))).toBe(a);
  });
});

describe('dailyPick', () => {
  it('returns a registered workout for any date', () => {
    for (let i = 0; i < 30; i++) {
      expect(workouts).toContain(dailyPick(workouts, day(i)));
    }
  });
});
