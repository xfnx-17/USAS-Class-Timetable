import { useState, useEffect } from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useModalA11y } from '@/shared/lib/useModalA11y';
import { useAuth } from '@/app/providers/AuthProvider';
import { X, FileText, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';
import type { TimetableItem } from '@/shared/types/usas';

type ExamScheduleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  courses?: TimetableItem[];
  isDemo?: boolean;
};

export default function ExamScheduleModal({ isOpen, onClose, courses = [], isDemo: propIsDemo }: ExamScheduleModalProps) {
  const modalRef = useModalA11y(isOpen, onClose);
  const { theme } = useTheme();
  const { session } = useAuth();
  const isLight = theme === 'light';
  const isDemo = propIsDemo ?? session?.isDemo ?? false;

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

  if (!shouldRender) return null;

  // Real vs Demo Logic.
  // The USAS mobile student backend does NOT expose a per-course final exam
  // schedule during the early semester, so only entries the backend actually
  // returns (e.g. an `exam_date` field) are shown; fake dates, halls, or seat
  // numbers are never generated for a real student account.
  const examFields = (course: TimetableItem) => course as unknown as {
    exam_date?: string;
    exam_time?: string;
    exam_venue?: string;
    exam_seat?: string | number;
  };

  const countdownFrom = (date: Date) => Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const realExamList = courses
    .filter(c => Boolean(examFields(c).exam_date))
    .map(c => {
      const fields = examFields(c);
      const examDate = new Date(String(fields.exam_date));
      const validDate = !Number.isNaN(examDate.getTime());
      const seatRaw = fields.exam_seat;
      const seatText = seatRaw === undefined || seatRaw === null || String(seatRaw).trim() === ''
        ? ''
        : `Meja #${String(seatRaw).replace(/^#/, '').replace(/^meja\s*/i, '')}`;

      return {
        id: c.course_id || c.kod_kursus || '',
        name: c.course_name || c.kursus || '',
        date: validDate
          ? examDate.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
          : String(fields.exam_date),
        time: fields.exam_time || '',
        venue: fields.exam_venue || '',
        seatNo: seatText,
        countdownDays: validDate ? countdownFrom(examDate) : 0,
        isDemoSample: false,
      };
    })
    .sort((a, b) => a.countdownDays - b.countdownDays);

  const demoExamList = isDemo ? courses.map((c, i) => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 14);
    const examDate = new Date(baseDate);
    examDate.setDate(baseDate.getDate() + (i * 2));
    const dayStr = examDate.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const diffTime = Math.abs(examDate.getTime() - Date.now());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      id: c.course_id || c.kod_kursus,
      name: c.course_name || c.kursus,
      date: dayStr,
      time: i % 2 === 0 ? '09:00 AM - 12:00 PM' : '02:30 PM - 05:30 PM',
      venue: 'Dewan Besar USAS',
      seatNo: `Meja #${(i + 1) * 12 + 5}`,
      countdownDays: diffDays,
      isDemoSample: true
    };
  }) : [];

  const examList = isDemo ? demoExamList : realExamList;
  const hasExams = examList.length > 0;

  return (
    <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Jadual Peperiksaan" className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200 ${
      animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
    }`}>
      
      <div className={`rounded-xl w-full max-w-[92vw] sm:max-w-3xl border pt-4 px-4 sm:px-6 pb-6 relative transition-all duration-200 transform flex flex-col gap-5 min-h-0 max-h-[85dvh] sm:max-h-[90dvh] ${
        animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      } ${
        isLight 
          ? 'bg-white border-slate-200 shadow-xl text-slate-800' 
          : 'bg-[#0A1428]/95 border-white/10 text-white shadow-2xl'
      }`}>
        {/* Modal Header */}
        <div className="flex items-start sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm sm:text-base font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  Jadual Peperiksaan Akhir USAS
                </h3>
                {isDemo && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Mod Demo
                  </span>
                )}
              </div>
              <p className={`text-[11px] sm:text-xs font-semibold truncate ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                Semakan Tarikh, Dewan Peperiksaan & Nombor Meja
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-white/30 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div data-lenis-prevent className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1 usas-scrollbar touch-pan-y overscroll-contain">
          {!hasExams ? (
            <div className={`py-10 px-5 text-center rounded-2xl border flex flex-col items-center justify-center gap-3 ${
              isLight ? 'bg-slate-50/70 border-slate-200 text-slate-600' : 'bg-white/[0.02] border-white/[0.06] text-white/50'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
              }`}>
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h4 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  Jadual Peperiksaan Belum Dikeluarkan
                </h4>
                <p className="text-xs leading-relaxed opacity-80">
                  Pihak Unit Peperiksaan & Pengijazahan USAS belum menerbitkan jadual waktu, dewan, dan nombor meja peperiksaan akhir bagi semester ini.
                </p>
                <p className="text-[11px] leading-relaxed opacity-60">
                  Jadual rasmi kebiasaannya akan diumumkan dan diselaraskan pada penghujung semester (Minggu 12–14). Sila rujuk Kalendar Akademik untuk tarikh minggu peperiksaan rasmi.
                </p>
              </div>
            </div>
          ) : (
            examList.map((e, idx) => (
              <div key={idx} className={`p-3 sm:p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 shadow-sm transition-all ${
                isLight 
                  ? 'bg-slate-50/70 border-slate-200 hover:bg-slate-50' 
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
              }`}>
                {/* Course Details */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {e.id}
                    </span>
                    {e.seatNo && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-white/70'
                      }`}>
                        {e.seatNo}
                      </span>
                    )}
                  </div>
                  <h4 className={`text-xs sm:text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    {e.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs pt-1">
                    <span className="flex items-center gap-1.5 text-sky-500 font-semibold">
                      <MapPin className="w-3.5 h-3.5" /> {e.venue}
                    </span>
                  </div>
                </div>

                {/* Date & Time Block */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-1.5 border-t md:border-t-0 pt-2 md:pt-0 border-white/5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    isLight 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {e.countdownDays} Hari Lagi
                  </span>
                  <div className="flex flex-col text-right">
                    <span className={`text-[11px] font-semibold flex items-center md:justify-end gap-1 ${
                      isLight ? 'text-slate-700' : 'text-white/80'
                    }`}>
                      <Calendar className="w-3 h-3 text-amber-500" /> {e.date}
                    </span>
                    <span className={`text-[10px] font-medium flex items-center md:justify-end gap-1 ${
                      isLight ? 'text-slate-500' : 'text-white/40'
                    }`}>
                      <Clock className="w-3 h-3 text-slate-400" /> {e.time}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
