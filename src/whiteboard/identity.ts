// Gym-whiteboard identity: a display name the athlete confirms every finish
// (pre-filled with whatever they used last), plus a generated device id as a
// stable key. No accounts, no verification — the server stores both verbatim
// and trusts them (good-faith friend group). The device id isn't used for
// anything yet; it's the hook for later edit/delete-own-results without a
// schema change.

import type { WhiteboardIdentity } from '../heatmap/api';

const NAME_KEY = 'emoms.athleteName.v1';
const DEVICE_KEY = 'emoms.deviceId.v1';

export type StoredIdentity = WhiteboardIdentity;

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
    name: rawName ? rawName : null,
    deviceId,
  };
}

/**
 * Persist the athlete's name as the default for next time. A blank name
 * (declining for this run) is not persisted, so it doesn't clear a
 * previously stored default.
 */
export function setAthleteName(name: string): void {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) return;
  try {
    window.localStorage.setItem(NAME_KEY, trimmed);
  } catch {
    // Ignore — see getIdentity.
  }
}
