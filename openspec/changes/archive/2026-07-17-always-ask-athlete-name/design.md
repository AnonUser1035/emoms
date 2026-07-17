## Context

`src/whiteboard/identity.ts` currently treats the stored name as a one-time gate: `getIdentity()` returns `asked: true` once any value (including `''` for "declined") has ever been written, and `FinishScreen.tsx` uses `!identity.asked` to decide whether to render the name input at all. This proposal changes the field from a permanent decision to a per-run default, so it needs to touch both the storage semantics and the finish-screen render/submit logic.

## Goals / Non-Goals

**Goals:**
- Show an editable name field on every finish, pre-filled with the last name used on that device.
- Let each run's submitted name (including blank) stand on its own, without altering whether future runs get prompted.
- Preserve the existing "nameless runs still count, just don't appear on the board" behavior.

**Non-Goals:**
- No accounts, multi-profile switcher, or per-person device pairing — still a single cached "last name" per device, just no longer locked in.
- No server/Worker/payload changes — `name` is already accepted on every `startRun`/`completeRun` call.
- No change to device id handling.

## Decisions

- **Pre-fill instead of blank-every-time**: default the input to the last stored name rather than an empty box. Rationale: the common case is still one person using their own device repeatedly: forcing them to retype their name every rep session would be a regression for that case just to fix the shared-device case. Alternative considered (always blank) rejected as needless friction for the majority.
- **Drop `asked` as a "stop asking" flag; keep it only to distinguish "never used before" for copy/placeholder purposes if needed.** The stored name becomes purely a default value read at render time, not a gate on whether to render. `setAthleteName` still writes on every submit, same as today.
- **Blank submission stays a same-run decline, not a lasting preference**: submitting blank posts that run nameless (unchanged behavior) but does not clear the stored default — next run still pre-fills with the last non-blank name. This avoids one accidental/empty submission wiping out the cached name for a shared device's regular user. Alternative (blank submission also clears the stored default) rejected: it would make a single misclick permanent until someone re-types their name.

## Risks / Trade-offs

- [Repeated prompt is mild friction for solo users] → Mitigated by pre-fill; it's a single tap/enter to accept the default, not a re-type.
- [Shared-device users might forget to edit the field and still misattribute a run] → Same residual risk as any soft-identity system; out of scope to fully solve (would require accounts). This change only removes the *forced* misattribution (no way to change the name at all after the first run).
- [Existing tests assert ask-once behavior] → Update `identity.test.ts` and the `*Player.test.tsx` finish-flow tests as part of this change; no runtime migration needed since this is client-only, stateless-per-run behavior.

## Migration Plan

Client-only change, ships in a normal deploy. No data migration: existing `emoms.athleteName.v1` localStorage values are reused directly as the new pre-fill default. No rollback concerns beyond reverting the client build.
