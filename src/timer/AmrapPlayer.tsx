import { useEffect, useRef, useState } from 'react';

import type { AmrapWorkout, RepTarget, RunSummary } from './workouts';
import type { AudioCues } from './audio';
import { saveActiveRun, type ActiveRunSnapshot } from './activeRun';
import { mmss } from './format';
import { useCountUpClock } from './useCountUpClock';
import { useWakeLock } from './useWakeLock';

function targetLine(t: RepTarget): string {
  const extras = [t.load, t.notes].filter(Boolean).join(' · ');
  return extras ? `${t.movement} · ${extras}` : t.movement;
}

type AmrapSnapshot = Extract<ActiveRunSnapshot, { mode: 'amrap' }>;

interface AmrapPlayerProps {
  workout: AmrapWorkout;
  /** In-run state to start from — fresh from Start, or restored on reload. */
  snapshot: AmrapSnapshot;
  cues: AudioCues;
  /** Fired exactly once when the cap is reached. */
  onFinish?: (summary: RunSummary) => void;
  /** Abandon the run (parent discards the snapshot). */
  onExit: () => void;
}

/** Reps implied by completing `rounds` full rounds, honouring roundStep. */
function repsThrough(round: RepTarget[], step: number, rounds: number): number {
  const base = round.reduce((a, t) => a + t.count, 0);
  let total = 0;
  for (let k = 0; k < rounds; k++) total += base + step * k * round.length;
  return total;
}

export default function AmrapPlayer({
  workout,
  snapshot,
  cues,
  onFinish,
  onExit,
}: AmrapPlayerProps) {
  const step = workout.roundStep ?? 0;
  const [rounds, setRounds] = useState(snapshot.rounds);
  const [summary, setSummary] = useState<RunSummary | null>(null);

  const clock = useCountUpClock(snapshot.startedAtMs, workout.capMin);
  useWakeLock(summary === null);

  // Fire-once: the cap effect is the only path to finish.
  const finished = useRef(false);
  const finish = (completedRounds: number) => {
    if (finished.current) return;
    finished.current = true;
    const s: RunSummary = {
      slug: workout.slug,
      elapsedSec: clock.elapsedSec,
      totalReps: repsThrough(workout.round, step, completedRounds),
      breaks: 0,
      completed: true,
    };
    cues.finish();
    onFinish?.(s);
    setSummary(s);
  };

  const cappedOut = clock.capReached && summary === null;
  useEffect(() => {
    if (cappedOut) finish(rounds);
  });

  // Persist the round count on every change until the run ends.
  const persistable = summary === null;
  useEffect(() => {
    if (!persistable) return;
    saveActiveRun({
      mode: 'amrap',
      slug: snapshot.slug,
      startedAtMs: snapshot.startedAtMs,
      runId: snapshot.runId,
      rounds,
    });
  }, [persistable, snapshot, rounds]);

  // ── Finished (cap reached) ────────────────────────────────────────────────
  if (summary) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div aria-hidden="true" className="text-5xl">
          ⏱️
        </div>
        <h2 className="text-2xl font-bold">{workout.title} — time</h2>
        <p className="text-fg-muted">
          {rounds} round{rounds === 1 ? '' : 's'} in {mmss(summary.elapsedSec)}
        </p>
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

  // ── Working: count rounds against the clock ────────────────────────────────
  // The round on the clock now (1-based); its counts scale by roundStep.
  const roundNo = rounds + 1;
  const scale = step * rounds;

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-work px-3 py-1 text-xs font-bold uppercase tracking-wide text-black">
          AMRAP
        </span>
        <span className="text-sm text-fg-muted">{workout.capMin}-min cap</span>
      </div>

      <div
        aria-live="off"
        className="tabular-nums text-[22vw] font-black leading-none text-work sm:text-[12rem]"
      >
        {clock.remainingToCapSec !== null
          ? mmss(clock.remainingToCapSec)
          : mmss(clock.elapsedSec)}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          Rounds complete
        </p>
        <p className="tabular-nums text-6xl font-black">{rounds}</p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="One fewer round"
          onClick={() => setRounds((r) => Math.max(0, r - 1))}
          className="min-w-16 rounded-xl bg-bg-elevated px-6 py-4 text-2xl font-bold transition-transform active:scale-[0.96]"
        >
          −
        </button>
        <button
          type="button"
          aria-label="One more round"
          onClick={() => setRounds((r) => r + 1)}
          className="min-w-24 rounded-xl bg-work px-8 py-4 text-2xl font-bold text-black transition-transform active:scale-[0.96]"
        >
          +1
        </button>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-border bg-bg-elevated p-4">
        <p className="mb-2 text-sm font-semibold text-fg-muted">
          Round {roundNo}
        </p>
        <ul className="flex flex-col gap-1.5">
          {workout.round.map((t, i) => (
            <li
              key={i}
              className="flex items-baseline justify-between gap-4 text-sm"
            >
              <span>
                {t.count + scale} {targetLine(t)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onExit}
        className="rounded-xl px-6 py-3 font-semibold text-fg-muted hover:text-fg"
      >
        Quit
      </button>
    </div>
  );
}
