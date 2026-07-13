# Delta: amrap-workouts

## ADDED Requirements

### Requirement: AMRAP is a distinct workout mode
The workout model SHALL provide an `amrap` mode: a fixed time cap and one round of rep targets the athlete repeats for the duration, discriminated from `emom`, `rep`, and `interval` by its `mode`. An AMRAP workout SHALL declare `capMin` and an ordered `round` of rep targets, and MAY declare a `roundStep` that increments every target's rep count by a fixed amount each successive round.

#### Scenario: AMRAP dispatches to the round-counting runtime
- **WHEN** a workout with `mode: 'amrap'` is loaded
- **THEN** consumers select the AMRAP runtime by mode alone, without inspecting `round`

#### Scenario: Ascending round scheme
- **WHEN** an AMRAP declares `roundStep: 1` on a round of `1 pushup renegade row, 1 kb high pull, 1 russian twist`
- **THEN** round 1 prescribes 1 of each, round 2 prescribes 2 of each, and round N prescribes N of each

### Requirement: The clock ends an AMRAP, not the athlete
An AMRAP SHALL run on a count-up clock bounded by `capMin`; it ends when the cap is reached regardless of rounds completed, and completing a round never ends the workout.

#### Scenario: Cap ends the workout
- **WHEN** the athlete has logged 12 rounds at the `capMin` boundary
- **THEN** the workout finishes and reports 12 rounds' worth of work as completed

### Requirement: Round count is tracked and survives reload
The AMRAP player SHALL let the athlete increment and decrement the completed-round count, never below zero, and SHALL persist the count to the active-run snapshot so a reload mid-run restores it.

#### Scenario: Decrement floors at zero
- **WHEN** the round count is 0 and the athlete taps decrement
- **THEN** it stays 0

#### Scenario: Reload restores the count
- **WHEN** a run with 5 rounds logged is reloaded before the cap
- **THEN** the player resumes at 5 rounds with the clock continuing from the original start
