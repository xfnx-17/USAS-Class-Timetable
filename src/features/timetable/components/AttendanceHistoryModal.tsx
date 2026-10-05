import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { fetchAttendanceHistoryAPI } from '@/services/usas/Api';
import { parseDisplayDate } from '@/shared/lib/dayFormat';
import type { AttendanceHistoryItem, TimetableItem } from '@/shared/types/usas';
import { X, CalendarCheck, CheckCircle2, XCircle, RotateCw, Clock } from 'lucide-react';

type AttendanceHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  course: TimetableItem | null;
  refreshToken?: number;
};

export default function AttendanceHistoryModal({ isOpen, onClose, course, refreshToken = 0 }: AttendanceHistoryModalProps) {
  const { session } = useAuth();
  const { theme } = useTheme();
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isLight = theme === 'light';

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
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
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    let active = true;
    if (isOpen && course) {
      setLoading(true);
      // Pass the real group_id from senarai_kursus or fallback to course.group
      const effectiveGroup = course.group_id || course.group || 'GRP01';
      fetchAttendanceHistoryAPI(session, effectiveGroup).then(res => {
        if (!active) return;
        setHistory(res);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [isOpen, course, session, refreshToken]);

  if (!shouldRender || !course) return null;

  const normalizeGroup = (groupStr?: string) => {
    if (!groupStr) return 'G1';
    return groupStr.replace(/^GRP/i, 'G');
  };

  const groupDisplay = normalizeGroup(course.group || course.kumpulan || 'A');

  return (
    <div data-lenis-prevent className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200 touch-pan-y overscroll-contain ${animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
      }`}>

      <div className={`rounded-xl w-full max-w-[92vw] sm:max-w-2xl border pt-4 px-4 sm:px-6 pb-6 relative transition-all duration-200 transform flex flex-col gap-5 min-h-0 max-h-[85dvh] sm:max-h-[90dvh] ${animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${isLight
          ? 'bg-white border-slate-200 shadow-xl text-slate-800'
          : 'bg-[#0A1428]/95 border-white/10 text-white shadow-2xl'
        }`}>
        {/* Left-Aligned Icon Modal Header */}
        <div className="flex items-start sm:items-center justify-between gap-3 pt-0 flex-shrink-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border ${isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
              }`}>
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <h3 className={`text-sm sm:text-base font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>Laporan Kehadiran Mingguan (Week 1 - 14)</h3>
              <p className={`text-[11px] sm:text-xs font-semibold truncate ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                {course.course_id || course.kod_kursus} ({groupDisplay}): {course.course_name || course.kursus}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-white/30 hover:text-white hover:bg-white/[0.06]'
              }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Attendance List (uses themed custom-scrollbar) */}
        {loading ? (
          <div className={`py-12 text-center text-xs space-y-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <RotateCw className={`w-6 h-6 animate-spin mx-auto ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <div>Memuatkan rekod kehadiran USAS...</div>
          </div>
        ) : (
          <div data-lenis-prevent className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1 usas-scrollbar touch-pan-y overscroll-contain">
            {history.length === 0 ? (
              <div className={`py-8 px-4 text-center text-xs rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/[0.02] border-white/[0.06] text-white/40'}`}>
                <p className="font-semibold text-sm mb-1">{isLight ? 'Tiada Rekod Kehadiran Direkodkan' : 'Tiada Rekod Kehadiran'}</p>
                <p className="text-[11px] max-w-sm mx-auto opacity-75">
                  Belum ada sesi kehadiran direkodkan untuk kursus ini bagi semester semasa. Rekod mingguan akan dikemaskini secara automatik setelah sesi kuliah bermula.
                </p>
              </div>
            ) : (
              <>
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const heldRows = history.filter(h => {
                    const status = (h.status_hadir || '').trim();
                    const date = parseDisplayDate(h.tarikh);
                    return status.length > 0 || (date !== null && date.getTime() < today.getTime());
                  });
                  const presentCount = heldRows.filter(h => /hadir|present/i.test(h.status_hadir || '') && !/tidak/i.test(h.status_hadir || '')).length;
                  const heldCount = heldRows.length;
                  const rate = heldCount > 0 ? Math.round((presentCount / heldCount) * 100) : null;
                  return (
                    <div className={`p-2.5 px-3.5 mb-2 rounded-lg border text-xs flex items-center justify-between font-semibold ${
                      isLight ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-amber-400/10 border-amber-400/20 text-amber-300'
                    }`}>
                      <span>Sesi Berlalu: {heldCount}</span>
                      <span>Hadir: {presentCount} / {heldCount}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rate === null
                          ? (isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-white/60')
                          : rate >= 80
                            ? (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300')
                            : (isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-300')
                      }`}>
                        {rate === null ? '—' : `${rate}%`}
                      </span>
                    </div>
                  );
                })()}
              {history.map((h, i) => {
                const status = (h.status_hadir || '').trim();
                const date = parseDisplayDate(h.tarikh);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isPresent = /hadir|present/i.test(status) && !/tidak/i.test(status);
                const isUpcoming = !status && date !== null && date.getTime() >= today.getTime();
                return (
                  <div key={i} className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors ${isLight
                      ? 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                      : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                    }`}>
                    <div className="flex items-center gap-3 text-left min-w-0">
                      <span className={`font-bold w-20 shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{h.minggu || `Minggu ${i + 1}`}</span>
                      <span className={`font-medium truncate ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{h.tarikh || '-'}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-left sm:text-right min-w-0">
                      <span className={`truncate max-w-[150px] sm:max-w-[180px] ${isLight ? 'text-slate-500' : 'text-white/30'}`}>{h.catatan || 'Scan QR App'}</span>
                      {isPresent ? (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 self-start sm:self-auto ${isLight
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          }`}>
                          <CheckCircle2 className="w-3 h-3" /> Hadir
                        </span>
                      ) : isUpcoming ? (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 self-start sm:self-auto ${isLight
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : 'bg-white/[0.06] text-white/40 border-white/10'
                          }`}>
                          <Clock className="w-3 h-3" /> Belum
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 self-start sm:self-auto ${isLight
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-red-500/15 text-red-400 border border-red-500/20'
                          }`}>
                          <XCircle className="w-3 h-3" /> Tidak Hadir
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          </div>
        )}

      </div>

    </div>
  );
}





