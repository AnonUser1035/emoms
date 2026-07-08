# results-whiteboard

## Requirements

### Requirement: Whiteboard identity is a name entered once plus a generated device id
The app SHALL prompt for the athlete's display name at most once (at first finish), store it client-side alongside a generated stable device id, and attach both to subsequent run events. There SHALL be no accounts, passwords, or server-side identity verification.

#### Scenario: First finish prompts for a name
- **WHEN** an athlete finishes a workout on a device with no stored identity
- **THEN** the finish screen asks for a display name before offering to post the result

#### Scenario: Subsequent finishes reuse the identity
- **WHEN** the same device finishes another workout
- **THEN** no prompt appears and the stored name and device id are attached automatically

#### Scenario: Declining a name still counts the run
- **WHEN** the athlete declines to give a name
- **THEN** the run still completes (and counts toward the heatmap) but carries no whiteboard name

### Requirement: Completed runs with a name appear on the workout's whiteboard
The Worker SHALL list completed runs per workout slug — name, date, elapsed time, total reps, breaks, completed flag, and notes — newest first, and the app SHALL show this board on the workout's idle screen. Nameless runs SHALL be excluded from the board.

#### Scenario: Board shows a posted result
- **WHEN** Brian completes the 300-pushup workout at the 35-minute cap with 276 reps
- **THEN** the 300-pushup workout's board lists "Brian — 276 reps, 35:00" with the date

#### Scenario: Nameless run excluded
- **WHEN** a run completes without a whiteboard name
- **THEN** it contributes to the heatmap but does not appear on any board

### Requirement: Results carry measured fields plus free-text notes
A posted result SHALL include the player-measured summary and MAY include a short free-text note (e.g., heart rate, load used) entered on the finish screen. The Worker SHALL store notes verbatim with a length limit.

#### Scenario: Note attached to a result
- **WHEN** the athlete finishes the chipper in 28:30 and adds the note "144 hr, 50 lb goblet"
- **THEN** the board entry shows the time with that note
