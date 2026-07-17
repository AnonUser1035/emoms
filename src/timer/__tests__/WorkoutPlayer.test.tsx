import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Tiny workouts keep completion tests fast and deterministic — the real
// library entries take 30+ minutes of virtual time to finish.
vi.mock('../workouts', () => {
  const tinyEmom = {
    mode: 'emom',
    slug: 'tiny',
    title: 'Tiny',
    origin: 'original',
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
    origin: 'generated',
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
import workoutsList from '../workouts';
import { dailyPick } from '../dailyPick';

const KEY = 'emoms.activeRun.v1';
const NAME_KEY = 'emoms.athleteName.v1';

async function clickFinish() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /^finish$/i }));
  });
}

/** The default selection is now the daily pick — tests that need a specific
 *  workout choose it from the dropdown explicitly. */
function selectWorkout(slug: string) {
  fireEvent.change(screen.getByRole('combobox', { name: /choose a workout/i }), {
    target: { value: slug },
  });
}
function selectTinyEmom() {
  selectWorkout('tiny');
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

    selectTinyEmom();
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(window.localStorage.getItem(KEY)).not.toBeNull();

    // Tiny has a single segment — one "Done" tap ends it. Elapsed time alone
    // never would (that's the whole point of the tap-paced model).
    fireEvent.click(screen.getByRole('button', { name: /^done$/i }));
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

    selectTinyEmom();
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    fireEvent.click(screen.getByRole('button', { name: /^done$/i }));
    await clickFinish();

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    fireEvent.click(screen.getByRole('button', { name: /^done$/i }));
    expect(screen.getByText(/tiny complete/i)).toBeDefined();
  });

  it('quitting mid-run clears the snapshot without a finish screen', () => {
    render(<WorkoutPlayer />);

    selectTinyEmom();
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    fireEvent.click(screen.getByRole('button', { name: /quit/i }));

    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(screen.getByRole('button', { name: /start/i })).toBeDefined();
  });

  it('auto-resumes a fresh EMOM snapshot mid-timeline', () => {
    const startedAtMs = Date.now() - 30_000;
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        mode: 'emom',
        slug: 'tiny',
        startedAtMs,
        athleteIndex: 0,
        athleteSegmentStartedAtMs: startedAtMs,
      }),
    );
    render(<WorkoutPlayer />);

    // Straight into the run — no Start button, pause control visible.
    expect(screen.queryByRole('button', { name: /^start$/i })).toBeNull();
    expect(screen.getByRole('button', { name: /pause/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^done$/i })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /^done$/i }));
    expect(screen.getByText(/tiny complete/i)).toBeDefined();
  });

  it('a run well past the schedule total keeps running until the athlete taps done', () => {
    const startedAtMs = Date.now() - 70_000; // past the 60s nominal total
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        mode: 'emom',
        slug: 'tiny',
        startedAtMs,
        athleteIndex: 0,
        athleteSegmentStartedAtMs: startedAtMs,
      }),
    );
    render(<WorkoutPlayer />);

    // Nothing auto-finished it — the schedule is only a ghost now.
    expect(screen.getByText(/behind/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /^done$/i })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /^done$/i }));
    expect(screen.getByText(/tiny complete/i)).toBeDefined();
  });

  it('offers resume-or-discard for a stale snapshot', () => {
    const startedAtMs = Date.now() - 18_000_000; // 5h > the 4h uncapped bound
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        mode: 'emom',
        slug: 'tiny',
        startedAtMs,
        athleteIndex: 0,
        athleteSegmentStartedAtMs: startedAtMs,
      }),
    );
    render(<WorkoutPlayer />);

    expect(screen.getByText(/unfinished workout/i)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /discard/i }));

    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(screen.getByRole('button', { name: /start/i })).toBeDefined();
  });

  it('resuming a stale snapshot re-enters the run', () => {
    const startedAtMs = Date.now() - 18_000_000;
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        mode: 'emom',
        slug: 'tiny',
        startedAtMs,
        athleteIndex: 0,
        athleteSegmentStartedAtMs: startedAtMs,
      }),
    );
    render(<WorkoutPlayer />);

    fireEvent.click(screen.getByRole('button', { name: /^resume$/i }));
    // Re-enters the run rather than auto-finishing — completion is
    // athlete-driven now, not clock-driven.
    expect(screen.getByRole('button', { name: /^done$/i })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /^done$/i }));
    expect(screen.getByText(/tiny complete/i)).toBeDefined();
  });

  it('pre-selects the daily pick and badges it as today\'s EMOM', () => {
    render(<WorkoutPlayer />);

    const expected = dailyPick(workoutsList, new Date());
    expect(
      screen.getByRole('heading', { name: expected.title, level: 2 }),
    ).toBeDefined();
    expect(screen.getByText(/today's emom/i)).toBeDefined();
    // The dropdown defaults to the daily pick.
    const select = screen.getByRole('combobox', {
      name: /choose a workout/i,
    }) as HTMLSelectElement;
    expect(select.value).toBe(expected.slug);
  });

  it('shows origin badges and lets the athlete switch freely', () => {
    render(<WorkoutPlayer />);

    selectTinyEmom();
    expect(screen.getByText(/dr original/i)).toBeDefined();

    selectWorkout('tiny-rep');
    expect(screen.getByText(/^generated$/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /start/i })).toBeDefined();
  });

  it('runs a rep workout end to end, prompting for the whiteboard name every finish', async () => {
    const onActivity = vi.fn();
    render(<WorkoutPlayer onActivity={onActivity} />);

    selectWorkout('tiny-rep');
    // Exact match hits the body summary paragraph, not the <option> label
    // (which now embeds the summary as "Tiny Rep — Five pushups.").
    expect(screen.getByText('Five pushups.')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    fireEvent.click(screen.getByRole('button', { name: /target done/i }));

    // Rep finish screen: summary + name prompt, empty on a fresh device.
    expect(screen.getByText(/5 reps in/i)).toBeDefined();
    expect(
      (screen.getByPlaceholderText(/your name/i) as HTMLInputElement).value,
    ).toBe('');
    fireEvent.change(screen.getByPlaceholderText(/your name/i), {
      target: { value: 'Ryan' },
    });
    await clickFinish();

    expect(window.localStorage.getItem(NAME_KEY)).toBe('Ryan');
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(onActivity).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /start/i })).toBeDefined();

    // Second finish prompts again, pre-filled with the last name used.
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    fireEvent.click(screen.getByRole('button', { name: /target done/i }));
    expect(
      (screen.getByPlaceholderText(/your name/i) as HTMLInputElement).value,
    ).toBe('Ryan');
  });
});
