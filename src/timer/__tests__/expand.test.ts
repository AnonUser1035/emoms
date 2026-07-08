import { describe, expect, it } from 'vitest';

import type { EmomWorkout } from '../workouts';
import workouts, { getWorkout } from '../workouts';
import { expand } from '../expand';

const A = { movement: 'A', measure: { kind: 'reps', count: 1 } } as const;
const B = { movement: 'B', measure: { kind: 'reps', count: 1 } } as const;
const C = { movement: 'C', measure: { kind: 'reps', count: 1 } } as const;

function movements(workout: EmomWorkout): string[] {
  return expand(workout)
    .filter((s) => s.type === 'work')
    .map((s) => (s.type === 'work' ? s.station.movement : ''));
}

describe('expand()', () => {
  it('expands a clean 2-station / 10-min block into 5 whole rounds', () => {
    const w: EmomWorkout = {
      mode: 'emom',
      slug: 't',
      title: 't',
      summary: '',
      blocks: [{ durationMin: 10, intervalSec: 60, stations: [A, B] }],
    };
    expect(movements(w)).toEqual([
      'A',
      'B',
      'A',
      'B',
      'A',
      'B',
      'A',
      'B',
      'A',
      'B',
    ]);
    expect(expand(w).every((s) => s.durationSec === 60)).toBe(true);
  });

  it('runs a 3-station / 10-min block to the clock (Option A partial round)', () => {
    const w: EmomWorkout = {
      mode: 'emom',
      slug: 't',
      title: 't',
      summary: '',
      blocks: [{ durationMin: 10, intervalSec: 60, stations: [A, B, C] }],
    };
    // Three full rounds (A B C ×3 = 9 min) + one leftover minute continuing
    // with the next station in rotation (A). Ends at the 10th segment.
    expect(movements(w)).toEqual([
      'A',
      'B',
      'C',
      'A',
      'B',
      'C',
      'A',
      'B',
      'C',
      'A',
    ]);
  });

  it('emits trailing break then hold in authoring order', () => {
    const w: EmomWorkout = {
      mode: 'emom',
      slug: 't',
      title: 't',
      summary: '',
      blocks: [
        {
          durationMin: 10,
          intervalSec: 60,
          stations: [A, B],
          then: [
            { kind: 'break', seconds: 60 },
            {
              kind: 'station',
              station: {
                movement: 'Plank',
                measure: { kind: 'hold', seconds: 50 },
              },
            },
          ],
        },
      ],
    };
    const tail = expand(w).slice(-2);
    expect(tail[0]).toMatchObject({ type: 'break', durationSec: 60 });
    expect(tail[1]).toMatchObject({ type: 'hold', durationSec: 50 });
    expect(tail[1].type === 'hold' && tail[1].station.movement).toBe('Plank');
  });

  it('honours a per-station interval override', () => {
    const w: EmomWorkout = {
      mode: 'emom',
      slug: 't',
      title: 't',
      summary: '',
      blocks: [
        {
          durationMin: 5,
          intervalSec: 60,
          stations: [{ ...A, interval: 90 }, B],
        },
      ],
    };
    const durations = expand(w).map((s) => s.durationSec);
    // 90 (A) + 60 (B) + 90 (A) = 240 ≤ 300; next B would need 60 (300 ≤ 300, fits)
    expect(durations).toEqual([90, 60, 90, 60]);
  });

  it('does not emit a partial segment that overruns the block boundary', () => {
    const w: EmomWorkout = {
      mode: 'emom',
      slug: 't',
      title: 't',
      summary: '',
      blocks: [
        {
          durationMin: 2, // 120s
          intervalSec: 90,
          stations: [A, B],
        },
      ],
    };
    // 90 (A) fits; next 90 (B) would reach 180 > 120, so stop. Leftover 30s
    // is left empty rather than truncating a station turn.
    expect(expand(w).map((s) => s.durationSec)).toEqual([90]);
  });

  it('concatenates blocks into one continuous timeline', () => {
    const w: EmomWorkout = {
      mode: 'emom',
      slug: 't',
      title: 't',
      summary: '',
      blocks: [
        { label: 'B1', durationMin: 2, intervalSec: 60, stations: [A] },
        { label: 'B2', durationMin: 2, intervalSec: 60, stations: [B] },
      ],
    };
    const segs = expand(w);
    expect(segs.map((s) => s.blockIndex)).toEqual([0, 0, 1, 1]);
    expect(movements(w)).toEqual(['A', 'A', 'B', 'B']);
  });

  it('is deterministic', () => {
    const w = getWorkout('emom-30') as EmomWorkout;
    expect(expand(w)).toEqual(expand(w));
  });
});

describe('seeded EMOM 30', () => {
  const emom30 = getWorkout('emom-30') as EmomWorkout;

  it('is present in the library', () => {
    expect(workouts.some((w) => w.slug === 'emom-30')).toBe(true);
    expect(emom30.blocks).toHaveLength(3);
  });

  it('expands to the expected shape', () => {
    const segs = expand(emom30);
    // Block 1: 2 stations ×5 = 10 work + break + plank hold = 12
    // Block 2: 3 stations run-to-clock = 10 work + break = 11
    // Block 3: 3 stations run-to-clock = 10 work = 10
    expect(segs.filter((s) => s.type === 'work')).toHaveLength(30);
    expect(segs.filter((s) => s.type === 'break')).toHaveLength(2);
    expect(segs.filter((s) => s.type === 'hold')).toHaveLength(1);
  });

  it('starts block 2 rotation with the bent-over row and leaves a leftover row', () => {
    const b2 = expand(emom30)
      .filter((s) => s.type === 'work' && s.blockIndex === 1)
      .map((s) => (s.type === 'work' ? s.station.movement : ''));
    expect(b2[0]).toBe('Single-arm bent-over row');
    expect(b2[b2.length - 1]).toBe('Single-arm bent-over row');
    expect(b2).toHaveLength(10);
  });
});
