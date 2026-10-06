import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { 
  X, Download, Users, Moon,
  GraduationCap, LogOut, Calculator, Calendar, ScanLine, Bell, FileText
} from 'lucide-react';
import { useNotification } from '@/app/providers/NotificationProvider';
import { exportTimetableICS } from '@/features/export/lib/icsGenerator';

interface ToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPdf: () => void;
  onOpenExam: () => void;
  onOpenCompare: () => void;
  onOpenAttendanceScan: () => void;
  onOpenGpa: () => void;
  onOpenPrayerTimes: () => void;
  onOpenLogout: () => void;
}

export default function ToolsDrawer({ 
  isOpen, 
  onClose, 
  onOpenPdf, 
  onOpenExam, 
  onOpenCompare,
  onOpenAttendanceScan,
  onOpenGpa,
  onOpenPrayerTimes,
  onOpenLogout,
}: ToolsDrawerProps) {
  const { session, timetableData } = useAuth();
  const { isNotificationsEnabled, toggleNotifications } = useNotification();
  const { lang, t } = useLanguage();
  const { theme } = useTheme();

  const allCourses = timetableData?.timetable || [];
  const isLight = theme === 'light';

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setAnimate(false);
      let raf1 = 0;
      let raf2 = 0;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setAnimate(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setShouldRender(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-250 ${animate ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div role="dialog" aria-modal="true" aria-label="Menu Alat" className={`fixed top-0 right-0 h-full w-[min(20rem,85vw)] sm:w-80 border-l z-50 flex flex-col shadow-2xl transition-all duration-250 ease-in-out ${animate ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0A1428] border-white/[0.06] text-white/80'
      }`}>
        
        {/* Header */}
        <div className={`h-11 flex items-center justify-between px-4 border-b ${
          isLight ? 'border-slate-200' : 'border-white/[0.06]'
        }`}>
          <div className={`text-[9px] font-semibold uppercase tracking-[0.22em] ${
            isLight ? 'text-slate-400' : 'text-white/25'
          }`}>
            {t('toolsAndExport')}
          </div>
          <button 
            onClick={onClose} 
            className={`p-1 rounded-md transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-white/30 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student Info */}
        {session && (
          <div className={`px-4 py-3 border-b ${isLight ? 'bg-slate-50/50 border-slate-200' : 'border-white/[0.06]'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <img src="/usas-logo.png" alt="USAS" className="w-7 h-7 object-contain" />
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white/80'}`}>{timetableData?.studentName || session.user_id}</p>
                <p className={`text-[10px] flex items-center gap-1 min-w-0 ${isLight ? 'text-slate-500' : 'text-white/30'}`}>
                  <GraduationCap className="w-3 h-3" />
                  {session.user_id} - {allCourses.length} {t('sessions').toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action List */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto p-3 space-y-0.5 usas-scrollbar touch-pan-y overscroll-contain">
          
          {/* Export Section */}
          <p className={`text-[9px] font-semibold uppercase tracking-widest px-2 pt-2 pb-1 ${
            isLight ? 'text-slate-400' : 'text-white/20'
          }`}>{t('exportSection')}</p>
          
          <button
            onClick={onOpenPdf}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-slate-50 text-slate-700 hover:text-slate-900' : 'hover:bg-white/[0.04] text-white/70 hover:text-white'
            }`}
          >
            <Download className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400/60'}`} />
            <div>
              <div className="text-xs font-semibold">{t('exportPdfTitle')}</div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/25'}`}>{t('exportPdfDesc')}</div>
            </div>
          </button>

          <button
            onClick={() => {
              exportTimetableICS(allCourses, timetableData?.studentName || session?.user_id);
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-slate-50 text-slate-700 hover:text-slate-900' : 'hover:bg-white/[0.04] text-white/70 hover:text-white'
            }`}
          >
            <Calendar className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-sky-400/70'}`} />
            <div>
              <div className="text-xs font-semibold">{t('syncCalTitle')}</div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/25'}`}>{t('syncCalDesc')}</div>
            </div>
          </button>

          {/* Share Section */}
          <p className={`text-[9px] font-semibold uppercase tracking-widest px-2 pt-3 pb-1 ${
            isLight ? 'text-slate-400' : 'text-white/20'
          }`}>{t('shareSection')}</p>

          <button
            onClick={onOpenCompare}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-slate-50 text-slate-700 hover:text-slate-900' : 'hover:bg-white/[0.04] text-white/70 hover:text-white'
            }`}
          >
            <Users className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-blue-400/70'}`} />
            <div>
              <div className="text-xs font-semibold">{t('compareTitle')}</div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/25'}`}>
                {t('compareDesc')}
              </div>
            </div>
          </button>

          <button
            onClick={onOpenAttendanceScan}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-slate-50 text-slate-700 hover:text-slate-900' : 'hover:bg-white/[0.04] text-white/70 hover:text-white'
            }`}
          >
            <ScanLine className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400/70'}`} />
            <div>
              <div className="text-xs font-semibold">{t('scanAttendanceTitle')}</div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/25'}`}>
                {t('scanAttendanceDesc')}
              </div>
            </div>
          </button>

          {/* Academic Section */}
          <p className={`text-[9px] font-semibold uppercase tracking-widest px-2 pt-3 pb-1 ${
            isLight ? 'text-slate-400' : 'text-white/20'
          }`}>{t('academicSection')}</p>

          <button
            onClick={onOpenExam}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-slate-50 text-slate-700 hover:text-slate-900' : 'hover:bg-white/[0.04] text-white/70 hover:text-white'
            }`}
          >
            <FileText className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400/60'}`} />
            <div>
              <div className="text-xs font-semibold">{t('examTitle')}</div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/25'}`}>{t('examDesc')}</div>
            </div>
          </button>

          <button
            onClick={onOpenGpa}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-slate-50 text-slate-700 hover:text-slate-900' : 'hover:bg-white/[0.04] text-white/70 hover:text-white'
            }`}
          >
            <Calculator className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-blue-400/70'}`} />
            <div>
              <div className="text-xs font-semibold">{t('gpaBtn')}</div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/25'}`}>
                {lang === 'ms' ? 'Kira anggaran GPA & sasaran keputusan semester' : lang === 'zh' ? '估算学期 GPA 与目标成绩' : lang === 'ta' ? 'GPA மற்றும் கல்வி இலக்குகளைக் கணக்கிடுங்கள்' : 'Estimate GPA & academic semester target goals'}
              </div>
            </div>
          </button>

          <button
            onClick={onOpenPrayerTimes}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-slate-50 text-slate-700 hover:text-slate-900' : 'hover:bg-white/[0.04] text-white/70 hover:text-white'
            }`}
          >
            <Moon className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400/60'}`} />
            <div>
              <div className="text-xs font-semibold">{t('prayerTitle')}</div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/25'}`}>
                {t('prayerSubtitle')}
              </div>
            </div>
          </button>

          {/* Account Section */}
          <p className={`text-[9px] font-semibold uppercase tracking-widest px-2 pt-3 pb-1 ${
            isLight ? 'text-slate-400' : 'text-white/20'
          }`}>{t('accountSection')}</p>

          <button
            onClick={toggleNotifications}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-white/[0.04] text-white/70'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className={`w-4 h-4 ${isLight ? 'text-indigo-500' : 'text-indigo-400/80'}`} />
              <div>
                <div className="text-xs font-semibold">{t('classAlertsTitle')}</div>
                <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/25'}`}>
                  {t('classAlertsDesc')}
                </div>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <div className={`w-8 h-4 rounded-full flex items-center transition-colors px-0.5 ${
              isNotificationsEnabled 
                ? (isLight ? 'bg-indigo-500' : 'bg-indigo-500/80') 
                : (isLight ? 'bg-slate-200' : 'bg-white/10')
            }`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                isNotificationsEnabled ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </div>
          </button>

          <button
            onClick={onOpenLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-red-50 text-slate-700 hover:text-red-600' : 'hover:bg-red-950 bg-transparent text-white/70 hover:text-red-400'
            }`}
          >
            <LogOut className="w-4 h-4 text-red-500/80 flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold">{lang === 'ms' ? 'Log Keluar' : lang === 'zh' ? '退出登录' : lang === 'ta' ? 'வெளியேறு' : 'Log Out'}</div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/25'}`}>
                {lang === 'ms' ? 'Tamatkan sesi aktif portal' : lang === 'zh' ? '结束当前在线会话' : lang === 'ta' ? 'செயலில் உள்ள அமர்வை முடிக்கவும்' : 'End your active portal session'}
              </div>
            </div>
          </button>

        </div>
      </div>
    </>
  );
}
