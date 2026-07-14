## ADDED Requirements

### Requirement: The athlete's tap is the only thing that advances the workout
The player SHALL maintain an athlete pointer identifying the current segment (station, break, or hold) in the flattened timeline, and SHALL advance it only in response to an explicit athlete "done" tap on the current segment. Elapsed wall-clock time alone SHALL NOT advance the athlete pointer.

#### Scenario: Tapping done before the schedule would advance
- **WHEN** the athlete taps "done" on station 3 with 20 seconds remaining in that station's nominal interval
- **THEN** the player immediately shows station 4 as current

#### Scenario: Nominal interval elapses without a tap
- **WHEN** a station's nominal interval elapses and the athlete has not tapped "done"
- **THEN** the player continues showing that same station as current; nothing forces the athlete onward

### Requirement: A read-only schedule pointer tracks where strict pacing would be
The player SHALL compute a schedule position from wall-clock elapsed time against the segments' cumulative nominal durations, using the same timestamp-anchored method as the prior enforced clock, and SHALL treat this position as informational only — it SHALL NOT gate or move the athlete pointer.

#### Scenario: Schedule advances independently of the athlete
- **WHEN** the athlete is still on station 2 but two stations' worth of nominal time has elapsed
- **THEN** the schedule position reflects station 4 while the athlete pointer still shows station 2

### Requirement: A persistent pace delta is shown
The player SHALL display, at all times during the run, the difference between the schedule's nominal end time for the athlete's current segment (i.e. the schedule's start time for the athlete's *next* segment) and the current elapsed time, labeled as ahead when positive and behind when negative. This means "behind" begins only once the schedule has fully passed the athlete's current segment without a tap — not merely once time has passed within it.

#### Scenario: Athlete is behind
- **WHEN** the schedule's nominal end time for the athlete's current segment passed 1 minute 18 seconds ago and the athlete still has not tapped done
- **THEN** the display reads "1:18 behind" (or equivalent behind-labeled delta)

#### Scenario: Athlete is ahead
- **WHEN** the athlete taps through segments faster than the schedule, banking 32 seconds
- **THEN** the display reads "0:32 ahead" (or equivalent ahead-labeled delta)

#### Scenario: Schedule has already finished
- **WHEN** the schedule's total nominal duration has fully elapsed but the athlete has not yet reached the last segment
- **THEN** the delta continues to grow more behind against the finished schedule, without any other change to the run

### Requirement: The current segment displays a count-up, not a countdown
The player SHALL display elapsed time on the current segment counting up from the moment the athlete pointer last advanced (or from run start, for the first segment), anchored to a wall-clock timestamp so it is accurate across background tab throttling. The segment's nominal interval length SHALL be shown as a reference value, not a deadline, and SHALL NOT cause the segment to end on its own.

#### Scenario: Count-up since last tap
- **WHEN** the athlete tapped into the current station 47 seconds ago
- **THEN** the display shows 00:47 counting up, alongside the station's nominal interval as a reference

#### Scenario: Exceeding the nominal interval does not end the segment
- **WHEN** the athlete's time on the current station exceeds its nominal interval
- **THEN** the display continues counting up on the same station; the player takes no automatic action

### Requirement: Breaks and holds are tap-gated like work stations
Trailing break and hold segments SHALL require an explicit athlete tap to resume, rather than clearing automatically when their nominal duration elapses. The schedule pointer SHALL still assign these segments their nominal duration for pace-delta purposes.

#### Scenario: Break does not end on its own
- **WHEN** a break segment's nominal duration elapses and the athlete has not tapped resume
- **THEN** the player continues showing the break screen until the athlete taps resume

#### Scenario: Break contributes to the schedule
- **WHEN** computing the pace delta for the segment after a break
- **THEN** the break's nominal duration is included in the schedule's cumulative time the same as any work segment

### Requirement: Circuit stations advance as a single unit
A circuit station's per-part checklist SHALL remain a non-gating memory aid that resets each time the athlete pointer enters that station. The athlete pointer SHALL advance past a circuit station only on a single whole-station "done" tap, independent of how many parts are checked.

#### Scenario: Unchecked parts do not block advancement
- **WHEN** the athlete taps "done" on a circuit station with some parts still unchecked
- **THEN** the player advances to the next segment regardless

### Requirement: The workout ends when the athlete taps through the final segment
The player SHALL end the workout when the athlete pointer advances past the last segment in the timeline, regardless of the schedule's state. The player SHALL NOT end the workout when the schedule reaches its total duration while the athlete pointer has segments remaining.

#### Scenario: Athlete finishes after the schedule would have ended
- **WHEN** the schedule's total duration has already elapsed and the athlete then taps "done" on the final remaining segment
- **THEN** the workout ends at that tap, with the completion callback firing exactly once

#### Scenario: Schedule finishing does not end the workout
- **WHEN** the schedule reaches its total duration but the athlete pointer is still short of the last segment
- **THEN** the workout continues; only the pace delta reflects the overrun

### Requirement: Audio cues distinguish the athlete's advance from the schedule's pace beacon
The player SHALL play a distinct tone when the athlete pointer advances (the athlete's own transition) and a separate, audibly distinct tone when the schedule pointer crosses into a new segment (an ambient pace beacon), independent of one another. The final-seconds countdown cue SHALL be tied to the schedule's remaining time in its current segment, not the athlete's.

#### Scenario: Athlete's own tap plays the advance tone
- **WHEN** the athlete taps "done" on the current segment
- **THEN** the advance tone plays immediately, regardless of where the schedule pointer is

#### Scenario: Schedule crossing plays the beacon tone
- **WHEN** the schedule pointer crosses into its next segment while the athlete has not yet tapped
- **THEN** the beacon tone plays, audibly different from the advance tone, and the athlete pointer does not change

### Requirement: An in-progress EMOM or interval run survives page reloads
The player SHALL persist the athlete pointer's index and the wall-clock timestamp of its last advance to the active-run snapshot on every advance, and SHALL restore both on load, recomputing the current segment's count-up from the stored timestamp. The schedule pointer SHALL be restored purely by recomputing from the run's stored start time, as before.

#### Scenario: Reload mid-run resumes the athlete's actual position
- **WHEN** the page reloads while the athlete pointer is on segment 5, tapped into 40 seconds ago
- **THEN** the restored player shows segment 5 as current with elapsed time recomputed as ≈40 seconds plus reload time, and the schedule pointer recomputed independently from the run's start time

#### Scenario: Stale run bound accounts for legitimate lateness
- **WHEN** a snapshot's age is evaluated for staleness
- **THEN** the bound SHALL NOT assume the run must have ended once the schedule's original total duration has elapsed, since the athlete may legitimately still be behind
