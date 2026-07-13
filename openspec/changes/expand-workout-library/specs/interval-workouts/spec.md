# Delta: interval-workouts

## ADDED Requirements

### Requirement: Interval is a distinct workout mode that compiles to segments
The workout model SHALL provide an `interval` mode for rounds of timed work and rest: it SHALL declare `rounds`, `workSec`, `restSec`, and a `stations` list rotated one per work interval. An interval workout SHALL compile through `expand()` into the same `Segment[]` timeline the interval clock already plays — a `work` segment per round and, when `restSec > 0`, a following `break` segment — introducing no new runtime.

#### Scenario: Tabata compiles to alternating work/rest
- **WHEN** an interval workout declares `rounds: 8, workSec: 20, restSec: 10` with one station
- **THEN** `expand()` emits 16 segments alternating 20-second work and 10-second break, totaling 240 seconds

#### Scenario: No rest emits no break segment
- **WHEN** an interval workout declares `restSec: 0`
- **THEN** `expand()` emits only the per-round work segments, with no break segments

#### Scenario: Stations rotate across rounds
- **WHEN** an interval workout has two stations over four rounds
- **THEN** the work segments cycle station A, B, A, B in order

### Requirement: A max-effort measure
The model SHALL support a `max` measure kind for stations worked to failure rather than a fixed count, labeled "max reps" for display.

#### Scenario: Max station label
- **WHEN** a station declares a `max` measure
- **THEN** its display label reads "max reps"
