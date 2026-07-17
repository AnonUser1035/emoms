## 1. Identity storage semantics

- [x] 1.1 In `src/whiteboard/identity.ts`, drop the "asked = never prompt again" contract: keep `getIdentity()` returning the last stored name as a plain default, but stop treating `''` as a special "declined forever" sentinel — a blank submission simply should not overwrite the stored default.
- [x] 1.2 Update `setAthleteName(name)` so it only persists non-blank, trimmed names (skip the `localStorage.setItem` when the trimmed value is empty), so a blank run doesn't clear the cached default for the next run.
- [x] 1.3 Decide whether to keep the `asked` field on `StoredIdentity` (e.g. for first-run placeholder copy) or remove it; update its doc comment either way to reflect the new meaning. (Removed — nothing consumes it once the prompt always renders.)
- [x] 1.4 Update `src/whiteboard/__tests__/identity.test.ts` to cover: first call with no stored name, a submitted name persisting as the next default, and a blank submission not clearing a previously stored name.

## 2. Finish screen prompt

- [x] 2.1 In `src/timer/FinishScreen.tsx`, remove the `!identity.asked` gate (line 84) so the name `<input>` always renders.
- [x] 2.2 Initialize `nameInput` state from `identity.name` (pre-fill) instead of `''`, so the field defaults to the last used name but stays editable.
- [x] 2.3 In `handleFinish`, always resolve `name` from the current `nameInput` value (trimmed, `null` if blank) and always call `setAthleteName` with that value, replacing the `if (!identity.asked)` branch (lines 49-54).
- [x] 2.4 Remove or rework the now-redundant "Posting as {identity.name}" hint (lines 112-114) since the name is now visibly editable in the field itself. (Removed.)
- [x] 2.5 Update the component doc comment (lines 22-28) to describe the new always-prompt-with-default behavior instead of "asks once ever."

## 3. Test coverage for finish flow

- [x] 3.1 Update finish-flow assertions in `src/timer/__tests__/WorkoutPlayer.test.tsx`, `AmrapPlayer.test.tsx`, `RepPlayer.test.tsx`, and `EmomPlayer.test.tsx` that currently assume the name field disappears after first use — assert it's always present and pre-filled instead. (Only `WorkoutPlayer.test.tsx` exercised `FinishScreen`; the others test individual timer players directly and don't touch identity.)
- [x] 3.2 Add a test asserting a second finish on the same device pre-fills the name input with the previously submitted value. (`WorkoutPlayer.test.tsx` end-to-end + `identity.test.ts` unit test.)
- [x] 3.3 Add a test asserting a blank submission posts a nameless run but leaves the stored default intact for the next finish. (`identity.test.ts`.)

## 4. Spec sync

- [x] 4.1 Verify the delta spec at `openspec/changes/always-ask-athlete-name/specs/results-whiteboard/spec.md` matches the implemented behavior once code changes land (adjust scenario wording if implementation details shifted during coding). (Matches as written — no changes needed.)
