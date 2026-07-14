import { useEffect, useRef, useState } from 'react';

import type { EmomWorkout, IntervalWorkout, Segment } from './workouts';
import type { AudioCues } from './audio';
import { saveActiveRun, type ActiveRunSnapshot } from './activeRun';
import { expand } from './expand';
import { measureLabel, mmss, paceLabel } from './format';
import { useAthletePointer } from './useAthletePointer';
import { useSchedule } from './useSchedule';
import { useWakeLock } from './useWakeLock';

const SEGMENT_LABELS: Record<Segment['type'], string> = {
  work: 'Work',
  break: 'Rest',
  hold: 'Hold',
};

const SEGMENT_PILL_CLASS: Record<Segment['type'], string> = {
  work: 'bg-work text-black',
  break: 'bg-break text-black',
  hold: 'bg-hold text-black',
};

const SEGMENT_TEXT_CLASS: Record<Segment['type'], string> = {
  work: 'text-work',
  break: 'text-break',
  hold: 'text-hold',
};

function stationOf(segment: Segment | undefined) {
  if (!segment || segment.type === 'break') return null;
  return segment.station;
}

/** One-line "up next" descriptor for the following segment. */
function nextLabel(segment: Segment | undefined): string {
  if (!segment) return 'Finish';
  if (segment.type === 'break') return 'Rest';
  return segment.station.movement;
}

/** Ahead/behind readout for the pace delta — positive means the schedule
 *  hasn't yet reached the point the athlete needs to leave their current
 *  segment by; negative means it already has. */
function paceDeltaLabel(deltaSec: number): string {
  const rounded = Math.round(deltaSec);
  if (rounded === 0) return 'on pace';
  return rounded > 0 ? `${mmss(rounded)} ahead` : `${mmss(-rounded)} behind`;
}

type EmomSnapshot = Extract<
  ActiveRunSnapshot,
  { mode: 'emom' } | { mode: 'interval' }
>;

interface EmomPlayerProps {
  // Interval workouts play here too — both compile to a Segment[] the same
  // hooks drive; only `title` and `expand()` are read off the workout.
  workout: EmomWorkout | IntervalWorkout;
  /** In-run state to start from — fresh from Start, or restored on reload. */
  snapshot: EmomSnapshot;
  cues: AudioCues;
  /** Fired exactly once when the athlete taps through the final segment,
   *  carrying true elapsed seconds (the workout's real end is emergent, not
   *  the schedule's nominal total). */
  onComplete?: (elapsedSec: number) => void;
  /** Leave the run (quit mid-way, or "back to start" from the done screen). */
  onExit: () => void;
}

export default function EmomPlayer({
  workout,
  snapshot,
  cues,
  onComplete,
  onExit,
}: EmomPlayerProps) {
  const segments = expand(workout);
  const schedule = useSchedule(segments);
  const athlete = useAthletePointer({
    athleteIndex: snapshot.athleteIndex,
    athleteSegmentStartedAtMs: snapshot.athleteSegmentStartedAtMs,
  });

  // Auto-start the schedule ghost on mount at the elapsed time the start
  // timestamp implies (0 for a fresh run; wherever the buzzer would be for
  // a restore) — it never gates the athlete pointer, only informs the delta.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    schedule.start((Date.now() - snapshot.startedAtMs) / 1000);
  }, [schedule, snapshot.startedAtMs]);

  const running = schedule.status === 'running';
  const [done, setDone] = useState(false);
  useWakeLock(running && !done);

  const current = segments[athlete.athleteIndex];
  const next = segments[athlete.athleteIndex + 1];
  const station = stationOf(current);
  const pace = station ? paceLabel(station.pace) : null;

  // Ghost's own transition — an ambient pace beacon, independent of the
  // athlete's progress.
  const prevScheduleIndex = useRef<number | null>(null);
  useEffect(() => {
    if (!running) {
      prevScheduleIndex.current = null;
      return;
    }
    if (
      prevScheduleIndex.current !== null &&
      prevScheduleIndex.current !== schedule.scheduleIndex
    ) {
      cues.beacon();
    }
    prevScheduleIndex.current = schedule.scheduleIndex;
  }, [running, schedule.scheduleIndex, cues]);

  // 3-2-1 lead-in to the *schedule's* next transition, not the athlete's.
  const lastBeep = useRef('');
  useEffect(() => {
    if (!running) return;
    const r = schedule.scheduleRemaining;
    if (r >= 1 && r <= 3) {
      const tag = `${schedule.scheduleIndex}:${r}`;
      if (lastBeep.current !== tag) {
        lastBeep.current = tag;
        cues.countdown();
      }
    }
  }, [running, schedule.scheduleIndex, schedule.scheduleRemaining, cues]);

  // Circuit checklist: a per-segment memory aid, never a gate — the whole
  // station still only advances on the "Done" tap below, and every new
  // segment starts unchecked.
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set());
  useEffect(() => {
    setChecked(new Set());
  }, [athlete.athleteIndex]);
  const togglePart = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  // Soft pacing tick at whole minutes on the athlete's own current station —
  // circuits only, same as before, just keyed off the athlete's own time
  // rather than the old gating segment clock.
  const lastTick = useRef('');
  useEffect(() => {
    if (!running || !station?.circuit) return;
    const minute = Math.floor(athlete.athleteSegmentElapsed / 60);
    if (minute >= 1) {
      const tag = `${athlete.athleteIndex}:${minute}`;
      if (lastTick.current !== tag) {
        lastTick.current = tag;
        cues.tick();
      }
    }
  }, [running, athlete.athleteIndex, athlete.athleteSegmentElapsed, station, cues]);

  // Fire-once guard: finish() can only be reached from the "Done" tap on the
  // final segment.
  const finishedRef = useRef(false);
  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    schedule.pause();
    athlete.pause();
    cues.finish();
    onComplete?.(schedule.scheduleElapsed);
    setDone(true);
  };

  const handleDone = () => {
    if (done) return;
    if (athlete.athleteIndex + 1 >= segments.length) {
      finish();
    } else {
      cues.start();
      athlete.advance();
    }
  };

  const handlePauseRun = () => {
    schedule.pause();
    athlete.pause();
  };
  const handleResumeRun = () => {
    schedule.resume();
    athlete.resume();
  };

  // Persist in-run state on every mutation; the parent clears it on finish,
  // so stop writing once the run is done.
  const persistable = !done;
  useEffect(() => {
    if (!persistable) return;
    saveActiveRun({
      mode: snapshot.mode,
      slug: snapshot.slug,
      startedAtMs: snapshot.startedAtMs,
      runId: snapshot.runId,
      athleteIndex: athlete.athleteIndex,
      athleteSegmentStartedAtMs: athlete.athleteSegmentStartedAtMs,
    });
  }, [
    persistable,
    snapshot,
    athlete.athleteIndex,
    athlete.athleteSegmentStartedAtMs,
  ]);

  // ── Finished (athlete tapped through the final segment) ─────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div aria-hidden="true" className="text-5xl">
          ✅
        </div>
        <h2 className="text-2xl font-bold">{workout.title} complete</h2>
        <p className="text-fg-muted">
          {mmss(schedule.scheduleElapsed)} elapsed.
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

  // ── Running / paused ────────────────────────────────────────────────────
  const type = current?.type ?? 'work';
  const round = current?.type === 'work' ? current.round : undefined;
  const blockLabel =
    current?.type === 'work'
      ? (current.blockLabel ?? `Block ${current.blockIndex + 1}`)
      : undefined;

  const nominalSec = current?.durationSec ?? 0;
  const overNominal = athlete.athleteSegmentElapsed > nominalSec;
  const delta =
    schedule.startOf(athlete.athleteIndex + 1) - schedule.scheduleElapsed;

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${SEGMENT_PILL_CLASS[type]}`}
        >
          {SEGMENT_LABELS[type]}
        </span>
        <span className="text-sm text-fg-muted">
          {athlete.athleteIndex + 1} / {segments.length}
          {blockLabel ? ` · ${blockLabel}${round ? ` · rd ${round}` : ''}` : ''}
        </span>
      </div>

      <div
        aria-live="off"
        className={`tabular-nums text-[22vw] font-black leading-none sm:text-[12rem] ${SEGMENT_TEXT_CLASS[type]}`}
      >
        {mmss(athlete.athleteSegmentElapsed)}
      </div>
      {nominalSec > 0 && (
        <p className="-mt-4 text-sm text-fg-muted">
          target {mmss(nominalSec)}
          {overNominal ? ' · over' : ''}
        </p>
      )}

      <div className="flex flex-col items-center gap-0.5">
        <p
          className={`text-sm font-bold ${delta < 0 ? 'text-behind' : 'text-fg-muted'}`}
        >
          {paceDeltaLabel(delta)}
        </p>
        <p className="text-xs text-fg-muted">
          Schedule: station {schedule.scheduleIndex + 1} / {segments.length}
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-1">
        {station ? (
          station.circuit ? (
            <div className="flex w-full max-w-sm flex-col gap-1.5">
              {station.circuit.map((part, i) => {
                const partDone = checked.has(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => togglePart(i)}
                    aria-pressed={partDone}
                    className={`flex items-baseline justify-between gap-4 rounded-xl bg-bg-elevated px-4 py-3 text-left text-lg font-semibold transition-colors ${
                      partDone ? 'text-fg-muted line-through' : ''
                    }`}
                  >
                    <span>
                      {partDone ? '✓ ' : ''}
                      {part.movement}
                    </span>
                    <span className="shrink-0 text-sm font-normal text-fg-muted">
                      {part.measure ? measureLabel(part.measure) : ''}
                      {part.load ? ` · ${part.load}` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold">{station.movement}</p>
              <p className="text-lg text-fg-muted">
                {measureLabel(station.measure)}
                {station.load ? ` · ${station.load}` : ''}
              </p>
              {pace && <p className="text-sm text-fg-muted">{pace}</p>}
            </>
          )
        ) : (
          <p className="text-3xl font-bold">Rest</p>
        )}
      </div>

      <p className="text-fg-muted">
        Next: <strong className="text-fg">{nextLabel(next)}</strong>
      </p>

      <button
        type="button"
        onClick={handleDone}
        className="w-full max-w-xs rounded-xl bg-work px-8 py-5 text-xl font-bold text-black transition-transform active:scale-[0.96]"
      >
        {type === 'break' ? 'Ready' : 'Done'}
      </button>

      <div className="flex gap-3">
        {running ? (
          <button
            type="button"
            onClick={handlePauseRun}
            className="rounded-xl border border-border px-6 py-3 font-semibold"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={handleResumeRun}
            className="rounded-xl bg-bg-elevated px-6 py-3 font-bold"
          >
            Resume run
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
