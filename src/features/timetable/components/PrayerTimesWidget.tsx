import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { fetchPrayerTimesAPI } from '@/services/jakim/JakimApi';
import type { WaktuSolatPrayer } from '@/shared/types/usas';
import { playPrayerChime, sendPushNotification } from '@/shared/lib/audioNotifier';
import { getLocalDateStamp, pruneDayScopedNotificationKeys } from '@/shared/lib/notificationKeys';

type PrayerData = {
  times: { label: string; timestamp: number }[];
  location: string;
};

const NOTIFY_WINDOW_SECONDS = 600;
const PRAYER_NOTIFY_KEY = 'usas_prayer_auto_notify';
const PRAYER_NOTIFY_EVENT = 'usas-prayer-auto-notify-changed';
const PRAYER_NOTIFIED_STORE_KEY = 'usas_prayer_notified_store';


export const formatCountdown = (diffSeconds: number) => {
  const h = Math.floor(diffSeconds / 3600);
  const m = Math.floor((diffSeconds % 3600) / 60);
  const s = diffSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const usePrayerAutoNotifySetting = () => {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(PRAYER_NOTIFY_KEY) === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const syncSetting = () => {
      try {
        setEnabled(localStorage.getItem(PRAYER_NOTIFY_KEY) === 'true');
      } catch (e) {
        setEnabled(false);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === PRAYER_NOTIFY_KEY) {
        syncSetting();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(PRAYER_NOTIFY_EVENT, syncSetting);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(PRAYER_NOTIFY_EVENT, syncSetting);
    };
  }, []);

  const setAutoNotifyEnabled = (nextState: boolean) => {
    setEnabled(nextState);
    try {
      localStorage.setItem(PRAYER_NOTIFY_KEY, String(nextState));
    } catch (e) { }
    window.dispatchEvent(new Event(PRAYER_NOTIFY_EVENT));

    if (nextState && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  return [enabled, setAutoNotifyEnabled] as const;
};

export const PRAYER_ZONE_KEY = 'usas_prayer_zone';
export const PRAYER_ZONE_EVENT = 'usas_prayer_zone_change';

export const usePrayerZone = () => {
  const [zone, setZone] = useState(() => {
    try {
      return localStorage.getItem(PRAYER_ZONE_KEY) || 'PRK02';
    } catch (e) {
      return 'PRK02';
    }
  });

  useEffect(() => {
    const syncSetting = () => {
      try {
        setZone(localStorage.getItem(PRAYER_ZONE_KEY) || 'PRK02');
      } catch (e) {
        setZone('PRK02');
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === PRAYER_ZONE_KEY) {
        syncSetting();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(PRAYER_ZONE_EVENT, syncSetting);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(PRAYER_ZONE_EVENT, syncSetting);
    };
  }, []);

  const setPrayerZone = (newZone: string) => {
    setZone(newZone);
    try {
      localStorage.setItem(PRAYER_ZONE_KEY, newZone);
    } catch (e) { }
    window.dispatchEvent(new Event(PRAYER_ZONE_EVENT));
  };

  return [zone, setPrayerZone] as const;
};

export function useNextPrayer() {
  const { session } = useAuth();
  const [zone] = usePrayerZone();
  const [prayerData, setPrayerData] = useState<PrayerData>({
    times: [],
    location: 'Kuala Kangsar (PRK02)',
  });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    fetchPrayerTimesAPI(session, zone).then(res => {
      if (active && res?.success && res.data?.prayers) {
        const flatTimes: { label: string; timestamp: number }[] = [];
        res.data.prayers.forEach((p: WaktuSolatPrayer) => {
          flatTimes.push({ label: 'Subuh', timestamp: p.fajr });
          flatTimes.push({ label: 'Zohor', timestamp: p.dhuhr });
          flatTimes.push({ label: 'Asar', timestamp: p.asr });
          flatTimes.push({ label: 'Maghrib', timestamp: p.maghrib });
          flatTimes.push({ label: 'Isyak', timestamp: p.isha });
        });
        flatTimes.sort((a, b) => a.timestamp - b.timestamp);
        setPrayerData({ times: flatTimes, location: res.location });
      }
    });
    return () => { active = false; };
  }, [session, zone]);

  const currentUnix = Math.floor(now.getTime() / 1000);

  const formatTime = (ts: number) => {
    const date = new Date(ts * 1000);
    const hours = date.getHours();
    const mins = date.getMinutes();
    return `${hours % 12 || 12}:${mins.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  };

  let nextPrayer = null;
  let diffSeconds = 0;
  let currentPrayer = null;
  let secondsSinceCurrent = 0;

  for (const p of prayerData.times) {
    if (p.timestamp > currentUnix) {
      nextPrayer = { label: p.label, content: formatTime(p.timestamp), timestamp: p.timestamp };
      diffSeconds = p.timestamp - currentUnix;
      break;
    }

    currentPrayer = { label: p.label, content: formatTime(p.timestamp), timestamp: p.timestamp };
    secondsSinceCurrent = currentUnix - p.timestamp;
  }

  return { nextPrayer, diffSeconds, currentPrayer, secondsSinceCurrent, location: prayerData.location };
}

function readPrayerNotifiedStore(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PRAYER_NOTIFIED_STORE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, boolean>;
    }
  } catch {
    // Ignore malformed storage.
  }
  return {};
}

function persistPrayerNotifiedStore(store: Record<string, boolean>): void {
  try {
    localStorage.setItem(PRAYER_NOTIFIED_STORE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage failures.
  }
}

export function PrayerTimesNotifier() {
  const { session } = useAuth();
  const [zone] = usePrayerZone();
  const [prayerData, setPrayerData] = useState<PrayerData>({
    times: [],
    location: 'Kuala Kangsar (PRK02)',
  });
  const [now, setNow] = useState(new Date());
  const [autoNotifyEnabled] = usePrayerAutoNotifySetting();
  // Persist the notified keys so a page refresh does not replay the chime for
  // a prayer that was already announced.
  const notifiedRef = useRef<Record<string, boolean>>(readPrayerNotifiedStore());
  const activeDayStampRef = useRef('');

  useEffect(() => {
    let active = true;
    fetchPrayerTimesAPI(session, zone).then(res => {
      if (active && res?.success && res.data?.prayers) {
        const flatTimes: { label: string; timestamp: number }[] = [];
        res.data.prayers.forEach((p: WaktuSolatPrayer) => {
          flatTimes.push({ label: 'Subuh', timestamp: p.fajr });
          flatTimes.push({ label: 'Zohor', timestamp: p.dhuhr });
          flatTimes.push({ label: 'Asar', timestamp: p.asr });
          flatTimes.push({ label: 'Maghrib', timestamp: p.maghrib });
          flatTimes.push({ label: 'Isyak', timestamp: p.isha });
        });
        flatTimes.sort((a, b) => a.timestamp - b.timestamp);
        setPrayerData({ times: flatTimes, location: res.location });
      }
    });
    return () => { active = false; };
  }, [session, zone]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const dayStamp = getLocalDateStamp(now);
    if (activeDayStampRef.current === dayStamp) return;
    activeDayStampRef.current = dayStamp;
    notifiedRef.current = pruneDayScopedNotificationKeys(notifiedRef.current, now);
    persistPrayerNotifiedStore(notifiedRef.current);
  }, [now]);

  useEffect(() => {
    if (!autoNotifyEnabled || prayerData.times.length === 0) return;

    const dayStamp = getLocalDateStamp(now);
    const currentUnix = Math.floor(now.getTime() / 1000);
    let changed = false;

    prayerData.times.forEach((prayer) => {
      const label = prayer.label.toLowerCase();

      const diff = prayer.timestamp - currentUnix;
      const notifyKey = `${dayStamp}-${label}-${prayer.timestamp}`;
      if (diff > 0 && diff <= NOTIFY_WINDOW_SECONDS && !notifiedRef.current[notifyKey]) {
        notifiedRef.current[notifyKey] = true;
        changed = true;
        playPrayerChime();
        sendPushNotification(
          `Waktu Solat USAS: ${prayer.label}`,
          `${prayer.label} masuk dalam ${Math.ceil(diff / 60)} minit di ${prayerData.location}`
        );
      }
    });

    if (changed) persistPrayerNotifiedStore(notifiedRef.current);
  }, [autoNotifyEnabled, now, prayerData]);

  return null;
}
