# Delta: rep-workout-player

## ADDED Requirements

### Requirement: Rep workouts run on a count-up clock
When a rep workout starts, the player SHALL display a count-up stopwatch anchored to wall-clock time (correct across background tab throttling), not a per-segment countdown. The existing interval clock (`useIntervalClock`) SHALL NOT be modified to support this.

#### Scenario: Clock counts up from start
- **WHEN** the athlete starts a rep workout
- **THEN** the display shows elapsed time counting up from 00:00

#### Scenario: Background throttling does not drift the clock
- **WHEN** the tab is backgrounded for two minutes during a rep workout and then foregrounded
- **THEN** the elapsed time reflects true wall-clock time, not tick count

### Requirement: Athlete logs reps by tapping increments
The player SHALL let the athlete log completed reps against the current target via large tap controls usable mid-workout, and SHALL show the running count toward the current target and total.

#### Scenario: Logging reps advances the count
- **WHEN** the current target is 60 goblet squats with 40 logged and the athlete logs 10 more
- **THEN** the display shows 50/60 for the current target

#### Scenario: Completing a target advances to the next
- **WHEN** the athlete logs reps that meet or exceed the current target's count
- **THEN** the player advances to the next target in sequence and shows it as current (overflow reps do not carry forward)

### Requirement: Current and next targets are always visible
The player SHALL show the current target (movement, load, progress) prominently, and the next target when one exists, so the athlete can glance mid-set.

#### Scenario: Mid-chipper display
- **WHEN** the athlete is on target 3 of 12 in the chipper
- **THEN** the display shows target 3's movement, load, and progress, plus target 4's movement as "next"

### Requirement: Breaks are logged and show the break prescription
When the workout declares a break prescription, the player SHALL provide a break control; activating it increments the break count and displays the prescribed break work until the athlete resumes.

#### Scenario: Taking a break during the 300-pushup workout
- **WHEN** the athlete taps the break control
- **THEN** the display switches to "15 goblet squats, 15 tuck jumps", the break count increments, and a resume control returns to the current target

#### Scenario: Workout without a break prescription
- **WHEN** a rep workout declares no break prescription
- **THEN** no break control is shown

### Requirement: The workout ends at the cap or at completion, whichever comes first
The player SHALL end the workout when all targets are complete, or when the declared time cap elapses, whichever comes first. When the cap is declared, remaining time to the cap SHALL be visible.

#### Scenario: Finishing before the cap
- **WHEN** the athlete logs the 300th pushup at 28:30
- **THEN** the workout ends immediately with a recorded time of 28:30

#### Scenario: Cap elapses first
- **WHEN** the clock reaches 35:00 with 276 pushups logged
- **THEN** the workout ends and the summary records 276 reps at the cap

#### Scenario: Uncapped workout runs until done
- **WHEN** the chipper is in progress with targets remaining
- **THEN** the workout continues regardless of elapsed time until all targets are complete

### Requirement: An in-progress workout survives page reloads
The player SHALL snapshot the active run to client storage on every state change (start, rep log, break toggle, target advance) and, on load with a snapshot present, SHALL restore the in-progress workout: elapsed time recomputed from the stored wall-clock start (not from tick counts), logged reps, current target, and break count. The snapshot SHALL be cleared when the run finishes or is explicitly discarded. Snapshots SHALL be versioned and silently discarded on schema mismatch.

#### Scenario: Reload mid-workout resumes exactly
- **WHEN** the page reloads at true elapsed 12:40 during the chipper with 4 targets done and 2 breaks logged
- **THEN** the restored player shows elapsed ≈12:40 (wall-clock accurate, including time spent reloading), target 5 current, and 2 breaks

#### Scenario: Cap passed while the page was gone
- **WHEN** the page reloads during the 300-pushup workout and the recomputed elapsed time meets or exceeds the 35-minute cap
- **THEN** the player ends the run at the cap with the snapshotted reps and breaks

#### Scenario: Stale snapshot is not silently resumed
- **WHEN** a snapshot's age exceeds the staleness bound for its workout
- **THEN** the player offers resume-or-discard instead of auto-resuming

#### Scenario: Finishing clears the snapshot
- **WHEN** a run ends (completion, cap, or discard)
- **THEN** the snapshot is removed and a subsequent load starts at the idle screen

### Requirement: Finishing produces a summary of the run
On workout end (completion or cap), the player SHALL present a finish summary containing: elapsed time, total reps logged, break count, and whether all targets were completed. This summary is the hand-off point for any recording layer; the player itself SHALL NOT persist anything beyond the active-run snapshot, which is cleared on finish.

#### Scenario: Chipper finish summary
- **WHEN** the athlete completes all twelve chipper targets at 24:10 with 3 breaks
- **THEN** the summary shows 24:10, all targets complete, and 3 breaks

#### Scenario: No local persistence
- **WHEN** the page is reloaded after a finished workout
- **THEN** no run history is present in client storage
