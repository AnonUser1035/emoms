## ADDED Requirements

### Requirement: A workout's coded structure SHALL match everything its own summary describes
Every element a workout's `summary` claims — a finisher, a per-round penalty, an ascending/climbing rep scheme, a stated round count — SHALL be present in that workout's actual data (`blocks`/`targets`/`round`). A summary MUST NOT describe work, structure, or a scheme that the data doesn't actually produce.

#### Scenario: Ladder with a per-round addition
- **WHEN** a rep workout's summary states an extra fixed-rep movement occurs after every round of a ladder
- **THEN** that movement, at that rep count, appears in the workout's `targets` after every rung

#### Scenario: Workout with a finisher
- **WHEN** a rep workout's summary states it finishes with a named movement
- **THEN** that movement appears as the final target in the workout's `targets`

#### Scenario: Claimed climbing scheme is either real or not claimed
- **WHEN** a workout's summary states reps climb round over round
- **THEN** either the workout's data produces that climb (via `roundStep` for AMRAP, or explicit per-round stations for EMOM), or the summary does not claim a climb

### Requirement: An EMOM block's duration SHALL be an exact multiple of its rotation when a specific round count is claimed
When an EMOM workout's summary states a specific number of rounds for a block, that block's `durationMin * 60` SHALL equal `intervalSec * stations.length * claimedRounds` exactly, so the block neither cuts a final round short nor runs past the claimed count.

#### Scenario: Exact round count
- **WHEN** a block's summary states "five rounds of six stations"
- **THEN** `durationMin * 60 == intervalSec * 6 * 5`

### Requirement: Rest between repeated rounds SHALL be modeled at the granularity the summary describes
When a summary describes rest occurring after every round of a repeated unit (not once at the end of all rounds), that rest SHALL be encoded so it recurs every round — either as a rotating `rest()` station within the block, or via `mode: 'interval'` — not as a single one-time trailing break appended after all rounds complete.

#### Scenario: Per-round rest
- **WHEN** a block's summary describes a fixed unit of work followed by a break, repeated N times
- **THEN** the block's rotation includes a rest station (or the workout uses `mode: 'interval'`) such that a break occurs after each of the N rounds, not once after all N

#### Scenario: One-time transition break is still valid
- **WHEN** a summary describes a break occurring once between two distinct sections of a session (not per-round within one repeated unit)
- **THEN** a single trailing `then: [{ kind: 'break' }]` on the first section's block correctly represents it
