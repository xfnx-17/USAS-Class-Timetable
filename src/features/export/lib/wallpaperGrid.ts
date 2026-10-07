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

  let firstHour = Math.floor(Math.min(...validRanges.map(({ start }) => start)) / 60);
  const lastHour = Math.min(24, Math.ceil(Math.max(...validRanges.map(({ end }) => end)) / 60));
  const periodHours = Math.max(lastHour - firstHour >= 2 ? 2 : 1, Math.ceil((lastHour - firstHour) / maxColumns));
  const periodMinutes = periodHours * 60;
  const slotCount = Math.ceil((lastHour - firstHour) / periodHours);
  if (firstHour + slotCount * periodHours > 24) firstHour = 24 - slotCount * periodHours;
  const slots: WallpaperGridSlot[] = [];

  for (let index = 0; index < slotCount; index++) {
    const start = firstHour * 60 + index * periodMinutes;
    slots.push({ start, end: start + periodMinutes });
  }

  return slots;
};
