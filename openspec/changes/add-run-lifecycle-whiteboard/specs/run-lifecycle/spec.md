# Delta: run-lifecycle

## ADDED Requirements

### Requirement: Starting a workout creates a run on the server
When the athlete starts any workout, the app SHALL post a run-start event carrying the workout slug (plus whiteboard identity when known), and the Worker SHALL create a run in the `started` state, assign it an id, and stamp the day server-side in the configured timezone (never client-supplied). The returned run id SHALL be stored in the active-run snapshot (defined in `add-athlete-paced-workouts`) so it survives page reloads for the duration of the run.

#### Scenario: Run starts
- **WHEN** the athlete starts the 300-pushup workout
- **THEN** the Worker records a new run with state `started`, the workout slug, and today's server-computed day, and returns the run id

#### Scenario: Start event fails silently
- **WHEN** the run-start request fails (offline or Worker unreachable)
- **THEN** the workout begins normally and the app retains no error state beyond the missing run id

### Requirement: Finishing a workout completes the run
When a workout ends, the app SHALL post a run-complete event with the run summary (elapsed seconds, total reps, break count, completed flag) and any whiteboard identity, and the Worker SHALL mark the run completed and store the summary. Completion SHALL be idempotent per run id.

#### Scenario: Normal completion
- **WHEN** the athlete finishes a run that was started with id R
- **THEN** the Worker marks run R completed with the submitted summary

#### Scenario: Duplicate completion
- **WHEN** the same run-complete event is posted twice for run id R
- **THEN** the run is completed once and the second request does not create a second run or alter the stored summary

#### Scenario: Completion without a prior start
- **WHEN** a run-complete event arrives with no run id (the start event never reached the server)
- **THEN** the Worker creates a run directly in the completed state for the server-computed current day

### Requirement: Heatmap distinguishes started from completed runs
The heatmap data SHALL report, per day, the count of completed runs and the count of runs still in the `started` state, and the heatmap rendering SHALL show started-only contributions as a visibly distinct half state that becomes a full contribution once the run completes.

#### Scenario: In-progress run shows immediately
- **WHEN** an athlete starts a workout and the heatmap is fetched before they finish
- **THEN** today's cell reflects one started (half) contribution

#### Scenario: Completion fills the half state
- **WHEN** that run completes and the heatmap is fetched again
- **THEN** the contribution renders as completed (full) and the started count for the day decreases accordingly

#### Scenario: Abandoned run stays half
- **WHEN** a run is started but never completed
- **THEN** its day permanently reports it in the started count and it never converts to a full contribution

### Requirement: Legacy check-in history is preserved
Heatmap aggregation SHALL merge historical `daily_checkins` counts into each day's completed count, so past activity is not lost when the check-in endpoint is replaced by the run lifecycle.

#### Scenario: Historical day renders unchanged
- **WHEN** the heatmap covers a day that has only legacy `daily_checkins` data
- **THEN** that day's completed count equals the legacy count

### Requirement: The Worker is the system of record and the client stays thin
Run state, day attribution, and heatmap aggregation SHALL be computed on the Worker. The client SHALL NOT store run history or compute aggregates; its only run-related persistence is the single active-run snapshot (cleared on finish) and the whiteboard identity.

#### Scenario: No client-side run storage
- **WHEN** a run completes and the page is reloaded
- **THEN** client storage contains no run records (the active-run snapshot was cleared on finish); the heatmap and boards are rebuilt entirely from Worker responses

#### Scenario: Reload mid-run does not orphan the run
- **WHEN** the page reloads mid-run and the athlete later finishes the restored workout
- **THEN** the completion event carries the run id from the snapshot and the original run is completed — no second run is created and no permanent half mark remains
