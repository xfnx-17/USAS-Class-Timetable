import type { TimetableItem } from '@/shared/types/usas';
import { extractDayName } from '@/shared/lib/dayFormat';

/**
 * Generates an iCalendar (.ics) file for Google Calendar, Apple iCal, and Outlook.
 * Creates recurring weekly events for all enrolled student courses.
 */

type IcsTimeInput = string | undefined;

export function escapeIcsText(value: unknown): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .trim();
}

export function sanitizeFileNameSegment(value: unknown): string {
  return String(value ?? '')
    .trim()
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'Pelajar_USAS';
}

export function formatICSDatetime(dayName: string | undefined, timeStr: IcsTimeInput): string {
  // Map day names to day offset (Monday = 1, Friday = 5)
  const dayOffsets = {
    'ISNIN': 1, 'MONDAY': 1, 'MON': 1,
    'SELASA': 2, 'TUESDAY': 2, 'TUE': 2,
    'RABU': 3, 'WEDNESDAY': 3, 'WED': 3,
    'KHAMIS': 4, 'THURSDAY': 4, 'THU': 4,
    'JUMAAT': 5, 'FRIDAY': 5, 'FRI': 5,
    'SABTU': 6, 'SATURDAY': 6, 'SAT': 6,
    'AHAD': 0, 'SUNDAY': 0, 'SUN': 0
  };

  const dayIndex = dayOffsets[extractDayName(dayName)] ?? 1;

  // Calculate next occurrence of this day
  const now = new Date();
  const currentDayIndex = now.getDay();
  let daysUntil = (dayIndex - currentDayIndex + 7) % 7;
  if (daysUntil === 0) daysUntil = 0;

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntil);

  // Parse time (e.g. "08:30 AM" or "14:00")
  let hours = 9;
  let minutes = 0;

  if (timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
  }

  targetDate.setHours(hours, minutes, 0, 0);

  if (dayIndex === currentDayIndex) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = hours * 60 + minutes;
    if (targetMinutes <= nowMinutes) {
      targetDate.setDate(targetDate.getDate() + 7);
    }
  }

  // Format as YYYYMMDDTHHMMSSZ
  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const date = String(targetDate.getUTCDate()).padStart(2, '0');
  const hh = String(targetDate.getUTCHours()).padStart(2, '0');
  const mm = String(targetDate.getUTCMinutes()).padStart(2, '0');

  return `${year}${month}${date}T${hh}${mm}00Z`;
}

export async function exportTimetableICS(timetable: TimetableItem[] = [], studentName = 'Pelajar USAS'): Promise<void> {
  if (!timetable || timetable.length === 0) {
    alert('Tiada kursus untuk dieksport ke kalendar.');
    return;
  }

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Universiti Sultan Azlan Shah//USAS Student Timetable//MS',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Jadual USAS - ${escapeIcsText(studentName)}`,
    'X-WR-TIMEZONE:Asia/Kuala_Lumpur'
  ];

  timetable.forEach((course, idx) => {
    // A valid calendar event needs a start time; skip rows without one rather
    // than inventing a default time.
    if (!course.start_time) return;

    const startIso = formatICSDatetime(course.day, course.start_time);
    const endIso = formatICSDatetime(course.day, course.end_time || course.start_time);

    const summary = escapeIcsText(`${course.course_id || course.kod_kursus}: ${course.course_name || course.kursus}`);
    const location = escapeIcsText(course.location || '');

    const descriptionLines = [
      course.lecturer ? `Pensyarah: ${course.lecturer}` : '',
      course.group ? `Kumpulan: ${course.group}` : '',
      course.location ? `Lokasi: ${course.location}` : '',
    ].filter(Boolean);
    const description = escapeIcsText(descriptionLines.join('\n'));

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:usas-course-${idx}-${Date.now()}@usas.edu.my`,
      `DTSTAMP:${startIso}`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      'RRULE:FREQ=WEEKLY;COUNT=14', // assumes a 14-week semester
      `SUMMARY:${summary}`
    );
    if (location) icsContent.push(`LOCATION:${location}`);
    if (description) icsContent.push(`DESCRIPTION:${description}`);
    icsContent.push('STATUS:CONFIRMED', 'END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const safeFileName = `Jadual_USAS_${sanitizeFileNameSegment(studentName)}.ics`;
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], safeFileName, { type: 'text/calendar' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Jadual USAS (.ICS)'
        });
        return;
      }
    } catch (err: unknown) {
      console.warn('Share API failed or cancelled:', err);
      if (err instanceof Error && err.name === 'AbortError') return;
    }
  }

  const link = document.createElement('a');
  const objectUrl = window.URL.createObjectURL(blob);
  link.href = objectUrl;
  link.setAttribute('download', safeFileName);
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  }
}



