import { useEffect, useRef, useState } from 'react';

import type { EmomWorkout, IntervalWorkout, Segment } from './workouts';
import type { AudioCues } from './audio';
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
  // Interval workouts play here too — both compile to a Segment[] the same
  // clock drives; only `title` and `expand()` are read off the workout.
  workout: EmomWorkout | IntervalWorkout;
  /** Wall-clock start (from the active-run snapshot) — playback begins at
   *  the elapsed time this implies, so a restored run resumes mid-timeline. */
  startedAtMs: number;
  cues: AudioCues;
  /** Fired exactly once when the workout's full timeline completes. */
  onComplete?: () => void;
  /** Leave the run (quit mid-way, or "back to start" from the done screen). */
  onExit: () => void;
}

export default function EmomPlayer({
  workout,
  startedAtMs,
  cues,
  onComplete,
  onExit,
}: EmomPlayerProps) {
  const segments = expand(workout);
  const clock = useIntervalClock(segments);

  // Auto-start on mount at the elapsed time the start timestamp implies
  // (0 for a fresh run; mid-timeline — or straight to done — for a restore).
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    clock.start((Date.now() - startedAtMs) / 1000);
  }, [clock, startedAtMs]);

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
      cues.start();
    }
    prevIndex.current = clock.segmentIndex;
  }, [running, clock.segmentIndex, cues]);

  // 3-2-1 countdown beeps in the final seconds of a segment.
  const lastBeep = useRef('');
  useEffect(() => {
    if (!running) return;
    const r = clock.segmentRemaining;
    if (r >= 1 && r <= 3) {
      const tag = `${clock.segmentIndex}:${r}`;
      if (lastBeep.current !== tag) {
        lastBeep.current = tag;
        cues.countdown();
      }
    }
  }, [running, clock.segmentIndex, clock.segmentRemaining, cues]);

  // Circuit checklist: a per-segment memory aid, never a gate — the clock
  // ends the segment regardless, and every new segment starts unchecked.
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set());
  useEffect(() => {
    setChecked(new Set());
  }, [clock.segmentIndex]);
  const togglePart = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  // Soft pacing tick at whole minutes inside circuit segments only — the
  // loud start beep and 3-2-1 stay reserved for segment boundaries. Keyed on
  // the minute *number* (not an exact elapsed value) so a dropped or
  // coalesced render never swallows a tick, and a throttled tab that jumps
  // forward re-syncs with a single tick for the current minute.
  const lastTick = useRef('');
  useEffect(() => {
    if (!running || !station?.circuit) return;
    const minute = Math.floor(clock.segmentElapsed / 60);
    if (minute >= 1) {
      const tag = `${clock.segmentIndex}:${minute}`;
      if (lastTick.current !== tag) {
        lastTick.current = tag;
        cues.tick();
      }
    }
  }, [running, clock.segmentIndex, clock.segmentElapsed, station, cues]);

  // End-of-workout: flourish + a single onComplete call, guarded against
  // re-firing on re-render.
  const completedFired = useRef(false);
  useEffect(() => {
    if (clock.status !== 'done' || completedFired.current) return;
    completedFired.current = true;
    cues.finish();
    onComplete?.();
  }, [clock.status, onComplete, cues]);

  // ── Done ────────────────────────────────────────────────────────────────
  if (clock.status === 'done') {
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

      <div className="flex w-full flex-col items-center gap-1">
        {station ? (
          station.circuit ? (
            <div className="flex w-full max-w-sm flex-col gap-1.5">
              {station.circuit.map((part, i) => {
                const done = checked.has(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => togglePart(i)}
                    aria-pressed={done}
                    className={`flex items-baseline justify-between gap-4 rounded-xl bg-bg-elevated px-4 py-3 text-left text-lg font-semibold transition-colors ${
                      done ? 'text-fg-muted line-through' : ''
                    }`}
                  >
                    <span>
                      {done ? '✓ ' : ''}
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
          onClick={onExit}
          className="rounded-xl px-6 py-3 font-semibold text-fg-muted hover:text-fg"
        >
          Quit
        </button>
      </div>
    </div>
  );
}
