import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearActiveRun,
  isStaleActiveRun,
  loadActiveRun,
  saveActiveRun,
  type ActiveRunSnapshot,
} from '../activeRun';

const KEY = 'emoms.activeRun.v1';

function repSnapshot(
  overrides: Partial<Extract<ActiveRunSnapshot, { mode: 'rep' }>> = {},
): ActiveRunSnapshot {
  return {
    mode: 'rep',
    slug: 'chipper-60-30',
    startedAtMs: Date.now() - 60_000,
    targetIndex: 3,
    repsByTarget: [60, 60, 60, 20, 0, 0, 0, 0, 0, 0, 0, 0],
    breaks: 2,
    inBreak: false,
    ...overrides,
  };
}

describe('active-run snapshot', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('round-trips an EMOM snapshot', () => {
    const snap: ActiveRunSnapshot = {
      mode: 'emom',
      slug: 'emom-30',
      startedAtMs: Date.now() - 5_000,
      runId: 'r-1',
      athleteIndex: 3,
      athleteSegmentStartedAtMs: Date.now() - 1_000,
    };
    saveActiveRun(snap);
    expect(loadActiveRun()).toEqual(snap);
  });

  it('round-trips a rep snapshot', () => {
    const snap = repSnapshot();
    saveActiveRun(snap);
    expect(loadActiveRun()).toEqual(snap);
  });

  it('clear removes the snapshot', () => {
    saveActiveRun(repSnapshot());
    clearActiveRun();
    expect(loadActiveRun()).toBeNull();
  });

  it('discards unparseable payloads', () => {
    window.localStorage.setItem(KEY, 'not json {');
    expect(loadActiveRun()).toBeNull();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('discards snapshots for unknown workouts', () => {
    saveActiveRun(repSnapshot({ slug: 'deleted-workout' }));
    expect(loadActiveRun()).toBeNull();
  });

  it('discards snapshots whose mode does not match the workout', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        mode: 'emom',
        slug: 'pushups-300',
        startedAtMs: Date.now(),
      }),
    );
    expect(loadActiveRun()).toBeNull();
  });

  it('discards rep snapshots with a mismatched target list', () => {
    saveActiveRun(repSnapshot({ repsByTarget: [1, 2, 3] }));
    expect(loadActiveRun()).toBeNull();
  });
});

describe('isStaleActiveRun', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('EMOM: bound is four hours, since the real end is athlete-determined', () => {
    // emom-30's nominal total (1970s) no longer bounds this — the athlete
    // may legitimately still be behind well past it.
    const fresh: ActiveRunSnapshot = {
      mode: 'emom',
      slug: 'emom-30',
      startedAtMs: Date.now() - 3 * 3_600_000, // 3h
      athleteIndex: 0,
      athleteSegmentStartedAtMs: Date.now() - 3 * 3_600_000,
    };
    const stale: ActiveRunSnapshot = {
      ...fresh,
      startedAtMs: Date.now() - 5 * 3_600_000, // 5h > 4h bound
    };
    expect(isStaleActiveRun(fresh)).toBe(false);
    expect(isStaleActiveRun(stale)).toBe(true);
  });

  it('capped rep workout: bound is cap + slack', () => {
    // pushups-300: 35 min cap → bound 2100 + 1800 = 3900s.
    const base = repSnapshot({
      slug: 'pushups-300',
      targetIndex: 0,
      repsByTarget: [100],
    });
    expect(
      isStaleActiveRun({ ...base, startedAtMs: Date.now() - 3_800_000 }),
    ).toBe(false);
    expect(
      isStaleActiveRun({ ...base, startedAtMs: Date.now() - 4_000_000 }),
    ).toBe(true);
  });

  it('uncapped rep workout: bound is four hours', () => {
    const base = repSnapshot();
    expect(
      isStaleActiveRun({ ...base, startedAtMs: Date.now() - 3 * 3_600_000 }),
    ).toBe(false);
    expect(
      isStaleActiveRun({ ...base, startedAtMs: Date.now() - 5 * 3_600_000 }),
    ).toBe(true);
  });
});
