import LZString from 'lz-string';
import type { TimetableItem } from '@/shared/types/usas';
import { extractDayName } from '@/shared/lib/dayFormat';

export type FreeSlot = {
  dayStr: string;
  startMins: number;
  endMins: number;
};

// Map Malay day names to integers (1 = ISNIN, 5 = JUMAAT)
const dayMap: Record<string, number> = {
  'ISNIN': 1, 'SELASA': 2, 'RABU': 3, 'KHAMIS': 4, 'JUMAAT': 5, 'SABTU': 6, 'AHAD': 0
};
export const reverseDayMap = ['AHAD', 'ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU'];

export function parseTimeStr(timeStr: string | undefined): [number, number] | null {
  if (!timeStr) return null;
  // Format: "10:00 AM - 12:00 PM"
  const parts = timeStr.split(' - ');
  if (parts.length !== 2) return null;

  const toMins = (t: string) => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let [_, h, m, period] = match;
    let hours = parseInt(h);
    const mins = parseInt(m);
    if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  return [toMins(parts[0]), toMins(parts[1])];
}

/**
 * Minifies a timetable into a highly compressed base64 URI-safe string.
 * Format: [[dayInt, startMins, endMins, "Code"], ...]
 */
export function compressTimetable(timetable: TimetableItem[], studentName: string): string {
  const minified = timetable.map(item => {
    const dayInt = dayMap[extractDayName(item.day)] ?? 1;
    const times = parseTimeStr(`${item.start_time || ''} - ${item.end_time || ''}`);
    const code = item.course_id || item.kod_kursus || 'Class';
    return [dayInt, times?.[0] || 0, times?.[1] || 0, code];
  });
  const payload = { n: studentName, t: minified };
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

/**
 * Decompresses the URI-safe string back into basic timetable items
 */
export function decompressTimetable(compressed: string): { studentName: string; timetable: TimetableItem[] } | null {
  try {
    const jsonStr = LZString.decompressFromEncodedURIComponent(compressed);
    if (!jsonStr) return null;
    const payload = JSON.parse(jsonStr);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: TimetableItem[] = payload.t.map((arr: any) => {
      const [dayInt, startMins, endMins, code] = arr;
      
      const formatTime = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
      };

      return {
        id: `gen-${Math.random().toString(36).substring(2, 9)}`,
        day: reverseDayMap[dayInt],
        course_id: code,
        course_name: code,
        start_time: formatTime(startMins),
        end_time: formatTime(endMins)
      } as TimetableItem;
    });

    return { studentName: payload.n || 'Student', timetable: items };
  } catch {
    return null;
  }
}

/**
 * Calculates overlapping free slots between two schedules.
 * Considers standard hours: 8:00 AM (480) to 5:00 PM (1020).
 * Checks Monday to Friday only.
 */
export function calculateOverlappingFreeTime(myTimetable: TimetableItem[], friendTimetable: TimetableItem[]): FreeSlot[] {
  const WORK_START = 8 * 60;  // 8:00 AM
  const WORK_END = 17 * 60;   // 5:00 PM
  
  const allClasses = [...myTimetable, ...friendTimetable];
  const freeSlots: FreeSlot[] = [];

  for (let dayInt = 1; dayInt <= 5; dayInt++) {
    const dayStr = reverseDayMap[dayInt];
    
    // Get all busy blocks for this day
    const busyBlocks = allClasses
      .filter(c => extractDayName(c.day) === dayStr)
      .map(c => {
        const times = parseTimeStr(`${c.start_time || ''} - ${c.end_time || ''}`);
        return { start: times?.[0] || 0, end: times?.[1] || 0 };
      })
      .filter(b => b.start < b.end)
      .sort((a, b) => a.start - b.start);

    // Merge overlapping busy blocks
    const mergedBusy: {start: number, end: number}[] = [];
    for (const block of busyBlocks) {
      if (mergedBusy.length === 0) {
        mergedBusy.push(block);
      } else {
        const last = mergedBusy[mergedBusy.length - 1];
        if (block.start <= last.end) {
          last.end = Math.max(last.end, block.end);
        } else {
          mergedBusy.push(block);
        }
      }
    }

    // Invert busy blocks to find free blocks
    let currentTime = WORK_START;
    for (const busy of mergedBusy) {
      if (currentTime < busy.start) {
        freeSlots.push({ dayStr, startMins: currentTime, endMins: busy.start });
      }
      currentTime = Math.max(currentTime, busy.end);
    }
    
    if (currentTime < WORK_END) {
      freeSlots.push({ dayStr, startMins: currentTime, endMins: WORK_END });
    }
  }

  return freeSlots;
}
