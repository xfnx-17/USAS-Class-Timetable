import { extractDayName } from '@/shared/lib/dayFormat';
import { getOwnRecordValue } from '@/shared/lib/security';
import { formatTimeFromMinutes, getShortTimeRange } from '@/shared/lib/timetableTime';

export type WallpaperPreset = 'phone' | 'android' | 'tablet' | 'desktop' | 'square';

// Android wallpapers are just a taller phone, so they share the phone layout.
export const getLayoutPreset = (preset: WallpaperPreset): Exclude<WallpaperPreset, 'android'> =>
  preset === 'android' ? 'phone' : preset;
export type ContentDetail = 'CODE' | 'DETAILS';
export type WallpaperDesign = 'GRID' | 'MINIMAL' | 'GLASS';
export type ExportTheme = 'light' | 'dark' | 'emerald' | 'oled' | 'warm';
export type WallpaperPresetStyle = {
  tableFontSize: string;
  thPadding: string;
  tdPadding: string;
  minH: string;
  courseTitleSize: string;
  courseSubSize?: string;
  courseLocSize: string;
  durationSize: string;
  iconSize: string;
};

export const getModalDayColors = (day: string | undefined, theme: ExportTheme) => {
  const isLight = theme === 'light';
  const darkColors = {
    'ISNIN': { bg: 'bg-emerald-500/25', border: 'border-emerald-500/40', text: 'text-emerald-300 font-bold' },
    'SELASA': { bg: 'bg-blue-500/25', border: 'border-blue-500/40', text: 'text-blue-300 font-bold' },
    'RABU': { bg: 'bg-amber-500/25', border: 'border-amber-500/40', text: 'text-amber-300 font-bold' },
    'KHAMIS': { bg: 'bg-purple-500/25', border: 'border-purple-500/40', text: 'text-purple-300 font-bold' },
    'JUMAAT': { bg: 'bg-rose-500/25', border: 'border-rose-500/40', text: 'text-rose-300 font-bold' },
    'SABTU': { bg: 'bg-orange-500/25', border: 'border-orange-500/40', text: 'text-orange-300 font-bold' },
    'AHAD': { bg: 'bg-slate-500/25', border: 'border-slate-500/40', text: 'text-slate-300 font-bold' },
  };
  const emeraldColors = {
    'ISNIN': { bg: 'bg-emerald-500/30', border: 'border-emerald-400/50', text: 'text-emerald-200 font-bold' },
    'SELASA': { bg: 'bg-teal-500/30', border: 'border-teal-400/50', text: 'text-teal-200 font-bold' },
    'RABU': { bg: 'bg-amber-500/30', border: 'border-amber-400/50', text: 'text-amber-200 font-bold' },
    'KHAMIS': { bg: 'bg-lime-500/30', border: 'border-lime-400/50', text: 'text-lime-200 font-bold' },
    'JUMAAT': { bg: 'bg-emerald-600/35', border: 'border-emerald-300/60', text: 'text-emerald-100 font-bold' },
    'SABTU': { bg: 'bg-amber-600/30', border: 'border-amber-400/50', text: 'text-amber-200 font-bold' },
    'AHAD': { bg: 'bg-slate-500/30', border: 'border-slate-400/50', text: 'text-slate-200 font-bold' },
  };
  const warmColors = {
    'ISNIN': { bg: 'bg-amber-500/30', border: 'border-amber-400/50', text: 'text-amber-200 font-bold' },
    'SELASA': { bg: 'bg-orange-500/30', border: 'border-orange-400/50', text: 'text-orange-200 font-bold' },
    'RABU': { bg: 'bg-yellow-500/30', border: 'border-yellow-400/50', text: 'text-yellow-200 font-bold' },
    'KHAMIS': { bg: 'bg-red-500/30', border: 'border-red-400/50', text: 'text-red-200 font-bold' },
    'JUMAAT': { bg: 'bg-amber-600/35', border: 'border-amber-300/60', text: 'text-amber-100 font-bold' },
    'SABTU': { bg: 'bg-orange-600/30', border: 'border-orange-400/50', text: 'text-orange-200 font-bold' },
    'AHAD': { bg: 'bg-stone-500/30', border: 'border-stone-400/50', text: 'text-stone-200 font-bold' },
  };
  const oledColors = {
    'ISNIN': { bg: 'bg-emerald-950/60', border: 'border-emerald-500/60', text: 'text-emerald-300 font-bold' },
    'SELASA': { bg: 'bg-blue-950/60', border: 'border-blue-500/60', text: 'text-blue-300 font-bold' },
    'RABU': { bg: 'bg-amber-950/60', border: 'border-amber-500/60', text: 'text-amber-300 font-bold' },
    'KHAMIS': { bg: 'bg-purple-950/60', border: 'border-purple-500/60', text: 'text-purple-300 font-bold' },
    'JUMAAT': { bg: 'bg-rose-950/60', border: 'border-rose-500/60', text: 'text-rose-300 font-bold' },
    'SABTU': { bg: 'bg-orange-950/60', border: 'border-orange-500/60', text: 'text-orange-300 font-bold' },
    'AHAD': { bg: 'bg-zinc-900/80', border: 'border-zinc-500/60', text: 'text-zinc-300 font-bold' },
  };
  const lightColors = {
    'ISNIN': { bg: 'bg-emerald-100/80', border: 'border-emerald-300', text: 'text-emerald-800 font-bold' },
    'SELASA': { bg: 'bg-blue-100/80', border: 'border-blue-300', text: 'text-blue-800 font-bold' },
    'RABU': { bg: 'bg-amber-100/90', border: 'border-amber-350', text: 'text-amber-800 font-bold' },
    'KHAMIS': { bg: 'bg-purple-100/80', border: 'border-purple-300', text: 'text-purple-800 font-bold' },
    'JUMAAT': { bg: 'bg-rose-100/80', border: 'border-rose-300', text: 'text-rose-800 font-bold' },
    'SABTU': { bg: 'bg-orange-100/80', border: 'border-orange-300', text: 'text-orange-800 font-bold' },
    'AHAD': { bg: 'bg-slate-200/80', border: 'border-slate-300', text: 'text-slate-800 font-bold' },
  };

  const map = theme === 'emerald'
    ? emeraldColors
    : theme === 'warm'
      ? warmColors
      : theme === 'oled'
        ? oledColors
        : isLight
          ? lightColors
          : darkColors;

  const key = (extractDayName(day) || 'ISNIN') as keyof typeof map;
  return getOwnRecordValue<(typeof map)[keyof typeof map]>(map, key)
    || getOwnRecordValue<(typeof map)[keyof typeof map]>(map, 'ISNIN')!;
};

export const getLockscreenThemeConfig = (theme: ExportTheme) => {
  switch (theme) {
    case 'light':
      return {
        bg: '#FFFFFF',
        borderColor: '#E2E8F0',
        textColor: '#1E293B',
        gridBg: 'bg-slate-50 border-slate-200',
        headerBorder: 'border-slate-200',
        headerText: 'text-slate-700',
        dayText: 'text-slate-400',
        cellBorder: 'border-slate-200/60',
        isLight: true,
      };
    case 'emerald':
      return {
        bg: '#012117',
        borderColor: '#05966940',
        textColor: '#ECFDF5',
        gridBg: 'bg-[#012d20] border-emerald-500/25',
        headerBorder: 'border-emerald-500/20',
        headerText: 'text-emerald-300',
        dayText: 'text-emerald-400/60',
        cellBorder: 'border-emerald-500/15',
        isLight: false,
      };
    case 'oled':
      return {
        bg: '#000000',
        borderColor: '#27272a',
        textColor: '#FFFFFF',
        gridBg: 'bg-[#09090b] border-zinc-800',
        headerBorder: 'border-zinc-800',
        headerText: 'text-white',
        dayText: 'text-zinc-500',
        cellBorder: 'border-zinc-800/80',
        isLight: false,
      };
    case 'warm':
      return {
        bg: '#170e03',
        borderColor: '#d9770640',
        textColor: '#FEF3C7',
        gridBg: 'bg-[#261705] border-amber-500/25',
        headerBorder: 'border-amber-500/20',
        headerText: 'text-amber-300',
        dayText: 'text-amber-400/60',
        cellBorder: 'border-amber-500/15',
        isLight: false,
      };
    case 'dark':
    default:
      return {
        bg: '#070F22',
        borderColor: '#ffffff15',
        textColor: '#FFFFFF',
        gridBg: 'bg-[#0A1428] border-white/[0.08]',
        headerBorder: 'border-white/[0.06]',
        headerText: 'text-white',
        dayText: 'text-white/40',
        cellBorder: 'border-white/[0.04]',
        isLight: false,
      };
  }
};

export type LockscreenThemeConfig = ReturnType<typeof getLockscreenThemeConfig>;

export const getPresetStyle = (wallpaperPreset: WallpaperPreset, detail: ContentDetail = 'DETAILS'): WallpaperPresetStyle => {
  const preset = getLayoutPreset(wallpaperPreset);
  const base: Record<Exclude<WallpaperPreset, 'android'>, WallpaperPresetStyle> = {
    phone: {
      tableFontSize: 'text-[5.75px]',
      thPadding: 'p-0.5',
      tdPadding: 'p-0.5',
      minH: 'min-h-[34px]',
      courseTitleSize: 'text-[6px] font-black leading-none text-center',
      courseSubSize: 'text-[5px] leading-tight line-clamp-2 text-center break-words',
      courseLocSize: 'text-[4.5px] leading-none text-center font-medium',
      durationSize: 'text-[4.4px] leading-none text-center font-semibold',
      iconSize: 'w-1.5 h-1.5',
    },
    square: {
      tableFontSize: 'text-[7px]',
      thPadding: 'p-0.5',
      tdPadding: 'p-0.5',
      minH: 'min-h-[40px]',
      courseTitleSize: 'text-[7px] font-black leading-none text-center',
      courseSubSize: 'text-[6px] leading-tight line-clamp-2 text-center break-words',
      courseLocSize: 'text-[5.5px] leading-none text-center font-medium',
      durationSize: 'text-[5px] leading-none text-center font-semibold',
      iconSize: 'w-2 h-2',
    },
    tablet: {
      tableFontSize: 'text-[8px]',
      thPadding: 'p-1',
      tdPadding: 'p-1',
      minH: 'min-h-[46px]',
      courseTitleSize: 'text-[8.5px] font-black leading-none text-center',
      courseSubSize: 'text-[7px] leading-tight line-clamp-2 text-center break-words',
      courseLocSize: 'text-[6px] leading-none text-center font-medium',
      durationSize: 'text-[5.8px] leading-none text-center font-semibold',
      iconSize: 'w-2.5 h-2.5',
    },
    desktop: {
      tableFontSize: 'text-[9px]',
      thPadding: 'p-1.5',
      tdPadding: 'p-1',
      minH: 'min-h-[52px]',
      courseTitleSize: 'text-[9.5px] font-black leading-none text-center',
      courseSubSize: 'text-[8.2px] leading-tight line-clamp-2 text-center break-words',
      courseLocSize: 'text-[7px] leading-none text-center font-medium',
      durationSize: 'text-[6.5px] leading-none text-center font-semibold',
      iconSize: 'w-3 h-3',
    },
  };

  const detailTweaks: Record<ContentDetail, Partial<Record<WallpaperPreset, Partial<WallpaperPresetStyle>>>> = {
    CODE: {
      phone: { minH: 'min-h-[24px]', courseTitleSize: 'text-[7.2px] font-black leading-none text-center tracking-tight', durationSize: 'text-[4px] leading-none text-center font-semibold' },
      square: { minH: 'min-h-[32px]', courseTitleSize: 'text-[8.4px] font-black leading-none text-center tracking-tight', durationSize: 'text-[4.6px] leading-none text-center font-semibold' },
      tablet: { minH: 'min-h-[38px]', courseTitleSize: 'text-[10px] font-black leading-none text-center tracking-tight', durationSize: 'text-[5.2px] leading-none text-center font-semibold' },
      desktop: { minH: 'min-h-[44px]', courseTitleSize: 'text-[11.8px] font-black leading-none text-center tracking-tight', durationSize: 'text-[5.8px] leading-none text-center font-semibold' },
    },
    DETAILS: {
      phone: { minH: 'min-h-[26px]', courseTitleSize: 'text-[6.8px] font-black leading-none text-center tracking-tight', courseLocSize: 'text-[3.8px] leading-none text-center font-medium', durationSize: 'text-[3.8px] leading-none text-center font-semibold' },
      square: { minH: 'min-h-[34px]', courseTitleSize: 'text-[8px] font-black leading-none text-center tracking-tight', courseLocSize: 'text-[4.5px] leading-none text-center font-medium', durationSize: 'text-[4.5px] leading-none text-center font-semibold' },
      tablet: { minH: 'min-h-[40px]', courseTitleSize: 'text-[9.4px] font-black leading-none text-center tracking-tight', courseLocSize: 'text-[5.1px] leading-none text-center font-medium', durationSize: 'text-[5px] leading-none text-center font-semibold' },
      desktop: { minH: 'min-h-[46px]', courseTitleSize: 'text-[10.8px] font-black leading-none text-center tracking-tight', courseLocSize: 'text-[5.8px] leading-none text-center font-medium', durationSize: 'text-[5.8px] leading-none text-center font-semibold' },
    },
  };

  const presetBase = getOwnRecordValue<WallpaperPresetStyle>(base, preset) ?? base.phone;
  const detailConfig = getOwnRecordValue<Partial<Record<WallpaperPreset, Partial<WallpaperPresetStyle>>>>(detailTweaks, detail);
  const presetTweaks = detailConfig && getOwnRecordValue<Partial<WallpaperPresetStyle>>(detailConfig, preset);
  return { ...presetBase, ...(presetTweaks || {}) };
};

export const WALLPAPER_PRESET_SIZES = new Map<WallpaperPreset, { width: number; height: number }>([
  ['phone', { width: 360, height: 640 }],
  ['android', { width: 360, height: 800 }],
  ['tablet', { width: 520, height: 640 }],
  ['square', { width: 480, height: 480 }],
  ['desktop', { width: 780, height: 480 }],
]);

// Measures the real rendered width of bold text so the wallpaper can shrink the
// course code to exactly fit a narrow (single-period) cell.
let codeMeasureCanvas: HTMLCanvasElement | null = null;
export const measureBoldTextWidth = (text: string, fontSizePx: number): number | null => {
  if (typeof document === 'undefined' || !text) return null;
  if (!codeMeasureCanvas) codeMeasureCanvas = document.createElement('canvas');
  const ctx = codeMeasureCanvas.getContext('2d');
  if (!ctx) return null;
  ctx.font = `900 ${fontSizePx}px Inter, Arial, sans-serif`;
  return ctx.measureText(text).width || null;
};

export const parseTimeToMinutes = (timeStr?: string) => {
  if (!timeStr) return null;
  const raw = String(timeStr).trim();
  const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const twentyFourMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
  const match = ampmMatch || twentyFourMatch;
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const suffix = ampmMatch ? ampmMatch[3].toUpperCase() : null;
  const normalizedHour = suffix === 'PM' && hour < 12 ? hour + 12 : suffix === 'AM' && hour === 12 ? 0 : hour;
  return normalizedHour * 60 + minute;
};

export const formatDurationRange = (startTime?: string, endTime?: string, timeFormat: '12h' | '24h' = '24h') => {
  if (!startTime && !endTime) return '-';
  return getShortTimeRange(startTime, endTime, timeFormat).replace('-', ' - ');
};

export const formatWallpaperSlotLabel = (startMinutes: number, endMinutes: number, timeFormat: '12h' | '24h') => {
  const format = (minutes: number) => {
    if (timeFormat === '24h' && minutes % 60 === 0) return String(Math.floor(minutes / 60));
    if (timeFormat === '12h') return String(Math.floor(minutes / 60) % 12 || 12);
    return formatTimeFromMinutes(minutes, timeFormat).replace(/\s?(AM|PM)$/i, '');
  };
  if (endMinutes - startMinutes <= 30) return format(startMinutes);
  const start = format(startMinutes);
  const end = format(Math.min(24 * 60, endMinutes));
  return timeFormat === '12h' ? `${start} - ${end}` : `${start}-${end}`;
};

export const formatShortDurationLabel = (startTime?: string, endTime?: string) => {
  const startParsed = parseTimeToMinutes(startTime);
  const endParsed = parseTimeToMinutes(endTime);
  if (startParsed == null || endParsed == null || endParsed <= startParsed) return '';
  const hours = Math.max(1, Math.round((endParsed - startParsed) / 60));
  return `${hours}hr${hours > 1 ? 's' : ''}`;
};

export const getWallpaperSpacerHeights = (
  preset: WallpaperPreset,
  design: WallpaperDesign,
  topAdjustment = 0,
  bottomAdjustment = 0,
) => {
  const top = preset === 'desktop' ? 56 : preset === 'square' ? 64 : preset === 'tablet' ? 104 : 96;
  const bottom = design === 'GRID' ? (preset === 'desktop' ? 28 : preset === 'square' ? 24 : preset === 'tablet' ? 22 : 18) : 47;
  const topOffset = Math.max(12 - top, Math.min(120, topAdjustment));
  const bottomOffset = Math.max(-bottom, Math.min(120, bottomAdjustment));
  return {
    top: top + topOffset,
    bottom: bottom + bottomOffset,
    topBase: top,
    bottomBase: bottom,
    topMax: top + 120,
    bottomMax: bottom + 120,
  };
};

export type WallpaperSpacers = ReturnType<typeof getWallpaperSpacerHeights>;
