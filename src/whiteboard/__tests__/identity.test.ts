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

    const second = getIdentity();
    expect(second.deviceId).toBe(first.deviceId);
  });

  it('remembers the athlete name once set, as the default for next time', () => {
    setAthleteName('Ryan');
    const id = getIdentity();
    expect(id.name).toBe('Ryan');
  });

  it('overwrites the stored name when a new one is submitted', () => {
    setAthleteName('Ryan');
    setAthleteName('Brian');
    expect(getIdentity().name).toBe('Brian');
  });

  it('does not clear a stored name when a blank name is submitted', () => {
    setAthleteName('Ryan');
    setAthleteName('');
    expect(getIdentity().name).toBe('Ryan');
  });

  it('stays anonymous when no name has ever been submitted', () => {
    setAthleteName('');
    expect(getIdentity().name).toBeNull();
  });

  it('trims and caps stored names', () => {
    setAthleteName(`  ${'x'.repeat(60)}  `);
    expect(getIdentity().name).toHaveLength(40);
  });
});
