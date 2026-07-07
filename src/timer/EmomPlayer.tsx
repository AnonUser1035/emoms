import { useEffect, useMemo, useRef, useState } from 'react';

import workouts, { type Segment, type Workout } from './workouts';
import { AudioCues } from './audio';
import { expand } from './expand';
import { measureLabel, mmss, paceLabel } from './format';
import { useIntervalClock } from './useIntervalClock';
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

interface EmomPlayerProps {
  /** Fired exactly once when a workout's full timeline completes. */
  onComplete?: () => void;
}

export default function EmomPlayer({ onComplete }: EmomPlayerProps) {
  const [workout, setWorkout] = useState<Workout>(workouts[0]);
  const segments = useMemo(() => expand(workout), [workout]);
  const clock = useIntervalClock(segments);
  const cues = useRef<AudioCues | null>(null);
  if (!cues.current) cues.current = new AudioCues();

  const running = clock.status === 'running';
  useWakeLock(running);

  const current = segments[clock.segmentIndex];
  const next = segments[clock.segmentIndex + 1];
  const station = stationOf(current);
  const pace = station ? paceLabel(station.pace) : null;

  // Start tone / transition cue when the active segment changes.
  const prevIndex = useRef<number | null>(null);
  useEffect(() => {
    if (!running) {
      prevIndex.current = null;
      return;
    }
    if (
      prevIndex.current !== null &&
      prevIndex.current !== clock.segmentIndex
    ) {
      cues.current?.start();
    }
    prevIndex.current = clock.segmentIndex;
  }, [running, clock.segmentIndex]);

  // 3-2-1 countdown beeps in the final seconds of a segment.
  const lastBeep = useRef('');
  useEffect(() => {
    if (!running) return;
    const r = clock.segmentRemaining;
    if (r >= 1 && r <= 3) {
      const tag = `${clock.segmentIndex}:${r}`;
      if (lastBeep.current !== tag) {
        lastBeep.current = tag;
        cues.current?.countdown();
      }
    }
  }, [running, clock.segmentIndex, clock.segmentRemaining]);

  // End-of-workout: flourish + a single onComplete call, guarded against
  // re-firing on re-render (a ref survives renders within the same run;
  // resetting the clock back to idle clears it for the next attempt).
  const completedFired = useRef(false);
  useEffect(() => {
    if (clock.status === 'done') {
      cues.current?.finish();
      if (!completedFired.current) {
        completedFired.current = true;
        onComplete?.();
      }
    } else if (clock.status === 'idle') {
      completedFired.current = false;
    }
  }, [clock.status, onComplete]);

  const handleStart = () => {
    cues.current?.unlock();
    cues.current?.start();
    prevIndex.current = 0;
    clock.start();
  };

  const idle = clock.status === 'idle';
  const done = clock.status === 'done';

  // ── Idle: workout overview + start ──────────────────────────────────────
  if (idle) {
    return (
      <div className="flex flex-col gap-6">
        {workouts.length > 1 && (
          <div
            role="tablist"
            aria-label="Choose a workout"
            className="flex gap-2"
          >
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
            <h2 className="text-2xl font-bold tracking-tight">
              {workout.title}
            </h2>
            <p className="mt-1 text-fg-muted">{workout.summary}</p>
          </div>

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

  // ── Done ────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div aria-hidden="true" className="text-5xl">
          ✅
        </div>
        <h2 className="text-2xl font-bold">{workout.title} complete</h2>
        <p className="text-fg-muted">
          {mmss(clock.totalDuration)} of work done.
        </p>
        <button
          type="button"
          onClick={clock.reset}
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

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${SEGMENT_PILL_CLASS[type]}`}
        >
          {SEGMENT_LABELS[type]}
        </span>
        <span className="text-sm text-fg-muted">
          {clock.segmentIndex + 1} / {segments.length}
          {blockLabel ? ` · ${blockLabel}${round ? ` · rd ${round}` : ''}` : ''}
        </span>
      </div>

      <div
        aria-live="off"
        className={`tabular-nums text-[22vw] font-black leading-none sm:text-[12rem] ${SEGMENT_TEXT_CLASS[type]}`}
      >
        {mmss(clock.segmentRemaining)}
      </div>

      <div className="flex flex-col gap-1">
        {station ? (
          <>
            <p className="text-3xl font-bold">{station.movement}</p>
            <p className="text-lg text-fg-muted">
              {measureLabel(station.measure)}
              {station.load ? ` · ${station.load}` : ''}
            </p>
            {pace && <p className="text-sm text-fg-muted">{pace}</p>}
          </>
        ) : (
          <p className="text-3xl font-bold">Rest</p>
        )}
      </div>

      <p className="text-fg-muted">
        Next: <strong className="text-fg">{nextLabel(next)}</strong>
      </p>

      <div className="flex gap-3">
        {running ? (
          <button
            type="button"
            onClick={clock.pause}
            className="rounded-xl border border-border px-6 py-3 font-semibold"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={clock.resume}
            className="rounded-xl bg-work px-6 py-3 font-bold text-black"
          >
            Resume
          </button>
        )}
        <button
          type="button"
          onClick={clock.reset}
          className="rounded-xl px-6 py-3 font-semibold text-fg-muted hover:text-fg"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
