import { describe, expect, it } from 'vitest';
import { buildWallpaperGridSlots } from '../src/features/export/lib/wallpaperGrid';

describe('buildWallpaperGridSlots', () => {
  it('keeps course boundaries and compresses long empty gaps', () => {
    const slots = buildWallpaperGridSlots([
      { start: 11 * 60, end: 13 * 60 },
      { start: 13 * 60, end: 16 * 60 },
      { start: 20 * 60, end: 23 * 60 },
    ]);

    expect(slots).toEqual([
      { start: 11 * 60, end: 13 * 60, weight: 2 },
      { start: 13 * 60, end: 16 * 60, weight: 3 },
      { start: 16 * 60, end: 20 * 60, weight: 1 },
      { start: 20 * 60, end: 23 * 60, weight: 3 },
    ]);
  });

  it('caps the last slot at midnight', () => {
    expect(buildWallpaperGridSlots([{ start: 23 * 60, end: 25 * 60 }])).toEqual([
      { start: 23 * 60, end: 24 * 60, weight: 1 },
    ]);
  });
});
