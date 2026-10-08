import type { Dispatch, SetStateAction } from 'react';

export type LanguageCode = 'ms' | 'en' | 'zh' | 'ta';
export type ThemeName = 'navy' | 'oled' | 'emerald' | 'light';
export type TimeFormat = '12h' | '24h';

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface StudentSession {
  status?: number;
  message?: string;
  user_id: string;
  sid_1: string;
  sid_2: string;
  sid_3: string;
  isDemo: boolean;
}

export interface TimetableItem {
  id: string;
  day: string;
  course_id?: string;
  kod_kursus?: string;
  course_name?: string;
  kursus?: string;
  group?: string;
  kumpulan?: string;
  group_id?: string;
  jadual?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  lecturer?: string;
  pensyarah?: string;
  kehadiran?: string;
  catatan?: string;
  pelajar?: string;
  student_name?: string;
  semester?: string;
  nama?: string;
  name?: string;
}

export interface TimetableData {
  success: true;
  days: string[];
  timetable: TimetableItem[];
  studentName: string;
  program: string;
  semester: string;
}

export interface StudentProfile {
  name: string | null;
  program: string | null;
  financialBalance?: string;
}

export interface AttendanceHistoryItem {
  minggu?: string;
  tarikh?: string;
  status_hadir?: string;
  catatan?: string;
}

export interface WaktuSolatPrayer {
  day: number;
  hijri: string;
  imsak: number;
  fajr: number;
  syuruk: number;
  dhuha: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface WaktuSolatApiResponse {
  zone: string;
  year: number;
  month: string;
  month_number: number;
  last_updated: string | null;
  prayers: WaktuSolatPrayer[];
}

export interface AuthContextValue {
  session: StudentSession | null;
  timetableData: TimetableData | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
  login: (userId: string, password: string, isDemo?: boolean, captchaToken?: string) => Promise<boolean>;
  logout: () => void;
  refreshTimetable: () => Promise<void>;
  setError: Dispatch<SetStateAction<string | null>>;
}

export interface ThemeContextValue {
  theme: ThemeName;
  changeTheme: (newTheme: ThemeName, e?: React.MouseEvent) => void;
  THEMES: Record<string, ThemeName>;
}

export interface LanguageContextValue {
  lang: LanguageCode;
  setLang: Dispatch<SetStateAction<LanguageCode>>;
  toggleLanguage: () => void;
  t: (key: string) => string;
}
