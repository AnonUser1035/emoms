# Design: add-iphone-install-guide

## The constraint that shapes everything

iOS Safari exposes no install API (`beforeinstallprompt` is Chrome/Android only). The *only* path onto an iPhone Home Screen is the manual Share → Add to Home Screen gesture. So the "guide" is not a companion to some install button — it **is** the whole feature. Nothing here automates the install; it only teaches the gesture.

## State machine

```
  FIRST LAUNCH  (localStorage["emoms.installPromptSeen.v1"] absent)
        │
        ▼
  ┌────────────────────────┐
  │  Are you on an iPhone?  │
  │   [ Yes ]    [ No ]    │
  └────┬──────────────┬─────┘
       │ Yes          │ No ─────────► markSeen(), unmount
       ▼
  ┌────────────────────────┐
  │  Add emoms to Home     │
  │  Screen (in Safari):   │
  │   1. Tap ⎋ Share       │
  │   2. Add to Home Screen│
  │   3. Tap Add           │
  │        [ Got it ] ─────┼────────► markSeen(), unmount
  └────────────────────────┘

  EVERY LATER LAUNCH  (key present) ─────► render nothing
```

Two in-component states: `'ask'` and `'steps'`. Initial state is read lazily once from
`localStorage` — if the key is present the component renders `null` from the first frame
(no flash). `markSeen()` writes the key and hides the prompt.

## Decisions

- **`localStorage` key is the sole gate.** No `navigator.standalone`, no user-agent
  parsing. The user tells us they're on iPhone by tapping Yes; whether they follow
  through is theirs to decide, and either way we've done our one-time job.
  - *Accepted consequence:* Safari and the installed Home-Screen app have separate
    `localStorage`. Someone who dismisses in Safari then installs may see the question
    once more inside the installed app. Harmless — they tap through it — and it keeps
    the gate to a single boolean.
- **Set the key on every exit**, including the bare "No" and closing the question step,
  so the prompt is genuinely once-ever rather than once-per-path.
- **Safari is named in the copy.** Add to Home Screen only exists in Safari on iOS;
  Chrome/Firefox/in-app browsers can't do it. Telling a Chrome-iOS user to "tap Share →
  Add to Home Screen" fails silently, so the guide states Safari up front.
- **Key naming** follows the repo convention (`emoms.activeRun.v1`,
  `emoms.athleteName.v1`): `emoms.installPromptSeen.v1`.
- **Lazy `useState` initializer** reads storage once (SSR-free Vite client app; the
  double-invoke under `StrictMode` is a pure read and idempotent).

## Testing approach

jsdom + Testing Library, mirroring the existing player tests. `localStorage` is cleared
between tests (the jsdom Storage is wired up in `vitest.setup.ts`). Cover: renders the
question on a clean slate; Yes reveals Safari-specific steps; No sets the key and
unmounts; the key suppresses the prompt on the next mount; the steps mention Safari.
