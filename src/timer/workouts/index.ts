// Workout registry — the single library, assembled from the shape files.
// Every consumer imports types and the registry from here (`./workouts`);
// adding a workout is a data-only edit in one of the shape modules.

export type {
  Measure,
  Pace,
  CircuitPart,
  MovementStation,
  CircuitStation,
  Station,
  Trailing,
  Block,
  WorkoutOrigin,
  EmomWorkout,
  RepTarget,
  RepWorkout,
  AmrapWorkout,
  IntervalWorkout,
  Workout,
  RunSummary,
  Segment,
} from './types';

import type { Workout } from './types';
import { emomWorkouts } from './emom';
import { emomLibrary } from './emomLibrary';
import { repWorkouts } from './rep';
import { repLibrary } from './repLibrary';
import { amrapWorkouts } from './amrap';
import { intervalWorkouts } from './interval';

const workouts: Workout[] = [
  ...emomWorkouts,
  ...emomLibrary,
  ...repWorkouts,
  ...repLibrary,
  ...amrapWorkouts,
  ...intervalWorkouts,
];

export function getWorkout(slug: string): Workout | undefined {
  return workouts.find((w) => w.slug === slug);
}

export default workouts;
