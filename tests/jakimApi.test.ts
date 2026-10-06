import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchPrayerTimesAPI } from '../src/services/jakim/JakimApi';

describe('JakimApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns success with data on a valid response', async () => {
    const mockData = { zone: 'PRK02', prayers: [] as unknown[] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }));

    const result = await fetchPrayerTimesAPI(null, 'PRK02');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
    expect(result.location).toBe('PRK02');
  });

  it('returns failure on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    const result = await fetchPrayerTimesAPI(null, 'PRK02');

    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.location).toBe('Kuala Kangsar (PRK02)');
  });

  it('returns failure on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await fetchPrayerTimesAPI(null, 'PRK02');

    expect(result.success).toBe(false);
  });

  it('uses the default zone when none is provided', async () => {
    const mockData = { zone: 'PRK02', prayers: [] as unknown[] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }));

    await fetchPrayerTimesAPI(null);

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://api.waktusolat.app/v2/solat/PRK02',
    );
  });
});
