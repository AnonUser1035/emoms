import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  completeRun,
  fetchHeatmap,
  fetchResults,
  startRun,
} from '../api';

const WORKER = 'http://worker.test';
const identity = { name: 'Ryan', deviceId: 'dev-1' };
const result = {
  durationSec: 1710,
  totalReps: 300,
  breaks: 4,
  completedAll: true,
};

function okJson(body: unknown) {
  return { ok: true, json: async () => body };
}

describe('runs API client', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv('VITE_CHECKIN_WORKER_URL', WORKER);
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('startRun posts the slug and identity, returns the run id', async () => {
    fetchMock.mockResolvedValue(okJson({ runId: 'r-1', day: '2026-07-07' }));

    const runId = await startRun('pushups-300', identity);

    expect(runId).toBe('r-1');
    expect(fetchMock).toHaveBeenCalledWith(
      `${WORKER}/runs`,
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      slug: 'pushups-300',
      name: 'Ryan',
      deviceId: 'dev-1',
    });
  });

  it('startRun degrades to null on network failure', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    expect(await startRun('pushups-300', identity)).toBeNull();
  });

  it('completeRun targets the started run when an id exists', async () => {
    fetchMock.mockResolvedValue(okJson({ runId: 'r-1', day: '2026-07-07' }));

    await completeRun('r-1', 'pushups-300', result, identity, '150 hr');

    expect(fetchMock).toHaveBeenCalledWith(
      `${WORKER}/runs/r-1/complete`,
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({
      slug: 'pushups-300',
      notes: '150 hr',
      ...result,
    });
  });

  it('completeRun falls back to a self-contained completion without an id', async () => {
    fetchMock.mockResolvedValue(okJson({ runId: 'r-9', day: '2026-07-07' }));

    await completeRun(null, 'chipper-60-30', result, identity);

    expect(fetchMock).toHaveBeenCalledWith(
      `${WORKER}/runs/complete`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('completeRun swallows failures', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(
      completeRun('r-1', 'pushups-300', result, identity),
    ).resolves.toBeUndefined();
  });

  it('fetchHeatmap returns completed/started day pairs', async () => {
    const days = [{ date: '2026-07-07', completed: 2, started: 1 }];
    fetchMock.mockResolvedValue(okJson({ days }));
    expect(await fetchHeatmap()).toEqual(days);
  });

  it('fetchResults returns the whiteboard for a workout', async () => {
    const results = [
      {
        name: 'Brian',
        day: '2026-07-06',
        durationSec: 2100,
        totalReps: 276,
        breaks: 6,
        completedAll: false,
        notes: null,
      },
    ];
    fetchMock.mockResolvedValue(okJson({ results }));

    expect(await fetchResults('pushups-300')).toEqual(results);
    expect(fetchMock).toHaveBeenCalledWith(
      `${WORKER}/results?workout=pushups-300`,
    );
  });

  it('does nothing when no worker URL is configured', async () => {
    vi.stubEnv('VITE_CHECKIN_WORKER_URL', '');
    expect(await startRun('pushups-300', identity)).toBeNull();
    expect(await fetchHeatmap()).toBeNull();
    expect(await fetchResults('pushups-300')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
