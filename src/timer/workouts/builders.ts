// Authoring helpers for repeat-with-variation, so rep schemes aren't written
// rung by rung. Pure — they only build data.

import type { RepTarget } from './types';

/** Repeat a round's targets n times, in order — "N rounds for time". */
export function rounds(n: number, targets: RepTarget[]): RepTarget[] {
  return Array.from({ length: n }, () => targets).flat();
}

/** Inclusive integer range, ascending or descending: range(12,1) → 12..1. */
export function range(from: number, to: number): number[] {
  const step = from <= to ? 1 : -1;
  const out: number[] = [];
  for (let n = from; step > 0 ? n <= to : n >= to; n += step) out.push(n);
  return out;
}

/** A movement in a ladder, sans count (the scheme supplies the count). */
export interface LadderMovement {
  movement: string;
  load?: string;
  notes?: string;
}

/**
 * Expand a rep scheme over a movement list into ordered rep targets: for each
 * count in `scheme`, one target per movement at that count. A `12-1` pyramid
 * of four movements is `ladder(range(12, 1), moves)`; an up-and-down ladder is
 * `ladder([...range(5, 20), ...range(20, 5)], moves)` (dedupe the peak by
 * dropping one of the 20s in the scheme if unwanted).
 */
export function ladder(
  scheme: number[],
  movements: LadderMovement[],
): RepTarget[] {
  return scheme.flatMap((count) =>
    movements.map((m) => ({
      movement: m.movement,
      count,
      ...(m.load ? { load: m.load } : {}),
      ...(m.notes ? { notes: m.notes } : {}),
    })),
  );
}
