// Today's EMOM: one workout featured per calendar day, the same on every
// device, with no server involvement — the pick is a pure function of the
// date and the registry. Days are bucketed at America/New_York midnight to
// match the Worker's heatmap day (change both together if that ever moves).
//
// Selection deals from a shuffled deck rather than hashing each day
// independently: day numbers are grouped into cycles of n (pool size), each
// cycle gets a seeded permutation, and the day indexes into it. Every workout
// appears exactly once per cycle, consecutive days never repeat within a
// cycle (permutation entries are distinct), and the cycle boundary is fixed
// by one deterministic rule: if a cycle's first pick equals the previous
// cycle's last, swap it with the second. The swap never touches a cycle's
// last element (n ≥ 3), so the rule needs only the previous cycle's
// *unadjusted* permutation — no recursion, any date computable in isolation.

import type { Workout } from './workouts';

const DAILY_TIMEZONE = 'America/New_York';

/** Fixed epoch (UTC noon, DST-safe) that day numbers count from. */
const EPOCH_UTC_NOON = Date.UTC(2024, 0, 1, 12);

/** Days since the epoch for `date`, in the fixed timezone's calendar. */
function dayNumber(date: Date): number {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: DAILY_TIMEZONE,
  }).format(date);
  const [y, m, d] = ymd.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d, 12) - EPOCH_UTC_NOON) / 86_400_000);
}

/** Tiny deterministic PRNG — identical sequences on every device. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded Fisher-Yates shuffle of [0..n-1] for one cycle. */
function cyclePermutation(n: number, cycleIndex: number): number[] {
  // Mix the cycle index so adjacent cycles get unrelated seeds; the pool
  // size participates so growing the registry reshuffles cleanly.
  const rand = mulberry32(Math.imul(cycleIndex + 1, 0x9e3779b1) ^ n);
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Index of the daily pick into a pool of `n`, for `date`. Pure. */
export function dailyPickIndex(n: number, date: Date): number {
  if (n <= 1) return 0;
  const d = dayNumber(date);
  if (n === 2) return ((d % 2) + 2) % 2; // strict alternation

  const cycleIndex = Math.floor(d / n);
  const pos = ((d % n) + n) % n;
  const perm = cyclePermutation(n, cycleIndex);
  const prevLast = cyclePermutation(n, cycleIndex - 1)[n - 1];
  if (perm[0] === prevLast) {
    [perm[0], perm[1]] = [perm[1], perm[0]];
  }
  return perm[pos];
}

/** Today's EMOM for the given registry and moment. */
export function dailyPick(workouts: Workout[], date: Date): Workout {
  return workouts[dailyPickIndex(workouts.length, date)];
}
