# Design: add-daily-pick-and-origins

## Context

Explore settled: deterministic client-side daily pick (shared, offline-correct, "random" to humans), New York day bucketing to match the Worker, never-twice-in-a-row, all workouts eligible, featured-not-forced, `origin` marker with all four current workouts as David Rosen originals, and an authoring-loop generator (repo skill) rather than runtime AI.

## Goals / Non-Goals

**Goals:**
- Everyone sees the same "Today's EMOM" with zero network dependency.
- Deterministic no-repeat selection computable for any date in isolation.
- Origin visible at a glance; generation stays in the authoring loop.

**Non-Goals:**
- A `GET /daily` Worker endpoint (rare stale-cache skew accepted; revisit if it ever bites).
- Restricting the daily pool by origin or an approval flag.
- Runtime workout generation in the app or Worker.

## Decisions

### 1. Permutation-cycle selection, not hash-with-adjustment

Naive `hash(date) % n` with a "+1 if same as yesterday" fix either recurses (yesterday's pick needs its yesterday) or leaks repeats through the adjusted case. Instead: number the days (days since a fixed epoch, in NY time), deal from a shuffled deck.

```
dayNumber d, pool size n
cycle c = floor(d / n)
perm_c  = seeded shuffle of [0..n-1] with seed c
pick(d) = perm_c[d mod n], with one boundary rule:
          if d mod n == 0 and perm_c[0] == last element of perm_{c-1},
          swap perm_c[0] and perm_c[1]
```

Properties: every workout appears exactly once per n-day cycle (fair), consecutive days never repeat (within a cycle by permutation, across the boundary by the swap — needs n ≥ 2), and `pick(d)` is computable for any date alone (the boundary rule only needs the previous cycle's permutation, also directly computable). Seeded shuffle = Fisher-Yates over a tiny deterministic PRNG (e.g. mulberry32); no dependency.

### 2. Day bucketing reuses the Worker's pattern

`Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' })` → `YYYY-MM-DD`, parsed to a UTC-noon day number (the Worker's DST-safe idiom). Constant lives beside the function; if the Worker's timezone ever changes, both move together (noted in a comment, not worth plumbing config).

### 3. Selection state: daily pick is only the *initial* value

`WorkoutPlayer` already initializes selection as `restored snapshot's workout ?? workouts[0]`; the fallback becomes `dailyPick(new Date())`. Everything else (tabs, start, snapshot precedence) is untouched — featured-not-forced falls out of it being merely the default. The tab of today's pick gets a marker (★) and the overview header a "Today's EMOM" chip when the selected workout is the pick. No re-computation timer: the pick is read at mount; a tab left open across midnight keeps the old default until reload, which is fine for a workout timer.

### 4. `origin` is required, not optional

`origin: 'original' | 'generated'` on both workout shapes. Required so the generator skill and future authors can't forget it — the compiler enforces attribution. Badge rendering: small pill next to the overview title ("DR original" / "Generated"), styled distinctly; tabs stay uncluttered except the daily ★.

### 5. Generator skill is documentation-as-tooling

`.claude/skills/new-workout/SKILL.md` captures: equipment inventory and loads in use, the three timing shapes and when each fits, `Measure` kinds and pace conventions, authoring helpers (`round()`, `cycle()`), required `origin: 'generated'`, and the checklist (define → register → test expectations → run suite). It changes no app behavior; it exists so "generate me a 24-minute EMOM" in a future session yields a reviewable, on-pattern data PR.

## Risks / Trade-offs

- [Stale cached client with a smaller registry disagrees on the pick] → Accepted; cosmetic, self-heals on refresh. A Worker endpoint remains the escape hatch.
- [Adding/removing workouts reshuffles future picks] → Inherent to pool-size-dependent selection; harmless (no promises were made about future dates).
- [Device clock wildly wrong → wrong pick] → Same trust the timer itself already places in the device clock.

## Open Questions

_None._
