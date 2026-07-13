import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AmrapWorkout } from '../workouts';
import type { ActiveRunSnapshot } from '../activeRun';
import { AudioCues } from '../audio';
import AmrapPlayer from '../AmrapPlayer';

const KEY = 'emoms.activeRun.v1';

const amrap: AmrapWorkout = {
  mode: 'amrap',
  slug: 'test-amrap',
  origin: 'original',
  title: 'Test AMRAP',
  summary: '',
  capMin: 1,
  round: [
    { movement: 'Pushups', count: 5 },
    { movement: 'Squats', count: 10 },
  ],
};

const ascending: AmrapWorkout = {
  ...amrap,
  slug: 'test-amrap-asc',
  roundStep: 1,
};

function fresh(
  workout: AmrapWorkout,
  rounds = 0,
): Extract<ActiveRunSnapshot, { mode: 'amrap' }> {
  return { mode: 'amrap', slug: workout.slug, startedAtMs: Date.now(), rounds };
}

function renderPlayer(workout: AmrapWorkout, rounds = 0) {
  const onFinish = vi.fn();
  const onExit = vi.fn();
  render(
    <AmrapPlayer
      workout={workout}
      snapshot={fresh(workout, rounds)}
      cues={new AudioCues()}
      onFinish={onFinish}
      onExit={onExit}
    />,
  );
  return { onFinish, onExit };
}

const plusRound = () =>
  fireEvent.click(screen.getByRole('button', { name: /one more round/i }));
const minusRound = () =>
  fireEvent.click(screen.getByRole('button', { name: /one fewer round/i }));

describe('AmrapPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('counts rounds up and floors the decrement at zero', () => {
    renderPlayer(amrap);
    minusRound(); // already 0 → stays 0
    expect(window.localStorage.getItem(KEY)).not.toBeNull();
    let stored = JSON.parse(window.localStorage.getItem(KEY) ?? 'null');
    expect(stored.rounds).toBe(0);

    plusRound();
    plusRound();
    stored = JSON.parse(window.localStorage.getItem(KEY) ?? 'null');
    expect(stored.rounds).toBe(2);
  });

  it('ends at the cap, reporting reps for the rounds completed', () => {
    const { onFinish } = renderPlayer(amrap);
    plusRound();
    plusRound();
    plusRound(); // 3 rounds × (5 + 10) = 45 reps
    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith({
      slug: 'test-amrap',
      elapsedSec: 60,
      totalReps: 45,
      breaks: 0,
      completed: true,
    });
    // Further time must not re-fire.
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('resumes the round count from a restored snapshot', () => {
    const { onFinish } = renderPlayer(amrap, 5);
    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ totalReps: 75 }), // 5 × 15
    );
  });

  it('scales the round list and the finish reps by roundStep', () => {
    const { onFinish } = renderPlayer(ascending);
    plusRound();
    plusRound(); // two rounds done → the list now shows round 3's counts
    // Round 3 (rounds=2, step=1): 5+2 and 10+2.
    expect(screen.getByText(/7 Pushups/)).toBeDefined();
    expect(screen.getByText(/12 Squats/)).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    // reps through 2 rounds: round0 = 15, round1 = 15 + 1×1×2 = 17 → 32.
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ totalReps: 32 }),
    );
  });
});
