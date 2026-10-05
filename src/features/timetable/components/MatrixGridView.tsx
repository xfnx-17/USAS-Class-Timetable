import { useMemo } from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import type { TimetableItem } from '@/shared/types/usas';
import { extractDayName, formatDayDisplay } from '@/shared/lib/dayFormat';
import { MapPin } from 'lucide-react';
import {
  getCourseHighlightKey,
  parseTo24hHour,
  parseTimeToMinutes,
} from '@/shared/lib/timetableTime';

type MatrixGridViewProps = {
  timetable?: TimetableItem[];
  days?: string[];
  activeHighlights?: {
    ongoingKey: string | null;
    upcomingKey: string | null;
  };
};

const getDayColors = (day: string | undefined, isLight: boolean) => {
  const darkColors: Record<string, Record<string, string>> = {
    'ISNIN':  { bg: 'bg-emerald-500/[0.18]', border: 'border-emerald-500/40 border-l-2 border-l-emerald-400', text: 'text-emerald-300 font-bold', dot: 'bg-emerald-400' },
    'SELASA': { bg: 'bg-blue-500/[0.18]',    border: 'border-blue-500/40 border-l-2 border-l-blue-400',    text: 'text-blue-300 font-bold',    dot: 'bg-blue-400' },
    'RABU':   { bg: 'bg-amber-500/[0.18]',   border: 'border-amber-500/40 border-l-2 border-l-amber-400',   text: 'text-amber-300 font-bold',   dot: 'bg-amber-400' },
    'KHAMIS': { bg: 'bg-purple-500/[0.18]',  border: 'border-purple-500/40 border-l-2 border-l-purple-400',  text: 'text-purple-300 font-bold',  dot: 'bg-purple-400' },
    'JUMAAT': { bg: 'bg-rose-500/[0.18]',    border: 'border-rose-500/40 border-l-2 border-l-rose-400',    text: 'text-rose-300 font-bold',    dot: 'bg-rose-400' },
    'SABTU':  { bg: 'bg-orange-500/[0.18]',  border: 'border-orange-500/40 border-l-2 border-l-orange-400',  text: 'text-orange-300 font-bold',  dot: 'bg-orange-400' },
    'AHAD':   { bg: 'bg-slate-500/[0.18]',   border: 'border-slate-500/40 border-l-2 border-l-slate-400',   text: 'text-slate-300 font-bold',   dot: 'bg-slate-400' },
  };

  const lightColors: Record<string, Record<string, string>> = {
    'ISNIN':  { bg: 'bg-emerald-100/70', border: 'border-emerald-300/80 border-l-2 border-l-emerald-500', text: 'text-emerald-800 font-bold', dot: 'bg-emerald-500' },
    'SELASA': { bg: 'bg-blue-100/70',    border: 'border-blue-300/80 border-l-2 border-l-blue-500',    text: 'text-blue-800 font-bold',    dot: 'bg-blue-500' },
    'RABU':   { bg: 'bg-amber-100/80',   border: 'border-amber-300/85 border-l-2 border-l-amber-500',   text: 'text-amber-800 font-bold',   dot: 'bg-amber-500' },
    'KHAMIS': { bg: 'bg-purple-100/70',  border: 'border-purple-300/80 border-l-2 border-l-purple-500',  text: 'text-purple-800 font-bold',  dot: 'bg-purple-500' },
    'JUMAAT': { bg: 'bg-rose-100/70',    border: 'border-rose-300/80 border-l-2 border-l-rose-500',    text: 'text-rose-800 font-bold',    dot: 'bg-rose-500' },
    'SABTU':  { bg: 'bg-orange-100/70',  border: 'border-orange-300/80 border-l-2 border-l-orange-500',  text: 'text-orange-800 font-bold',  dot: 'bg-orange-500' },
    'AHAD':   { bg: 'bg-slate-200/70',   border: 'border-slate-300/80 border-l-2 border-l-slate-500',   text: 'text-slate-800 font-bold',   dot: 'bg-slate-500' },
  };

  const key = extractDayName(day) || 'ISNIN';
  return (isLight ? lightColors[key] : darkColors[key]) || (isLight ? lightColors['ISNIN'] : darkColors['ISNIN']);
};

const ALL_TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

const getDurationLabel = (startTime?: string, endTime?: string, lang?: string) => {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  if (startMin === null || endMin === null || endMin <= startMin) return '';
  
  const diff = endMin - startMin;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  
  if (lang === 'en') {
    if (m === 0) {
      return `${h} hr${h > 1 ? 's' : ''}`;
    }
    if (h === 0) {
      return `${m} min${m > 1 ? 's' : ''}`;
    }
    return `${h} hr${h > 1 ? 's' : ''} ${m} min`;
  } else {
    if (m === 0) {
      return `${h} jam`;
    }
    if (h === 0) {
      return `${m} minit`;
    }
    return `${h} jam ${m} minit`;
  }
};

const getSlotLabel = (slot: string) => {
  const slotMap = {
    '08:00 AM': '8-9',
    '09:00 AM': '9-10',
    '10:00 AM': '10-11',
    '11:00 AM': '11-12',
    '12:00 PM': '12-13',
    '01:00 PM': '13-14',
    '02:00 PM': '14-15',
    '03:00 PM': '15-16',
    '04:00 PM': '16-17',
    '05:00 PM': '17-18'
  };
  return slotMap[slot] || slot;
};

export default function MatrixGridView({
  timetable = [],
  days = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'],
  activeHighlights,
}: MatrixGridViewProps) {
  const { theme } = useTheme();
  const { t, lang } = useLanguage();
  const isLight = theme === 'light';
  
  const getCourseForSlot = (dayName: string, slotTime: string) => {
    const targetDay = extractDayName(dayName);
    return timetable.find(c => {
      const isDay = extractDayName(c.day) === targetDay;
      if (!isDay) return false;
      const startTime = c.start_time || c.jadual || '';
      return startTime.includes(slotTime.split(':')[0]);
    });
  };

  // Filter out trailing empty time slots dynamically checking class end times
  const activeTimeSlots = useMemo(() => {
    if (timetable.length === 0) return ALL_TIME_SLOTS.slice(0, 4);

    let maxHour = 8;
    timetable.forEach(c => {
      const startH = parseTo24hHour(c.start_time);
      const endH = parseTo24hHour(c.end_time);
      if (startH !== null) {
        if (startH > maxHour) maxHour = startH;
      }
      if (endH !== null) {
        if (endH - 1 > maxHour) maxHour = endH - 1;
      }
    });

    let maxIdx = 0;
    ALL_TIME_SLOTS.forEach((slot, idx) => {
      const slotH = parseTo24hHour(slot);
      if (slotH !== null && slotH <= maxHour) {
        maxIdx = idx;
      }
    });

    return ALL_TIME_SLOTS.slice(0, maxIdx + 1);
  }, [timetable]);

  // Auto-scale text based on how many columns exist — never below 1.0 (table scrolls instead of compressing)
  const autoScale = useMemo(() => {
    const n = activeTimeSlots.length || 6;
    if (n <= 3) return 1.35;
    if (n === 4) return 1.25;
    if (n === 5) return 1.15;
    if (n === 6) return 1.05;
    return 1.0; // 7+ columns: keep at full base size, outer container scrolls horizontally
  }, [activeTimeSlots.length]);

  return (
    <div className={`border rounded-lg overflow-auto flex-1 min-h-0 flex flex-col transition-colors duration-150 ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.025] border-white/[0.06]'
    }`}>
      <div className="min-w-[700px] flex-1 overflow-y-auto flex flex-col">
        <table className="w-full table-fixed border-collapse flex-1 h-auto sm:h-full">
          {/* Head - Transposed: Waktu slots as columns */}
          <thead>
            <tr className={`border-b ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.06]'}`}>
              <th
                className={`px-2 sm:px-3 py-1.5 sm:py-2 border-r w-20 sm:w-24 whitespace-nowrap leading-none ${
                  isLight ? 'border-slate-200' : 'border-white/[0.04]'
                }`}
                style={{ fontSize: `${autoScale * 10}px` }}
              >
              </th>
              {activeTimeSlots.map(slot => (
                <th
                  key={slot}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 text-center font-semibold font-mono tracking-wider border-r whitespace-nowrap leading-none ${
                    isLight ? 'text-slate-500 border-slate-200 bg-slate-50/10' : 'text-amber-400/70 border-white/[0.04]'
                  } last:border-r-0`}
                  style={{ fontSize: `${autoScale * 10}px` }}
                >
                  {getSlotLabel(slot)}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body - Transposed: Days as rows, slots aligned using colSpan */}
          <tbody>
            {days.map((d) => {
              const color = getDayColors(d, isLight);
              let skipCount = 0;

              return (
                <tr key={d} className={`border-b last:border-b-0 transition-colors ${
                  isLight 
                    ? 'border-slate-100 hover:bg-slate-50/40' 
                    : 'border-white/[0.03] hover:bg-white/[0.015]'
                }`}>
                  <td
                    className={`px-2 sm:px-3 py-1.5 font-bold uppercase border-r text-center w-20 sm:w-24 ${
                      isLight ? 'border-slate-200' : 'border-white/[0.04]'
                    }`}
                    style={{ fontSize: `${autoScale * 10}px` }}
                  >
                    <span className="flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[48px] whitespace-nowrap">
                      <span className={color.text}>{formatDayDisplay(d, t)}</span>
                    </span>
                  </td>
                  {activeTimeSlots.map((slot) => {
                    if (skipCount > 0) {
                      skipCount--;
                      return null;
                    }

                    const course = getCourseForSlot(d, slot);
                    const courseKey = course ? getCourseHighlightKey(course) : '';
                    const courseStatus =
                      courseKey && activeHighlights
                        ? (activeHighlights.ongoingKey === courseKey
                            ? 'ongoing'
                            : activeHighlights.upcomingKey === courseKey
                              ? 'upcoming'
                              : 'idle')
                        : 'idle';
                    let colSpan = 1;
                    
                    let durationText = '';
                    if (course) {
                      const startH = parseTo24hHour(course.start_time);
                      const endH = parseTo24hHour(course.end_time);
                      if (startH !== null && endH !== null) {
                        const duration = endH - startH;
                        if (duration > 1) {
                          colSpan = duration;
                        }
                        durationText = getDurationLabel(course.start_time, course.end_time, lang);
                      }
                    }
                    
                    skipCount = colSpan - 1;

                    return (
                      <td 
                        key={slot} 
                        colSpan={colSpan}
                        className={`p-1 border-r last:border-r-0 ${
                          isLight ? 'border-slate-100' : 'border-white/[0.03]'
                        }`}
                      >
                        {course ? (
                          <div className={`px-2 py-2 rounded-md border h-full flex flex-col justify-between gap-0.5 transition-all duration-300 hover:brightness-105 ${color.bg} ${color.border} ${
                            courseStatus === 'ongoing'
                              ? 'ring-1 ring-emerald-400/70 shadow-[0_0_16px_rgba(52,211,153,0.20)]'
                              : courseStatus === 'upcoming'
                                ? 'ring-1 ring-amber-300/60 shadow-[0_0_14px_rgba(251,191,36,0.16)] animate-[pulse_4s_ease-in-out_infinite]'
                                : ''
                          }`}>
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <div className={`font-bold truncate ${color.text}`} style={{ fontSize: `${autoScale * 12}px` }}>
                                {course.course_id || course.kod_kursus}
                              </div>
                              {durationText && (
                                <div className={`text-[8.5px] font-extrabold uppercase shrink-0 flex items-center justify-center text-center px-1.5 py-0.5 rounded leading-none ${
                                  isLight 
                                    ? 'bg-slate-100 text-slate-600 border border-slate-200/50' 
                                    : 'bg-white/10 text-white/80 border border-white/5'
                                }`} style={{ fontSize: `${autoScale * 8.5}px` }}>
                                  {durationText}
                                </div>
                              )}
                            </div>
                            <div className={`font-medium leading-snug break-words ${
                              isLight ? 'text-slate-700' : 'text-white/80'
                            }`} style={{ fontSize: `${autoScale * 10}px` }}>
                              {course.course_name || course.kursus}
                            </div>
                            <div className={`break-words flex items-center gap-1 leading-none ${
                              isLight ? 'text-slate-500' : 'text-white/50'
                            }`} style={{ fontSize: `${autoScale * 10.5}px` }}>
                              <MapPin style={{ width: `${autoScale * 10.5}px`, height: `${autoScale * 10.5}px`, color: '#ed4134' }} className="flex-shrink-0 self-center" />
                              <span className="leading-none self-center">{course.location}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full w-full min-h-[48px]" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}





