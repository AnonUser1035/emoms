# Tasks: add-iphone-install-guide

## 1. Component

- [x] 1.1 Create `src/install/InstallPrompt.tsx`: a dismissible card with two states — `'ask'` ("Are you on an iPhone?" / Yes / No) and `'steps'` (Safari Add-to-Home-Screen instructions with a "Got it" button)
- [x] 1.2 Gate on `localStorage["emoms.installPromptSeen.v1"]` via a lazy `useState` initializer (render `null` from the first frame when present); `dismiss()` writes the key and hides the prompt
- [x] 1.3 Wire exits: Yes → `'steps'`; No → `dismiss()`; Got it → `dismiss()`
- [x] 1.4 State Safari explicitly in the steps copy (Add to Home Screen only works in Safari on iOS)

## 2. Integration

- [x] 2.1 Render `<InstallPrompt />` in `src/App.tsx` alongside the existing layout

## 3. Tests

- [x] 3.1 `src/install/__tests__/InstallPrompt.test.tsx`: renders the question on a clean slate; Yes reveals the Safari steps; No sets the key and unmounts; the key suppresses the prompt on a fresh mount; the steps mention Safari

## 4. Verify

- [x] 4.1 Full test suite, typecheck, lint, build
