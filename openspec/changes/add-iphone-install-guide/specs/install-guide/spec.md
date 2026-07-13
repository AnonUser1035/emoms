# Delta: install-guide

## ADDED Requirements

### Requirement: First launch offers a one-time iPhone install prompt
On the first visit — determined solely by the absence of the `emoms.installPromptSeen.v1` `localStorage` key — the app SHALL display a dismissible prompt asking whether the visitor is on an iPhone, offering **Yes** and **No**. The prompt SHALL NOT use device or browser detection to decide whether to appear; the `localStorage` key is the only gate.

#### Scenario: Prompt appears on a clean slate
- **WHEN** the app loads and `emoms.installPromptSeen.v1` is absent
- **THEN** the prompt renders asking "Are you on an iPhone?" with Yes and No choices

#### Scenario: No detection gates the prompt
- **WHEN** the app loads with the key absent on any device or browser
- **THEN** the prompt still appears — the decision is left to the user's Yes/No answer, not to user-agent or `navigator.standalone`

### Requirement: Yes reveals Safari-specific Add-to-Home-Screen steps
When the visitor answers Yes, the prompt SHALL show step-by-step instructions for adding emoms to the Home Screen, and the instructions SHALL state that they must be performed in Safari (Add to Home Screen is unavailable in other iOS browsers). The steps SHALL cover opening the Share sheet, choosing "Add to Home Screen", and confirming.

#### Scenario: Yes shows the steps
- **WHEN** the visitor taps Yes
- **THEN** the prompt shows the Share → Add to Home Screen → Add instructions

#### Scenario: Steps name Safari
- **WHEN** the steps are shown
- **THEN** the copy states the instructions must be done in Safari

### Requirement: The prompt is shown exactly once, ever
The app SHALL set the `emoms.installPromptSeen.v1` key on every exit from the prompt — after Yes-then-dismiss, after No, and after closing the question directly — and SHALL NOT render the prompt again while the key is present.

#### Scenario: No dismisses and never returns
- **WHEN** the visitor taps No
- **THEN** the prompt disappears, the key is set, and it does not reappear on a subsequent load

#### Scenario: Completing the guide sets the key
- **WHEN** the visitor taps Yes, reads the steps, and taps "Got it"
- **THEN** the key is set and the prompt does not reappear on a subsequent load

#### Scenario: Later launches render nothing
- **WHEN** the app loads with `emoms.installPromptSeen.v1` present
- **THEN** no prompt renders at any point during the session
