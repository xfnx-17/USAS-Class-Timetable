import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { fetchAttendanceHistoryAPI, resolveGroupIdForCourseAPI } from '@/services/usas/Api';
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

    const loadHistory = async () => {
      // Prefer the real numeric group_id. If it's missing (e.g. a stale cached
      // timetable), resolve it from senarai_kursus before calling the report.
      let effectiveGroup = course?.group_id || '';
      if (!effectiveGroup && course) {
        effectiveGroup = (await resolveGroupIdForCourseAPI(
          session,
          course.course_id || course.kod_kursus || '',
        )) || '';
      }

      // Never fall back to another group: only query the report when a real
      // group_id was resolved, otherwise show the empty state.
      if (!effectiveGroup) {
        if (!active) return;
        setHistory([]);
        setLoading(false);
        return;
      }

      const res = await fetchAttendanceHistoryAPI(session, effectiveGroup);
      if (!active) return;
      setHistory(res);
      setLoading(false);
    };

    if (isOpen && course) {
      setLoading(true);
      void loadHistory();
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [isOpen, course, session, refreshToken]);

  if (!shouldRender || !course) return null;

  const normalizeGroup = (groupStr?: string) => {
    if (!groupStr) return '';
    return groupStr.replace(/^GRP/i, 'G');
  };

  const groupDisplay = normalizeGroup(course.group || course.kumpulan) || '—';

  return (
    <div data-lenis-prevent role="dialog" aria-modal="true" aria-label="Laporan Kehadiran" className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200 touch-pan-y overscroll-contain ${animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
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
              <h3 className={`text-sm sm:text-base font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
                <span className="sm:hidden">Laporan Kehadiran</span>
                <span className="hidden sm:inline">Laporan Kehadiran Mingguan (Week 1 - 14)</span>
              </h3>
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
                    <div className={`p-3 mb-2 rounded-lg border grid grid-cols-3 gap-2 text-center text-xs font-semibold ${
                      isLight ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-amber-400/10 border-amber-400/20 text-amber-300'
                    }`}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wide opacity-60">Sesi Berlalu</span>
                        <span className="font-bold tabular-nums">{heldCount}</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wide opacity-60">Hadir</span>
                        <span className="font-bold tabular-nums">{presentCount} / {heldCount}</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wide opacity-60">Peratus</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tabular-nums ${
                          rate === null
                            ? (isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-white/60')
                            : rate >= 80
                              ? (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300')
                              : (isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-300')
                        }`}>
                          {rate === null ? '—' : `${rate}%`}
                        </span>
                      </div>
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
                const note = (h.catatan || '').trim();
                const hasNote = note.length > 0 && note !== '-' && !/^tiada maklumat$/i.test(note);
                return (
                  <div key={i} className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${isLight
                      ? 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                      : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                    }`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>Minggu {h.minggu || '—'}</span>
                        <span className={`font-medium truncate ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{h.tarikh || '-'}</span>
                      </div>
                      {hasNote && (
                        <div className={`text-[10px] mt-0.5 truncate ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{note}</div>
                      )}
                    </div>

                    {isPresent ? (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 shrink-0 ${isLight
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        }`}>
                        <CheckCircle2 className="w-3 h-3" /> Hadir
                      </span>
                    ) : isUpcoming ? (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 shrink-0 ${isLight
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : 'bg-white/[0.06] text-white/40 border-white/10'
                        }`}>
                        <Clock className="w-3 h-3" /> Belum
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 shrink-0 ${isLight
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-red-500/15 text-red-400 border border-red-500/20'
                        }`}>
                        <XCircle className="w-3 h-3" /> Tidak Hadir
                      </span>
                    )}
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





