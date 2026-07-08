import { useEffect, useState } from 'react';

import { fetchResults, type WorkoutResult } from '../heatmap/api';
import { mmss } from '../timer/format';

function resultLine(r: WorkoutResult): string {
  const parts: string[] = [];
  if (r.totalReps !== null) parts.push(`${r.totalReps} reps`);
  if (r.durationSec !== null) parts.push(mmss(r.durationSec));
  if (r.breaks) parts.push(`${r.breaks} break${r.breaks === 1 ? '' : 's'}`);
  if (!r.completedAll) parts.push('capped');
  return parts.join(' · ');
}

/**
 * The workout's whiteboard: completed, named runs from the Worker, newest
 * first. Renders nothing while loading, unavailable, or empty — the board is
 * a bonus layer over the timer, never a blocker.
 */
export default function ResultsBoard({ slug }: { slug: string }) {
  const [results, setResults] = useState<WorkoutResult[] | null>(null);

  useEffect(() => {
    let live = true;
    setResults(null);
    void fetchResults(slug).then((r) => {
      if (live) setResults(r);
    });
    return () => {
      live = false;
    };
  }, [slug]);

  if (!results || results.length === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-bg-elevated p-4">
      <h3 className="text-sm font-semibold text-fg-muted">Whiteboard</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {results.map((r, i) => (
          <li key={i} className="flex items-baseline justify-between gap-4 text-sm">
            <div className="min-w-0">
              <span className="font-semibold">{r.name}</span>
              <span className="text-fg-muted"> — {resultLine(r)}</span>
              {r.notes && (
                <p className="truncate text-xs text-fg-muted">{r.notes}</p>
              )}
            </div>
            <span className="shrink-0 text-xs text-fg-muted">{r.day}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
