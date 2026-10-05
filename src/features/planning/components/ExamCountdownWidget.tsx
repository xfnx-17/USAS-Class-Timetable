import { useMemo } from 'react';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Clock } from 'lucide-react';
import type { TimetableItem } from '@/shared/types/usas';

type ExamCountdownWidgetProps = {
  courses: TimetableItem[];
  isDemo?: boolean;
  onOpenExam: () => void;
};

export default function ExamCountdownWidget({ courses, isDemo = false, onOpenExam }: ExamCountdownWidgetProps) {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const isLight = theme === 'light';

  // Find the closest upcoming exam only if real exam dates exist or explicitly in demo mode
  const closestExam = useMemo(() => {
    if (!courses || courses.length === 0) return null;

    // Check if courses have official exam dates
    const coursesWithOfficialExams = courses.filter(c => Boolean((c as unknown as { exam_date?: string }).exam_date));

    if (coursesWithOfficialExams.length > 0) {
      const nowMs = Date.now();
      let nearest: { name: string; id: string; countdownDays: number } | null = null;
      let minDiff = Infinity;

      coursesWithOfficialExams.forEach(c => {
        const dateStr = (c as unknown as { exam_date: string }).exam_date;
        const examDate = new Date(dateStr);
        const diffTime = examDate.getTime() - nowMs;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < minDiff) {
          minDiff = diffDays;
          nearest = {
            id: c.course_id || c.kod_kursus,
            name: c.course_name || c.kursus,
            countdownDays: diffDays,
          };
        }
      });
      return nearest;
    }

    // In demo mode only, show a sample preview
    if (isDemo) {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 14);
      const diffTime = Math.abs(baseDate.getTime() - Date.now());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const firstCourse = courses[0];

      return {
        name: `${firstCourse.course_name || firstCourse.kursus} [Demo]`,
        id: firstCourse.course_id || firstCourse.kod_kursus,
        countdownDays: diffDays,
      };
    }

    // For real student accounts without published exam schedules, do not synthesize fake exams
    return null;
  }, [courses, isDemo]);

  if (!closestExam || closestExam.countdownDays > 30) return null;

  return (
    <div 
      onClick={onOpenExam}
      className={`mx-2.5 sm:mx-6 mt-3 sm:mt-4 mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] ${
        isLight 
          ? 'bg-amber-500/[0.04] border-amber-500/20 hover:bg-amber-500/[0.08]' 
          : 'bg-amber-400/[0.02] border-amber-500/15 hover:bg-amber-400/[0.05]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-left min-w-0">
          <h4 className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
            isLight ? 'text-amber-700' : 'text-amber-500'
          }`}>
            {lang === 'ms' ? 'Peperiksaan Menghampiri' : 'Upcoming Exam'}
          </h4>
          <p className={`text-xs sm:text-sm font-semibold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            <span className="font-extrabold mr-1.5">{closestExam.id}</span>
            {closestExam.name}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-bold flex items-center gap-1.5 shadow-sm ${
          isLight 
            ? 'bg-white border-amber-200 text-amber-600' 
            : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          {lang === 'ms' ? `${closestExam.countdownDays} Hari Lagi` : `${closestExam.countdownDays} Days Left`}
        </div>
      </div>
    </div>
  );
}
