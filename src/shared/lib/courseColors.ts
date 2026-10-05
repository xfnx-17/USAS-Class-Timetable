import type { TimetableItem } from '../types/usas';

// Each distinct course is assigned one colour slot so the same course keeps the
// same colour across the card view, the matrix grid and the wallpaper export.
//
// The slots reuse the palette keys already defined by each view's day-colour
// map (ISNIN = emerald, SELASA = blue, RABU = amber, KHAMIS = purple,
// JUMAAT = rose, SABTU = orange, AHAD = slate), so no new colour classes are
// needed.
export const COURSE_COLOR_SLOTS = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'] as const;
export type CourseColorSlot = typeof COURSE_COLOR_SLOTS[number];

export function buildCourseColorMap(courses: TimetableItem[] | undefined): Map<string, CourseColorSlot> {
  const map = new Map<string, CourseColorSlot>();
  let index = 0;

  (courses || []).forEach((course) => {
    const id = String(course.course_id || course.kod_kursus || '').toUpperCase();
    if (id && !map.has(id)) {
      map.set(id, COURSE_COLOR_SLOTS[index % COURSE_COLOR_SLOTS.length]);
      index += 1;
    }
  });

  return map;
}

export function getCourseColorSlot(map: Map<string, CourseColorSlot>, courseId?: string): CourseColorSlot {
  return map.get(String(courseId || '').toUpperCase()) ?? COURSE_COLOR_SLOTS[0];
}
