# Delta: workout-origins

## ADDED Requirements

### Requirement: Every workout declares its origin
The workout model SHALL require an `origin` field on every workout distinguishing David Rosen originals (`original`) from other workouts (`generated`). All four existing workouts SHALL be marked `original`.

#### Scenario: Registry is fully attributed
- **WHEN** the registry is loaded
- **THEN** every workout carries an origin, and emom-30, the 60/30 chipper, 300 pushups, and 6×5 Cycles are all `original`

### Requirement: Origin is visible in the UI
The idle overview SHALL display an origin badge on the selected workout — originals attributed to David Rosen, generated workouts visibly distinct — so an athlete always knows which they're looking at.

#### Scenario: Original badge
- **WHEN** an `original` workout is selected on the idle screen
- **THEN** a badge attributes it to David Rosen (e.g. "DR original")

#### Scenario: Generated badge
- **WHEN** a `generated` workout is selected
- **THEN** its badge reads as generated, visually distinct from the original badge
