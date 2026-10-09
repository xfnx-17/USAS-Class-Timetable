import type { TimetableItem, TimeFormat } from '@/shared/types/usas';
import { extractDayName } from '@/shared/lib/dayFormat';
import { getCourseColorSlot, type CourseColorSlot } from '@/shared/lib/courseColors';
import { formatTimeFromMinutes, parseTimeToMinutes } from '@/shared/lib/timetableTime';
import { getOwnRecordValue } from '@/shared/lib/security';

const WEEK_DAYS = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'] as const;

type ChipColor = { bg: string; text: string; bar: string };
type GlassTheme = 'light' | 'dark' | 'emerald' | 'oled' | 'warm';

const GLASS_THEMES: Record<GlassTheme, { card: string; wash: string; strong: string; muted: string; hairline: string; rim: string }> = {
  light: { card: 'rgba(255,255,255,0.5)', wash: 'rgba(255,255,255,0.38)', strong: '#111113', muted: 'rgba(28,28,30,0.62)', hairline: 'rgba(0,0,0,0.1)', rim: '255,255,255' },
  dark: { card: 'rgba(10,20,40,0.58)', wash: 'rgba(10,20,40,0.38)', strong: '#F8FAFC', muted: 'rgba(226,232,240,0.68)', hairline: 'rgba(255,255,255,0.16)', rim: '191,219,254' },
  emerald: { card: 'rgba(1,45,32,0.62)', wash: 'rgba(1,33,23,0.4)', strong: '#ECFDF5', muted: 'rgba(209,250,229,0.68)', hairline: 'rgba(110,231,183,0.2)', rim: '110,231,183' },
  oled: { card: 'rgba(0,0,0,0.72)', wash: 'rgba(0,0,0,0.52)', strong: '#FFFFFF', muted: 'rgba(228,228,231,0.68)', hairline: 'rgba(255,255,255,0.18)', rim: '212,212,216' },
  warm: { card: 'rgba(38,23,5,0.64)', wash: 'rgba(23,14,3,0.42)', strong: '#FEF3C7', muted: 'rgba(253,230,138,0.7)', hairline: 'rgba(251,191,36,0.2)', rim: '252,211,77' },
};

// Plain rgba/hex values (not Tailwind classes) so the PNG renderer sees exact colours.
const DARK_CHIPS: Record<CourseColorSlot, ChipColor> = {
  ISNIN:  { bg: 'rgba(16,185,129,0.34)', text: '#A7F3D0', bar: '#10B981' },
  SELASA: { bg: 'rgba(79,70,229,0.48)',  text: '#C7D2FE', bar: '#6366F1' },
  RABU:   { bg: 'rgba(217,119,6,0.45)',  text: '#FDE68A', bar: '#F59E0B' },
  KHAMIS: { bg: 'rgba(147,51,234,0.42)', text: '#E9D5FF', bar: '#A855F7' },
  JUMAAT: { bg: 'rgba(225,29,72,0.42)',  text: '#FECDD3', bar: '#F43F5E' },
  SABTU:  { bg: 'rgba(234,88,12,0.45)',  text: '#FED7AA', bar: '#F97316' },
  AHAD:   { bg: 'rgba(100,116,139,0.5)', text: '#E2E8F0', bar: '#94A3B8' },
};

const LIGHT_CHIPS: Record<CourseColorSlot, ChipColor> = {
  ISNIN:  { bg: '#D1FAE5', text: '#065F46', bar: '#10B981' },
  SELASA: { bg: '#E0E7FF', text: '#3730A3', bar: '#6366F1' },
  RABU:   { bg: '#FEF3C7', text: '#92400E', bar: '#F59E0B' },
  KHAMIS: { bg: '#F3E8FF', text: '#6B21A8', bar: '#A855F7' },
  JUMAAT: { bg: '#FFE4E6', text: '#9F1239', bar: '#F43F5E' },
  SABTU:  { bg: '#FFEDD5', text: '#9A3412', bar: '#F97316' },
  AHAD:   { bg: '#E2E8F0', text: '#334155', bar: '#64748B' },
};

type MinimalWeekCardProps = {
  courses: TimetableItem[];
  courseColorMap: Map<string, CourseColorSlot>;
  isLight: boolean;
  showTimes: boolean;
  timeFormat: TimeFormat;
  title: string;
  t: (key: string) => string;
  // Offsets from the card to the wallpaper root, so the blurred copy of a
  // custom background lines up with the sharp one behind the card.
  width: number;
  // Apple-style liquid glass: light milky glass, dark text, bent edges and a bright rim.
  glass?: boolean;
  glassTheme?: GlassTheme;
  background?: { url: string; nativeBlur: boolean; rootWidth: number; rootHeight: number; left: number; bottom: number };
};

// The PNG renderer clips text inside overflow:hidden boxes, so long names are
// shortened here instead of with CSS ellipsis.
const shortenName = (name: string, max = 42) => (name.length > max ? `${name.slice(0, max - 1).trimEnd()}…` : name);

const hexToRgba = (hex: string, alpha: number) => {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`;
};

// Liquid glass rim width and how much the rim magnifies what is behind it.

const courseCode = (course: TimetableItem) => course.course_id || course.kod_kursus || '';

export default function MinimalWeekCard({
  courses,
  courseColorMap,
  isLight,
  showTimes,
  timeFormat,
  title,
  t,
  width,
  glass = false,
  glassTheme = 'light',
  background,
}: MinimalWeekCardProps) {
  const glassStyle = getOwnRecordValue<typeof GLASS_THEMES.light>(GLASS_THEMES, glassTheme) || GLASS_THEMES.light;
  const palette = isLight ? LIGHT_CHIPS : DARK_CHIPS;
  const colorFor = (code: string): ChipColor => {
    const color = getOwnRecordValue<ChipColor>(palette, getCourseColorSlot(courseColorMap, code)) || palette.ISNIN;
    if (!glass) return color;
    return { ...color, bg: hexToRgba(color.bar, isLight ? 0.2 : 0.28) };
  };

  const startOf = (course: TimetableItem) => parseTimeToMinutes(course.start_time || course.jadual || '');
  const byDay = WEEK_DAYS.map((day) => ({
    day,
    classes: courses
      .filter((course) => extractDayName(course.day) === day)
      .sort((a, b) => (startOf(a) ?? Infinity) - (startOf(b) ?? Infinity)),
  })).filter(({ classes }) => classes.length > 0);

  // Free days are left out so class days get the full card width. Text is then
  // sized to fit each chip on one line (the PNG renderer can't shrink-to-fit).
  const COLUMN_GAP = 4;
  const padX = glass ? 14 : 12;
  const chipTextWidth = (width - (glass ? 4 : 2) - padX * 2 - COLUMN_GAP * Math.max(0, byDay.length - 1)) / Math.max(1, byDay.length) - 6;
  const fitFont = (texts: string[], max: number, charWidth: number) =>
    Math.max(4, Math.min(max, chipTextWidth / (Math.max(1, ...texts.map((text) => text.length)) * charWidth)));
  const chipDetail = (course: TimetableItem) => {
    const start = startOf(course);
    return [start !== null ? formatTimeFromMinutes(start, timeFormat) : '', course.location || ''].filter(Boolean).join(' | ');
  };
  // One size for every chip so the card reads evenly.
  const shownCourses = byDay.flatMap(({ classes }) => classes);
  const codeFontSize = fitFont(shownCourses.map(courseCode), 8.5, 0.68);
  const detailFontSize = fitFont(shownCourses.map(chipDetail), 6.5, 0.6);

  const legend = Array.from(
    new Map(courses.map((course) => [courseCode(course), course.course_name || course.kursus || ''])).entries(),
  ).filter(([code]) => code);

  const muted = glass ? glassStyle.muted : isLight ? '#64748B' : 'rgba(255,255,255,0.45)';
  const strong = glass ? glassStyle.strong : isLight ? '#0F172A' : 'rgba(255,255,255,0.92)';
  const hairline = glass ? glassStyle.hairline : isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.07)';
  const radius = glass ? '26px' : '18px';
  // Per-side rim: bright where light hits (top/left), dimmer on the far sides.
  // The PNG renderer paints inset box-shadows as a solid inner band, so the
  // glow comes from gradients instead and only a drop shadow is used.
  const glassRim = (strength: number, width: number) => ({
    borderStyle: 'solid',
    borderWidth: `${width}px`,
    borderTopColor: `rgba(${glassStyle.rim},${0.85 * strength})`,
    borderLeftColor: `rgba(${glassStyle.rim},${0.6 * strength})`,
    borderRightColor: `rgba(${glassStyle.rim},${0.25 * strength})`,
    borderBottomColor: `rgba(${glassStyle.rim},${0.4 * strength})`,
  });

  return (
    <div
      data-wallpaper-minimal-card
      data-wallpaper-glass-theme={glass ? glassTheme : undefined}
      className="relative z-10 overflow-hidden"
      style={{
        borderRadius: radius,
        ...(glass
          ? { ...glassRim(0.82, 1), boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }
          : { border: `1px solid ${isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)'}` }),
        backgroundColor: glass
          ? glassStyle.card
          : background
            ? (isLight ? 'rgba(255,255,255,0.55)' : 'rgba(18,18,22,0.55)')
            : (isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.05)'),
        isolation: 'isolate',
      }}
    >
      {background && (
        <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden" style={{ borderRadius: radius }}>
          <img
            data-wallpaper-background-blur
            src={background.url}
            draggable={false}
            className="absolute max-w-none object-cover"
            style={{
              width: `${background.rootWidth}px`,
              height: `${background.rootHeight}px`,
              left: `${-background.left}px`,
              bottom: `${-background.bottom}px`,
              ...(background.nativeBlur ? { WebkitFilter: 'blur(16px)', filter: 'blur(16px)' } : {}),
            }}
          />
          <div className="absolute inset-0" style={{ backgroundColor: glass ? glassStyle.wash : isLight ? 'rgba(255,255,255,0.45)' : 'rgba(10,10,14,0.5)' }} />
        </div>
      )}
      {glass && (
        // Specular light along the top edge, a diagonal glint and a faint bottom glow.
        <div
          aria-hidden="true"
          data-wallpaper-glass-sheen
          className="absolute inset-0 z-[1]"
          style={{ borderRadius: radius, backgroundImage: [
              'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 8%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 84%, rgba(255,255,255,0.1) 100%)',
              'linear-gradient(120deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 30%)',
            ].join(', ') }}
        />
      )}
      <div className="relative z-10" style={{ padding: glass ? `16px ${padX}px 16px` : `14px ${padX}px 12px` }}>
        <div data-wallpaper-minimal-text style={{ fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: muted }}>
          {title}
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${byDay.length}, minmax(0, 1fr))`,
            marginTop: '9px',
            columnGap: `${COLUMN_GAP}px`,
          }}
        >
          {byDay.map(({ day, classes }) => (
            <div key={day} className="flex flex-col items-center" style={{ gap: '3px', minWidth: 0 }}>
              <div data-wallpaper-minimal-text style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: strong, marginBottom: '2px' }}>
                {t(`shortDays.${day}`)}
              </div>
              {classes.map((course) => {
                  const code = courseCode(course);
                  const color = colorFor(code);
                  const start = startOf(course);
                  const detail = chipDetail(course);
                  return (
                    <div
                      key={`${code}-${start}`}
                      data-export-course-color-code={code}
                      className="w-full text-center"
                      style={{
                        backgroundColor: color.bg,
                        color: color.text,
                        borderRadius: glass ? '11px' : '6px',
                        padding: '4px 2px 5.5px',
                        lineHeight: 1.3,
                        ...(glass
                          ? {
                              ...glassRim(0.58, 1),
                              backgroundImage: [
                                'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.1) 22%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 78%, rgba(255,255,255,0.16) 100%)',
                                'linear-gradient(90deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 18%)',
                              ].join(', '),
                            }
                          : {}),
                      }}
                    >
                      <div data-wallpaper-minimal-text style={{ fontSize: `${codeFontSize}px`, fontWeight: 800, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>{code}</div>
                      {showTimes && detail && (
                        <div data-minimal-chip-detail data-wallpaper-minimal-text style={{ fontSize: `${detailFontSize}px`, fontWeight: 600, opacity: 0.85, marginTop: '1.5px', whiteSpace: 'nowrap' }}>
                          {detail}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>

        {legend.length > 0 && (
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: `1px solid ${hairline}`, display: 'grid', rowGap: '4px' }}>
            {legend.map(([code, name]) => (
              // The colour bar is a text glyph so it shares the code's baseline; box
              // elements drift above the text in the PNG renderer.
              <div key={code} data-wallpaper-minimal-text style={{ fontSize: '7.5px', lineHeight: 1.4, minWidth: 0, whiteSpace: 'nowrap' }}>
                <span aria-hidden="true" style={{ color: colorFor(code).bar, marginRight: '5px' }}>{'\u258E'}</span>
                <span style={{ fontWeight: 800, color: strong }}>{code}</span>{' '}
                <span style={{ color: muted, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                  · {shortenName(name.toLowerCase())}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
