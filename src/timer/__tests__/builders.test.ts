import { describe, expect, it } from 'vitest';

import { ladder, range, rounds } from '../workouts/builders';

describe('range()', () => {
  it('counts down inclusively', () => {
    expect(range(12, 1)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });
  it('counts up inclusively', () => {
    expect(range(5, 8)).toEqual([5, 6, 7, 8]);
  });
  it('handles a single-element range', () => {
    expect(range(3, 3)).toEqual([3]);
  });
});

describe('rounds()', () => {
  it('repeats a round in order', () => {
    const r = rounds(3, [
      { movement: 'A', count: 5 },
      { movement: 'B', count: 10 },
    ]);
    expect(r).toHaveLength(6);
    expect(r.map((t) => t.movement)).toEqual(['A', 'B', 'A', 'B', 'A', 'B']);
  });
});

describe('ladder()', () => {
  it('emits one target per movement at each count, in scheme order', () => {
    const t = ladder(range(12, 1), [
      { movement: 'Snatch', notes: 'per side' },
      { movement: 'Swing' },
    ]);
    // 12 rungs × 2 movements
    expect(t).toHaveLength(24);
    expect(t.slice(0, 4)).toEqual([
      { movement: 'Snatch', count: 12, notes: 'per side' },
      { movement: 'Swing', count: 12 },
      { movement: 'Snatch', count: 11, notes: 'per side' },
      { movement: 'Swing', count: 11 },
    ]);
    expect(t.at(-1)).toEqual({ movement: 'Swing', count: 1 });
  });

  it('carries load cues through', () => {
    const t = ladder([5], [{ movement: 'Press', load: '40 lb' }]);
    expect(t).toEqual([{ movement: 'Press', count: 5, load: '40 lb' }]);
  });

  it('builds an up-and-down ladder from a composed scheme', () => {
    const scheme = [...range(5, 8), ...range(7, 5)]; // 5,6,7,8,7,6,5
    const t = ladder(scheme, [{ movement: 'Burpee' }]);
    expect(t.map((x) => x.count)).toEqual([5, 6, 7, 8, 7, 6, 5]);
  });
});
