## Why

The finish screen currently asks for the athlete's name at most once per device, then reuses that cached name forever. On a shared device (a gym iPad, a phone passed between training partners), every run after the first gets misattributed to whoever answered the prompt first — there's no way to correct it short of clearing localStorage. Asking each time (but defaulting to the last name used) fixes attribution for shared devices while keeping the single-tap flow for the common single-owner case.

## What Changes

- The finish screen shows the name field on every completed run, not just the first — **BREAKING** (changes the documented "ask once" contract in `results-whiteboard`).
- The field is pre-filled with the last name used on this device (from the existing localStorage cache), so returning solo users still just tap through.
- The athlete can edit or clear the field before posting; whatever they submit (including blank) is used for that run only, and also becomes the new pre-fill default for next time.
- Declining (submitting blank) no longer means "never ask again" — it just means this run posts nameless, same as today, but the next run still prompts.
- Remove the permanent "declined" sentinel semantics from `getIdentity()`/`setAthleteName()`: the stored name becomes a plain default/suggestion, not a flag that suppresses future prompts.

## Capabilities

### Modified Capabilities
- `results-whiteboard`: the "Whiteboard identity is a name entered once plus a generated device id" requirement changes from ask-once-cache-forever to ask-every-time-with-last-used-default. Scenarios for first finish vs. subsequent finishes are replaced with a single always-prompt behavior; the "declining stops future prompts" implication goes away (declining now only affects the current run).

## Impact

- `src/timer/FinishScreen.tsx`: remove the `!identity.asked` gate on the name input; always render it, pre-filled from cached identity; always resolve the submitted value (not just on first ask).
- `src/whiteboard/identity.ts`: drop the `asked` field's "suppress future prompts" meaning; `getIdentity()` keeps returning the last stored name as a pre-fill default, `setAthleteName()` keeps writing the latest value.
- `src/timer/WorkoutPlayer.tsx` (and Amrap/Rep/Emom players): no change to `startRun` call itself, since it already just reads current cached identity.
- Tests: `src/whiteboard/__tests__/identity.test.ts`, `src/timer/__tests__/*Player.test.tsx` that assert ask-once behavior need updating to assert always-prompt-with-prefill behavior.
- `openspec/specs/results-whiteboard/spec.md`: requirement and scenarios updated via delta spec.
- No server/Worker or payload shape changes — `name` is already sent on every start/complete call.
