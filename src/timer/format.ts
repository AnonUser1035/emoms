import type { Measure, Pace } from './workouts';

/** Seconds → "m:ss". */
export function mmss(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec));
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

/** Human label for a station's work target. */
export function measureLabel(measure: Measure): string {
  switch (measure.kind) {
    case 'reps':
      return `${measure.count} reps`;
    case 'perSide':
      return `${measure.count}/${measure.count} each side`;
    case 'cal':
      return measure.meters
        ? `${measure.count} cal · ${measure.meters}m`
        : `${measure.count} cal`;
    case 'dist':
      return `${measure.meters} m`;
    case 'hold':
      return `${measure.seconds} sec hold`;
  }
}

/** Pace-line text for erg stations, or null when no target is set. */
export function paceLabel(pace?: Pace): string | null {
  if (pace?.calPerMin) return `hold ≥ ${pace.calPerMin} cal/min`;
  return null;
}
