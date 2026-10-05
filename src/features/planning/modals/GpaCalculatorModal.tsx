import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { X, Calculator, Award, ChevronDown, ExternalLink, BadgeInfo } from 'lucide-react';
import type { TimetableItem } from '@/shared/types/usas';

type GpaCalculatorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  courses?: TimetableItem[];
};

type CourseTarget = {
  credits: number;
  grade: string;
};

type GpaCustomDropdownProps<T> = {
  value: T;
  options: { label: string; labelShort?: string; value: T }[];
  onChange: (val: T) => void;
  isLight: boolean;
  minWidth: string;
  textColorClass?: string;
};

function GpaCustomDropdown<T extends string | number>({
  value,
  options,
  onChange,
  isLight,
  minWidth,
  textColorClass = ''
}: GpaCustomDropdownProps<T>) {
  const [open, setOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    if (!open) return;
    const handleGlobalClick = () => setOpen(false);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [open]);

  const selectedOption = options.find(opt => opt.value === value);
  const labelText = selectedOption 
    ? (selectedOption.labelShort || selectedOption.label) 
    : String(value);

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all shadow-sm justify-between max-w-full ${minWidth} ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-slate-100/50'
            : 'bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08]'
        } ${textColorClass}`}
      >
        <span className="truncate">{labelText}</span>
        <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          data-lenis-prevent
          className={`absolute top-full right-0 mt-1 z-50 rounded-lg border shadow-xl max-h-48 overflow-y-auto usas-scrollbar focus:outline-none transition-all py-1 min-w-[100px] sm:min-w-[120px] ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#0E1B35] border-white/10 text-white'
          }`}
        >
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors ${
                opt.value === value
                  ? (isLight ? 'bg-amber-100 font-bold text-amber-900' : 'bg-amber-400/20 font-bold text-amber-300')
                  : (isLight ? 'hover:bg-slate-100' : 'hover:bg-white/[0.05]')
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GpaCalculatorModal({ isOpen, onClose, courses = [] }: GpaCalculatorModalProps) {
  const { lang, t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const gradePoints = {
    'A': 4.0, 'A-': 3.67, 'B+': 3.33, 'B': 3.0,
    'B-': 2.67, 'C+': 2.33, 'C': 2.0, 'C-': 1.67,
    'D+': 1.33, 'D': 1.0, 'F': 0.0
  };

  // Group courses by ID/name to avoid duplicate slots having separate inputs
  const uniqueCourses = courses.reduce<TimetableItem[]>((acc, item) => {
    const id = item.course_id || item.kod_kursus || item.course_name;
    if (id && !acc.some(x => (x.course_id || x.kod_kursus || x.course_name) === id)) {
      acc.push(item);
    }
    return acc;
  }, []);

  // State mapping course id to { credits, grade }
  const [courseTargets, setCourseTargets] = useState<Record<string, CourseTarget>>({});

  // Reset/Initialize state when courses list changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, CourseTarget> = {};
      uniqueCourses.forEach((c) => {
        const id = c.course_id || c.kod_kursus || c.course_name || 'course';
        initial[id] = { credits: 3, grade: 'A' };
      });
      setCourseTargets(initial);
    }
  }, [isOpen, courses]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleTargetChange = (courseId: string, field: keyof CourseTarget, value: string | number) => {
    setCourseTargets(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        [field]: value
      }
    }));
  };

  // Calculate GPA
  let totalPoints = 0;
  let totalCredits = 0;

  Object.values(courseTargets).forEach((item) => {
    const cred = Number(item.credits) || 0;
    const pts = gradePoints[item.grade as keyof typeof gradePoints] || 4.0;
    totalPoints += pts * cred;
    totalCredits += cred;
  });

  const estGpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '4.00';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200 ${
      animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
    }`}>
      
      <div className={`rounded-xl w-full max-w-[92vw] sm:max-w-2xl border flex flex-col min-h-0 overflow-hidden relative transition-all duration-200 transform max-h-[85dvh] sm:max-h-[90dvh] ${
        animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      } ${
        isLight 
          ? 'bg-white border-slate-200 shadow-xl text-slate-800' 
          : 'bg-[#0A1428]/95 border-white/10 text-white shadow-2xl'
      }`}>

        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-start sm:items-center justify-between gap-3 flex-shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.06] bg-[#0A1428]/95'
        }`}>
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
            }`}>
              <Calculator className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <h3 className={`text-sm sm:text-base font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{t('gpaBtn')}</h3>
              <p className={`text-[11px] sm:text-xs font-semibold truncate ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                {lang === 'ms' ? 'Kira anggaran GPA semester berdasarkan sasaran gred subjek anda' : 'Estimate your semester GPA based on target subject grades'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
              isLight ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600' : 'text-white/30 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div data-lenis-prevent className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto usas-scrollbar touch-pan-y overscroll-contain">
          
          {/* GPA Result Display Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
            isLight 
              ? 'bg-amber-500/[0.04] border-amber-500/20' 
              : 'bg-amber-400/[0.02] border-amber-500/15'
          }`}>
            <div className="text-left">
              <div className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('estGpa')}</div>
              <div className="text-2.5xl font-black text-amber-500 mt-0.5">{estGpa} <span className="text-xs font-semibold opacity-50">/ 4.00</span></div>
            </div>

            <div className="text-right">
              {parseFloat(estGpa) >= 3.75 ? (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border inline-flex items-center gap-1.5 ${
                  isLight 
                    ? 'bg-amber-100 border-amber-300 text-amber-850' 
                    : 'bg-amber-400/10 border-amber-400/30 text-amber-300'
                }`}>
                  <Award className="w-3.5 h-3.5 text-amber-500" /> Target Anugerah Dekan
                </span>
              ) : parseFloat(estGpa) >= 3.0 ? (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center ${
                  isLight 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                }`}>
                  {lang === 'ms' ? 'Kepujian Baik' : 'Good Standing'}
                </span>
              ) : (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center ${
                  isLight 
                    ? 'bg-slate-100 border-slate-200 text-slate-700' 
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}>
                  {lang === 'ms' ? 'Status Memuaskan' : 'Satisfactory Status'}
                </span>
              )}
              <div className={`text-[10px] font-semibold mt-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {lang === 'ms' ? 'Jumlah Kredit:' : 'Total Credits:'} {totalCredits}
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-2 text-[10px] px-1 ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
            <BadgeInfo className={`w-3.5 h-3.5 flex-shrink-0 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
            <span className="font-medium">
              {lang === 'ms' ? 'Rujukan gred:' : 'Grade source:'}
            </span>
            <a
              href="https://www.instagram.com/p/DAcy0xzSUqG/"
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                isLight ? 'text-sky-700 hover:text-sky-900' : 'text-sky-300 hover:text-sky-200'
              }`}
            >
              <span>MPMUSAS</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>

          {/* Subject Grade Target Table */}
          <div className="space-y-2 pr-1">
            {uniqueCourses.map((c, i) => {
              const id = c.course_id || c.kod_kursus || c.course_name || `course-${i}`;
              const target = courseTargets[id] || { credits: 3, grade: 'A' };
              return (
                <div key={i} className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                  isLight 
                    ? 'bg-slate-50/50 border-slate-200 hover:bg-slate-50' 
                    : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                }`}>
                  <div className="flex-1 min-w-0 text-left">
                    <div className={`font-extrabold text-[10px] tracking-wide ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{id}</div>
                    <div className="font-bold leading-snug mt-0.5 truncate">{c.course_name || c.kursus}</div>
                  </div>

                  {/* Custom Styled Select wrappers using Chevron and absolute overlays */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
                    {/* Credit Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-medium break-words ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {lang === 'ms' ? 'Kredit:' : 'Credits:'}
                      </span>
                      <GpaCustomDropdown
                        value={target.credits}
                        options={[
                          { label: '1', value: 1 },
                          { label: '2', value: 2 },
                          { label: '3', value: 3 },
                          { label: '4', value: 4 }
                        ]}
                        onChange={(val) => handleTargetChange(id, 'credits', val)}
                        isLight={isLight}
                        minWidth="min-w-[54px] sm:min-w-[64px]"
                        textColorClass={isLight ? 'text-slate-800' : 'text-white/90'}
                      />
                    </div>

                    {/* Target Grade Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-medium break-words ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {lang === 'ms' ? 'Sasaran:' : 'Target:'}
                      </span>
                      <GpaCustomDropdown
                        value={target.grade}
                        options={Object.keys(gradePoints).map(g => ({
                          label: g,
                          value: g
                        }))}
                        onChange={(val) => handleTargetChange(id, 'grade', val)}
                        isLight={isLight}
                        minWidth="min-w-[48px] sm:min-w-[56px]"
                        textColorClass={isLight ? 'text-amber-600 font-black' : 'text-amber-400 font-black'}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}




