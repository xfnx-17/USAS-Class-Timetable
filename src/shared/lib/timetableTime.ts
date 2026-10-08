import type { TimeFormat, TimetableItem } from '../types/usas';
import { extractDayName } from './dayFormat';

export type ActiveClassHighlights = {
  ongoingKey: string | null;
  upcomingKey: string | null;
};

export const parseTo24hHour = (timeStr?: string): number | null => {
  if (!timeStr) return null;
  const raw = String(timeStr).trim();
  const match = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) {
    const numMatch = raw.match(/(\d{1,2})/);
    return numMatch ? parseInt(numMatch[1], 10) : null;
  }
  let hour = parseInt(match[1], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hour !== 12) {
    hour += 12;
  } else if (ampm === 'AM' && hour === 12) {
    hour = 0;
  }
  return hour;
};

export const buildHourlyTimeSlots = (startHour: number, endHour: number) => {
  const firstHour = Math.max(0, Math.ceil(startHour));
  const lastHour = Math.min(23, Math.floor(endHour));
  return Array.from(
    { length: Math.max(0, lastHour - firstHour + 1) },
    (_, index) => `${String(firstHour + index).padStart(2, '0')}:00`,
  );
};

export const parseTimeToMinutes = (timeStr?: string): number | null => {
  if (!timeStr) return null;
  const raw = String(timeStr).trim();

  // "11:30 AM" or "02:30 PM"
  const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = parseInt(ampmMatch[2], 10);
    const suffix = ampmMatch[3].toUpperCase();
    if (suffix === 'PM' && hour < 12) hour += 12;
    if (suffix === 'AM' && hour === 12) hour = 0;
    return hour * 60 + minute;
  }

  // "11:30" (24-hour with minutes)
  const twentyFourMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourMatch) {
    const hour = parseInt(twentyFourMatch[1], 10);
    const minute = parseInt(twentyFourMatch[2], 10);
    return hour * 60 + minute;
  }

  // "11-13" or "14-17" (range)
  const rangeMatch = raw.match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
  if (rangeMatch) {
    const hour = parseInt(rangeMatch[1], 10);
    return hour * 60;
  }

  // "11" or "14" (plain hour)
  const plainHourMatch = raw.match(/^(\d{1,2})$/);
  if (plainHourMatch) {
    const hour = parseInt(plainHourMatch[1], 10);
    return hour * 60;
  }

  return null;
};

export const formatTimeFromMinutes = (minutes: number, timeFormat: TimeFormat = '24h') => {
  const hour = Math.floor(minutes / 60);
  const minute = String(minutes % 60).padStart(2, '0');
  if (timeFormat === '12h') {
    const normalizedHour = hour % 24;
    const suffix = normalizedHour < 12 ? 'AM' : 'PM';
    return `${normalizedHour % 12 || 12}:${minute} ${suffix}`;
  }
  return `${hour}:${minute}`;
};

export const formatHourSlot = (startHour: number, endHour: number, timeFormat: TimeFormat = '24h') => {
  if (timeFormat === '24h') return `${startHour}-${endHour}`;
  const start = startHour % 12 || 12;
  const end = endHour % 12 || 12;
  const startSuffix = startHour < 12 ? 'AM' : 'PM';
  const normalizedEndHour = endHour % 24;
  const endSuffix = normalizedEndHour < 12 ? 'AM' : 'PM';
  return startSuffix === endSuffix
    ? `${start}-${end} ${startSuffix}`
    : `${start} ${startSuffix}-${end} ${endSuffix}`;
};

export const getShortTimeRange = (startTime?: string, endTime?: string, timeFormat: TimeFormat = '24h') => {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null) return startTime || '';
  if (end === null) return formatTimeFromMinutes(start, timeFormat);
  return `${formatTimeFromMinutes(start, timeFormat)}-${formatTimeFromMinutes(end, timeFormat)}`;
};

export const getTimeRangePosition = (start: number, end: number, axisStart: number, axisDuration: number) => ({
  left: ((start - axisStart) / axisDuration) * 100,
  width: ((end - start) / axisDuration) * 100,
});

export const getDayKeyFromDate = (date: Date) => {
  const dayMap = ['AHAD', 'ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU'];
  return dayMap[date.getDay()] || 'ISNIN';
};

export const getCourseHighlightKey = (course: TimetableItem) => {
  return [
    course.course_id || course.kod_kursus || '',
    course.day || '',
    course.start_time || course.jadual || '',
    course.end_time || '',
  ].join('|');
};

export const getActiveCourseHighlights = (courses: TimetableItem[], now: Date): ActiveClassHighlights => {
  const todayKey = getDayKeyFromDate(now);
  const currentMin = now.getHours() * 60 + now.getMinutes();
  let ongoingKey: string | null = null;
  let upcomingKey: string | null = null;
  let nextUpcomingStart: number | null = null;

  courses.forEach((course) => {
    const courseDayName = extractDayName(course.day);
    if (!courseDayName || courseDayName !== todayKey) return;

    const startMin = parseTimeToMinutes(course.start_time || course.jadual || '');
    if (startMin === null) return;

    const rawEndMin = parseTimeToMinutes(course.end_time || '');
    const endMin = rawEndMin !== null && rawEndMin > startMin ? rawEndMin : startMin + 60;

    const courseKey = getCourseHighlightKey(course);
    if (currentMin >= startMin && currentMin < endMin) {
      ongoingKey = courseKey;
      return;
    }

    if (startMin > currentMin && (nextUpcomingStart === null || startMin < nextUpcomingStart)) {
      nextUpcomingStart = startMin;
      upcomingKey = courseKey;
    }
  });

  return { ongoingKey, upcomingKey };
};
