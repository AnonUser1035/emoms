// Node ≥25 ships an experimental `localStorage` global (undefined unless
// --localstorage-file is passed). Vitest's jsdom environment skips copying a
// window key onto the Node global when the global already has it — and then
// aliases `window` to that global — so both `localStorage` and
// `window.localStorage` resolve to Node's stub instead of jsdom's Storage.
// Re-point the global at the real jsdom implementation.
interface JsdomExposingGlobal {
  jsdom?: { window: { localStorage: Storage; sessionStorage: Storage } };
}

const dom = (globalThis as unknown as JsdomExposingGlobal).jsdom;
if (dom) {
  for (const key of ['localStorage', 'sessionStorage'] as const) {
    if (globalThis[key] === undefined) {
      Object.defineProperty(globalThis, key, {
        get: () => dom.window[key],
        configurable: true,
      });
    }
  }
}
