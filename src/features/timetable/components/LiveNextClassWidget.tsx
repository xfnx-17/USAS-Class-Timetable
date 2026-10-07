import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';

import { playClassChime, sendPushNotification } from '@/shared/lib/audioNotifier';
import { buildDayScopedNotificationKey, getLocalDateStamp, pruneDayScopedNotificationKeys } from '@/shared/lib/notificationKeys';
import { Clock, CheckCircle2, Bell, BellOff } from 'lucide-react';
import type { TimetableItem } from '@/shared/types/usas';
import { extractDayName } from '@/shared/lib/dayFormat';

type LiveNextClassWidgetProps = {
  timetable?: TimetableItem[];
};

type NextClassItem = TimetableItem & {
  diff?: number;
  diffSeconds?: number;
  endMin?: number;
};

export default function LiveNextClassWidget({ timetable = [] }: LiveNextClassWidgetProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [now, setNow] = useState(new Date());
  const [autoNotifyEnabled, setAutoNotifyEnabled] = useState(() => {
    try { return localStorage.getItem('usas_auto_notify') === 'true'; } catch (e) { return false; }
  });
  const notifiedRef = useRef(new Set<string>());
  const activeDayStampRef = useRef('');
  const isLight = theme === 'light';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const dayStamp = getLocalDateStamp(now);
    if (activeDayStampRef.current === dayStamp) return;
    activeDayStampRef.current = dayStamp;
    notifiedRef.current = pruneDayScopedNotificationKeys(notifiedRef.current, now);
  }, [now]);

  const toggleAutoNotify = () => {
    const nextState = !autoNotifyEnabled;
    setAutoNotifyEnabled(nextState);
    try { 
      localStorage.setItem('usas_auto_notify', String(nextState)); 
      localStorage.setItem('usas_prayer_auto_notify', String(nextState));
    } catch (e) {}
    
    // Dispatch event so PrayerTimesNotifier picks it up
    window.dispatchEvent(new Event('usas-prayer-auto-notify-changed'));
    
    if (nextState) {
      playClassChime();
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    }
  };

  const dayNames = ['AHAD', 'ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU'];
  const currentDayName = dayNames[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = currentMinutes * 60 + now.getSeconds();

  const parseTimeToMinutes = (timeStr: string | undefined) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const parseTimeToSeconds = (timeStr: string | undefined) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 3600 + m * 60;
  };

  const formatCountdown = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  let ongoingClass: NextClassItem | null = null;
  let nextClass: NextClassItem | null = null;
  let minDiff = Infinity;

  if (Array.isArray(timetable) && timetable.length > 0) {
    for (const item of timetable) {
      const isToday = extractDayName(item.day) === currentDayName || item.day?.toUpperCase() === currentDayName;
      if (!isToday) continue;

      const startMin = parseTimeToMinutes(item.start_time);
      const endMin = item.end_time ? parseTimeToMinutes(item.end_time) : startMin + 120;
      const startSec = parseTimeToSeconds(item.start_time);
      if (currentMinutes >= startMin && currentMinutes <= endMin) {
        ongoingClass = { ...item, endMin };
      }

      if (startSec > currentSeconds) {
        const diff = startSec - currentSeconds;
        if (diff < minDiff) {
          minDiff = diff;
          nextClass = { ...item, diffSeconds: diff };
        }
      }
    }
  }

  useEffect(() => {
    if (autoNotifyEnabled && nextClass && nextClass.diffSeconds !== undefined && nextClass.diffSeconds <= 600 && nextClass.diffSeconds > 0) {
      const key = buildDayScopedNotificationKey(now, nextClass.course_id, nextClass.day, nextClass.start_time);
      if (!notifiedRef.current.has(key)) {
        notifiedRef.current.add(key);
        playClassChime();
        sendPushNotification(
          `Peringatan Kuliah USAS: ${nextClass.course_id}`,
          `Kelas ${nextClass.course_name} bermula dalam 10 minit di ${nextClass.location}`
        );
      }
    }
  }, [autoNotifyEnabled, nextClass, now]);

  if (!timetable || timetable.length === 0) return null;

  /* ── No more classes today ─────────────────────────────────────────── */
  if (!ongoingClass && !nextClass) {
    return (
      <>
        <div className={`py-2 px-3 rounded-xl border text-[10px] flex items-center gap-2 transition-all shadow-sm ${
          isLight
            ? 'bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border-emerald-100/80 text-emerald-900 shadow-emerald-500/5'
            : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-300 shadow-black/10'
        }`}>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
          isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
        }`}>
          <CheckCircle2 className="w-3 h-3" />
        </div>
        <span className="font-semibold tracking-wide truncate flex-1 min-w-0">
          {t('noClassRemaining')} ({t(`days.${currentDayName}`) || currentDayName})
        </span>
        <button
          onClick={toggleAutoNotify}
          className={`p-1 rounded-lg transition-all flex-shrink-0 ${
            autoNotifyEnabled
              ? (isLight
                  ? 'bg-emerald-100/80 text-emerald-700 hover:bg-emerald-200/80'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30')
              : (isLight
                  ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                  : 'text-white/20 hover:text-white/40 hover:bg-white/[0.04]')
          }`}
          title="Mod Peringatan Chime Auto"
        >
          {autoNotifyEnabled
            ? <Bell className="w-3 h-3 animate-bounce" style={{ animationIterationCount: 2 }} />
            : <BellOff className="w-3 h-3" />}
        </button>
      </div>
      </>
    );
  }

  /* ── Ongoing or next class ─────────────────────────────────────────── */
  const activeCourse = ongoingClass || nextClass;

  return (
    <div className={`py-2 px-3 rounded-lg border flex items-center gap-2 text-xs transition-colors duration-150 ${
      isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/[0.03] border-white/[0.05] text-slate-100'
    }`}>
      {/* Icon */}
      <div className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 ${
        ongoingClass
          ? (isLight
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400')
          : (isLight
              ? 'bg-amber-50 border-amber-200 text-amber-600'
              : 'bg-amber-400/15 border-amber-400/30 text-amber-400')
      }`}>
        <Clock className="w-3.5 h-3.5" />
      </div>

      {/* Course info — all inline, truncated */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-x-1.5 flex-wrap leading-none">
          <span className={`text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${
            ongoingClass
              ? (isLight ? 'text-emerald-600' : 'text-emerald-400')
              : (isLight ? 'text-amber-600' : 'text-amber-400')
          }`}>
            {ongoingClass ? t('ongoingNow') : t('nextClass')}
          </span>
          {nextClass && (
            <span className={`text-[9px] font-bold tabular-nums flex-shrink-0 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
              {formatCountdown(nextClass.diffSeconds || 0)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 leading-none">
          <span className={`text-[9.5px] font-bold truncate ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
            {activeCourse!.course_id}: {activeCourse!.course_name}
          </span>
          <div className={`text-[9px] truncate flex-shrink-0 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            {activeCourse!.location}
          </div>
        </div>
      </div>

      {/* Bell button */}
      <button
        onClick={toggleAutoNotify}
        className={`p-1 rounded flex-shrink-0 transition-colors ${
          autoNotifyEnabled
            ? (isLight
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20')
            : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/30 hover:text-white/60')
        }`}
        title="Peringatan Auto 10 Minit"
      >
        {autoNotifyEnabled
          ? <Bell className="w-3 h-3 text-emerald-500" />
          : <BellOff className="w-3 h-3" />}
      </button>
    </div>
  );
}
