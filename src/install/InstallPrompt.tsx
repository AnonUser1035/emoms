import { useState } from 'react';

const SEEN_KEY = 'emoms.installPromptSeen.v1';

function hasSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    // Private mode / storage disabled: treat as seen so we never nag in a
    // context where we can't remember having asked.
    return true;
  }
}

function rememberSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Nothing we can do; the prompt still closes for this session.
  }
}

/**
 * A one-time, opt-in nudge to add emoms to the iPhone Home Screen. iOS Safari
 * has no install API — the only path onto the Home Screen is the manual
 * Share → Add to Home Screen gesture — so this teaches the gesture rather than
 * automating anything.
 *
 * The visitor answers the iPhone question themselves (no user-agent sniffing,
 * no `navigator.standalone`); the sole gate is the `emoms.installPromptSeen.v1`
 * key, set on any exit so the prompt appears exactly once, ever.
 */
export default function InstallPrompt() {
  // Read storage once; when the key is present we render null from the first
  // frame, so returning users never see a flash.
  const [step, setStep] = useState<'ask' | 'steps' | null>(() =>
    hasSeen() ? null : 'ask',
  );

  const dismiss = () => {
    rememberSeen();
    setStep(null);
  };

  if (step === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-prompt-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg-elevated p-6 shadow-xl">
        {step === 'ask' ? (
          <>
            <h2
              id="install-prompt-title"
              className="text-lg font-bold tracking-tight"
            >
              Are you on an iPhone?
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              Add emoms to your Home Screen so it opens like an app — no typing
              the URL each time.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setStep('steps')}
                className="flex-1 rounded-lg bg-work px-4 py-2.5 font-semibold text-bg"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 font-semibold text-fg-muted"
              >
                No
              </button>
            </div>
          </>
        ) : (
          <>
            <h2
              id="install-prompt-title"
              className="text-lg font-bold tracking-tight"
            >
              Add emoms to your Home Screen
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              Do this in <span className="font-semibold text-fg">Safari</span> —
              it&rsquo;s the only iPhone browser with Add to Home Screen.
            </p>
            <ol className="mt-4 flex flex-col gap-3 text-sm">
              <li className="flex gap-3">
                <span className="font-bold text-work">1.</span>
                <span>
                  Tap the <span className="font-semibold">Share</span> button
                  (the square with an arrow{' '}
                  <span aria-hidden="true">&#x2B06;&#xFE0E;</span> pointing up) in
                  Safari&rsquo;s bottom bar.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-work">2.</span>
                <span>
                  Scroll down and tap{' '}
                  <span className="font-semibold">Add to Home Screen</span>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-work">3.</span>
                <span>
                  Tap <span className="font-semibold">Add</span> in the
                  top-right.
                </span>
              </li>
            </ol>
            <p className="mt-4 text-sm text-fg-muted">
              Then launch emoms from your Home Screen any time.
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-5 w-full rounded-lg bg-work px-4 py-2.5 font-semibold text-bg"
            >
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  );
}
