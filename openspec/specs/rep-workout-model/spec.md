# rep-workout-model

## Requirements

### Requirement: Workout model is a discriminated union of clock-paced and athlete-paced shapes
The workout model SHALL distinguish clock-paced (EMOM block) workouts from athlete-paced (rep) workouts via a discriminant, such that existing EMOM definitions remain valid without modification and every consumer can select behavior by mode.

#### Scenario: Existing EMOM workout is unaffected
- **WHEN** the `emom-30` workout is loaded after the model change
- **THEN** it compiles through `expand()` to the same segment timeline as before, with no changes to its definition

#### Scenario: Consumers dispatch on mode
- **WHEN** a component receives a workout of either shape
- **THEN** the mode discriminant is sufficient to select the correct runtime (interval clock vs rep player) without inspecting inner structure

### Requirement: Rep workouts are an ordered sequence of rep targets
An athlete-paced workout SHALL be defined as an ordered list of rep targets, each naming a movement, a rep count, and optionally a load, so that both chippers (many targets) and single-goal workouts (one target) use the same shape.

#### Scenario: Chipper with per-round movement variation
- **WHEN** the 60/30 chipper is defined
- **THEN** it contains twelve targets in order: 60 reps each of diamond pushups, goblet squats, seated overhead press, curls, reverse lunges, and full-body extensions, followed by 30 reps each of the same list with regular pushups replacing diamond pushups

#### Scenario: Single-target workout
- **WHEN** the 300-pushup workout is defined
- **THEN** it contains exactly one target of 300 pushups

### Requirement: Rep workouts support an optional time cap
The model SHALL support an optional time cap in minutes on a rep workout. When present, the workout ends at the cap even if targets remain incomplete; when absent, the workout ends only when all targets are complete.

#### Scenario: Cap declared
- **WHEN** the 300-pushup workout is defined
- **THEN** it declares a 35-minute time cap

#### Scenario: No cap declared
- **WHEN** the 60/30 chipper is defined
- **THEN** it declares no time cap and is complete only when all twelve targets are done

### Requirement: Rep workouts support an optional break prescription
The model SHALL support an optional break prescription on a rep workout — work to perform every time the athlete takes a break — expressed as a list of movement/rep pairs.

#### Scenario: Break prescription on the rep-goal workout
- **WHEN** the 300-pushup workout is defined
- **THEN** its break prescription is 15 goblet squats and 15 tuck jumps

### Requirement: Both new workouts ship as data in the workout registry
The 60/30 chipper and the 300-pushup rep-goal workout SHALL be registered alongside `emom-30`, each with a slug, title, and summary, making the registry hold three workouts.

#### Scenario: Registry lists all three workouts
- **WHEN** the workout registry is loaded
- **THEN** it contains `emom-30`, the 60/30 chipper, and the 300-pushup workout, each retrievable by slug
