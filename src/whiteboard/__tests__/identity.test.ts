import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getIdentity, setAthleteName } from '../identity';

describe('whiteboard identity', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('creates a stable device id on first read', () => {
    const first = getIdentity();
    expect(first.deviceId).toBeTruthy();
    expect(first.name).toBeNull();
    expect(first.asked).toBe(false);

    const second = getIdentity();
    expect(second.deviceId).toBe(first.deviceId);
  });

  it('remembers the athlete name once set', () => {
    setAthleteName('Ryan');
    const id = getIdentity();
    expect(id.name).toBe('Ryan');
    expect(id.asked).toBe(true);
  });

  it('records a decline as asked-but-anonymous', () => {
    setAthleteName('');
    const id = getIdentity();
    expect(id.name).toBeNull();
    expect(id.asked).toBe(true);
  });

  it('trims and caps stored names', () => {
    setAthleteName(`  ${'x'.repeat(60)}  `);
    expect(getIdentity().name).toHaveLength(40);
  });
});
