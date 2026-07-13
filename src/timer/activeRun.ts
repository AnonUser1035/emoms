// Active-run snapshot: the app's single piece of client-side persistence.
//
// At most one snapshot exists — the workout currently in progress — written on
// every state change and cleared on finish or discard, so an accidental reload
// (or a mobile browser killing the tab) resumes instead of losing the run.
// Both clocks are timestamp-anchored, so restoring needs no "time served"
// bookkeeping: recomputing elapsed from `startedAtMs` is exact. This is
// deliberately not run history; the server stays the system of record.

import { expand } from './expand';
import { getWorkout } from './workouts';

const KEY = 'emoms.activeRun.v1';

/** Auto-resume window past a run's known length (cap or EMOM total). */
const SLACK_SEC = 30 * 60;
/** Auto-resume window for uncapped rep workouts, which have no known length. */
const UNCAPPED_BOUND_SEC = 4 * 60 * 60;

interface BaseSnapshot {
  slug: string;
  /** Wall-clock start — elapsed time is recomputed from this on restore. */
  startedAtMs: number;
  /** Server run id (set by the run-lifecycle layer when available). */
  runId?: string;
}

export type ActiveRunSnapshot =
  // Clock-paced runs (emom, interval) resume purely from startedAtMs — the
  // timeline is recomputed, so no per-run bookkeeping is stored.
  | ({ mode: 'emom' } & BaseSnapshot)
  | ({ mode: 'interval' } & BaseSnapshot)
  | ({ mode: 'amrap'; rounds: number } & BaseSnapshot)
  | ({
      mode: 'rep';
      targetIndex: number;
      repsByTarget: number[];
      breaks: number;
      inBreak: boolean;
    } & BaseSnapshot);

export function saveActiveRun(snapshot: ActiveRunSnapshot): void {
  try {
    // The server run id arrives asynchronously after the snapshot is first
    // written (and players re-save without knowing it). Once known for this
    // run, it sticks — a save without one never erases it.
    if (!snapshot.runId) {
      const existing = loadActiveRun();
      if (existing && existing.slug === snapshot.slug && existing.runId) {
        snapshot = { ...snapshot, runId: existing.runId };
      }
    }
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // Storage unavailable (private mode, quota) — run just won't survive
    // a reload, which is the pre-snapshot behaviour.
  }
}

/** Attach the server run id to the stored snapshot (slug-guarded). */
export function setActiveRunId(slug: string, runId: string): void {
  const existing = loadActiveRun();
  if (existing && existing.slug === slug) {
    saveActiveRun({ ...existing, runId });
  }
}

export function clearActiveRun(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Ignore — see saveActiveRun.
  }
}

/**
 * Load and validate the stored snapshot. Anything unparseable, mis-shaped, or
 * referring to an unknown/mismatched workout is silently discarded — a schema
 * change bumps KEY's version suffix, and old keys simply never load.
 */
export function loadActiveRun(): ActiveRunSnapshot | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearActiveRun();
    return null;
  }

  if (isValidSnapshot(parsed)) return parsed;
  clearActiveRun();
  return null;
}

function isValidSnapshot(value: unknown): value is ActiveRunSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  if (typeof s.slug !== 'string' || !Number.isFinite(s.startedAtMs)) {
    return false;
  }
  const workout = getWorkout(s.slug);
  if (!workout) return false;

  if (s.mode === 'emom') return workout.mode === 'emom';
  if (s.mode === 'interval') return workout.mode === 'interval';
  if (s.mode === 'amrap') {
    return workout.mode === 'amrap' && Number.isInteger(s.rounds);
  }
  if (s.mode !== 'rep' || workout.mode !== 'rep') return false;
  return (
    Number.isInteger(s.targetIndex) &&
    Array.isArray(s.repsByTarget) &&
    s.repsByTarget.length === workout.targets.length &&
    s.repsByTarget.every((n) => Number.isFinite(n)) &&
    Number.isInteger(s.breaks) &&
    typeof s.inBreak === 'boolean'
  );
}

/**
 * A stale snapshot is offered resume-or-discard instead of auto-resuming.
 * Bound: known run length (EMOM total, or rep cap) plus slack; uncapped rep
 * workouts get a fixed multi-hour window.
 */
export function isStaleActiveRun(snapshot: ActiveRunSnapshot): boolean {
  const workout = getWorkout(snapshot.slug);
  if (!workout) return true;

  let boundSec: number;
  if (workout.mode === 'emom' || workout.mode === 'interval') {
    const totalSec = expand(workout).reduce((acc, s) => acc + s.durationSec, 0);
    boundSec = totalSec + SLACK_SEC;
  } else if (workout.mode === 'amrap') {
    boundSec = workout.capMin * 60 + SLACK_SEC;
  } else if (workout.capMin != null) {
    boundSec = workout.capMin * 60 + SLACK_SEC;
  } else {
    boundSec = UNCAPPED_BOUND_SEC;
  }

  return (Date.now() - snapshot.startedAtMs) / 1000 > boundSec;
}
