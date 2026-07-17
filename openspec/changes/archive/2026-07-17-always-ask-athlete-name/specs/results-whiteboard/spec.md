## MODIFIED Requirements

### Requirement: Whiteboard identity is a name entered every finish, defaulted from the last one used
The app SHALL prompt for the athlete's display name on every completed workout, pre-filled with the name last used on that device (if any), alongside a generated stable device id attached to every run event. The athlete MAY edit or clear the pre-filled name before posting. There SHALL be no accounts, passwords, or server-side identity verification.

#### Scenario: First finish prompts for a name with no default
- **WHEN** an athlete finishes a workout on a device with no stored identity
- **THEN** the finish screen asks for a display name with an empty field before offering to post the result

#### Scenario: Subsequent finish prompts again, pre-filled with the last name
- **WHEN** the same device finishes another workout after a name was previously submitted
- **THEN** the finish screen asks for a display name again, pre-filled with the previously submitted name, and the athlete can accept it as-is or change it

#### Scenario: Editing the name only affects this run and becomes the new default
- **WHEN** an athlete changes the pre-filled name before posting
- **THEN** that run is attributed to the edited name, and the edited name becomes the pre-filled default on the next finish

#### Scenario: Declining a name still counts the run and does not clear the stored default
- **WHEN** the athlete clears the name field and submits blank
- **THEN** the run still completes (and counts toward the heatmap) but carries no whiteboard name for that run, and the next finish still pre-fills with the last non-blank name used on the device
