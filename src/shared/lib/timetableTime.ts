import type { TimetableItem } from '../types/usas';
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

  // General match for any string with hour
  const generalMatch = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (generalMatch) {
    let hour = parseInt(generalMatch[1], 10);
    const minute = generalMatch[2] ? parseInt(generalMatch[2], 10) : 0;
    const suffix = generalMatch[3]?.toUpperCase();
    if (suffix === 'PM' && hour < 12) hour += 12;
    if (suffix === 'AM' && hour === 12) hour = 0;
    return hour * 60 + minute;
  }

  return null;
};

export const getShortTimeRange = (startTime?: string, endTime?: string) => {
  const startHour = parseTo24hHour(startTime);
  const endHour = parseTo24hHour(endTime);
  if (startHour === null) return startTime || '';
  if (endHour === null) return `${startHour}`;
  return `${startHour}-${endHour}`;
};

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
