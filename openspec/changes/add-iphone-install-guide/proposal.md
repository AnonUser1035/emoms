# Proposal: add-iphone-install-guide

## Why

emoms already works well when added to an iPhone Home Screen — tap the icon, it opens like an app, and the athlete leaves the phone across the room to follow the beeps. But iOS has no install API: the only way onto the Home Screen is the manual Safari gesture (Share → Add to Home Screen), which nobody discovers on their own. First-time visitors have no idea the option exists, so they keep re-typing the URL in a browser tab. A one-time, opt-in guide surfaces the gesture without nagging returning users.

## What Changes

- **First-launch prompt**: on the first visit, a dismissible card asks "Are you on an iPhone?" with **Yes** / **No**.
  - **Yes** → reveals the step-by-step Safari Add-to-Home-Screen instructions.
  - **No** → dismisses immediately.
- **Safari is stated explicitly**: the instructions require Safari, because Add to Home Screen only works there on iOS (Chrome/Firefox/in-app browsers can't do it usefully). The guide says so.
- **Shown exactly once, ever**: a `localStorage` key is the single source of truth. It is set on *any* exit — Yes-then-Got-it, No, or closing the question — after which the prompt never renders again. No user-agent sniffing and no `navigator.standalone` check: gating is the key alone.

## Non-goals

- No PWA plumbing (manifest, service worker, `apple-touch-icon`, standalone meta tags). The existing Safari-shortcut behavior is kept as-is.
- No device or browser detection. The user answers the iPhone question themselves.
- No programmatic install ("Install" button) — iOS Safari does not expose one.

## Capabilities

### New Capabilities

- `install-guide`: the first-launch iPhone install prompt — the Yes/No question, the Safari-specific step-by-step instructions, and the once-ever `localStorage` suppression.

### Modified Capabilities

_None — the timer, run lifecycle, whiteboard, and heatmap are untouched; the prompt is additive UI mounted alongside the existing app._

## Impact

- `src/install/InstallPrompt.tsx`: new component (Yes/No question → Safari steps), gated by `localStorage["emoms.installPromptSeen.v1"]`.
- `src/App.tsx`: render `<InstallPrompt />` alongside the existing layout.
- `src/install/__tests__/InstallPrompt.test.tsx`: new tests.
- No changes to the timer, Worker, heatmap, or build config.
