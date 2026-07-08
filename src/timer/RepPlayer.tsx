import { useEffect, useRef, useState } from 'react';

import type { RepTarget, RepWorkout, RunSummary } from './workouts';
import type { AudioCues } from './audio';
import { saveActiveRun, type ActiveRunSnapshot } from './activeRun';
import { mmss } from './format';
import { useCountUpClock } from './useCountUpClock';
import { useWakeLock } from './useWakeLock';

/** Chunk sizes for logging reps mid-set — precision beyond this is fake. */
const INCREMENTS = [1, 5, 10];

function targetLine(t: RepTarget): string {
  const extras = [t.load, t.notes].filter(Boolean).join(' · ');
  return extras ? `${t.movement} · ${extras}` : t.movement;
}

type RepSnapshot = Extract<ActiveRunSnapshot, { mode: 'rep' }>;

interface RepPlayerProps {
  workout: RepWorkout;
  /** In-run state to start from — fresh from Start, or restored on reload. */
  snapshot: RepSnapshot;
  cues: AudioCues;
  /** Fired exactly once when the run ends (all targets done, or capped). */
  onFinish?: (summary: RunSummary) => void;
  /** Abandon the run (parent discards the snapshot). */
  onExit: () => void;
}

export default function RepPlayer({
  workout,
  snapshot,
  cues,
  onFinish,
  onExit,
}: RepPlayerProps) {
  const { targets } = workout;
  const [targetIndex, setTargetIndex] = useState(snapshot.targetIndex);
  const [repsByTarget, setRepsByTarget] = useState(snapshot.repsByTarget);
  const [breaks, setBreaks] = useState(snapshot.breaks);
  const [inBreak, setInBreak] = useState(snapshot.inBreak);
  const [summary, setSummary] = useState<RunSummary | null>(null);

  const clock = useCountUpClock(snapshot.startedAtMs, workout.capMin);
  useWakeLock(summary === null);

  const totalReps = repsByTarget.reduce((a, n) => a + n, 0);
  const current = targets[targetIndex];
  const next = targets[targetIndex + 1];

  // Fire-once guard: finish() can be reached from a rep tap or the cap
  // effect; only the first call wins.
  const finished = useRef(false);
  const finish = (completed: boolean, elapsedSec: number, total: number) => {
    if (finished.current) return;
    finished.current = true;
    const s: RunSummary = {
      slug: workout.slug,
      elapsedSec,
      totalReps: total,
      breaks,
      completed,
    };
    cues.finish();
    onFinish?.(s);
    setSummary(s);
  };

  const logReps = (n: number) => {
    if (!current || summary) return;
    const logged = Math.min(repsByTarget[targetIndex] + n, current.count);
    const nextReps = repsByTarget.map((r, i) => (i === targetIndex ? logged : r));
    setRepsByTarget(nextReps);
    if (logged >= current.count) {
      // Target complete — advance; overflow reps don't carry forward.
      if (targetIndex + 1 >= targets.length) {
        finish(
          true,
          clock.elapsedSec,
          nextReps.reduce((a, r) => a + r, 0),
        );
      } else {
        cues.start();
        setTargetIndex(targetIndex + 1);
      }
    }
  };

  // Cap elapsed → the run ends with whatever was logged (elapsed is pinned
  // to the cap by the clock). The finished ref makes this a one-shot.
  const cappedOut = clock.capReached && summary === null;
  useEffect(() => {
    if (cappedOut) finish(false, clock.elapsedSec, totalReps);
  });

  // Persist in-run state on every mutation; the parent clears it on finish,
  // so stop writing once a summary exists.
  const persistable = summary === null;
  useEffect(() => {
    if (!persistable) return;
    saveActiveRun({
      mode: 'rep',
      slug: snapshot.slug,
      startedAtMs: snapshot.startedAtMs,
      runId: snapshot.runId,
      targetIndex,
      repsByTarget,
      breaks,
      inBreak,
    });
  }, [persistable, snapshot, targetIndex, repsByTarget, breaks, inBreak]);

  // ── Finished (all targets done, or capped out) ──────────────────────────
  if (summary) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div aria-hidden="true" className="text-5xl">
          {summary.completed ? '✅' : '⏱️'}
        </div>
        <h2 className="text-2xl font-bold">
          {workout.title} {summary.completed ? 'complete' : '— time'}
        </h2>
        <p className="text-fg-muted">
          {summary.totalReps} reps in {mmss(summary.elapsedSec)}
          {summary.breaks > 0
            ? ` · ${summary.breaks} break${summary.breaks === 1 ? '' : 's'}`
            : ''}
        </p>
        {!summary.completed && (
          <p className="text-sm text-fg-muted">Capped at {workout.capMin} min.</p>
        )}
        <button
          type="button"
          onClick={onExit}
          className="mt-4 rounded-xl border border-border px-6 py-3 font-semibold"
        >
          Back to start
        </button>
      </div>
    );
  }

  // ── On a break: show the prescription until the athlete resumes ─────────
  if (inBreak) {
    return (
      <div className="flex flex-col items-center gap-6 py-6 text-center">
        <span className="rounded-full bg-break px-3 py-1 text-xs font-bold uppercase tracking-wide text-black">
          Break {breaks}
        </span>
        <div
          aria-live="off"
          className="tabular-nums text-[22vw] font-black leading-none text-break sm:text-[12rem]"
        >
          {mmss(clock.elapsedSec)}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold text-fg-muted">Pay the toll:</p>
          {workout.onBreak?.map((t, i) => (
            <p key={i} className="text-3xl font-bold">
              {t.count} {targetLine(t)}
            </p>
          ))}
        </div>
        {clock.remainingToCapSec !== null && (
          <p className="text-sm text-fg-muted">
            {mmss(clock.remainingToCapSec)} to the cap — it keeps running.
          </p>
        )}
        <button
          type="button"
          onClick={() => setInBreak(false)}
          className="rounded-xl bg-work px-8 py-4 text-lg font-bold text-black"
        >
          Back to work
        </button>
      </div>
    );
  }

  // ── Working ──────────────────────────────────────────────────────────────
  const logged = repsByTarget[targetIndex] ?? 0;

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-work px-3 py-1 text-xs font-bold uppercase tracking-wide text-black">
          Work
        </span>
        <span className="text-sm text-fg-muted">
          Target {targetIndex + 1} / {targets.length}
          {breaks > 0 ? ` · ${breaks} break${breaks === 1 ? '' : 's'}` : ''}
        </span>
      </div>

      <div
        aria-live="off"
        className="tabular-nums text-[22vw] font-black leading-none text-work sm:text-[12rem]"
      >
        {mmss(clock.elapsedSec)}
      </div>
      {clock.remainingToCapSec !== null && (
        <p className="-mt-4 text-sm text-fg-muted">
          {mmss(clock.remainingToCapSec)} to the {workout.capMin}-min cap
        </p>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-3xl font-bold">{current && targetLine(current)}</p>
        <p className="text-lg tabular-nums text-fg-muted">
          {logged} / {current?.count}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {INCREMENTS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => logReps(n)}
            className="min-w-20 rounded-xl bg-bg-elevated px-5 py-4 text-xl font-bold transition-transform active:scale-[0.96]"
          >
            +{n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => current && logReps(current.count - logged)}
          className="rounded-xl bg-work px-5 py-4 text-xl font-bold text-black transition-transform active:scale-[0.96]"
        >
          Target done
        </button>
      </div>

      <p className="text-fg-muted">
        Next:{' '}
        <strong className="text-fg">
          {next ? `${next.count} ${targetLine(next)}` : 'Finish'}
        </strong>
      </p>

      <div className="flex gap-3">
        {workout.onBreak && (
          <button
            type="button"
            onClick={() => {
              setBreaks((b) => b + 1);
              setInBreak(true);
            }}
            className="rounded-xl border border-border px-6 py-3 font-semibold"
          >
            Take a break
          </button>
        )}
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl px-6 py-3 font-semibold text-fg-muted hover:text-fg"
        >
          Quit
        </button>
      </div>
    </div>
  );
}
