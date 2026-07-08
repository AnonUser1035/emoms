# Design: add-athlete-paced-workouts

## Context

The timer today has a clean two-layer architecture: an authoring model (`Workout` → `Block[]` → `Station[]` in `src/timer/workouts.ts`) compiled by a pure function (`expand()` in `src/timer/expand.ts`) into a flat `Segment[]`, played back by a time-only, wall-clock-anchored hook (`useIntervalClock.ts`). Every segment is time-terminated; there is no rep tracking or mid-workout user input anywhere.

Two new workouts are athlete-paced: a 60/30 chipper and a 300-pushups-or-35-minutes rep-goal workout. Both reduce to the same runtime: a count-up clock plus an ordered sequence of rep targets advanced by taps, optionally bounded by a time cap, optionally with an on-break prescription.

Constraint carried through this design: keep as little as possible on the frontend. The player holds only in-run state; the sole client-side persistence is a single active-run snapshot for reload survival (decision 7), cleared on finish. Recording finished runs is the companion change (`add-run-lifecycle-whiteboard`), which consumes this change's finish summary.

## Goals / Non-Goals

**Goals:**
- One rep-based runtime that expresses both new workouts as pure data.
- Existing EMOM model, `expand()`, and `useIntervalClock` untouched.
- Player usable mid-workout: big tap targets, glanceable current/next display.
- A well-defined finish summary as the single hand-off point to persistence.

**Non-Goals:**
- Persistence, identity, results whiteboard, heatmap changes (companion change).
- Per-rep counting hardware/sensors; the athlete taps in chunks.
- Pause/resume of the clock (matches existing player: the clock runs).
- Editing workouts in the UI; definitions remain code-authored data.

## Decisions

### 1. Discriminated union at the workout level, not a generalized segment model

`Workout` becomes `EmomWorkout | RepWorkout`, discriminated by a `mode` field (existing shape gets `mode: 'emom'`; a type-level default or a small mechanical edit keeps `emom-30` unchanged in substance). Alternative considered: generalizing `Segment` to include athlete-terminated segments and teaching `useIntervalClock` about them. Rejected — the interval clock's simplicity (cumulative ends, purely elapsed-time-driven) is its main virtue, and a "segment that ends on user input" poisons every consumer with input handling. Two small engines beat one complicated one.

### 2. `RepWorkout` shape

```ts
interface RepTarget {
  movement: string;
  count: number;
  load?: string;      // "65 lb"
  notes?: string;     // "seated"
}

interface RepWorkout {
  mode: 'rep';
  slug: string;
  title: string;
  summary: string;
  targets: RepTarget[];        // ordered; chipper = 12, rep-goal = 1
  capMin?: number;             // absent = run until done
  onBreak?: RepTarget[];       // prescription shown when athlete takes a break
}
```

The chipper's "diamond → regular pushups" round variation needs no special mechanism — the twelve targets are just written out, with different movement names in round one and round two. Alternative considered: a `rounds: {reps, exercises[]}[]` shape that expands to targets. Rejected as premature — with one chipper, the flat list is simpler and the expansion is trivial to add later if authoring gets repetitive.

### 3. New `useCountUpClock` hook, sibling to `useIntervalClock`

Timestamp-anchored (Date.now vs a stored start), ticking ~200ms, exposing `elapsedSec` and (when capped) `remainingToCapSec`. Reuses the existing patterns (wake lock, wall-clock anchoring) but shares no code path with the interval clock. Rep/target progression is plain React state in the player, not in the hook — the hook stays time-only, mirroring the existing separation of clock vs content.

### 4. Rep logging is chunked taps, with target-sized increments

Primary controls: a small set of increment buttons (e.g. +5 / +10 / +15, plus "target done"). Overflow on the last logged chunk completes the target without carrying reps forward (spec'd). Rationale: mid-set precision is fake precision; athletes count sets, not single reps, and big buttons survive sweat. Alternative considered: free-number entry — rejected for mid-workout ergonomics, though the finish summary is the place a correction could later live.

### 5. Break is a modal state, not a segment

Tapping "break" flips the player into a break view (prescription shown, break count incremented, clock still running) until "resume". It is not a timeline segment — breaks have no duration contract, and the cap clock must keep running through them. Break count is part of the finish summary.

### 6. Finish summary is a typed value, not a side effect

```ts
interface RunSummary {
  slug: string;
  elapsedSec: number;
  totalReps: number;
  breaks: number;
  completed: boolean;   // all targets done (vs capped out)
}
```

The player renders it and surfaces it through a callback/prop boundary. This change wires no network calls; the companion change plugs into exactly this boundary. This keeps the player testable and the frontend-minimal constraint honest.

### 7. Active-run snapshot: reload survival via localStorage

A single versioned localStorage key (e.g. `emoms.activeRun.v1`) holds the active run: workout slug, wall-clock start timestamp, mode-specific progress (rep mode: per-target logged reps, current target index, break count, in-break flag; EMOM mode: nothing beyond slug + start, since the whole timeline derives from elapsed time), and — once the companion change lands — the server run id. Written on every state mutation (tiny payload, synchronous write is fine), cleared on finish or discard.

Why this works cheaply: both clocks are timestamp-anchored, so resume needs no "time served" bookkeeping — recomputing elapsed from the stored start is exact, including the time the page spent dead. On load: snapshot fresh → auto-resume; recomputed elapsed past a declared cap → end the run at the cap with snapshotted progress; stale (default bound: cap + slack for capped workouts, ~4 hours for uncapped) → resume-or-discard prompt. Version mismatch → silent discard.

localStorage over sessionStorage because mobile browsers kill background tabs — surviving tab death, not just refresh, is the actual requirement. This is deliberately not "client-side history": at most one snapshot exists, and finishing removes it, so the thin-frontend rule (server as system of record) stays intact. Alternative considered: streaming rep events to the Worker and resuming from server state — rejected; it breaks offline use, multiplies network chatter, and turns a crash-recovery cache into a distributed-state problem.

### 8. Player dispatch in `EmomPlayer.tsx`

The workout selector stays where it is; on start, mode routes to the existing interval player or the new rep player. The dormant multi-workout tab UI activates naturally once the registry has three entries. Alternative considered: a separate route/page per mode — rejected; the app is a single screen and the selector already exists.

## Risks / Trade-offs

- [Snapshot schema drifts across deploys and resumes garbage] → Versioned key; any mismatch discards silently and starts clean.
- [Snapshot restores stale state the athlete abandoned] → Staleness bound with an explicit resume-or-discard prompt; capped workouts additionally self-terminate at the cap on restore.
- [Chunked increments can mis-log actual reps] → Accepted imprecision; buttons sized to common set sizes per workout, and "target done" is always exact at target boundaries.
- [Two clock hooks drift apart in behavior (wake lock, throttling handling)] → Keep both hooks tiny and colocated in `src/timer/`; extract shared timestamp-anchoring helper only if a third clock ever appears.
- [Union type ripples through existing code paths expecting block-based workouts] → `expand()` and the interval player only ever receive `EmomWorkout` after dispatch narrows the type; compiler enforces exhaustiveness.

## Open Questions

- Exact increment button set per workout (+5/+10/+15 vs derived from target size) — decide during implementation with real use.
- Whether the chipper should show per-target elapsed splits in the finish summary (nice for the whiteboard later; cheap to add, but not required by spec).
