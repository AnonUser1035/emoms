import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RepWorkout } from '../workouts';
import type { ActiveRunSnapshot } from '../activeRun';
import { AudioCues } from '../audio';
import RepPlayer from '../RepPlayer';

const KEY = 'emoms.activeRun.v1';

const twoTargets: RepWorkout = {
  mode: 'rep',
  slug: 'test-rep',
  origin: 'original',
  title: 'Test Rep',
  summary: '',
  targets: [
    { movement: 'Pushups', count: 10 },
    { movement: 'Squats', count: 5 },
  ],
};

const capped: RepWorkout = {
  mode: 'rep',
  slug: 'test-capped',
  origin: 'original',
  title: 'Test Capped',
  summary: '',
  targets: [{ movement: 'Pushups', count: 300 }],
  capMin: 1,
  onBreak: [
    { movement: 'Goblet squats', count: 15 },
    { movement: 'Tuck jumps', count: 15 },
  ],
};

function fresh(workout: RepWorkout): Extract<ActiveRunSnapshot, { mode: 'rep' }> {
  return {
    mode: 'rep',
    slug: workout.slug,
    startedAtMs: Date.now(),
    targetIndex: 0,
    repsByTarget: workout.targets.map(() => 0),
    breaks: 0,
    inBreak: false,
  };
}

function renderPlayer(
  workout: RepWorkout,
  overrides: Partial<Parameters<typeof RepPlayer>[0]> = {},
) {
  const onFinish = vi.fn();
  const onExit = vi.fn();
  render(
    <RepPlayer
      workout={workout}
      snapshot={fresh(workout)}
      cues={new AudioCues()}
      onFinish={onFinish}
      onExit={onExit}
      {...overrides}
    />,
  );
  return { onFinish, onExit };
}

describe('RepPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('logs reps in chunks against the current target', () => {
    renderPlayer(twoTargets);
    fireEvent.click(screen.getByRole('button', { name: '+5' }));
    expect(screen.getByText('5 / 10')).toBeDefined();
    expect(screen.getByText(/target 1 \/ 2/i)).toBeDefined();
  });

  it('advances on target completion without carrying overflow', () => {
    renderPlayer(twoTargets);
    fireEvent.click(screen.getByRole('button', { name: '+5' }));
    fireEvent.click(screen.getByRole('button', { name: '+10' })); // 15 logged → capped at 10
    expect(screen.getByText(/target 2 \/ 2/i)).toBeDefined();
    expect(screen.getByText('0 / 5')).toBeDefined();
  });

  it('finishes with a summary when the last target completes', () => {
    const { onFinish } = renderPlayer(twoTargets);
    act(() => {
      vi.advanceTimersByTime(90_000);
    });
    fireEvent.click(screen.getByRole('button', { name: /target done/i }));
    fireEvent.click(screen.getByRole('button', { name: /target done/i }));

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith({
      slug: 'test-rep',
      elapsedSec: 90,
      totalReps: 15,
      breaks: 0,
      completed: true,
    });
    expect(screen.getByText(/complete/i)).toBeDefined();
  });

  it('runs until done regardless of elapsed time when uncapped', () => {
    const { onFinish } = renderPlayer(twoTargets);
    act(() => {
      vi.advanceTimersByTime(5 * 3_600_000); // five hours
    });
    expect(onFinish).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '+1' })).toBeDefined();
  });

  it('shows the break prescription and counts breaks', () => {
    const { onFinish } = renderPlayer(capped);
    fireEvent.click(screen.getByRole('button', { name: /take a break/i }));
    expect(screen.getByText(/break 1/i)).toBeDefined();
    expect(screen.getByText(/15 Goblet squats/)).toBeDefined();
    expect(screen.getByText(/15 Tuck jumps/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /back to work/i }));
    fireEvent.click(screen.getByRole('button', { name: '+10' }));

    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ breaks: 1 }),
    );
  });

  it('offers no break control without a prescription', () => {
    renderPlayer(twoTargets);
    expect(screen.queryByRole('button', { name: /take a break/i })).toBeNull();
  });

  it('ends at the cap with whatever was logged', () => {
    const { onFinish } = renderPlayer(capped);
    fireEvent.click(screen.getByRole('button', { name: '+10' }));
    act(() => {
      vi.advanceTimersByTime(61_000);
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith({
      slug: 'test-capped',
      elapsedSec: 60,
      totalReps: 10,
      breaks: 0,
      completed: false,
    });

    // Further time must not re-fire.
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('persists every mutation to the active-run snapshot', () => {
    renderPlayer(twoTargets);
    fireEvent.click(screen.getByRole('button', { name: '+5' }));
    const stored = JSON.parse(window.localStorage.getItem(KEY) ?? 'null');
    expect(stored).toMatchObject({
      mode: 'rep',
      slug: 'test-rep',
      repsByTarget: [5, 0],
      targetIndex: 0,
    });
  });
});
