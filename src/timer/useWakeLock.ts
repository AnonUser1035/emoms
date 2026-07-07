import { useEffect } from 'react';

// Minimal typing for the Screen Wake Lock API (not in older lib.dom).
interface WakeLockSentinelLike {
  release: () => Promise<void>;
}
interface WakeLockNavigator {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
}

/**
 * Keeps the screen awake while `active` is true. Re-acquires the lock if the
 * tab is hidden and later revealed (browsers auto-release on visibility loss).
 * No-ops silently where the Wake Lock API is unavailable.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const nav = navigator as Navigator & WakeLockNavigator;
    if (!nav.wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let released = false;

    const acquire = async () => {
      try {
        sentinel = await nav.wakeLock!.request('screen');
      } catch {
        // Denied or interrupted — leave the screen to its default behaviour.
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !released) void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}
