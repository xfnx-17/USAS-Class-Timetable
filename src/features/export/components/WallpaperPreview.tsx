import type { Dispatch, ReactNode, Ref, SetStateAction } from 'react';
import type { TimetableItem, TimeFormat } from '@/shared/types/usas';
import { extractDayName, formatDayDisplay } from '@/shared/lib/dayFormat';
import { getCourseColorSlot, type CourseColorSlot } from '@/shared/lib/courseColors';
import { getShortTimeRange } from '@/shared/lib/timetableTime';
import { buildWallpaperGridSlots, getWallpaperAxisPosition } from '../lib/wallpaperGrid';
import {
  formatDurationRange, formatShortDurationLabel, formatWallpaperSlotLabel, getModalDayColors,
  getPresetStyle, measureBoldTextWidth, parseTimeToMinutes, WALLPAPER_PRESET_SIZES,
  type ContentDetail, type ExportTheme, type LockscreenThemeConfig, type WallpaperDesign,
  type WallpaperPreset, type WallpaperSpacers,
} from '../lib/wallpaperExportHelpers';
import MinimalWeekCard from './MinimalWeekCard';

type WallpaperPreviewProps = {
  isLight: boolean;
  wallpaperDesign: WallpaperDesign;
  setWallpaperDesign: Dispatch<SetStateAction<WallpaperDesign>>;
  t: (key: string) => string;
  renderFloatingZoomWidget: (isLight: boolean) => ReactNode;
  wallpaperPreset: WallpaperPreset;
  contentDetail: ContentDetail;
  timeFormat: TimeFormat;
  wallpaperBackground: string;
  wallpaperBackgroundBlurred: string;
  useNativeGlassBlur: boolean;
  currentSpacers: WallpaperSpacers;
  wallpaperRef: Ref<HTMLDivElement>;
  userZoom: number;
  allCourses: TimetableItem[];
  courseColorMap: Map<string, CourseColorSlot>;
  daysList: string[];
  brightDayLabels: Set<number>;
  exportTheme: ExportTheme;
  lockscreenConfig: LockscreenThemeConfig;
};

export default function WallpaperPreview({
  isLight, wallpaperDesign, setWallpaperDesign, t, renderFloatingZoomWidget,
  wallpaperPreset, contentDetail, timeFormat, wallpaperBackground, wallpaperBackgroundBlurred,
  useNativeGlassBlur, currentSpacers, wallpaperRef, userZoom, allCourses, courseColorMap,
  daysList, brightDayLabels, exportTheme, lockscreenConfig,
}: WallpaperPreviewProps) {
  const renderWallpaperCourseContent = (
    course: TimetableItem,
    cellWidthPx: number,
    isLightMode: boolean,
    style: {
      tableFontSize: string;
      thPadding: string;
      tdPadding: string;
      minH: string;
      courseTitleSize: string;
      courseSubSize?: string;
      courseLocSize: string;
      durationSize: string;
      iconSize: string;
    }
  ) => {
    const code = course.course_id || course.kod_kursus || '';
    const loc = course.location || '';
    const duration = formatDurationRange(course.start_time || course.jadual, course.end_time, timeFormat);
    const timeRange = getShortTimeRange(course.start_time || course.jadual, course.end_time, timeFormat)
      .replace(/\s?(AM|PM)/gi, '');
    const [startTimeLabel, endTimeLabel] = timeRange.split('-');
    const shortDuration = formatShortDurationLabel(course.start_time || course.jadual, course.end_time);
    const timeInfoFontSize = Math.max(3.6, Math.min(5, (cellWidthPx - 8) / (Math.max(startTimeLabel.length, endTimeLabel?.length || 0) * 0.58)));
    const timeInfo = (
      <>
        {startTimeLabel && <span data-export-course-time="start" title={duration} className={`absolute left-0.5 top-0.5 z-20 whitespace-nowrap font-semibold leading-none ${isLightMode ? 'text-slate-600' : 'text-white/70'}`} style={{ fontSize: `${timeInfoFontSize}px` }}>{startTimeLabel}</span>}
        {endTimeLabel && <span data-export-course-time="end" title={duration} className={`absolute right-0.5 bottom-0.5 z-20 whitespace-nowrap font-semibold leading-none ${isLightMode ? 'text-slate-600' : 'text-white/70'}`} style={{ fontSize: `${timeInfoFontSize}px` }}>{endTimeLabel}</span>}
      </>
    );
    const durationInfo = shortDuration && (
      <div data-export-course-duration className={`w-full text-center ${style.durationSize} leading-normal font-bold ${isLightMode ? 'text-slate-500' : 'text-white/60'}`}>
        {shortDuration}
      </div>
    );
    const codeOnlyFontSize = (() => {
      const baseSize = (() => {
        if (wallpaperPreset === 'phone') {
          if (code.length > 8) return 7.5;
          if (code.length > 6) return 8.2;
          if (code.length > 4) return 9.0;
          return 10.0;
        }
        if (wallpaperPreset === 'square') {
          if (code.length > 8) return 9.5;
          if (code.length > 6) return 10.5;
          if (code.length > 4) return 11.5;
          return 12.5;
        }
        if (wallpaperPreset === 'tablet') {
          if (code.length > 8) return 10.5;
          if (code.length > 6) return 11.5;
          if (code.length > 4) return 12.5;
          return 13.5;
        }
        if (code.length > 8) return 10.0;
        if (code.length > 6) return 11.0;
        if (code.length > 4) return 12.0;
        return 13.0;
      })();
      if (contentDetail === 'CODE') return baseSize * 1.25;
      return baseSize;
    })();

    // Shrink the course code so it always fits the cell width — critical for
    // narrow single-period columns — using the measured glyph width.
    const fitFontSize = (() => {
      if (!cellWidthPx || cellWidthPx <= 0 || !code) return codeOnlyFontSize;
      const availableWidth = Math.max(6, cellWidthPx - 6);
      const measured = measureBoldTextWidth(code, codeOnlyFontSize);
      const scaled = measured
        ? (availableWidth / measured) * codeOnlyFontSize
        : availableWidth / (code.length * 0.72);
      return Math.max(5, Math.min(codeOnlyFontSize, scaled));
    })();

    return (
      <div
        data-export-course-content
        className="absolute inset-0 w-full flex flex-col justify-center items-center text-center p-0.5"
      >
        {timeInfo}
        {contentDetail === 'DETAILS' ? (
          <div className="w-full flex flex-col justify-center items-center text-center gap-0">
            {durationInfo}
            <div className="w-full text-center">
              <span
                data-export-course-code
                className={`block w-full whitespace-nowrap font-black leading-normal tracking-tight text-center ${isLightMode ? 'text-slate-800' : 'text-white'
                  }`}
                style={{ fontSize: `${fitFontSize}px` }}
                title={code}
              >
                {code}
              </span>
            </div>
            <div className={`w-full text-center ${style.courseLocSize} leading-normal font-semibold ${isLightMode ? 'text-slate-500' : 'text-white/60'}`}>
              <span data-export-course-location className="break-words whitespace-normal text-center" title={loc}>{loc}</span>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center text-center gap-0">
            {durationInfo}
            <span
              data-export-course-code
              className={`inline-block max-w-full whitespace-nowrap leading-normal tracking-tight text-center font-black ${isLightMode ? 'text-slate-800' : 'text-white'}`}
              style={{ fontSize: `${fitFontSize}px`, letterSpacing: '-0.03em' }}
              title={code}
            >
              {code}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
<div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-amber-800' : 'text-amber-400/90'}`}>{t('wallpaperDesign')}:</span>
                <div role="group" aria-label={t('wallpaperDesign')} className={`flex items-center gap-0.5 border rounded-lg p-0.5 ${isLight ? 'bg-slate-100/80 border-slate-200/80' : 'bg-white/[0.04] border-white/10'}`}>
                  {([['GRID', t('wallpaperDesignGrid')], ['MINIMAL', t('wallpaperDesignMinimal')], ['GLASS', t('wallpaperDesignGlass')]] as const).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={wallpaperDesign === id}
                      onClick={() => setWallpaperDesign(id)}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        wallpaperDesign === id
                          ? (isLight ? 'bg-white text-slate-800 shadow-sm' : 'bg-amber-400/20 text-amber-300')
                          : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/50 hover:text-white/80')
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div
                data-lenis-prevent
                className={`flex py-3 rounded-xl border overflow-x-auto overflow-y-hidden relative ${isLight ? 'border-slate-200' : 'border-white/[0.04]'
                  }`}
                style={{ backgroundColor: lockscreenConfig.bg }}
              >
                <div className="absolute inset-0 pointer-events-none z-30">
                  {renderFloatingZoomWidget(lockscreenConfig.isLight)}
                </div>
                {(() => {
                  const { width: w, height: h } = WALLPAPER_PRESET_SIZES.get(wallpaperPreset) ?? WALLPAPER_PRESET_SIZES.get('phone')!;
                  return (
                    <div
                      style={{
                        width: `${w * userZoom}px`,
                        height: `${h * userZoom}px`,
                        position: 'relative',
                        overflow: 'hidden',
                        flexShrink: 0,
                        margin: '0 auto'
                      }}
                    >
                      <div
                        ref={wallpaperRef}
                        data-export-root="wallpaper-export-root"
                        className="font-sans flex flex-col justify-start gap-2 select-none border absolute top-0 left-0 origin-top-left overflow-hidden"
                        style={{
                          width: `${w}px`,
                          height: `${h}px`,
                          transform: `scale(${userZoom})`,
                          fontFamily: 'Inter, Arial, sans-serif',
                          padding: wallpaperPreset === 'phone' ? '12px' : wallpaperPreset === 'square' ? '14px' : '16px',
                          backgroundColor: lockscreenConfig.bg,
                          borderColor: lockscreenConfig.borderColor,
                          color: lockscreenConfig.textColor
                        }}
                      >
                        {wallpaperBackground && (
                          <img
                            data-wallpaper-background-layer
                            aria-hidden="true"
                            draggable={false}
                            src={wallpaperBackground}
                            className="absolute inset-0 z-0 h-full w-full object-cover"
                          />
                        )}
                        {wallpaperDesign === 'MINIMAL' || wallpaperDesign === 'GLASS' ? (
                          <>
                            {/* Clock and photo stay visible above a compact week card */}
                            <div className="relative z-10 flex-1 min-h-0" />
                            <MinimalWeekCard
                              courses={allCourses}
                              courseColorMap={courseColorMap}
                              isLight={lockscreenConfig.isLight}
                              showTimes={contentDetail === 'DETAILS'}
                              timeFormat={timeFormat}
                              title={t('minimalWeekTitle')}
                              t={t}
                              glass={wallpaperDesign === 'GLASS'}
                              glassTheme={exportTheme}
                              width={w - 2 * (wallpaperPreset === 'phone' ? 12 : wallpaperPreset === 'square' ? 14 : 16)}
                              background={wallpaperBackgroundBlurred ? {
                                url: wallpaperBackgroundBlurred,
                                nativeBlur: useNativeGlassBlur,
                                rootWidth: w,
                                rootHeight: h,
                                left: (wallpaperPreset === 'phone' ? 12 : wallpaperPreset === 'square' ? 14 : 16) + 1,
                                bottom: (wallpaperPreset === 'phone' ? 12 : wallpaperPreset === 'square' ? 14 : 16) + currentSpacers.bottom + 1,
                              } : undefined}
                            />
                          </>
                        ) : (
                        <>
                        {/* Top Reserved Clock Area */}
                        <div style={{ height: `${currentSpacers.top}px` }} className="relative z-10 flex-shrink-0" />

                        {/* Lock Screen Matrix Grid */}
                        <div
                          data-wallpaper-grid
                          data-wallpaper-grid-radius="12px"
                          className={`relative z-10 border border-x-0 p-0 flex-1 min-h-0 flex flex-col justify-start overflow-hidden ${lockscreenConfig.gridBg}`}
                          style={{
                            borderRadius: '12px',
                            isolation: 'isolate',
                            backgroundColor: wallpaperBackground
                              ? lockscreenConfig.isLight ? 'rgba(248,250,252,0.24)' : exportTheme === 'oled' ? 'rgba(0,0,0,0.24)' : 'rgba(10,20,40,0.24)'
                              : undefined,
                          }}
                        >
                          {wallpaperBackgroundBlurred && (
                            <>
                              <div
                                data-wallpaper-background-blur
                                data-wallpaper-native-blur={useNativeGlassBlur ? 'true' : undefined}
                                aria-hidden="true"
                                className="absolute inset-0 z-0"
                                style={{
                                  backgroundImage: `url(${wallpaperBackgroundBlurred})`,
                                  backgroundPosition: 'center',
                                  backgroundSize: 'cover',
                                  ...(useNativeGlassBlur ? { WebkitFilter: 'blur(16px)', filter: 'blur(16px)' } : {}),
                                }}
                              />
                              <div
                                data-wallpaper-glass-overlay
                                aria-hidden="true"
                                className="absolute inset-0 z-[1]"
                                style={{
                                  backgroundColor: lockscreenConfig.isLight ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.42)',
                                  pointerEvents: 'none',
                                }}
                              />
                            </>
                          )}
                          {/* DYNAMIC SCALING WALLPAPER GRID VIEW TABLE */}
                          {(() => {
                            const style = getPresetStyle(wallpaperPreset, contentDetail);
                            const wallpaperPadding = wallpaperPreset === 'phone' ? 12 : wallpaperPreset === 'square' ? 14 : 16;
                            const headerHeightPx = wallpaperPreset === 'phone' ? 14 : wallpaperPreset === 'square' ? 16 : wallpaperPreset === 'tablet' ? 20 : 18;
                            const gridHeightPx = h - (wallpaperPadding * 2) - 20 - currentSpacers.top - currentSpacers.bottom;
                            const rowHeightPx = Math.max(1, (gridHeightPx - 4 - headerHeightPx) / daysList.length);
                            const gridInnerWidth = w - (wallpaperPadding * 2) - 2;

                            // Skip hours with no classes. Dense schedules group active hours into wider periods.
                            const maxColumns = wallpaperPreset === 'phone' ? 8 : wallpaperPreset === 'square' ? 9 : wallpaperPreset === 'tablet' ? 10 : 12;
                            const slots = buildWallpaperGridSlots(allCourses.flatMap((course) => {
                              const start = parseTimeToMinutes(course.start_time || course.jadual || '');
                              if (start == null) return [];
                              const end = parseTimeToMinutes(course.end_time || '');
                              return [{ start, end: end != null && end > start ? end : start + 60 }];
                            }), maxColumns);
                            const slotLabels = slots.map((slot) => ({ slot, label: formatWallpaperSlotLabel(slot.start, slot.end, timeFormat) }));
                            const maxSlotLabelLength = Math.max(...slotLabels.map(({ label }) => label.length));
                            const axisStart = slots[0].start;
                            const axisEnd = slots[slots.length - 1].end;
                            const axisDuration = slots.length;
                            const gridContentWidth = gridInnerWidth - 38;
                            const widthPerSlot = () => gridContentWidth / axisDuration;
                            const periodHeaderFontSize = Math.max(3.5, Math.min(8, widthPerSlot() / (maxSlotLabelLength * 0.9)));

                            return (
                              <table className={`relative z-10 w-full h-full table-fixed border-collapse ${style.tableFontSize}`}>
                                <thead>
                                      <tr style={{ height: `${headerHeightPx}px` }}>
                                        <th
                                          className={`p-0 font-black uppercase tracking-wider align-middle border-r ${lockscreenConfig.headerBorder} ${lockscreenConfig.headerText}`}
                                          style={{ height: `${headerHeightPx}px`, width: '38px' }}
                                        >
                                          <div className="w-full h-full flex items-center justify-center text-center leading-none" style={{ height: `${headerHeightPx}px` }}>
                                            <span className="leading-none">&nbsp;</span>
                                          </div>
                                        </th>
                                        {slotLabels.map(({ slot, label }) => (
                                          <th
                                            key={slot.start}
                                            data-export-time-duration={slot.end - slot.start}
                                            className={`p-0 font-black uppercase tracking-wider align-middle border-r ${lockscreenConfig.headerBorder} ${lockscreenConfig.headerText}`}
                                            style={{ height: `${headerHeightPx}px`, width: `${widthPerSlot()}px` }}
                                          >
                                            <div className="w-full h-full flex items-center justify-center text-center leading-none" style={{ height: `${headerHeightPx}px` }}>
                                              <span data-export-time-label className="leading-none whitespace-nowrap" style={{ fontSize: `${periodHeaderFontSize}px` }}>{label}</span>
                                            </div>
                                          </th>
                                        ))}
                                      </tr>
                                </thead>
                                <tbody>
                                  {daysList.map((d, dayIndex) => {
                                    const brightenDayLabel = brightDayLabels.has(dayIndex);
                                    return (
                                      <tr key={d} style={{ height: `${rowHeightPx}px`, minHeight: `${rowHeightPx}px` }} className={`border-t ${lockscreenConfig.cellBorder}`}>
                                        <td
                                          className={`p-0 font-bold border-r ${lockscreenConfig.cellBorder} ${lockscreenConfig.dayText}`}
                                          style={{ height: `${rowHeightPx}px`, width: '38px' }}
                                        >
                                          <div className="w-full px-1 flex items-center justify-center text-center" style={{ height: `${rowHeightPx}px` }}>
                                            <span
                                              data-wallpaper-day-label={dayIndex}
                                              className="text-[10px] break-words whitespace-pre-wrap"
                                              style={brightenDayLabel ? {
                                                color: lockscreenConfig.isLight ? '#334155' : exportTheme === 'warm' ? '#FEF3C7' : exportTheme === 'emerald' ? '#ECFDF5' : '#FFFFFF',
                                              } : undefined}
                                            >
                                              {extractDayName(d) ? t(`shortDays.${extractDayName(d)}`) : formatDayDisplay(d, t, { short: true })}
                                            </span>
                                          </div>
                                        </td>
                                        <td colSpan={slots.length} className="relative p-0 overflow-hidden" style={{ height: `${rowHeightPx}px`, minHeight: `${rowHeightPx}px` }}>
                                          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }} aria-hidden="true">
                                            {slots.map((slot) => (
                                              <div key={slot.start} className={`border-r last:border-r-0 ${lockscreenConfig.cellBorder}`} />
                                            ))}
                                          </div>
                                          {allCourses.map((course) => {
                                            if (extractDayName(course.day) !== extractDayName(d)) return null;
                                            const start = parseTimeToMinutes(course.start_time || course.jadual || '');
                                            if (start == null || start < axisStart || start >= axisEnd) return null;
                                            const rawEnd = parseTimeToMinutes(course.end_time || '');
                                            const end = Math.min(axisEnd, rawEnd != null && rawEnd > start ? rawEnd : start + 60);
                                            if (end <= start) return null;
                                            const courseStart = getWallpaperAxisPosition(start, slots);
                                            const courseEnd = getWallpaperAxisPosition(end, slots);
                                            const left = (courseStart / axisDuration) * 100;
                                            const width = ((courseEnd - courseStart) / axisDuration) * 100;
                                            const courseWidth = gridContentWidth * (courseEnd - courseStart) / axisDuration;
                                            const courseColor = getModalDayColors(
                                              getCourseColorSlot(courseColorMap, course.course_id || course.kod_kursus),
                                              exportTheme,
                                            );
                                            return (
                                              <div
                                                key={`${course.course_id || course.kod_kursus}-${start}`}
                                                data-export-course-color-code={course.course_id || course.kod_kursus || ''}
                                                className={`absolute inset-0 border-r align-middle p-0.5 overflow-hidden ${lockscreenConfig.cellBorder} ${courseColor.bg} ${courseColor.border}`}
                                                style={{ left: `${left}%`, width: `${width}%`, top: '-0.5px', bottom: '-0.5px' }}
                                              >
                                                {renderWallpaperCourseContent(course, courseWidth, lockscreenConfig.isLight, style)}
                                              </div>
                                            );
                                          })}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            );
                          })()}
                        </div>
                        </>
                        )}

                        <div style={{ height: `${currentSpacers.bottom}px` }} className="flex-shrink-0" />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
  );
}
