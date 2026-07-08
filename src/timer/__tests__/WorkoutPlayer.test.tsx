import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Tiny workouts keep completion tests fast and deterministic — the real
// library entries take 30+ minutes of virtual time to finish.
vi.mock('../workouts', () => {
  const tinyEmom = {
    mode: 'emom',
    slug: 'tiny',
    title: 'Tiny',
    summary: 'One minute, one move.',
    blocks: [
      {
        durationMin: 1,
        intervalSec: 60,
        stations: [
          { movement: 'Test move', measure: { kind: 'reps', count: 1 } },
        ],
      },
    ],
  };
  const tinyRep = {
    mode: 'rep',
    slug: 'tiny-rep',
    title: 'Tiny Rep',
    summary: 'Five pushups.',
    targets: [{ movement: 'Pushups', count: 5 }],
  };
  const list = [tinyEmom, tinyRep];
  return {
    default: list,
    getWorkout: (slug: string) => list.find((w) => w.slug === slug),
  };
});

import WorkoutPlayer from '../WorkoutPlayer';

const KEY = 'emoms.activeRun.v1';

describe('WorkoutPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('completes an EMOM run: onComplete once, snapshot cleared', () => {
    const onComplete = vi.fn();
    render(<WorkoutPlayer onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(window.localStorage.getItem(KEY)).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(KEY)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('fires again on a second completed run', () => {
    const onComplete = vi.fn();
    render(<WorkoutPlayer onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    fireEvent.click(screen.getByRole('button', { name: /back to start/i }));
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('quitting mid-run clears the snapshot without completing', () => {
    const onComplete = vi.fn();
    render(<WorkoutPlayer onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    fireEvent.click(screen.getByRole('button', { name: /quit/i }));

    expect(onComplete).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(screen.getByRole('button', { name: /start/i })).toBeDefined();
  });

  it('auto-resumes a fresh EMOM snapshot mid-timeline', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        mode: 'emom',
        slug: 'tiny',
        startedAtMs: Date.now() - 30_000,
      }),
    );
    const onComplete = vi.fn();
    render(<WorkoutPlayer onComplete={onComplete} />);

    // Straight into the run — no Start button, pause control visible.
    expect(screen.queryByRole('button', { name: /^start$/i })).toBeNull();
    expect(screen.getByRole('button', { name: /pause/i })).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(35_000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('a run that finished while the page was gone lands on done', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        mode: 'emom',
        slug: 'tiny',
        startedAtMs: Date.now() - 70_000, // past the 60s total, within slack
      }),
    );
    const onComplete = vi.fn();
    render(<WorkoutPlayer onComplete={onComplete} />);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /back to start/i })).toBeDefined();
  });

  it('offers resume-or-discard for a stale snapshot', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        mode: 'emom',
        slug: 'tiny',
        startedAtMs: Date.now() - 2_000_000, // 2000s > 60s total + 1800s slack
      }),
    );
    render(<WorkoutPlayer />);

    expect(screen.getByText(/unfinished workout/i)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /discard/i }));

    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(screen.getByRole('button', { name: /start/i })).toBeDefined();
  });

  it('resuming a stale snapshot re-enters the run', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        mode: 'emom',
        slug: 'tiny',
        startedAtMs: Date.now() - 2_000_000,
      }),
    );
    const onComplete = vi.fn();
    render(<WorkoutPlayer onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /resume/i }));
    // Way past the timeline end → lands on done and completes.
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('switches workouts via tabs and runs a rep workout end to end', () => {
    const onComplete = vi.fn();
    render(<WorkoutPlayer onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('tab', { name: /tiny rep/i }));
    expect(screen.getByText(/5 pushups/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    fireEvent.click(screen.getByRole('button', { name: /target done/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'tiny-rep',
        totalReps: 5,
        completed: true,
      }),
    );
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });
});
