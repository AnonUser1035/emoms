import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EmomWorkout } from '../workouts';
import type { AudioCues } from '../audio';
import EmomPlayer from '../EmomPlayer';

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

function mockCues() {
  return {
    unlock: vi.fn(),
    start: vi.fn(),
    countdown: vi.fn(),
    finish: vi.fn(),
    tick: vi.fn(),
  } as unknown as AudioCues & { tick: ReturnType<typeof vi.fn> };
}

function renderCircuit(startedAtMs = Date.now()) {
  const cues = mockCues();
  render(
    <EmomPlayer
      workout={circuitWorkout}
      startedAtMs={startedAtMs}
      cues={cues}
      onExit={() => {}}
    />,
  );
  return cues;
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
    // Still segment 1 of 2, still ticking down.
    expect(screen.getByText(/1 \/ 2/)).toBeDefined();
  });

  it('a new cycle starts with the checklist reset', () => {
    renderCircuit();
    fireEvent.click(screen.getByRole('button', { name: /squats/i }));

    act(() => {
      vi.advanceTimersByTime(121_000); // cross the 2-minute boundary
    });
    expect(screen.getByText(/2 \/ 2/)).toBeDefined();
    expect(
      screen.getByRole('button', { name: /squats/i }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('false');
  });

  it('soft-ticks at whole minutes inside a cycle, once each', () => {
    const cues = renderCircuit();
    act(() => {
      vi.advanceTimersByTime(61_000); // past 1:00 elapsed
    });
    expect(cues.tick).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(30_000); // 1:31 — no new minute crossed
    });
    expect(cues.tick).toHaveBeenCalledTimes(1);
  });

  it('resumes into the right cycle with an unchecked list', () => {
    renderCircuit(Date.now() - 130_000); // 2:10 in → second cycle
    expect(screen.getByText(/2 \/ 2/)).toBeDefined();
    expect(
      screen.getByRole('button', { name: /squats/i }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('false');
  });
});
