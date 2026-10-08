const MALAY_DAYS = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'] as const;

export const WEEKDAY_ORDER = [...MALAY_DAYS] as string[];

const EN_DAY_MAP: Record<string, string> = {
  MONDAY: 'ISNIN',
  TUESDAY: 'SELASA',
  WEDNESDAY: 'RABU',
  THURSDAY: 'KHAMIS',
  FRIDAY: 'JUMAAT',
  SATURDAY: 'SABTU',
  SUNDAY: 'AHAD',
  MON: 'ISNIN',
  TUE: 'SELASA',
  WED: 'RABU',
  THU: 'KHAMIS',
  FRI: 'JUMAAT',
  SAT: 'SABTU',
  SUN: 'AHAD',
};

/**
 * Strips the raw localisation prefix (e.g. "days." / "shortdays.") that the
 * USAS UMC backend prepends to its already-formatted day labels, while keeping
 * the embedded date + day name intact (e.g. "days.05-10-2026 (ISNIN)" ->
 * "05-10-2026 (ISNIN)").
 */
export function stripDayPrefix(dayStr?: string): string {
  return String(dayStr ?? '').replace(/^(?:short)?days\./i, '').trim();
}

/**
 * Normalises a stored/compared day label: strips the localisation prefix and
 * uppercases the result so it matches the fixed day keys used across the app.
 */
export function normalizeDayLabel(dayStr?: string): string {
  return stripDayPrefix(dayStr).toUpperCase();
}

/**
 * Extracts standard uppercase Malay day key (e.g. 'ISNIN', 'SELASA') from any string.
 * Handles formats like:
 * - "05-10-2026 (ISNIN)"
 * - "05-10-2026 (ISNI)" (truncated)
 * - "days.05-10-2026 (ISNIN)"
 * - "ISNIN"
 * - "MONDAY"
 */
export function extractDayName(dayStr?: string): string {
  if (!dayStr) return '';
  const clean = stripDayPrefix(dayStr).toUpperCase();

  // 1. Direct match with Malay days
  for (const d of MALAY_DAYS) {
    if (clean === d) return d;
  }

  // 2. Contains full or partial (truncated) Malay day name
  for (const d of MALAY_DAYS) {
    // Check full name or at least first 4 chars (e.g. 'ISNI', 'SELA', 'KHAM', 'JUMA')
    const prefix = d.slice(0, 4);
    if (clean.includes(d) || clean.includes(prefix)) {
      return d;
    }
  }

  // 3. English day names
  for (const [en, ms] of Object.entries(EN_DAY_MAP)) {
    if (clean.includes(en)) {
      return ms;
    }
  }

  return clean;
}

/**
 * Extracts a date substring if present (e.g. "05-10-2026" or "2026-10-05").
 */
export function extractDatePart(dayStr?: string): string | null {
  if (!dayStr) return null;
  const match = dayStr.match(/(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * Parses a display date such as "05-10-2026" (DD-MM-YYYY) into a local Date.
 * Returns null for empty or unrecognised values.
 */
export function parseDisplayDate(value?: string): Date | null {
  if (!value) return null;
  const match = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(value).trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Sorts day labels into the canonical Monday-to-Sunday order. The USAS backend
 * returns days starting from the current day (e.g. Tuesday first), so this
 * keeps the UI stable regardless of the week offset.
 */
export function sortDayLabels(days: string[]): string[] {
  const seen = new Set<string>();
  const rank = (value: string) => {
    const index = WEEKDAY_ORDER.indexOf(extractDayName(value));
    return index === -1 ? WEEKDAY_ORDER.length : index;
  };
  return days
    .filter((day) => {
      const key = extractDayName(day);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => rank(a) - rank(b));
}

/**
 * Checks if two day strings represent the same day.
 * Matches whether they are identical or share the same extracted day name.
 */
export function isSameDay(dayA?: string, dayB?: string): boolean {
  if (!dayA || !dayB) return false;
  if (dayA.trim().toUpperCase() === dayB.trim().toUpperCase()) return true;

  const nameA = extractDayName(dayA);
  const nameB = extractDayName(dayB);
  if (nameA && nameB && nameA === nameB) return true;

  return false;
}

/**
 * Formats a day string for clean UI display, properly translating the day of week
 * and stripping any dangling 'days.' prefix.
 *
 * By default only the weekday is shown (e.g. "MONDAY"). Pass
 * `{ withDate: true }` to also include the embedded date.
 *
 * Example:
 * - "days.05-10-2026 (ISNIN)" + EN               -> "MONDAY"
 * - "days.05-10-2026 (ISNIN)" + EN + withDate    -> "05-10-2026 (MONDAY)"
 * - "days.05-10-2026 (ISNI)" + withDate          -> "05-10-2026 (ISNIN)"
 * - "ISNIN" + EN                                 -> "MONDAY"
 */
export function formatDayDisplay(
  dayStr: string | undefined,
  t?: (key: string) => string,
  options?: { short?: boolean; withDate?: boolean }
): string {
  if (!dayStr) return '';
  const clean = stripDayPrefix(dayStr);
  const dayName = extractDayName(clean);
  const datePart = extractDatePart(clean);

  let translatedDay = dayName;
  if (t && dayName) {
    const key = options?.short ? `shortDays.${dayName}` : `days.${dayName}`;
    const result = t(key);
    // If t returned the key itself or not found, fall back to dayName
    translatedDay = result && !result.startsWith('days.') && !result.startsWith('shortDays.') ? result : dayName;
  }

  // Only wrap the day name when explicitly requested, when it is a real
  // weekday label, and never when it is just the raw date echoed back.
  if (
    options?.withDate &&
    datePart &&
    translatedDay &&
    translatedDay.toUpperCase() !== datePart.toUpperCase()
  ) {
    return `${datePart} (${translatedDay})`;
  }

  if (translatedDay) {
    return translatedDay;
  }

  return clean;
}
