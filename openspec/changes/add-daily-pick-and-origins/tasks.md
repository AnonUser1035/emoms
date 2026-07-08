# Tasks: add-daily-pick-and-origins

## 1. Origins

- [x] 1.1 Add required `origin: 'original' | 'generated'` to both workout shapes; mark all four workouts `original`
- [x] 1.2 Origin badge on the idle overview ("DR original" / "Generated", visually distinct)
- [x] 1.3 Test: every registry entry has an origin; all four are original

## 2. Daily pick

- [x] 2.1 Implement `src/timer/dailyPick.ts`: NY-timezone day number (UTC-noon idiom), mulberry32 + Fisher-Yates permutation cycle with the boundary swap, exported `dailyPick(workouts, date)`
- [x] 2.2 Unit tests: deterministic (same date → same pick), no consecutive repeats across a long date range, fair coverage within a cycle, NY day bucketing, n=1 and n=2 edge cases
- [x] 2.3 Wire as the idle default selection (snapshot restore still wins); ★ on the daily tab; "Today's EMOM" chip when the pick is selected
- [x] 2.4 Component tests: daily pick pre-selected with no snapshot, switching tabs unrestricted, snapshot restore overrides the default

## 3. Generator skill

- [x] 3.1 Write `.claude/skills/new-workout/SKILL.md`: equipment/loads inventory, the three timing shapes, measure kinds and pace conventions, authoring helpers, origin requirement, registry + test checklist

## 4. Verify

- [x] 4.1 Full test suite, typecheck, lint, build
