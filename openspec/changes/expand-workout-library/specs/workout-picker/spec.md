# Delta: workout-picker

## ADDED Requirements

### Requirement: Idle selection scales via a featured workout plus a dropdown
The idle screen SHALL default to the daily featured workout and SHALL offer the rest of the registry through a single dropdown control rather than one control per workout, so selection remains usable as the registry grows to dozens of entries. Selecting a workout SHALL update the displayed title, origin badge, summary, and overview, and SHALL NOT start a run.

#### Scenario: Daily pick is the default selection
- **WHEN** the idle screen loads with no restored run
- **THEN** the daily-pick workout is selected and badged as today's featured workout

#### Scenario: Dropdown lists the whole registry
- **WHEN** the registry holds more than one workout
- **THEN** every workout is selectable from the dropdown, and choosing one swaps the overview and summary without starting a run

#### Scenario: Single workout hides the dropdown
- **WHEN** the registry holds exactly one workout
- **THEN** no dropdown is shown
