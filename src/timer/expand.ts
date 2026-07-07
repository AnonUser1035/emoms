// Pure compiler: authoring model → flat runtime timeline.
//
// The timer plays a Segment[] and knows nothing about blocks or rotations.
// All EMOM structure — rotation, per-station intervals, run-to-the-clock
// partial rounds, trailing breaks/holds — is resolved here, deterministically.

import type { Block, Segment, Station, Workout } from './workouts';

/** Seconds a station occupies within a block (hold = its own length). */
function stationSeconds(station: Station, defaultInterval: number): number {
  if (station.measure.kind === 'hold') return station.measure.seconds;
  return station.interval ?? defaultInterval;
}

function expandBlock(block: Block, blockIndex: number): Segment[] {
  const segments: Segment[] = [];
  const blockSec = block.durationMin * 60;
  const { stations } = block;

  if (stations.length > 0) {
    let elapsed = 0;
    let i = 0;
    // Rotate one station per interval, running to the clock: only add a full
    // station turn while it fits within the block's duration. A block whose
    // duration isn't a whole multiple of the rotation continues from the next
    // station and stops at the boundary (Option A), never emitting a partial
    // segment that would overrun.
    while (true) {
      const station = stations[i % stations.length];
      const turn = stationSeconds(station, block.intervalSec);
      if (elapsed + turn > blockSec) break;
      segments.push({
        type: 'work',
        durationSec: turn,
        station,
        blockIndex,
        blockLabel: block.label,
        round: Math.floor(i / stations.length) + 1,
      });
      elapsed += turn;
      i += 1;
    }
  }

  for (const trailing of block.then ?? []) {
    if (trailing.kind === 'break') {
      segments.push({
        type: 'break',
        durationSec: trailing.seconds,
        blockIndex,
      });
    } else {
      segments.push({
        type: 'hold',
        durationSec: stationSeconds(trailing.station, block.intervalSec),
        station: trailing.station,
        blockIndex,
      });
    }
  }

  return segments;
}

/** Flatten a workout into the ordered timeline the timer plays. Pure. */
export function expand(workout: Workout): Segment[] {
  return workout.blocks.flatMap((block, index) => expandBlock(block, index));
}
