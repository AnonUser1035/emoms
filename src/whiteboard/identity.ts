// Gym-whiteboard identity: a display name the athlete types once, plus a
// generated device id as a stable key. No accounts, no verification — the
// server stores both verbatim and trusts them (good-faith friend group).
// The device id isn't used for anything yet; it's the hook for later
// edit/delete-own-results without a schema change.

import type { WhiteboardIdentity } from '../heatmap/api';

const NAME_KEY = 'emoms.athleteName.v1';
const DEVICE_KEY = 'emoms.deviceId.v1';

export interface StoredIdentity extends WhiteboardIdentity {
  /** True once the name prompt has been answered (even by declining). */
  asked: boolean;
}

/** Read identity; creates and persists the device id on first call. */
export function getIdentity(): StoredIdentity {
  let rawName: string | null = null;
  let deviceId: string | null = null;
  try {
    rawName = window.localStorage.getItem(NAME_KEY);
    deviceId = window.localStorage.getItem(DEVICE_KEY);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      window.localStorage.setItem(DEVICE_KEY, deviceId);
    }
  } catch {
    // Storage unavailable — stay anonymous and unkeyed for this session.
  }
  return {
    // '' marks asked-and-declined: still anonymous, but never nag again.
    name: rawName ? rawName : null,
    deviceId,
    asked: rawName !== null,
  };
}

/** Persist the athlete's answer; an empty string records a decline. */
export function setAthleteName(name: string): void {
  try {
    window.localStorage.setItem(NAME_KEY, name.trim().slice(0, 40));
  } catch {
    // Ignore — see getIdentity.
  }
}
