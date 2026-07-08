# Delta: circuit-stations

## ADDED Requirements

### Requirement: A station may carry an ordered circuit of parts
The workout model SHALL allow a station to declare an ordered list of circuit parts, each with a movement and optional measure, load, and notes. A circuit station occupies its interval exactly like any other station — `expand()` and the interval clock treat it identically; only its display differs.

#### Scenario: Circuit station expands to a normal timed segment
- **WHEN** a block with `intervalSec: 300` contains a circuit station with five parts
- **THEN** `expand()` emits one 300-second work segment for it, indistinguishable in timing from a single-movement station

### Requirement: Distance is a first-class measure
The model SHALL support a distance measure kind expressed in meters, labeled for display (e.g. "200 m"), for erg work prescribed by distance rather than calories.

#### Scenario: Ski part shows meters
- **WHEN** a circuit part declares 200 meters on the ski erg
- **THEN** its display label reads "200 m"

### Requirement: Circuit segments display a tappable checklist that never gates the clock
During a circuit segment the player SHALL display the parts in order as a checklist the athlete can tap to mark done. Checks SHALL NOT affect timing: the segment ends at its boundary regardless of checked state, checking every part early does not end or advance the segment, and each new circuit segment starts with all parts unchecked. Checked state is ephemeral in-memory UI state and SHALL NOT be persisted to the active-run snapshot.

#### Scenario: Tapping marks a part done
- **WHEN** the athlete taps "Situps" during a cycle
- **THEN** it renders as checked and the remaining parts stay tappable

#### Scenario: All parts checked early
- **WHEN** the athlete checks all five parts with 1:30 left in the cycle
- **THEN** the segment continues to its 5:00 boundary as normal

#### Scenario: Boundary resets the list
- **WHEN** a cycle ends with two parts unchecked and the next cycle begins
- **THEN** the new cycle's checklist starts fully unchecked

#### Scenario: Reload loses only check state
- **WHEN** the page reloads mid-cycle and the run auto-resumes
- **THEN** the correct cycle and remaining time are restored but the checklist is unchecked

### Requirement: Minute ticks pace circuit segments
Within a circuit segment, the player SHALL sound a soft tick at each whole minute of segment-elapsed time (a pacing cue), audibly distinct from and quieter than the segment-start beep. The start beep and 3-2-1 countdown SHALL remain reserved for segment boundaries. Non-circuit segments SHALL NOT gain minute ticks.

#### Scenario: Ticks inside a 5-minute cycle
- **WHEN** a circuit segment passes 1:00, 2:00, 3:00, and 4:00 elapsed
- **THEN** a soft tick sounds at each mark, and the loud beep sounds only when the next segment starts

### Requirement: 6×5 Cycles ships as data
The registry SHALL include the 6×5 Cycles workout: one 30-minute EMOM block with `intervalSec: 300` and three rotating circuit stations sharing four parts (dumbbell squats, med ball throw downs, situps, pushups) and differing in the fifth — assault bike 12 cal, ski erg 200 m, row 250 m — so six cycles rotate each erg through twice.

#### Scenario: Six cycles, ergs rotating
- **WHEN** 6×5 Cycles is expanded
- **THEN** it yields exactly six 300-second work segments whose erg parts read bike, ski, row, bike, ski, row in order

#### Scenario: Overview lists circuit contents
- **WHEN** the idle overview renders 6×5 Cycles
- **THEN** each cycle station shows its five parts, including the erg's measure
