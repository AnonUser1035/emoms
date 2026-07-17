import { useState } from 'react';

import { completeRun, type RunResultPayload } from '../heatmap/api';
import { getIdentity, setAthleteName } from '../whiteboard/identity';
import { mmss } from './format';

export interface FinishedRun {
  slug: string;
  title: string;
  runId: string | null;
  result: RunResultPayload;
}

interface FinishScreenProps {
  run: FinishedRun;
  /** Fired after the completion event has been posted (or attempted). */
  onPosted?: () => void;
  /** Return to the idle screen. */
  onDone: () => void;
}

/**
 * The single hand-off point from a finished run to the shared record: shows
 * the summary, asks for a whiteboard name on every finish (pre-filled with
 * whatever was used last on this device), takes optional notes, and posts
 * the completion event. The run completes on the server whether or not a
 * name is given — a nameless run counts on the heatmap but stays off the
 * whiteboard.
 */
export default function FinishScreen({
  run,
  onPosted,
  onDone,
}: FinishScreenProps) {
  const [identity] = useState(() => getIdentity());
  const [nameInput, setNameInput] = useState(identity.name ?? '');
  const [notes, setNotes] = useState('');
  const [posting, setPosting] = useState(false);

  const { result } = run;
  const statLine =
    result.totalReps !== null
      ? `${result.totalReps} reps in ${mmss(result.durationSec)}`
      : `${mmss(result.durationSec)} of work done`;

  const handleFinish = async () => {
    if (posting) return;
    setPosting(true);
    const trimmed = nameInput.trim();
    setAthleteName(trimmed);
    const name = trimmed ? trimmed : null;
    await completeRun(
      run.runId,
      run.slug,
      result,
      { name, deviceId: identity.deviceId },
      notes.trim() || undefined,
    );
    onPosted?.();
    onDone();
  };

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div aria-hidden="true" className="text-5xl">
        {result.completedAll ? '✅' : '⏱️'}
      </div>
      <div>
        <h2 className="text-2xl font-bold">
          {run.title} {result.completedAll ? 'complete' : '— time'}
        </h2>
        <p className="mt-1 text-fg-muted">
          {statLine}
          {result.breaks
            ? ` · ${result.breaks} break${result.breaks === 1 ? '' : 's'}`
            : ''}
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Your name (for the whiteboard)"
          maxLength={40}
          className="rounded-xl border border-border bg-bg-elevated px-4 py-3"
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes — e.g. 150 hr · 48.5 lb goblet"
          maxLength={200}
          className="rounded-xl border border-border bg-bg-elevated px-4 py-3"
        />
      </div>

      <button
        type="button"
        onClick={() => void handleFinish()}
        disabled={posting}
        className="rounded-xl bg-work px-8 py-3 text-lg font-bold text-black disabled:opacity-60"
      >
        Finish
      </button>
    </div>
  );
}
