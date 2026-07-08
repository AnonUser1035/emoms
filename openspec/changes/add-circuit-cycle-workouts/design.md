# Design: add-circuit-cycle-workouts

## Context

The 6×5 workout enforces only 5-minute cycle boundaries; its five exercises pace to ~1 minute each but are advisory. The existing EMOM path (blocks → `expand()` → `Segment[]` → `useIntervalClock`) already models the timing — a 30-minute block at `intervalSec: 300` with three rotating stations gives six cycles with the erg rotating bike → ski → row twice. What's missing is purely representational: a station holds one movement/measure, and this segment holds five.

Decisions already made in explore: tap-to-check display (checks never gate the clock), soft minute ticks inside cycles, full cues only at boundaries, checks not persisted, workout is a David Rosen original.

## Goals / Non-Goals

**Goals:**
- Express multi-exercise timed segments with zero changes to timing machinery.
- Checklist interaction that survives being ignored entirely (gloves-on athlete).
- The 6×5 workout as pure data.

**Non-Goals:**
- Moving/pacing highlight driven by elapsed time (tap-to-check chosen instead).
- Persisting sub-segment check state in the active-run snapshot (a cycle is ≤5 min; losing checkmarks on reload is acceptable).
- Circuit support in rep workouts (rep targets already are a list).
- A new workout mode — this stays `mode: 'emom'`.

## Decisions

### 1. `Station.circuit?: CircuitPart[]` — extend, don't fork

```ts
interface CircuitPart {
  movement: string;
  measure?: Measure;   // erg parts; bodyweight parts omit it
  load?: string;
  notes?: string;
}
```

A circuit station is still a `Station`, so `expand()`, `stationSeconds()`, and every segment consumer are untouched; `station.movement` stays the display title ("Cycle"). Alternative considered: a new `Trailing`-style variant or a new segment type — rejected, both ripple through the clock and player for no timing difference.

### 2. `dist` measure kind

`{ kind: 'dist'; meters: number }`, label "200 m". The existing `cal` kind's optional meters is a calorie-first annotation; ski/row here are distance-first. One new switch case in `measureLabel`.

### 3. Checklist is component state keyed by segment index

`checked: Set<number>` (part indices) in the EMOM player, reset whenever `clock.segmentIndex` changes. Taps toggle; nothing reads the set except the render. This honors "clock is boss" structurally — there is no code path from checks to timing.

### 4. Minute ticks derive from `segmentElapsed`

The player already derives `segmentElapsed`; a small effect fires `cues.tick()` when a circuit segment crosses a whole minute (elapsed 60/120/180/240 for a 300s segment), tagged like the existing countdown-beep dedupe (`segmentIndex:minute`) so re-renders don't double-fire. `AudioCues.tick()` is a quieter, lower, shorter tone than `start()`. Ticks fire only when `station.circuit` is present — plain EMOM minutes keep their existing sound design.

### 5. Workout data via a small builder

The three stations share four parts; a local `cycle(erg: CircuitPart)` helper returns the five-part circuit station, mirroring the chipper's `round()` helper. Six segments come from rotation (`6 × 300s = 30 min`, 3 stations → each erg twice). Rep counts for the bodyweight parts are deliberately unspecified (pace-based, ~1 min each) — parts without a measure render movement-only.

### 6. Idle overview nests parts

The overview's station row, when `circuit` is present, renders the parts as an indented sub-list with their measure/load labels. Cheap, read-only.

## Risks / Trade-offs

- [Tap targets mid-workout with sweaty hands] → Whole-row tap targets, generous padding; ignoring the checklist entirely is fully supported.
- [Minute-tick effect double-fires under re-render] → Same tag-dedupe pattern the 3-2-1 beeps already use.
- [`measure` optional on parts could tempt optional measures on stations] → Scoped: only `CircuitPart.measure` is optional; `Station.measure` stays required.

## Open Questions

_None — display, sound, persistence, and origin were settled in explore._
