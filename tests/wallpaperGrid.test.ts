import { describe, expect, it } from 'vitest';
import { buildWallpaperGridSlots } from '../src/features/export/lib/wallpaperGrid';

describe('buildWallpaperGridSlots', () => {
  it('uses compact, regular periods across the class range', () => {
    const slots = buildWallpaperGridSlots([
      { start: 11 * 60, end: 13 * 60 },
      { start: 13 * 60, end: 16 * 60 },
      { start: 20 * 60, end: 23 * 60 },
    ]);

    expect(slots).toEqual([
      { start: 11 * 60, end: 13 * 60 },
      { start: 13 * 60, end: 15 * 60 },
      { start: 15 * 60, end: 17 * 60 },
      { start: 17 * 60, end: 19 * 60 },
      { start: 19 * 60, end: 21 * 60 },
      { start: 21 * 60, end: 23 * 60 },
    ]);
  });

  it('caps the last slot at midnight', () => {
    expect(buildWallpaperGridSlots([{ start: 23 * 60, end: 25 * 60 }])).toEqual([
      { start: 23 * 60, end: 24 * 60 },
    ]);
  });

  it('keeps a short daytime schedule short', () => {
    expect(buildWallpaperGridSlots([{ start: 13 * 60, end: 14 * 60 }])).toEqual([
      { start: 13 * 60, end: 14 * 60 },
    ]);
  });

  it('keeps equal-width periods aligned when the last class ends between periods', () => {
    expect(buildWallpaperGridSlots([{ start: 8 * 60 + 30, end: 17 * 60 }])).toEqual([
      { start: 8 * 60, end: 10 * 60 },
      { start: 10 * 60, end: 12 * 60 },
      { start: 12 * 60, end: 14 * 60 },
      { start: 14 * 60, end: 16 * 60 },
      { start: 16 * 60, end: 18 * 60 },
    ]);
  });
});
