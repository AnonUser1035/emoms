import { useRef, useState } from 'react';

import workouts, {
  getWorkout,
  type EmomWorkout,
  type RepWorkout,
  type RunSummary,
  type Workout,
} from './workouts';
import { AudioCues } from './audio';
import {
  clearActiveRun,
  isStaleActiveRun,
  loadActiveRun,
  saveActiveRun,
  type ActiveRunSnapshot,
} from './activeRun';
import EmomPlayer from './EmomPlayer';
import RepPlayer from './RepPlayer';
import { measureLabel, mmss } from './format';

interface WorkoutPlayerProps {
  /** Fired exactly once per finished run. Rep runs include their summary. */
  onComplete?: (summary?: RunSummary) => void;
}

function freshSnapshot(workout: Workout): ActiveRunSnapshot {
  const base = { slug: workout.slug, startedAtMs: Date.now() };
  if (workout.mode === 'emom') return { mode: 'emom', ...base };
  return {
    mode: 'rep',
    ...base,
    targetIndex: 0,
    repsByTarget: workout.targets.map(() => 0),
    breaks: 0,
    inBreak: false,
  };
}

/**
 * Owns workout selection, the idle overview, and the active-run snapshot:
 * on load a fresh snapshot auto-resumes the right player, a stale one gets a
 * resume-or-discard prompt. Dispatches by workout mode — the interval player
 * and the rep player never see each other's workouts.
 */
export default function WorkoutPlayer({ onComplete }: WorkoutPlayerProps) {
  // Restore once, at mount. Fresh → straight into the run; stale → prompt.
  const [restored] = useState(() => loadActiveRun());
  const [active, setActive] = useState<ActiveRunSnapshot | null>(() =>
    restored && !isStaleActiveRun(restored) ? restored : null,
  );
  const [stale, setStale] = useState<ActiveRunSnapshot | null>(() =>
    restored && isStaleActiveRun(restored) ? restored : null,
  );
  const [workout, setWorkout] = useState<Workout>(
    () => getWorkout(restored?.slug ?? '') ?? workouts[0],
  );

  const cues = useRef<AudioCues | null>(null);
  if (!cues.current) cues.current = new AudioCues();

  const handleStart = () => {
    cues.current?.unlock();
    cues.current?.start();
    const snapshot = freshSnapshot(workout);
    saveActiveRun(snapshot);
    setActive(snapshot);
  };

  const handleExit = () => {
    clearActiveRun();
    setActive(null);
  };

  // Finish clears the snapshot but keeps the player mounted on its done
  // screen; "Back to start" (onExit) returns to idle.
  const handleEmomComplete = () => {
    clearActiveRun();
    onComplete?.();
  };

  const handleRepFinish = (summary: RunSummary) => {
    clearActiveRun();
    onComplete?.(summary);
  };

  // ── Stale snapshot: resume or discard ───────────────────────────────────
  if (stale) {
    const staleWorkout = getWorkout(stale.slug);
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-bg-elevated p-6 text-center">
        <h2 className="text-xl font-bold">Unfinished workout</h2>
        <p className="text-fg-muted">
          {staleWorkout?.title ?? stale.slug} was started a while ago and never
          finished. Pick it back up, or discard it?
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              cues.current?.unlock();
              setActive(stale);
              setStale(null);
            }}
            className="rounded-xl bg-work px-6 py-3 font-bold text-black"
          >
            Resume
          </button>
          <button
            type="button"
            onClick={() => {
              clearActiveRun();
              setStale(null);
            }}
            className="rounded-xl border border-border px-6 py-3 font-semibold"
          >
            Discard
          </button>
        </div>
      </div>
    );
  }

  // ── Active run: dispatch by mode ────────────────────────────────────────
  if (active) {
    const activeWorkout = getWorkout(active.slug);
    if (!activeWorkout || activeWorkout.mode !== active.mode) {
      // Defensive: loadActiveRun validates this, and fresh snapshots are
      // built from registry entries — but never crash a workout screen.
      clearActiveRun();
      setActive(null);
      return null;
    }
    if (active.mode === 'emom') {
      return (
        <EmomPlayer
          workout={activeWorkout as EmomWorkout}
          startedAtMs={active.startedAtMs}
          cues={cues.current}
          onComplete={handleEmomComplete}
          onExit={handleExit}
        />
      );
    }
    return (
      <RepPlayer
        workout={activeWorkout as RepWorkout}
        snapshot={active}
        cues={cues.current}
        onFinish={handleRepFinish}
        onExit={handleExit}
      />
    );
  }

  // ── Idle: workout picker + overview + start ─────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {workouts.length > 1 && (
        <div role="tablist" aria-label="Choose a workout" className="flex flex-wrap gap-2">
          {workouts.map((w) => (
            <button
              key={w.slug}
              type="button"
              role="tab"
              aria-selected={w.slug === workout.slug}
              onClick={() => setWorkout(w)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                w.slug === workout.slug
                  ? 'bg-work text-black'
                  : 'bg-bg-elevated text-fg-muted hover:text-fg'
              }`}
            >
              {w.title}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{workout.title}</h2>
          <p className="mt-1 text-fg-muted">{workout.summary}</p>
        </div>

        {workout.mode === 'emom' ? (
          <EmomOverview workout={workout} />
        ) : (
          <RepOverview workout={workout} />
        )}
      </div>

      <button
        type="button"
        onClick={handleStart}
        className="rounded-xl bg-work py-4 text-lg font-bold text-black transition-transform active:scale-[0.98]"
      >
        Start
      </button>
    </div>
  );
}

function EmomOverview({ workout }: { workout: EmomWorkout }) {
  return (
    <ol className="flex flex-col gap-4">
      {workout.blocks.map((block, bi) => (
        <li
          key={bi}
          className="rounded-xl border border-border bg-bg-elevated p-4"
        >
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-semibold">
              {block.label ?? `Block ${bi + 1}`}
            </span>
            <span className="text-sm text-fg-muted">
              {block.durationMin} min · {block.intervalSec}s
            </span>
          </div>
          <ul className="mt-3 flex flex-col gap-1.5">
            {block.stations.map((s, si) => (
              <li
                key={si}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span>{s.movement}</span>
                <span className="text-fg-muted">
                  {measureLabel(s.measure)}
                  {s.load ? ` · ${s.load}` : ''}
                </span>
              </li>
            ))}
            {block.then?.map((t, ti) => (
              <li
                key={`t${ti}`}
                className="flex items-baseline justify-between gap-4 text-sm text-fg-muted"
              >
                {t.kind === 'break' ? (
                  <>
                    <span>Rest</span>
                    <span>{mmss(t.seconds)}</span>
                  </>
                ) : (
                  <>
                    <span>{t.station.movement}</span>
                    <span>{measureLabel(t.station.measure)}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function RepOverview({ workout }: { workout: RepWorkout }) {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-semibold">
          {workout.targets.length === 1 ? 'The work' : 'In order'}
        </span>
        <span className="text-sm text-fg-muted">
          {workout.capMin != null ? `${workout.capMin}-min cap` : 'for time'}
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {workout.targets.map((t, ti) => (
          <li
            key={ti}
            className="flex items-baseline justify-between gap-4 text-sm"
          >
            <span>
              {t.count} {t.movement}
              {t.notes ? ` (${t.notes})` : ''}
            </span>
            <span className="text-fg-muted">{t.load ?? ''}</span>
          </li>
        ))}
      </ul>
      {workout.onBreak && (
        <p className="mt-3 border-t border-border pt-3 text-sm text-fg-muted">
          Every break:{' '}
          {workout.onBreak.map((t) => `${t.count} ${t.movement.toLowerCase()}`).join(' · ')}
        </p>
      )}
    </div>
  );
}
