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
const NAME_KEY = 'emoms.athleteName.v1';

async function clickFinish() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /^finish$/i }));
  });
}

describe('WorkoutPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('completes an EMOM run: finish screen, snapshot cleared, one post', async () => {
    const onActivity = vi.fn();
    render(<WorkoutPlayer onActivity={onActivity} />);

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(window.localStorage.getItem(KEY)).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    // Finish screen with the summary; the snapshot is already cleared.
    expect(screen.getByText(/tiny complete/i)).toBeDefined();
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(onActivity).not.toHaveBeenCalled();

    await clickFinish();
    expect(onActivity).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /start/i })).toBeDefined();
  });

  it('runs a second workout after finishing the first', async () => {
    render(<WorkoutPlayer />);

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    await clickFinish();

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(screen.getByText(/tiny complete/i)).toBeDefined();
  });

  it('quitting mid-run clears the snapshot without a finish screen', () => {
    render(<WorkoutPlayer />);

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    fireEvent.click(screen.getByRole('button', { name: /quit/i }));

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
    render(<WorkoutPlayer />);

    // Straight into the run — no Start button, pause control visible.
    expect(screen.queryByRole('button', { name: /^start$/i })).toBeNull();
    expect(screen.getByRole('button', { name: /pause/i })).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(35_000);
    });
    expect(screen.getByText(/tiny complete/i)).toBeDefined();
  });

  it('a run that finished while the page was gone lands on the finish screen', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        mode: 'emom',
        slug: 'tiny',
        startedAtMs: Date.now() - 70_000, // past the 60s total, within slack
      }),
    );
    render(<WorkoutPlayer />);

    expect(screen.getByText(/tiny complete/i)).toBeDefined();
    expect(window.localStorage.getItem(KEY)).toBeNull();
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
    render(<WorkoutPlayer />);

    fireEvent.click(screen.getByRole('button', { name: /resume/i }));
    // Way past the timeline end → lands straight on the finish screen.
    expect(screen.getByText(/tiny complete/i)).toBeDefined();
  });

  it('runs a rep workout end to end, capturing the whiteboard name once', async () => {
    const onActivity = vi.fn();
    render(<WorkoutPlayer onActivity={onActivity} />);

    fireEvent.click(screen.getByRole('tab', { name: /tiny rep/i }));
    expect(screen.getByText(/five pushups/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    fireEvent.click(screen.getByRole('button', { name: /target done/i }));

    // Rep finish screen: summary + first-time name prompt.
    expect(screen.getByText(/5 reps in/i)).toBeDefined();
    fireEvent.change(screen.getByPlaceholderText(/your name/i), {
      target: { value: 'Ryan' },
    });
    await clickFinish();

    expect(window.localStorage.getItem(NAME_KEY)).toBe('Ryan');
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(onActivity).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /start/i })).toBeDefined();

    // Second finish must not re-prompt for a name.
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    fireEvent.click(screen.getByRole('button', { name: /target done/i }));
    expect(screen.queryByPlaceholderText(/your name/i)).toBeNull();
    expect(screen.getByText(/posting as ryan/i)).toBeDefined();
  });
});
