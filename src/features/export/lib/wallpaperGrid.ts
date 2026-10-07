export type WallpaperTimeRange = { start: number; end: number };
export type WallpaperGridSlot = WallpaperTimeRange;

export const buildWallpaperGridSlots = (ranges: WallpaperTimeRange[], maxColumns = 8): WallpaperGridSlot[] => {
  const validRanges = ranges
    .map(({ start, end }) => ({ start: Math.max(0, start), end: Math.min(24 * 60, end) }))
    .filter(({ start, end }) => Number.isFinite(start) && Number.isFinite(end) && end > start);

  if (validRanges.length === 0) {
    return Array.from({ length: 9 }, (_, index) => ({
      start: (8 + index) * 60,
      end: (9 + index) * 60,
    }));
  }

  const firstHour = Math.floor(Math.min(...validRanges.map(({ start }) => start)) / 60);
  const lastHour = Math.min(24, Math.ceil(Math.max(...validRanges.map(({ end }) => end)) / 60));
  const periodHours = Math.max(2, Math.ceil((lastHour - firstHour) / maxColumns));
  const periodMinutes = periodHours * 60;
  const slots: WallpaperGridSlot[] = [];

  for (let start = firstHour * 60; start < lastHour * 60; start += periodMinutes) {
    slots.push({ start, end: Math.min(lastHour * 60, start + periodMinutes) });
  }

  return slots;
};
