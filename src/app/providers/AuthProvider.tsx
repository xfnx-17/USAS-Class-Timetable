import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { loginStudentAPI, fetchTimetableAPI, UsasUnavailableError } from '@/services/usas/Api';
import type { AuthContextValue, StudentSession, TimeFormat, TimetableData } from '@/shared/types/usas';
import {
  evaluateLoginThrottle,
  formatRetryAt,
  getEmptyThrottleState,
  recordLoginFailure,
  recordLoginSuccess,
  sanitizeSession,
  sanitizeLoginUserId,
} from '@/shared/lib/security';
import {
  restoreSessionFromCache,
  restoreThrottleState,
  restoreTimetableFromCache,
} from '@/shared/lib/cache';
import { useRef } from 'react';

const AuthContext = createContext<AuthContextValue | null>(null);

const CACHE_KEY_SESSION = 'usas_student_session_cache';
const CACHE_KEY_TIMETABLE = 'usas_student_timetable_cache';
const CACHE_KEY_LOGIN_THROTTLE = 'usas_login_throttle_cache';
const getTimeFormatKey = (userId: string) => `usas_time_format_${userId}`;

const readTimeFormat = (userId?: string): TimeFormat => {
  if (!userId) return '24h';
  try {
    return localStorage.getItem(getTimeFormatKey(userId)) === '12h' ? '12h' : '24h';
  } catch {
    return '24h';
  }
};

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<StudentSession | null>(() => {
    try {
      const cachedSess = sessionStorage.getItem(CACHE_KEY_SESSION);
      return cachedSess ? restoreSessionFromCache(cachedSess) : null;
    } catch {
      return null;
    }
  });
  const [timetableData, setTimetableData] = useState<TimetableData | null>(() => {
    try {
      const cachedTime = localStorage.getItem(CACHE_KEY_TIMETABLE);
      return cachedTime ? restoreTimetableFromCache(cachedTime) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>(() => readTimeFormat(session?.user_id));
  const loginRequestRef = useRef(0);
  const refreshRequestRef = useRef(0);
  const sessionRef = useRef<StudentSession | null>(session);

  const getSessionKey = (value: StudentSession | null) => {
    if (!value) return '';
    return [value.user_id, value.sid_1, value.sid_2, value.sid_3].join('|');
  };

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    setTimeFormatState(readTimeFormat(session?.user_id));
  }, [session?.user_id]);

  const setTimeFormat = (format: TimeFormat) => {
    setTimeFormatState(format);
    if (!session?.user_id) return;
    try {
      localStorage.setItem(getTimeFormatKey(session.user_id), format);
    } catch {
      // Keep the preference for this session if storage is unavailable.
    }
  };

  const readThrottleState = () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY_LOGIN_THROTTLE);
      if (!cached) return getEmptyThrottleState();
      return restoreThrottleState(cached) || getEmptyThrottleState();
    } catch {
      return getEmptyThrottleState();
    }
  };

  const writeThrottleState = (nextState: ReturnType<typeof getEmptyThrottleState>) => {
    try {
      sessionStorage.setItem(CACHE_KEY_LOGIN_THROTTLE, JSON.stringify(nextState));
    } catch {
      // ignore storage failures
    }
  };

  // Track network status for PWA offline mode
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const login = async (userId: string, password: string, isDemo = false, captchaToken?: string) => {
    const requestId = ++loginRequestRef.current;
    refreshRequestRef.current += 1;
    setLoading(true);
    setError(null);
    try {
      const normalizedUserId = sanitizeLoginUserId(userId);
      if (!isDemo && !normalizedUserId) {
        if (loginRequestRef.current !== requestId) return false;
        setError('Isi no. matrik yang sah.');
        return false;
      }

      const throttleState = readThrottleState();
      const throttleCheck = evaluateLoginThrottle(throttleState);
      if (!isDemo && !throttleCheck.allowed) {
        if (loginRequestRef.current !== requestId) return false;
        setError(`Log masuk disekat seketika. Cuba lagi selepas ${formatRetryAt(throttleCheck.retryAt)}.`);
        return false;
      }

      const res = await loginStudentAPI(userId, password, isDemo, captchaToken);
      if (loginRequestRef.current !== requestId) return false;
      if (res.success) {
        const safeSession = sanitizeSession(res.data);
        setSession(safeSession);
        try {
          sessionStorage.setItem(CACHE_KEY_SESSION, JSON.stringify(safeSession));
        } catch {
          // ignore storage failures
        }
        writeThrottleState(recordLoginSuccess(throttleState));

        try {
          const timetableRes = await fetchTimetableAPI(safeSession);
          if (loginRequestRef.current !== requestId) return false;
          setTimetableData(timetableRes);
          try {
            localStorage.setItem(CACHE_KEY_TIMETABLE, JSON.stringify(timetableRes));
          } catch {
            // ignore storage failures
          }
        } catch (err) {
          if (loginRequestRef.current !== requestId) return false;
          setError(err instanceof UsasUnavailableError
            ? 'Pelayan USAS tidak dapat dihubungi. Sila cuba lagi sebentar.'
            : 'Gagal memuat jadual. Sila cuba lagi.');
        }
        return true;
      } else {
        if (loginRequestRef.current !== requestId) return false;
        if ('error' in res) {
          setError(res.error);
        }
        if (!isDemo) {
          writeThrottleState(recordLoginFailure(throttleState));
        }
        return false;
      }
    } catch (err) {
      if (loginRequestRef.current !== requestId) return false;
      if (!isDemo) {
        const throttleState = readThrottleState();
        writeThrottleState(recordLoginFailure(throttleState));
      }
      setError("Ralat sistem semasa log masuk.");
      return false;
    } finally {
      if (loginRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  const logout = () => {
    loginRequestRef.current += 1;
    refreshRequestRef.current += 1;
    setSession(null);
    setTimetableData(null);
    setError(null);
    try {
      sessionStorage.removeItem(CACHE_KEY_SESSION);
      sessionStorage.removeItem(CACHE_KEY_LOGIN_THROTTLE);
      localStorage.removeItem(CACHE_KEY_TIMETABLE);
    } catch {
      // ignore storage failures
    }
  };

  const refreshTimetable = async () => {
    if (!session) return;
    const requestId = ++refreshRequestRef.current;
    const sessionKey = getSessionKey(session);
    setLoading(true);
    try {
      const res = await fetchTimetableAPI(session);
      if (refreshRequestRef.current !== requestId || getSessionKey(sessionRef.current) !== sessionKey) return;
      setTimetableData(res);
      try {
        localStorage.setItem(CACHE_KEY_TIMETABLE, JSON.stringify(res));
      } catch {
        // ignore storage failures
      }
    } catch (err) {
      if (refreshRequestRef.current !== requestId || getSessionKey(sessionRef.current) !== sessionKey) return;
      setError(err instanceof UsasUnavailableError
        ? 'Pelayan USAS tidak dapat dihubungi. Memaparkan jadual tersimpan.'
        : 'Gagal memuat jadual. Sila cuba lagi.');
    } finally {
      if (refreshRequestRef.current === requestId && getSessionKey(sessionRef.current) === sessionKey) {
        setLoading(false);
      }
    }
  };

  // A restored session may come with a stale cached timetable (e.g. missing
  // group_id or attendance data), so refresh once from the API on first load.
  const didAutoRefreshRef = useRef(false);
  useEffect(() => {
    if (didAutoRefreshRef.current) return;
    if (!sessionRef.current) return;
    didAutoRefreshRef.current = true;
    void refreshTimetable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      timetableData,
      loading,
      error,
      isOffline,
      timeFormat,
      setTimeFormat,
      login,
      logout,
      refreshTimetable,
      setError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}




