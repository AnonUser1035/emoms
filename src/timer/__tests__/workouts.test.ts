import { describe, expect, it } from 'vitest';

import type { EmomWorkout, RepWorkout } from '../workouts';
import workouts, { getWorkout } from '../workouts';
import { expand } from '../expand';
import { measureLabel } from '../format';

describe('workout registry', () => {
  it('includes the seed workouts, each retrievable by slug', () => {
    const slugs = new Set(workouts.map((w) => w.slug));
    for (const slug of [
      'emom-30',
      'chipper-60-30',
      'pushups-300',
      'cycles-6x5',
    ]) {
      expect(slugs.has(slug)).toBe(true);
    }
    for (const w of workouts) {
      expect(getWorkout(w.slug)).toBe(w);
    }
  });

  it('has unique, non-empty slugs and titles/summaries throughout', () => {
    const slugs = workouts.map((w) => w.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const w of workouts) {
      expect(w.slug).toMatch(/^[a-z0-9-]+$/);
      expect(w.title.length).toBeGreaterThan(0);
      expect(w.summary.length).toBeGreaterThan(0);
    }
  });

  it('keeps emom-30 as an EMOM workout', () => {
    const w = getWorkout('emom-30');
    expect(w?.mode).toBe('emom');
  });

  it('attributes every imported workout to David Rosen', () => {
    expect(workouts.every((w) => w.origin === 'original')).toBe(true);
  });

  it('getWorkout returns undefined for an unknown slug', () => {
    expect(getWorkout('nope-not-here')).toBeUndefined();
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

describe('6×5 cycles', () => {
  const w = getWorkout('cycles-6x5');

  it('expands to six 300-second circuit segments with ergs rotating twice', () => {
    if (w?.mode !== 'emom') throw new Error('expected emom workout');
    const segs = expand(w);
    expect(segs).toHaveLength(6);
    expect(segs.every((s) => s.durationSec === 300 && s.type === 'work')).toBe(
      true,
    );
    const ergs = segs.map((s) =>
      s.type === 'work' ? s.station.circuit?.at(-1)?.movement : '',
    );
    expect(ergs).toEqual([
      'Assault bike',
      'Ski erg',
      'Row',
      'Assault bike',
      'Ski erg',
      'Row',
    ]);
  });

  it('every cycle shares the four bodyweight parts and a measured erg', () => {
    if (w?.mode !== 'emom') throw new Error('expected emom workout');
    for (const station of w.blocks[0].stations) {
      const parts = station.circuit ?? [];
      expect(parts.map((p) => p.movement).slice(0, 4)).toEqual([
        'Dumbbell squats',
        'Med ball throw downs',
        'Situps',
        'Pushups',
      ]);
      expect(parts[4].measure).toBeDefined();
    }
  });

  it('labels distance measures in meters', () => {
    expect(measureLabel({ kind: 'dist', meters: 200 })).toBe('200 m');
    expect(measureLabel({ kind: 'dist', meters: 250 })).toBe('250 m');
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

describe('imported library shapes', () => {
  it('includes AMRAP workouts, each a capped single round', () => {
    const amraps = workouts.filter((w) => w.mode === 'amrap');
    expect(amraps.length).toBeGreaterThan(0);
    for (const w of amraps) {
      if (w.mode !== 'amrap') continue;
      expect(w.capMin).toBeGreaterThan(0);
      expect(w.round.length).toBeGreaterThan(0);
    }
  });

  it('includes interval workouts that expand to a valid timeline', () => {
    const intervals = workouts.filter((w) => w.mode === 'interval');
    expect(intervals.length).toBeGreaterThan(0);
    for (const w of intervals) {
      if (w.mode !== 'interval') continue;
      const segs = expand(w);
      expect(segs.length).toBeGreaterThan(0);
      const works = segs.filter((s) => s.type === 'work').length;
      expect(works).toBe(w.rounds);
    }
  });

  it('labels a max-effort measure', () => {
    expect(measureLabel({ kind: 'max' })).toBe('max reps');
  });
});

describe('workout library fidelity fixes', () => {
  it('kbThen12Min: rests after every one of the 5 circuit rounds, no trailing break', () => {
    const w = getWorkout('emom-e3-kb-then-12min') as EmomWorkout;
    const segs = expand(w).filter((s) => s.blockIndex === 0);
    expect(segs.every((s) => s.type === 'work')).toBe(true);
    const movements = segs.map((s) => s.type === 'work' && s.station.movement);
    expect(movements).toEqual(
      Array.from({ length: 5 }, () => ['KB circuit', 'Rest']).flat(),
    );
    const circuitTurns = segs.filter(
      (s) => s.type === 'work' && s.station.movement === 'KB circuit',
    );
    const restTurns = segs.filter((s) => s.type === 'work' && s.station.movement === 'Rest');
    expect(circuitTurns.every((s) => s.durationSec === 180)).toBe(true);
    expect(restTurns.every((s) => s.durationSec === 120)).toBe(true);
  });

  it('ballisticRowsKb: five complete rounds, no partial round', () => {
    const w = getWorkout('emom-35-ballistic-rows-kb') as EmomWorkout;
    const work = expand(w).filter((s) => s.type === 'work');
    expect(work).toHaveLength(30);
    expect(work[work.length - 1].type === 'work' && work[work.length - 1].station.movement).toBe(
      'Pushups',
    );
  });

  it('ladder14: Russian twists appear after every rung', () => {
    const w = getWorkout('rep-14-ladder-burpee-press') as RepWorkout;
    const twists = w.targets.filter((t) => t.movement === 'Russian twists');
    expect(twists).toHaveLength(13); // scheme14 has 13 rungs
    expect(twists.every((t) => t.count === 50 && t.load === '25 lb')).toBe(true);
    // Every third target (burpees, press, twists) is the twist.
    expect(w.targets.filter((_, i) => i % 3 === 2).every((t) => t.movement === 'Russian twists')).toBe(
      true,
    );
  });

  it('superset5rft: ends with the bear-crawl finisher', () => {
    const w = getWorkout('rep-5rft-split-squat-press') as RepWorkout;
    expect(w.targets[w.targets.length - 1]).toMatchObject({
      movement: 'Bear crawl',
    });
  });

  it('pyr5010: a fixed 10-pushup target follows every rung, distinct from the ladder rung', () => {
    const w = getWorkout('rep-50-10-pyramid') as RepWorkout;
    const finishers = w.targets.filter(
      (t) => t.movement === 'Pushups' && t.count === 10 && t.notes,
    );
    expect(finishers).toHaveLength(5);
    // Every fourth target (pushups, snatches, situps, finisher) is the finisher.
    expect(w.targets.filter((_, i) => i % 4 === 3).every((t) => t.notes)).toBe(true);
  });

  it('amrapClimbSix: summary no longer claims a climb, and none is fabricated', () => {
    const w = getWorkout('amrap-climb-six');
    expect(w?.summary.toLowerCase()).not.toContain('climb');
    expect(w?.mode === 'amrap' && w.roundStep).toBeUndefined();
  });

  it('climbingGobletSwing: reps actually climb round over round', () => {
    const w = getWorkout('emom-36-climbing-goblet-swing-thruster') as EmomWorkout;
    const goblet = expand(w)
      .filter((s) => s.type === 'work' && s.station.movement === 'Goblet squats')
      .map((s) => s.type === 'work' && s.station.measure?.kind === 'reps' && s.station.measure.count);
    expect(goblet).toEqual([8, 10, 12, 14, 8, 10, 12, 14, 8, 10, 12, 14]);
  });

  it('climbingKb: reps actually climb round over round', () => {
    const w = getWorkout('emom-30-climbing-kb') as EmomWorkout;
    const goblet = expand(w)
      .filter((s) => s.type === 'work' && s.station.movement === 'KB goblet squats')
      .map((s) => s.type === 'work' && s.station.measure?.kind === 'reps' && s.station.measure.count);
    expect(goblet).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);
  });

  it('kbComplexAlternating: circuit parts reflect the stated round counts', () => {
    const w = getWorkout('emom-30-kb-complex-alternating') as EmomWorkout;
    const [complex3, complex2] = w.blocks[0].stations;
    expect(complex3.circuit).toHaveLength(9);
    expect(complex2.circuit).toHaveLength(6);
  });
});
