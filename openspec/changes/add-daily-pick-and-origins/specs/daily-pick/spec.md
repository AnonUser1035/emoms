# Delta: daily-pick

## ADDED Requirements

### Requirement: One workout is featured per day, the same for everyone
The app SHALL feature exactly one registered workout per calendar day as "Today's EMOM", computed deterministically from the date and the registry on the client — no network or server state — so all devices with the same workout list agree. Days SHALL be bucketed at America/New_York midnight, matching the Worker's heatmap day.

#### Scenario: Two devices agree
- **WHEN** two devices with the same app version compute the daily pick on the same New York calendar day
- **THEN** they feature the same workout

#### Scenario: Day flips at New York midnight
- **WHEN** the New York calendar day changes
- **THEN** the featured workout is recomputed for the new day

### Requirement: The daily pick never repeats on consecutive days
While more than one workout is registered, the featured workout SHALL differ from the previous day's featured workout, and selection SHALL remain deterministic (computable for any date without stored history).

#### Scenario: No back-to-back repeats
- **WHEN** the daily pick is computed for any two consecutive dates
- **THEN** the two picks differ (given ≥2 registered workouts)

### Requirement: All workouts are eligible
The daily pick SHALL draw from every registered workout regardless of origin.

#### Scenario: Generated workout can be featured
- **WHEN** a `generated` workout is registered
- **THEN** dates exist on which it is the daily pick

### Requirement: Featured, never forced
On the idle screen the daily pick SHALL be the default-selected workout, visibly marked as "Today's EMOM" — but the athlete SHALL be able to select and run any other workout freely. Restoring an active-run snapshot SHALL take precedence over the daily default.

#### Scenario: Daily pick is pre-selected
- **WHEN** the idle screen loads with no active-run snapshot
- **THEN** the daily pick is the selected workout and marked as today's

#### Scenario: Switching away is unrestricted
- **WHEN** the athlete taps a different workout's tab
- **THEN** that workout is selected and startable as normal

#### Scenario: Snapshot restore wins
- **WHEN** the app loads with a fresh active-run snapshot for a non-featured workout
- **THEN** that run resumes; the daily default does not interfere
