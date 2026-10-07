import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { buildDayScopedNotificationKey, getLocalDateStamp, persistDayScopedNotificationKeys, pruneDayScopedNotificationKeys, readDayScopedNotificationKeys } from '@/shared/lib/notificationKeys';
import { extractDayName } from '@/shared/lib/dayFormat';
import { playClassChime } from '@/shared/lib/audioNotifier';
import { isWithinClassNotificationWindow } from '@/shared/lib/notificationTiming';

type NotificationContextType = {
  isNotificationsEnabled: boolean;
  toggleNotifications: () => void;
  permissionStatus: NotificationPermission;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
const NOTIFIED_CLASSES_KEY = 'usas_notification_notified_classes';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { timetableData } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(() => {
    return localStorage.getItem('usas_notifications_enabled') === 'true';
  });
  const notifiedClasses = useRef(readDayScopedNotificationKeys(NOTIFIED_CLASSES_KEY, new Date()));
  const activeDayStamp = useRef('');

  useEffect(() => {
    if (!isNotificationsEnabled || permissionStatus !== 'granted') return;

    const checkClasses = () => {
      if (!timetableData?.timetable) return;

      const now = new Date();
      const dayStamp = getLocalDateStamp(now);
      if (activeDayStamp.current !== dayStamp) {
        activeDayStamp.current = dayStamp;
        notifiedClasses.current = pruneDayScopedNotificationKeys(notifiedClasses.current, now);
        persistDayScopedNotificationKeys(NOTIFIED_CLASSES_KEY, notifiedClasses.current);
      }

      // Check every class
      const courses = timetableData.timetable;
      
      const daysStrMap: Record<number, string> = {
        1: 'ISNIN', 2: 'SELASA', 3: 'RABU', 4: 'KHAMIS', 5: 'JUMAAT', 6: 'SABTU', 0: 'AHAD'
      };
      const currentDay = daysStrMap[now.getDay()];

      courses.forEach(course => {
        if (extractDayName(course.day) !== currentDay) return;
        
        // Parse class start time
        const startStr = course.start_time;
        if (!startStr) return;

        // Parse "10:00 AM" to Date object today
        const match = startStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return;

        let [_, h, m, period] = match;
        let hours = parseInt(h);
        const mins = parseInt(m);
        
        if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;

        const classTime = new Date(now);
        classTime.setHours(hours, mins, 0, 0);

        // Calculate diff in minutes
        const diffMs = classTime.getTime() - now.getTime();

        // Notify once while the class is within its 15-minute reminder window.
        const classKey = buildDayScopedNotificationKey(now, course.course_id, course.day, startStr);
        
        if (isWithinClassNotificationWindow(diffMs) && !notifiedClasses.current.has(classKey)) {
          notifiedClasses.current.add(classKey);
          persistDayScopedNotificationKeys(NOTIFIED_CLASSES_KEY, notifiedClasses.current);
          playClassChime();
          // Fire notification
          new Notification('Class Starting Soon!', {
            body: `${course.course_name} starts in ${Math.ceil(diffMs / 60000)} minutes at ${course.location}`,
            icon: '/usas-logo-dark.png'
          });
          
        }
      });
    };

    // Check immediately, then poll often enough to catch the reminder window.
    checkClasses();
    const interval = setInterval(checkClasses, 30000);

    return () => clearInterval(interval);
  }, [isNotificationsEnabled, permissionStatus, timetableData]);

  const toggleNotifications = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
      return;
    }

    if (isNotificationsEnabled) {
      setIsNotificationsEnabled(false);
      localStorage.setItem('usas_notifications_enabled', 'false');
    } else {
      playClassChime();
      if (Notification.permission === 'granted') {
        setIsNotificationsEnabled(true);
        localStorage.setItem('usas_notifications_enabled', 'true');
        setPermissionStatus('granted');
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        if (permission === 'granted') {
          setIsNotificationsEnabled(true);
          localStorage.setItem('usas_notifications_enabled', 'true');
        }
      }
    }
  };

  return (
    <NotificationContext.Provider value={{ isNotificationsEnabled, toggleNotifications, permissionStatus }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
