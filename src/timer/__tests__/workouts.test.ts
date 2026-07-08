import { describe, expect, it } from 'vitest';

import workouts, { getWorkout } from '../workouts';

describe('workout registry', () => {
  it('holds all three workouts, retrievable by slug', () => {
    expect(workouts.map((w) => w.slug)).toEqual([
      'emom-30',
      'chipper-60-30',
      'pushups-300',
    ]);
    for (const w of workouts) {
      expect(getWorkout(w.slug)).toBe(w);
    }
  });

  it('keeps emom-30 as an EMOM workout', () => {
    const w = getWorkout('emom-30');
    expect(w?.mode).toBe('emom');
  });
});

describe('60/30 chipper', () => {
  const w = getWorkout('chipper-60-30');

  it('is an uncapped rep workout with twelve ordered targets', () => {
    if (w?.mode !== 'rep') throw new Error('expected rep workout');
    expect(w.targets).toHaveLength(12);
    expect(w.capMin).toBeUndefined();
    expect(w.onBreak).toBeUndefined();
    expect(w.targets.slice(0, 6).every((t) => t.count === 60)).toBe(true);
    expect(w.targets.slice(6).every((t) => t.count === 30)).toBe(true);
  });

  it('swaps diamond pushups for regular in round two', () => {
    if (w?.mode !== 'rep') throw new Error('expected rep workout');
    expect(w.targets[0].movement).toBe('Diamond pushups');
    expect(w.targets[6].movement).toBe('Pushups');
    // The other five movements repeat across rounds.
    expect(w.targets.slice(1, 6).map((t) => t.movement)).toEqual(
      w.targets.slice(7).map((t) => t.movement),
    );
  });
});

describe('300 pushups', () => {
  it('is a single 300-rep target with a 35-minute cap and break penalty', () => {
    const w = getWorkout('pushups-300');
    if (w?.mode !== 'rep') throw new Error('expected rep workout');
    expect(w.targets).toEqual([{ movement: 'Pushups', count: 300 }]);
    expect(w.capMin).toBe(35);
    expect(w.onBreak).toEqual([
      { movement: 'Goblet squats', count: 15 },
      { movement: 'Tuck jumps', count: 15 },
    ]);
  });
});
