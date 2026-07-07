import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A tiny one-segment workout keeps completion tests fast and deterministic —
// EMOM 30 (the seeded default) takes ~32 minutes of virtual time to finish.
vi.mock('../workouts', () => {
  const tinyWorkout = {
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
  return { default: [tinyWorkout], getWorkout: () => tinyWorkout };
});

import EmomPlayer from '../EmomPlayer';

describe('EmomPlayer completion check-in', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires onComplete exactly once when the workout finishes', () => {
    const onComplete = vi.fn();
    render(<EmomPlayer onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    act(() => {
      vi.advanceTimersByTime(65_000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);

    // Further ticks/re-renders after completion must not re-fire it.
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('fires again on a second completed run after reset', () => {
    const onComplete = vi.fn();
    render(<EmomPlayer onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /back to start/i }));
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('does not fire onComplete when reset before the workout finishes', () => {
    const onComplete = vi.fn();
    render(<EmomPlayer onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    fireEvent.click(screen.getByRole('button', { name: /^reset$/i }));

    expect(onComplete).not.toHaveBeenCalled();
  });
});
