import type {
  ApiResponse,
  AttendanceHistoryItem,
  StudentProfile,
  StudentSession,
  TimetableData,
  TimetableItem,
} from '@/shared/types/usas';
import {
  isValidLoginUserId,
  sanitizeLoginUserId,
  sanitizeSingleLine,
  sanitizeTimetableItem,
  sanitizeTextForShare,
} from '@/shared/lib/security';
import { normalizeDayLabel, parseDisplayDate, sortDayLabels } from '@/shared/lib/dayFormat';

// USAS API Service Layer
// Dual JSON & Form-UrlEncoded transport layer with multi-endpoint fallback

const BASE_URL = '/api/usas';
const API_KEY = '123';
const UMC_VERSION = '2.0.3';
const PLATFORM = 'Android';
const DUMMY_TOKEN = 'dummytoken';
const REQUEST_TIMEOUT_MS = 12_000;
const POISON_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// Mock data for Demo Mode
export const MOCK_STUDENT_DATA: {
  user_id: string;
  name: string;
  program: string;
  semester: string;
  financialBalance: string;
  timetableDays: string[];
  timetable: TimetableItem[];
} = {
  user_id: 'AI210042',
  name: 'AHMAD AMIRUL BIN ROSLI',
  program: 'BACHELOR OF COMPUTER SCIENCE (HONS)',
  semester: 'Semester 1 2024/2025',
  financialBalance: 'RM 0.00 (Lunas)',
  timetableDays: ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'],
  timetable: [
    {
      id: '1',
      day: 'ISNIN',
      course_id: 'CSC2103',
      course_name: 'DATA STRUCTURES AND ALGORITHMS',
      group: 'GRP01',
      start_time: '08:30 AM',
      end_time: '10:30 AM',
      location: 'Makmal Komputer 3 (MK3)',
      lecturer: 'DR. NORAZLINA BINTI ABDUL RAHMAN',
      kehadiran: '88%',
      catatan: 'Dewan Kuliah Blok B'
    },
    {
      id: '2',
      day: 'ISNIN',
      course_id: 'SEC3303',
      course_name: 'CYBERSECURITY FUNDAMENTALS',
      group: 'GRP01',
      start_time: '11:00 AM',
      end_time: '01:00 PM',
      location: 'Dewan Kuliah 2 (DK2)',
      lecturer: 'PM DR. MOHD FAIZAL BIN KASIM',
      kehadiran: '95%',
      catatan: 'Bring your laptop'
    },
    {
      id: '3',
      day: 'SELASA',
      course_id: 'BIT2043',
      course_name: 'WEB APPLICATION DEVELOPMENT',
      group: 'GRP02',
      start_time: '09:00 AM',
      end_time: '12:00 PM',
      location: 'Makmal Software Engineering',
      lecturer: 'EN. MUHAMMAD HAZIM BIN ISMAIL',
      kehadiran: '100%',
      catatan: 'Lab session & assessment'
    },
    {
      id: '4',
      day: 'SELASA',
      course_id: 'MPU3113',
      course_name: 'HUBUNGAN ETNIK',
      group: 'GRP01',
      start_time: '02:30 PM',
      end_time: '04:30 PM',
      location: 'Dewan Besar USAS',
      lecturer: 'USTAZ AHMAD SHAFIQ BIN ZAINAL',
      kehadiran: '92%',
      catatan: 'Lecture'
    },
    {
      id: '5',
      day: 'RABU',
      course_id: 'CSC3203',
      course_name: 'DATABASE SYSTEMS & BIG DATA',
      group: 'GRP01',
      start_time: '08:30 AM',
      end_time: '11:30 AM',
      location: 'Makmal Komputer 1 (MK1)',
      lecturer: 'PN. SITI NURHALIZA BINTI OTHMAN',
      kehadiran: '90%',
      catatan: 'Practical SQL exercise'
    },
    {
      id: '6',
      day: 'RABU',
      course_id: 'SEC3403',
      course_name: 'ETHICAL HACKING & PENETRATION TESTING',
      group: 'GRP01',
      start_time: '02:00 PM',
      end_time: '05:00 PM',
      location: 'Cyber Security Lab (CSL)',
      lecturer: 'PM DR. MOHD FAIZAL BIN KASIM',
      kehadiran: '96%',
      catatan: 'Hands-on lab setup'
    },
    {
      id: '7',
      day: 'KHAMIS',
      course_id: 'CSC2103',
      course_name: 'DATA STRUCTURES AND ALGORITHMS',
      group: 'GRP01',
      start_time: '10:00 AM',
      end_time: '12:00 PM',
      location: 'Dewan Kuliah 1 (DK1)',
      lecturer: 'DR. NORAZLINA BINTI ABDUL RAHMAN',
      kehadiran: '88%',
      catatan: 'Tutorial & Q&A'
    },
    {
      id: '8',
      day: 'JUMAAT',
      course_id: 'BIT3903',
      course_name: 'FINAL YEAR PROJECT 1',
      group: 'GRP01',
      start_time: '09:00 AM',
      end_time: '11:30 AM',
      location: 'Bilik Mesyuarat FTMK',
      lecturer: 'DR. KHALID BIN HASSAN',
      kehadiran: '100%',
      catatan: 'Progress presentation with supervisor'
    }
  ]
};

// Robust HTTP POST helper for USAS backend
type UsasPayload = Record<string, string | number | boolean | undefined | null>;

function isSafeJsonValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.every(isSafeJsonValue);
  }

  if (typeof value !== 'object' || value === null) {
    return true;
  }

  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (POISON_KEYS.has(key)) return false;
    if (!isSafeJsonValue((value as Record<string, unknown>)[key])) return false;
  }

  return true;
}

export function parseSafeJsonResponse(text: string): unknown | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    return isSafeJsonValue(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export class UsasUnavailableError extends Error {
  constructor() {
    super('USAS service unavailable');
    this.name = 'UsasUnavailableError';
  }
}

type UsasFetchOutcome = {
  ok: boolean;
  data?: unknown;
  reason?: 'network' | 'invalid';
};

async function postUSASOutcome(
  endpoint: string,
  payload: UsasPayload,
  extraHeaders: Record<string, string> = {},
): Promise<UsasFetchOutcome> {
  const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      window.clearTimeout(timeout);
    }
  };

  let networkError = false;

  // 1. Try application/json
  try {
    const jsonRes = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify(payload)
    });
    if (jsonRes.ok || jsonRes.status === 403) {
      const text = await jsonRes.text();
      if (text && !text.startsWith('Access Denied') && text.includes('{')) {
        const data = parseSafeJsonResponse(text);
        if (data) return { ok: true, data };
      }
    }
  } catch {
    networkError = true;
  }

  // 2. Fallback to application/x-www-form-urlencoded
  try {
    const formParams = new URLSearchParams();
    Object.keys(payload).forEach(key => {
      const value = payload[key];
      if (value !== undefined && value !== null) {
        formParams.append(key, String(value));
      }
    });

    const formRes = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...extraHeaders },
      body: formParams.toString()
    });
    if (formRes.ok) {
      const formText = await formRes.text();
      if (formText && !formText.startsWith('Access Denied') && formText.includes('{')) {
        const data = parseSafeJsonResponse(formText);
        if (data) return { ok: true, data };
      }
    }
  } catch {
    networkError = true;
  }

  return { ok: false, reason: networkError ? 'network' : 'invalid' };
}

async function postUSAS(
  endpoint: string,
  payload: UsasPayload,
  extraHeaders: Record<string, string> = {},
): Promise<unknown> {
  const outcome = await postUSASOutcome(endpoint, payload, extraHeaders);
  return outcome.ok ? outcome.data : null;
}

export async function loginStudentAPI(
  userId: string,
  password: string,
  isDemo = false,
  captchaToken?: string,
): Promise<ApiResponse<StudentSession>> {
  if (isDemo || userId.toLowerCase() === 'demo') {
    return {
      success: true,
      data: {
        status: 1,
        message: "Demo Login Successful",
        user_id: MOCK_STUDENT_DATA.user_id,
        sid_1: "demo_sid_1_token_sample",
        sid_2: "demo_sid_2_token_sample",
        sid_3: "demo_sid_3_token_sample",
        isDemo: true
      }
    };
  }

  const normalizedUserId = sanitizeLoginUserId(userId);
  if (!isValidLoginUserId(normalizedUserId)) {
    return {
      success: false,
      error: 'No. matrik tidak sah.'
    };
  }

  const payload = {
    request_type: "login",
    user_id: normalizedUserId,
    password: password,
    umc_version: UMC_VERSION,
    platform: PLATFORM
  };

  const outcome = await postUSASOutcome(
    '/student/login_student.php',
    payload,
    captchaToken ? { 'x-turnstile-token': captchaToken } : {},
  );

  if (!outcome.ok) {
    return {
      success: false,
      error: outcome.reason === 'network'
        ? 'Tidak dapat hubungi pelayan USAS. Sila semak sambungan anda dan cuba lagi.'
        : 'Pelayan USAS tidak memberi respons yang sah. Sila cuba lagi sebentar.',
    };
  }

  const result = outcome.data;

  const gateResult = result as { success?: boolean; error?: string } | null;
  if (gateResult && gateResult.success === false && typeof gateResult.error === 'string' && gateResult.error.trim()) {
    return {
      success: false,
      error: sanitizeSingleLine(gateResult.error, 160),
    };
  }

  const loginResult = result as {
    server_response?: Array<{ status?: number | string; message?: string; sid_1?: string; sid_2?: string; sid_3?: string }>;
  } | null;

  if (loginResult?.server_response && loginResult.server_response.length > 0) {
    const resp = loginResult.server_response[0];
    if (resp.status === 1 || resp.status === "1") {
        return {
          success: true,
          data: {
            status: 1,
            user_id: normalizedUserId,
            sid_1: sanitizeSingleLine(resp.sid_1, 256),
            sid_2: sanitizeSingleLine(resp.sid_2, 256),
            sid_3: sanitizeSingleLine(resp.sid_3, 256),
            isDemo: false
          }
        };
    } else {
      return {
        success: false,
        error: "Wrong matric no. or password."
      };
    }
  }

  return {
    success: false,
    error: "Wrong matric no. or password."
  };
}

export async function fetchStudentProfileAPI(session: StudentSession): Promise<StudentProfile> {
  if (session.isDemo) {
    return {
      name: MOCK_STUDENT_DATA.name,
      program: MOCK_STUDENT_DATA.program,
      financialBalance: MOCK_STUDENT_DATA.financialBalance
    };
  }

  const payload = {
    apiKey: API_KEY,
    request_type: "student_profile",
    user_id: session.user_id,
    token: DUMMY_TOKEN,
    sid_1: session.sid_1,
    sid_2: session.sid_2,
    sid_3: session.sid_3,
    umc_platform: PLATFORM,
    umc_version: UMC_VERSION
  };

  const result = await postUSAS('/student/get_student_profile.php', payload);
  let name = null;
  let program = null;
  const profileResult = result as {
    server_response_profil?: Array<{ label?: string; header_label?: string; content?: string; name?: string; value?: string }>;
    server_response_akademik?: Array<{ label?: string; content?: string; value?: string }>;
  } | null;

  if (profileResult) {
    if (profileResult.server_response_profil && Array.isArray(profileResult.server_response_profil)) {
      for (const item of profileResult.server_response_profil) {
        const label = sanitizeSingleLine(item.label || item.header_label || '', 64).toLowerCase();
        const content = selectProfileText(item.content || item.name || item.value || '', 160);
        
        if (!name && content && (label.includes('name') || label.includes('nama') || label.includes('pelajar'))) {
          name = content;
        }
      }
      if (!name && profileResult.server_response_profil[0]?.content) {
        name = selectProfileText(profileResult.server_response_profil[0].content, 160);
      }
    }

    if (profileResult.server_response_akademik && Array.isArray(profileResult.server_response_akademik)) {
      for (const item of profileResult.server_response_akademik) {
        const label = sanitizeSingleLine(item.label || '', 64).toLowerCase();
        const content = selectProfileText(item.content || item.value || '', 160);
        if (!program && content && (label.includes('program') || label.includes('kursus') || label.includes('fakulti'))) {
          program = content;
        }
      }
      if (!program && profileResult.server_response_akademik[0]?.content) {
        program = selectProfileText(profileResult.server_response_akademik[0].content, 160);
      }
    }
  }

  return { 
    name: name && name.trim() ? sanitizeTextForShare(name, 160) : null, 
    program: program && program.trim() ? sanitizeTextForShare(program, 160) : null
  };
}

export async function fetchAttendanceHistoryAPI(
  session: StudentSession | null,
  groupId = '',
): Promise<AttendanceHistoryItem[]> {
  if (session?.isDemo) {
    return [
      { minggu: 'Minggu 1', tarikh: '10-Oct-2024', status_hadir: 'Present', catatan: 'Scan QR App' },
      { minggu: 'Minggu 2', tarikh: '17-Oct-2024', status_hadir: 'Present', catatan: 'Scan QR App' },
      { minggu: 'Minggu 3', tarikh: '24-Oct-2024', status_hadir: 'Present', catatan: 'Scan QR App' },
      { minggu: 'Minggu 4', tarikh: '31-Oct-2024', status_hadir: 'Absent', catatan: 'Kenyataan Sebab (Sakit)' },
      { minggu: 'Minggu 5', tarikh: '07-Nov-2024', status_hadir: 'Present', catatan: 'Scan QR App' },
      { minggu: 'Minggu 6', tarikh: '14-Nov-2024', status_hadir: 'Present', catatan: 'Scan QR App' },
      { minggu: 'Minggu 7', tarikh: '21-Nov-2024', status_hadir: 'Present', catatan: 'Scan QR App' }
    ];
  }

  if (!groupId) return [];

  const payload = {
    apiKey: API_KEY,
    request_type: "laporan_kehadiran",
    group_id: groupId,
    user_id: session.user_id,
    token: DUMMY_TOKEN,
    sid_1: session.sid_1,
    sid_2: session.sid_2,
    sid_3: session.sid_3,
    umc_platform: PLATFORM,
    umc_version: UMC_VERSION
  };

  const res = await postUSAS('/student/get_kehadiran_kuliah.php', payload);
  const attendanceRes = res as { server_response?: AttendanceHistoryItem[] } | null;
  if (attendanceRes?.server_response && Array.isArray(attendanceRes.server_response)) {
    return attendanceRes.server_response.map((item) => ({
      minggu: sanitizeTextForShare(item.minggu, 32),
      tarikh: sanitizeTextForShare(item.tarikh, 32),
      status_hadir: sanitizeTextForShare(item.status_hadir, 32),
      catatan: sanitizeTextForShare(item.catatan, 80),
    }));
  }
  return [];
}

// Resolves the numeric group_id for a course code via `senarai_kursus`.
// Used as a fallback when a cached timetable item is missing group_id.
export async function resolveGroupIdForCourseAPI(
  session: StudentSession | null,
  courseCode: string,
): Promise<string | null> {
  if (!session || session.isDemo) return null;

  const code = sanitizeSingleLine(courseCode, 64).trim().toUpperCase();
  if (!code) return null;

  const payload = {
    apiKey: API_KEY,
    request_type: 'senarai_kursus',
    user_id: session.user_id,
    token: DUMMY_TOKEN,
    sid_1: session.sid_1,
    sid_2: session.sid_2,
    sid_3: session.sid_3,
    umc_platform: PLATFORM,
    umc_version: UMC_VERSION,
  };

  try {
    const res = await postUSAS('/student/get_kehadiran_kuliah.php', payload);
    const rows = (res as { server_response?: Array<Record<string, unknown>> } | null)?.server_response;
    if (!Array.isArray(rows)) return null;

    const match = rows.find((row) => String(row.kod_kursus ?? '').trim().toUpperCase() === code);
    const groupId = match?.group_id;
    if (groupId === undefined || groupId === null) return null;
    return String(groupId).trim() || null;
  } catch {
    return null;
  }
}

export type AttendanceScanResponse = {
  alert?: string;
  message?: string;
  status?: string | number;
};

export async function scanAttendanceQrAPI(
  session: StudentSession | null,
  qrValue: string,
): Promise<ApiResponse<AttendanceScanResponse>> {
  const safeQrValue = sanitizeSingleLine(qrValue, 2048);

  if (!safeQrValue) {
    return {
      success: false,
      error: 'QR value is empty.',
    };
  }

  if (session?.isDemo) {
    return {
      success: true,
      data: {
        alert: `Demo mode captured QR: ${safeQrValue.slice(0, 80)}`,
        status: 1,
      },
    };
  }

  if (!session) {
    return {
      success: false,
      error: 'Session is missing.',
    };
  }

  const payload = {
    apiKey: API_KEY,
    request_type: "scan_kehadiran",
    user_id: session.user_id,
    token: DUMMY_TOKEN,
    qr_value: safeQrValue,
    sid_1: session.sid_1,
    sid_2: session.sid_2,
    sid_3: session.sid_3,
    umc_platform: PLATFORM,
    umc_version: UMC_VERSION,
  };

  const res = await postUSAS('/student/get_scan_qr_v2.php', payload);
  const scanRes = res as { server_response?: AttendanceScanResponse[] } | null;

  if (scanRes?.server_response && Array.isArray(scanRes.server_response) && scanRes.server_response.length > 0) {
    const first = scanRes.server_response[0];
    return {
      success: true,
      data: {
        alert: sanitizeTextForShare(first.alert || first.message || 'Scan processed.', 240),
        message: sanitizeTextForShare(first.message || first.alert || 'Scan processed.', 240),
        status: first.status,
      },
    };
  }

  return {
    success: false,
    error: 'No response from attendance scan endpoint.',
  };
}

// Computes the attendance percentage from real `laporan_kehadiran` rows.
// Only sessions that have actually taken place count toward the total:
// a row is "held" when it has a recorded status or its date is in the past.
export function computeAttendancePercent(rows: AttendanceHistoryItem[] | null | undefined): number | null {
  if (!rows || rows.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let held = 0;
  let present = 0;

  for (const row of rows) {
    const status = String(row.status_hadir ?? '').trim();
    const date = parseDisplayDate(row.tarikh);
    const isHeld = status.length > 0 || (date !== null && date.getTime() < today.getTime());
    if (!isHeld) continue;

    held += 1;
    if (/hadir|present/i.test(status) && !/tidak/i.test(status)) present += 1;
  }

  if (held === 0) return null;
  return Math.round((present / held) * 100);
}

export type LecturerDirectoryEntry = {
  id: string;
  name: string;
  position: string;
  email: string;
  ext: string;
  staffNo: string;
};

function stripHtmlTags(value: unknown): string {
  return sanitizeSingleLine(String(value ?? '').replace(/<[^>]*>/g, ' '), 160);
}

export async function searchLecturerDirectoryAPI(
  session: StudentSession | null,
  keyword: string,
): Promise<LecturerDirectoryEntry[]> {
  if (!session || session.isDemo) return [];

  const cleanKeyword = sanitizeSingleLine(keyword, 120);
  if (!cleanKeyword) return [];

  const payload = {
    apiKey: API_KEY,
    request_type: 'search_dir',
    keyword: cleanKeyword,
    user_id: session.user_id,
    token: DUMMY_TOKEN,
    sid_1: session.sid_1,
    sid_2: session.sid_2,
    sid_3: session.sid_3,
    umc_platform: PLATFORM,
    umc_version: UMC_VERSION,
  };

  const result = await postUSAS('/student/get_directory_staff_v2.php', payload);
  const typed = result as { server_response_directory?: Array<Record<string, unknown>> } | null;
  const rows = typed?.server_response_directory;
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((row) => Number(row.id) !== 0)
    .map((row, index) => ({
      id: sanitizeSingleLine(row.id ?? String(index + 1), 32),
      name: stripHtmlTags(row.nama),
      position: stripHtmlTags(row.jawatan),
      email: sanitizeSingleLine(row.email, 160).toLowerCase(),
      ext: stripHtmlTags(row.ext),
      staffNo: sanitizeSingleLine(row.no_staff, 32),
    }))
    .filter((entry) => entry.name.length > 0);
}

export async function fetchTimetableAPI(session: StudentSession): Promise<TimetableData> {
  if (session.isDemo) {
    return {
      success: true,
      days: MOCK_STUDENT_DATA.timetableDays,
      timetable: MOCK_STUDENT_DATA.timetable,
      studentName: MOCK_STUDENT_DATA.name,
      program: MOCK_STUDENT_DATA.program,
      semester: MOCK_STUDENT_DATA.semester
    };
  }

  const profilePromise = fetchStudentProfileAPI(session);

  const basePayload = {
    apiKey: API_KEY,
    user_id: session.user_id,
    token: DUMMY_TOKEN,
    sid_1: session.sid_1,
    sid_2: session.sid_2,
    sid_3: session.sid_3,
    umc_platform: PLATFORM,
    umc_version: UMC_VERSION
  };

  const timetablePayload = { ...basePayload, request_type: "jadual_kuliah" };
  const kehadiranCoursePayload = { ...basePayload, request_type: "senarai_kursus" };

  const [timetableOutcome, kehadiranCourseOutcome] = await Promise.all([
    postUSASOutcome('/student/get_timetable_stud.php', timetablePayload),
    postUSASOutcome('/student/get_kehadiran_kuliah.php', kehadiranCoursePayload),
  ]);

  // If neither endpoint returns usable data, the USAS API is unreachable/broken.
  if (!timetableOutcome.ok && !kehadiranCourseOutcome.ok) {
    throw new UsasUnavailableError();
  }

  const timetableRes = timetableOutcome.ok ? timetableOutcome.data : null;
  const kehadiranCourseRes = kehadiranCourseOutcome.ok ? kehadiranCourseOutcome.data : null;

  let rawItems: TimetableItem[] = [];
  let rawDays: string[] = [];

  // Build course -> group_id map from senarai_kursus so attendance logs wire to real database group IDs
  const courseGroupMap = new Map<string, { group_id: string; kumpulan?: string; semester?: string }>();
  const kehadiranPayloadTyped = kehadiranCourseRes as {
    server_response?: Array<Record<string, string | undefined>>;
  } | null;

  if (kehadiranPayloadTyped?.server_response && Array.isArray(kehadiranPayloadTyped.server_response)) {
    for (const k of kehadiranPayloadTyped.server_response) {
      const code = String(k.kod_kursus || '').trim().toUpperCase();
      if (code && k.group_id) {
        courseGroupMap.set(code, {
          group_id: String(k.group_id).trim(),
          kumpulan: k.kumpulan ? String(k.kumpulan).trim() : undefined,
          semester: k.semester ? String(k.semester).trim() : undefined,
        });
      }
    }
  }

  const timetablePayloadRes = timetableRes as {
    server_response?: TimetableItem[];
    server_response_day?: string[];
  } | null;

  if (timetablePayloadRes?.server_response && timetablePayloadRes.server_response.length > 0) {
    rawItems = timetablePayloadRes.server_response.map((item) => {
      const sanitized = sanitizeTimetableItem(item);
      const code = String(sanitized.course_id || sanitized.kod_kursus || '').trim().toUpperCase();
      const matched = courseGroupMap.get(code);
      if (matched?.group_id) {
        sanitized.group_id = matched.group_id;
      }
      if (matched?.kumpulan && !sanitized.group) {
        sanitized.group = matched.kumpulan;
      }
      if (matched?.semester && !sanitized.semester) {
        sanitized.semester = matched.semester;
      }
      return sanitized;
    });
    // Keep the formatted date + weekday label (e.g. "05-10-2026 (ISNIN)") so the
    // UI can render the real date beside the translated weekday, while still
    // de-duplicating repeated weekdays.
    rawDays = sortDayLabels(Array.from(new Set(
      (timetablePayloadRes.server_response_day || [])
        .map((day) => normalizeDayLabel(sanitizeSingleLine(day, 64)))
        .filter(Boolean)
    )));
  } else if (kehadiranPayloadTyped?.server_response && kehadiranPayloadTyped.server_response.length > 0) {
    rawItems = kehadiranPayloadTyped.server_response.map((item, i) => {
      const parsed = parseFallbackJadual(item.jadual);

      return {
        id: sanitizeSingleLine(item.id || String(i + 1), 32),
        day: parsed.day,
        course_id: sanitizeSingleLine(item.kod_kursus || '', 64),
        course_name: sanitizeTextForShare(item.kursus || '', 160),
        group: sanitizeSingleLine(item.kumpulan || item.group_id || '', 32),
        group_id: sanitizeSingleLine(item.group_id || '', 32),
        start_time: parsed.time,
        end_time: '',
        location: sanitizeSingleLine(item.tempat || item.lokasi || item.location || '', 160),
        lecturer: sanitizeTextForShare(item.pensyarah || '', 160),
        pelajar: sanitizeTextForShare(item.pelajar, 160),
        semester: sanitizeSingleLine(item.semester, 64),
        kehadiran: item.kehadiran ? sanitizeSingleLine(item.kehadiran, 16) : '',
        catatan: sanitizeSingleLine(item.catatan || '', 64)
      };
    });
    rawDays = [];
  }

  // If the backend did not return a day list, derive it from the timetable
  // items themselves, preserving any embedded date labels.
  if (rawDays.length === 0 && rawItems.length > 0) {
    rawDays = sortDayLabels(Array.from(new Set(
      rawItems
        .map((item) => normalizeDayLabel(sanitizeSingleLine(item.day, 64)))
        .filter(Boolean)
    )));
  }

  // Resolve the real lecture-attendance percentage per course from the official
  // `laporan_kehadiran` report, keyed by the group_id from `senarai_kursus`.
  // The timetable `kehadiran` field is only a human status string, so it can't
  // be parsed as a percentage.
  const uniqueGroupIds = Array.from(new Set(
    rawItems
      .map((item) => sanitizeSingleLine(item.group_id, 32))
      .filter((group): group is string => Boolean(group))
  ));

  if (uniqueGroupIds.length > 0) {
    const percentByGroup = new Map<string, number | null>();

    await Promise.all(uniqueGroupIds.map(async (groupId) => {
      try {
        const reportPayload = {
          ...basePayload,
          request_type: 'laporan_kehadiran',
          group_id: groupId,
        };
        const reportRes = await postUSAS('/student/get_kehadiran_kuliah.php', reportPayload);
        const rows = (reportRes as { server_response?: AttendanceHistoryItem[] } | null)?.server_response;
        percentByGroup.set(groupId, computeAttendancePercent(rows));
      } catch {
        percentByGroup.set(groupId, null);
      }
    }));

    rawItems = rawItems.map((item) => {
      const groupId = sanitizeSingleLine(item.group_id, 32);
      const percent = groupId ? percentByGroup.get(groupId) : null;
      return {
        ...item,
        kehadiran: percent === null || percent === undefined ? '' : `${percent}%`,
      };
    });
  }

  const profile = await profilePromise;

  let finalName = profile.name;
  let finalProgram = profile.program;

  if (!finalName && rawItems.length > 0) {
    for (const item of rawItems) {
      const candidate = item.pelajar || item.nama || item.student_name || item.name;
      if (candidate && candidate.trim() && candidate !== session.user_id) {
        finalName = sanitizeTextForShare(candidate, 160).trim();
        break;
      }
    }
  }

  const resultName = finalName || `Pelajar USAS (${sanitizeLoginUserId(session.user_id)})`;
  const resultProgram = finalProgram || '';
  const resultSemester = rawItems[0]?.semester || '';

  return {
    success: true,
    days: rawDays,
    timetable: rawItems
      .map(sanitizeTimetableItem)
      .filter((item) => (item.course_name?.trim() || item.course_id?.trim()) && item.day?.trim()),
    studentName: resultName,
    program: resultProgram,
    semester: resultSemester
  };
}

export function selectProfileText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    return null;
  }

  const normalized = sanitizeTextForShare(value, maxLength);
  return normalized.trim() ? normalized : null;
}

export function parseFallbackJadual(jadual: unknown): { day: string; time: string } {
  const jadualText = sanitizeSingleLine(jadual || '', 64);
  let day = '';
  let time = jadualText;

  if (jadualText) {
    const parts = jadualText.trim().split(' ');
    const dayMap = {
      'MON': 'ISNIN', 'TUE': 'SELASA', 'WED': 'RABU', 'THU': 'KHAMIS', 'FRI': 'JUMAAT',
      'SAT': 'SABTU', 'SUN': 'AHAD',
      'ISNIN': 'ISNIN', 'SELASA': 'SELASA', 'RABU': 'RABU', 'KHAMIS': 'KHAMIS', 'JUMAAT': 'JUMAAT'
    } as const;
    const parsedDay = dayMap[parts[0]?.toUpperCase() as keyof typeof dayMap];
    if (parsedDay) {
      day = parsedDay;
      time = parts.slice(1).join(' ');
    }
  }

  return { day, time };
}



