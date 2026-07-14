import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActiveRunSnapshot } from '../activeRun';
import type { EmomWorkout } from '../workouts';
import type { AudioCues } from '../audio';
import EmomPlayer from '../EmomPlayer';

type EmomSnapshot = Extract<ActiveRunSnapshot, { mode: 'emom' }>;

// Two 2-minute circuit cycles — long enough for a minute tick, short enough
// to cross a boundary fast.
const circuitWorkout: EmomWorkout = {
  mode: 'emom',
  slug: 'test-cycles',
  origin: 'original',
  title: 'Test Cycles',
  summary: '',
  blocks: [
    {
      durationMin: 4,
      intervalSec: 120,
      stations: [
        {
          movement: 'Cycle (a)',
          circuit: [
            { movement: 'Squats' },
            { movement: 'Row', measure: { kind: 'dist', meters: 250 } },
          ],
        },
        {
          movement: 'Cycle (b)',
          circuit: [
            { movement: 'Squats' },
            { movement: 'Ski', measure: { kind: 'dist', meters: 200 } },
          ],
        },
      ],
    },
  ],
};

// Two 60s stations then a 30s trailing break — exercises tap-gated
// advancement, tap-gated rest, and the emergent end.
const twoStationWorkout: EmomWorkout = {
  mode: 'emom',
  slug: 'test-two-station',
  origin: 'original',
  title: 'Test Two Station',
  summary: '',
  blocks: [
    {
      durationMin: 2,
      intervalSec: 60,
      stations: [
        { movement: 'Movement A', measure: { kind: 'reps', count: 10 } },
        { movement: 'Movement B', measure: { kind: 'reps', count: 10 } },
      ],
      then: [{ kind: 'break', seconds: 30 }],
    },
  ],
};

function mockCues() {
  return {
    unlock: vi.fn(),
    start: vi.fn(),
    countdown: vi.fn(),
    finish: vi.fn(),
    tick: vi.fn(),
    beacon: vi.fn(),
  } as unknown as AudioCues & { tick: ReturnType<typeof vi.fn> };
}

function renderWorkout(
  workout: EmomWorkout,
  opts?: {
    startedAtMs?: number;
    athleteIndex?: number;
    athleteSegmentStartedAtMs?: number;
    onComplete?: (elapsedSec: number) => void;
  },
) {
  const cues = mockCues();
  const startedAtMs = opts?.startedAtMs ?? Date.now();
  const snapshot: EmomSnapshot = {
    mode: 'emom',
    slug: workout.slug,
    startedAtMs,
    athleteIndex: opts?.athleteIndex ?? 0,
    athleteSegmentStartedAtMs: opts?.athleteSegmentStartedAtMs ?? startedAtMs,
  };
  render(
    <EmomPlayer
      workout={workout}
      snapshot={snapshot}
      cues={cues}
      onComplete={opts?.onComplete}
      onExit={() => {}}
    />,
  );
  return cues;
}

function renderCircuit(
  opts?: Parameters<typeof renderWorkout>[1],
) {
  return renderWorkout(circuitWorkout, opts);
}

describe('EmomPlayer circuit segments', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders parts as a checklist and tapping toggles them', () => {
    renderCircuit();
    const squats = screen.getByRole('button', { name: /squats/i });
    expect(squats.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(squats);
    expect(
      screen.getByRole('button', { name: /squats/i }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /squats/i }));
    expect(
      screen.getByRole('button', { name: /squats/i }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('false');
  });

  it('checking every part does not end or advance the segment', () => {
    renderCircuit();
    fireEvent.click(screen.getByRole('button', { name: /squats/i }));
    fireEvent.click(screen.getByRole('button', { name: /row/i }));

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    // Still segment 1 of 2 — checking parts never gates anything.
    expect(screen.getByText(/1 \/ 2/, { selector: 'span' })).toBeDefined();
  });

  it('tapping Done advances to the next cycle with the checklist reset', () => {
    renderCircuit();
    fireEvent.click(screen.getByRole('button', { name: /squats/i }));

    fireEvent.click(screen.getByRole('button', { name: /^done$/i }));
    expect(screen.getByText(/2 \/ 2/, { selector: 'span' })).toBeDefined();
    expect(
      screen.getByRole('button', { name: /squats/i }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('false');
  });

  it('does not auto-advance when the nominal interval elapses without a tap', () => {
    renderCircuit();
    act(() => {
      vi.advanceTimersByTime(121_000); // past the 2-minute nominal interval
    });
    // Still on cycle 1 — nothing forces the athlete onward.
    expect(screen.getByText(/1 \/ 2/, { selector: 'span' })).toBeDefined();
    expect(screen.getByText(/behind/i)).toBeDefined();
  });

  it('soft-ticks at whole minutes on the athlete\'s own station, once each', () => {
    const cues = renderCircuit();
    act(() => {
      vi.advanceTimersByTime(61_000); // past 1:00 on this station
    });
    expect(cues.tick).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(30_000); // 1:31 — no new minute crossed
    });
    expect(cues.tick).toHaveBeenCalledTimes(1);
  });

  it('resumes wherever the athlete pointer left off, with an unchecked list', () => {
    const startedAtMs = Date.now() - 130_000;
    renderCircuit({
      startedAtMs,
      athleteIndex: 1,
      athleteSegmentStartedAtMs: startedAtMs + 10_000,
    });
    expect(screen.getByText(/2 \/ 2/, { selector: 'span' })).toBeDefined();
    expect(
      screen.getByRole('button', { name: /squats/i }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('false');
  });
});

describe('EmomPlayer tap-paced advancement', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tapping Done advances immediately, ahead of the schedule', () => {
    renderWorkout(twoStationWorkout);
    expect(screen.getByText('Movement A')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /^done$/i }));
    expect(screen.getByText('Movement B')).toBeDefined();
    expect(screen.getByText(/ahead/i)).toBeDefined();
  });

  it('elapsed time alone never advances the segment', () => {
    renderWorkout(twoStationWorkout);
    act(() => {
      vi.advanceTimersByTime(90_000); // past station A's 60s nominal interval
    });
    expect(screen.getByText('Movement A')).toBeDefined();
    expect(screen.getByText(/behind/i)).toBeDefined();
  });

  it('a break requires a tap to resume', () => {
    renderWorkout(twoStationWorkout, { athleteIndex: 2 });
    expect(screen.getByRole('button', { name: /^ready$/i })).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(60_000); // past the 30s nominal break
    });
    expect(screen.getByRole('button', { name: /^ready$/i })).toBeDefined();
  });

  it('tapping through the final segment ends the workout, reporting real elapsed time', () => {
    const onComplete = vi.fn();
    renderWorkout(twoStationWorkout, { athleteIndex: 2, onComplete });

    fireEvent.click(screen.getByRole('button', { name: /^ready$/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(expect.any(Number));
    expect(screen.getByText(/complete/i)).toBeDefined();
  });
});
