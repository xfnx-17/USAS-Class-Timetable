import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import LiveNextClassWidget from './LiveNextClassWidget';
import AttendanceMeter from './AttendanceMeter';
import LecturerModal from './LecturerModal';
import MatrixGridView from './MatrixGridView';
import AttendanceHistoryModal from './AttendanceHistoryModal';
import ExamCountdownWidget from '@/features/planning/components/ExamCountdownWidget';
import type { TimetableItem } from '@/shared/types/usas';
import {
  getActiveCourseHighlights,
  getCourseHighlightKey,
  getShortTimeRange,
} from '@/shared/lib/timetableTime';
import { extractDayName, formatDayDisplay, isSameDay } from '@/shared/lib/dayFormat';
import { restoreStringRecord } from '@/shared/lib/storage';
import { 
  Clock, MapPin, User, BookOpen, Search, 
  GraduationCap, StickyNote, Edit3,
  Grid, LayoutList, CalendarCheck,
  CalendarOff, RefreshCw, ChevronDown
} from 'lucide-react';

// Day color system
const getCardDayColor = (day: string | undefined, isLight: boolean) => {
  const darkColors = {
    'ISNIN':  { dot: 'bg-emerald-400', text: 'text-emerald-400 font-bold', accent: 'border-l-emerald-400', bg: 'bg-emerald-500/[0.18]', border: 'border-emerald-500/40', badge: 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold' },
    'SELASA': { dot: 'bg-blue-400',    text: 'text-blue-400 font-bold',    accent: 'border-l-blue-400',    bg: 'bg-blue-500/[0.18]',    border: 'border-blue-500/40',    badge: 'bg-blue-500/30 text-blue-300 border border-blue-500/50 font-bold' },
    'RABU':   { dot: 'bg-amber-400',   text: 'text-amber-400 font-bold',   accent: 'border-l-amber-400',   bg: 'bg-amber-500/[0.18]',   border: 'border-amber-500/40',   badge: 'bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold' },
    'KHAMIS': { dot: 'bg-purple-400',  text: 'text-purple-400 font-bold',  accent: 'border-l-purple-400',  bg: 'bg-purple-500/[0.18]',  border: 'border-purple-500/40',  badge: 'bg-purple-500/30 text-purple-300 border border-purple-500/50 font-bold' },
    'JUMAAT': { dot: 'bg-rose-400',    text: 'text-rose-400 font-bold',    accent: 'border-l-rose-400',    bg: 'bg-rose-500/[0.18]',    border: 'border-rose-500/40',    badge: 'bg-rose-500/30 text-rose-300 border border-rose-500/50 font-bold' },
    'SABTU':  { dot: 'bg-orange-400',  text: 'text-orange-400 font-bold',  accent: 'border-l-orange-400',  bg: 'bg-orange-500/[0.18]',  border: 'border-orange-500/40',  badge: 'bg-orange-500/30 text-orange-300 border border-orange-500/50 font-bold' },
    'AHAD':   { dot: 'bg-slate-400',   text: 'text-slate-400 font-bold',   accent: 'border-l-slate-400',   bg: 'bg-slate-500/[0.18]',   border: 'border-slate-500/40',   badge: 'bg-slate-500/30 text-slate-300 border border-slate-500/50 font-bold' },
  };
  const lightColors = {
    'ISNIN':  { dot: 'bg-emerald-500', text: 'text-emerald-800 font-bold', accent: 'border-l-emerald-500', bg: 'bg-emerald-100/70', border: 'border-emerald-300/80', badge: 'bg-emerald-600 text-white font-extrabold shadow-sm' },
    'SELASA': { dot: 'bg-blue-500',    text: 'text-blue-800 font-bold',    accent: 'border-l-blue-500',    bg: 'bg-blue-100/70',    border: 'border-blue-300/80',    badge: 'bg-blue-600 text-white font-extrabold shadow-sm' },
    'RABU':   { dot: 'bg-amber-500',   text: 'text-amber-800 font-bold',   accent: 'border-l-amber-500',   bg: 'bg-amber-100/80',   border: 'border-amber-300/85',   badge: 'bg-amber-600 text-white font-extrabold shadow-sm' },
    'KHAMIS': { dot: 'bg-purple-500',  text: 'text-purple-800 font-bold',  accent: 'border-l-purple-500',  bg: 'bg-purple-100/70',  border: 'border-purple-300/80',  badge: 'bg-purple-600 text-white font-extrabold shadow-sm' },
    'JUMAAT': { dot: 'bg-rose-500',    text: 'text-rose-800 font-bold',    accent: 'border-l-rose-500',    bg: 'bg-rose-100/70',    border: 'border-rose-300/80',    badge: 'bg-rose-600 text-white font-extrabold shadow-sm' },
    'SABTU':  { dot: 'bg-orange-500',  text: 'text-orange-800 font-bold',  accent: 'border-l-orange-500',  bg: 'bg-orange-100/70',  border: 'border-orange-300/80',  badge: 'bg-orange-600 text-white font-extrabold shadow-sm' },
    'AHAD':   { dot: 'bg-slate-500',   text: 'text-slate-800 font-bold',   accent: 'border-l-slate-500',   bg: 'bg-slate-200/70',   border: 'border-slate-300/80',   badge: 'bg-slate-600 text-white font-extrabold shadow-sm' },
  };
  const key = extractDayName(day) || 'ISNIN';
  return (isLight ? lightColors[key] : darkColors[key]) || (isLight ? lightColors['ISNIN'] : darkColors['ISNIN']);
};

type TimetableGridProps = {
  attendanceRefreshToken?: number;
  onOpenExam?: () => void;
};

export default function TimetableGrid({ attendanceRefreshToken = 0, onOpenExam }: TimetableGridProps) {
  const { timetableData, session, refreshTimetable, loading } = useAuth();
  const { lang, t } = useLanguage();
  const { theme } = useTheme();
  
  const isLight = theme === 'light';
  const [now, setNow] = useState(() => new Date());
  
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [expandAll, setExpandAll] = useState(false);
  // Modals
  const [selectedLecturer, setSelectedLecturer] = useState<string | null>(null);
  const [selectedAttendanceCourse, setSelectedAttendanceCourse] = useState<TimetableItem | null>(null);

  // Notes
  const [courseNotes, setCourseNotes] = useState(() => {
    try {
      return restoreStringRecord(localStorage.getItem('usas_course_notes') || '{}');
    } catch (e) {
      return {};
    }
  });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const normalizeGroup = (groupStr?: string) => {
    if (!groupStr) return 'G1';
    return groupStr.replace(/^GRP/i, 'G');
  };

  const timetableDays = timetableData?.days;
  const timetableItems = timetableData?.timetable;

  const daysList = useMemo(() => {
    if (timetableDays && timetableDays.length > 0) {
      return Array.from(new Set(timetableDays));
    }
    const defaultOrder = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'];
    const daysInCourses = new Set((timetableItems || []).map(c => extractDayName(c.day)).filter(Boolean));
    const baseDays = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'];
    const extraDays = defaultOrder.filter(d => daysInCourses.has(d) && !baseDays.includes(d));
    return [...baseDays, ...extraDays];
  }, [timetableDays, timetableItems]);

  const allCourses = useMemo(() => timetableItems || [], [timetableItems]);

  const handleSaveNote = (courseId) => {
    const updated = { ...courseNotes, [courseId]: noteInput };
    setCourseNotes(updated);
    try { localStorage.setItem('usas_course_notes', JSON.stringify(updated)); } catch (e) {}
    setEditingCourseId(null);
  };

  // Detect clashes
  const filteredCourses = useMemo(() => {
    return allCourses.filter(item => {
      const matchesDay = selectedDay === 'ALL' || isSameDay(item.day, selectedDay);
      const q = searchQuery.toLowerCase();
      const matchesQuery = !q || 
        item.course_name?.toLowerCase().includes(q) ||
        item.course_id?.toLowerCase().includes(q) ||
        item.lecturer?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q);
      return matchesDay && matchesQuery;
    });
  }, [allCourses, selectedDay, searchQuery]);

  const totalSubjects = new Set(allCourses.map(c => c.course_id || c.kod_kursus).filter(Boolean)).size;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const activeClassKeys = useMemo(() => getActiveCourseHighlights(allCourses, now), [allCourses, now]);

  // Empty state
  if (allCourses.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4 animate-fade-in">
          <CalendarOff className={`w-12 h-12 mx-auto ${isLight ? 'text-slate-300' : 'text-white/10'}`} />
          <div>
            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>
              {lang === 'ms' ? 'Tiada Jadual Waktu' : 'No Timetable Found'}
            </h3>
            <p className={`text-xs mt-1 max-w-xs mx-auto ${isLight ? 'text-slate-500' : 'text-white/25'}`}>
              {lang === 'ms' ? 'Akaun' : 'Account'} <span className={isLight ? 'text-slate-700' : 'text-white/40'}>{session?.user_id}</span> {lang === 'ms' ? 'belum mempunyai rekod jadual waktu.' : 'has no timetable records yet.'}
            </p>
          </div>
          <button
            onClick={refreshTimetable}
            disabled={loading}
            className={`px-4 py-2 rounded-md border text-xs font-medium flex items-center gap-2 mx-auto transition-colors ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.08] text-white/60'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {lang === 'ms' ? 'Muat Semula' : 'Refresh'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      
      {/* Exam Widget */}
      <ExamCountdownWidget courses={allCourses} isDemo={session?.isDemo} onOpenExam={onOpenExam || (() => {})} />

      {/* TOP FILTER BAR */}
      <div className={`flex-shrink-0 px-2.5 sm:px-6 pt-2 pb-2 sm:pt-0 sm:pb-2.5 border-b transition-colors duration-150 ${
        isLight ? 'bg-white border-slate-200' : 'border-white/[0.06]'
      }`}>
        <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          
          {/* Quick Stats */}
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <span className={`text-[10px] font-medium ${isLight ? 'text-slate-400' : 'text-white/25'}`}>
              {totalSubjects} {t('subjects').toLowerCase()}
            </span>
            <span className={isLight ? 'text-slate-200' : 'text-white/10'}>-</span>
            <span className={`text-[10px] font-medium ${isLight ? 'text-slate-400' : 'text-white/25'}`}>
              {allCourses.length} {t('sessions').toLowerCase()}
            </span>
          </div>

          {/* Day Filter Pills */}
          <div className="flex items-center gap-0.5 w-full sm:flex-1 overflow-x-auto no-scrollbar -mx-0.5 px-0.5">
            {daysList.map(day => {
              const color = getCardDayColor(day, isLight);
              const count = allCourses.filter(c => isSameDay(c.day, day)).length;
              const isActive = selectedDay === day || (selectedDay !== 'ALL' && isSameDay(selectedDay, day));
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isActive ? 'ALL' : day)}
                  className={`flex-shrink-0 px-2 py-1 sm:px-2.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 sm:gap-1.5 focus:outline-none border ${
                    isActive
                      ? (isLight 
                          ? 'bg-slate-100 text-slate-800 border-slate-200/80 shadow-sm' 
                          : 'bg-white/10 text-white border-white/[0.08]')
                      : (isLight 
                          ? 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50' 
                          : 'border-transparent text-white/30 hover:text-white/50 hover:bg-white/[0.04]')
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                  <span>{formatDayDisplay(day, t)}</span>
                  {count > 0 && <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-white/20'}`}>{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Search + View controls (grouped on mobile) */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:contents">
          <div className="relative flex-1 sm:flex-none sm:w-48 md:w-56 min-w-0 sm:ml-auto">
            <Search className={`w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/20'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className={`w-full pl-7 pr-2 py-1.5 rounded-md border text-[10px] font-medium focus:outline-none transition-colors ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500/50' 
                  : 'bg-white/[0.04] border-white/[0.06] text-white placeholder-white/20 focus:border-amber-400/30'
              }`}
            />
          </div>

          {/* View Toggle & Expand All */}
          <div className={`flex items-center gap-0.5 border rounded-md p-0.5 shrink-0 ${
            isLight ? 'bg-slate-100/80 border-slate-200/80' : 'bg-white/[0.04] border-white/[0.06]'
          }`}>
            {viewMode === 'cards' && (
              <button
                onClick={() => {
                  const nextExpandAll = !expandAll;
                  setExpandAll(nextExpandAll);
                  if (!nextExpandAll) {
                    setExpandedCards({});
                  }
                }}
                className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                  expandAll 
                    ? (isLight ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'bg-amber-400/20 text-amber-300 border border-amber-400/25') 
                    : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/40 hover:text-white/70')
                }`}
                title={expandAll ? t('collapseAll') : t('expandAll')}
              >
                {expandAll ? t('collapseAll') : t('expandAll')}
              </button>
            )}
            <button
              onClick={() => setViewMode('cards')}
              title="Paparan Kad"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'cards' 
                  ? (isLight ? 'bg-white text-slate-800 shadow-sm' : 'bg-white/[0.08] text-white/70') 
                  : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/20 hover:text-white/40')
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              title="Paparan Grid"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'matrix' 
                  ? (isLight ? 'bg-white text-slate-800 shadow-sm' : 'bg-white/[0.08] text-white/70') 
                  : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/20 hover:text-white/40')
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        data-lenis-prevent-touch
        className={`flex-1 min-h-0 ${viewMode === 'matrix' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto usas-scrollbar touch-pan-y overscroll-contain [-webkit-overflow-scrolling:touch]'}`}
      >
        <div className={`w-full px-2.5 sm:px-6 pt-3 pb-4 space-y-3 ${viewMode === 'matrix' ? 'flex-1 flex flex-col min-h-0' : 'min-h-0'}`}>
          
          {/* View Content */}
          {viewMode === 'matrix' ? (
            <MatrixGridView timetable={allCourses} days={daysList} activeHighlights={activeClassKeys} />
          ) : (
            <div className="space-y-4">
              <LiveNextClassWidget timetable={allCourses} />
              
              {filteredCourses.length === 0 ? (
                <div className="py-16 text-center">
                  <BookOpen className={`w-8 h-8 mx-auto mb-3 ${isLight ? 'text-slate-300' : 'text-white/8'}`} />
                  <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-white/25'}`}>{t('noClassesOnDay')} {formatDayDisplay(selectedDay, t)}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
                  {filteredCourses.map((course) => {
                    const courseId = course.course_id || course.kod_kursus;
                    const dayColor = getCardDayColor(course.day?.toUpperCase(), isLight);
                    const cardKey = getCourseHighlightKey(course);
                    const isExpanded = expandAll ? true : !!expandedCards[cardKey];
                    const currentNote = courseNotes[courseId] || '';
                    const courseStatus =
                      activeClassKeys.ongoingKey === cardKey
                        ? 'ongoing'
                        : activeClassKeys.upcomingKey === cardKey
                          ? 'upcoming'
                          : 'idle';

                    return (
                      <div
                        key={cardKey}
                        className={`rounded-lg border border-l-2 transition-all duration-300 flex flex-col ${dayColor.accent} ${dayColor.border} ${dayColor.bg} hover:brightness-105 shadow-sm ${
                          courseStatus === 'ongoing'
                            ? 'ring-1 ring-emerald-400/70 shadow-[0_0_18px_rgba(52,211,153,0.22)]'
                            : courseStatus === 'upcoming'
                              ? 'ring-1 ring-amber-300/60 shadow-[0_0_16px_rgba(251,191,36,0.18)] animate-[pulse_4s_ease-in-out_infinite]'
                              : ''
                        }`}
                      >
                        {/* Card Header - Click to expand/collapse independently */}
                        <div 
                          className={`p-3 cursor-pointer select-none rounded-lg ${
                            ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCards(prev => ({
                              ...prev,
                              [cardKey]: expandAll ? false : !prev[cardKey]
                            }));
                            if (expandAll) setExpandAll(false);
                          }}
                        >
                          <div className="flex flex-col gap-1.5">
                            {/* Card Header Top Row */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-col gap-0.5">
                                <span className={`text-[10px] font-black tracking-wider ${dayColor.text}`}>{courseId}</span>
                                <div className={`flex items-center gap-1 text-[9.5px] leading-none ${isLight ? 'text-slate-500 font-semibold' : 'text-white/45'}`}>
                                  <Clock className={`w-3 h-3 flex-shrink-0 self-center ${isLight ? 'text-amber-600' : 'text-amber-400/70'}`} />
                                  <span className="inline-flex items-center leading-none self-center">{getShortTimeRange(course.start_time, course.end_time)}</span>
                                </div>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 whitespace-nowrap ${dayColor.badge}`}>
                                {formatDayDisplay(course.day, t)}
                              </span>
                            </div>

                            {/* Course Name */}
                            <h3 className={`text-[11.5px] font-bold leading-snug line-clamp-2 min-h-[32px] ${
                              isLight ? 'text-slate-800' : 'text-white/95'
                            }`}>
                              {course.course_name || course.kursus}
                            </h3>

                            {/* Location Row */}
                            <div className={`flex items-center justify-between gap-2 mt-0.5 text-[9.5px] leading-none ${
                              isLight ? 'text-slate-500 font-semibold' : 'text-white/45'
                            }`}>
                              <span className="flex items-center gap-1.5 min-w-0 max-w-[85%]">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 self-center" style={{ color: '#ed4134' }} />
                                <span className="truncate leading-none self-center">{course.location || 'TBA'}</span>
                              </span>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {currentNote && (
                                  <span className={isLight ? 'text-amber-600' : 'text-amber-400/60'} title="Nota Wujud">
                                    <StickyNote className="w-2.5 h-2.5" />
                                  </span>
                                )}
                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${
                                  isExpanded 
                                    ? (isLight ? 'rotate-180 text-amber-600 font-bold' : 'rotate-180 text-amber-400') 
                                    : (isLight ? 'text-slate-400' : 'text-white/20')
                                }`} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details - Isolated from header toggle with height transitions */}
                        <div 
                          className={`transition-all duration-300 ease-in-out overflow-hidden ${
                            isExpanded 
                              ? 'max-h-[300px] opacity-100 border-t' 
                              : 'max-h-0 opacity-0 pointer-events-none'
                          } ${isLight ? 'border-slate-100' : 'border-white/[0.04]'}`} 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-3 pb-3 pt-2.5 space-y-2.5">
                            
                            {/* Lecturer */}
                            <div 
                              className="flex items-center gap-2 text-[9.5px] cursor-pointer group"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLecturer(course.lecturer || course.pensyarah);
                              }}
                            >
                              <User className={`w-3 h-3 flex-shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400/60'}`} />
                              <span className={`transition-colors font-medium truncate ${
                                isLight ? 'text-slate-600 group-hover:text-amber-600' : 'text-white/60 group-hover:text-amber-300'
                              }`}>
                                {course.lecturer || course.pensyarah || t('lecturers')}
                              </span>
                            </div>

                            {/* Group (Normalized display) */}
                            <div className="flex items-center gap-2 text-[9.5px]">
                              <GraduationCap className={`w-3 h-3 flex-shrink-0 ${isLight ? 'text-amber-600/75' : 'text-amber-400/55'}`} />
                              <span className={`font-medium leading-none ${isLight ? 'text-slate-500' : 'text-white/35'}`}>
                                {t('group')}: {normalizeGroup(course.group || course.kumpulan || 'A')}
                              </span>
                            </div>

                            {/* Attendance */}
                            <div className="flex items-center justify-between pt-0.5">
                              <AttendanceMeter percentStr={course.kehadiran} />
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedAttendanceCourse(course); }}
                                className={`text-[9px] font-semibold flex items-center gap-1 transition-colors ml-2 ${
                                isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/25 hover:text-white/50'
                                }`}
                              >
                                <CalendarCheck className={`w-3 h-3 ${isLight ? 'text-sky-600' : 'text-sky-400/70'}`} /> Log
                              </button>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1 pt-0.5" onClick={(e) => e.stopPropagation()}>
                              {editingCourseId === courseId ? (
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    value={noteInput}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => setNoteInput(e.target.value)}
                                    placeholder={t('addNote')}
                                    className={`flex-1 rounded px-2 py-1 text-[9.5px] font-medium focus:outline-none border ${
                                      isLight 
                                        ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500/50' 
                                        : 'bg-white/[0.04] text-white placeholder-white/20 border-white/10'
                                    }`}
                                  />
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleSaveNote(courseId); }}
                                    className={`px-2 py-1 rounded text-[9px] font-bold ${
                                      isLight ? 'bg-[#0B1E43] text-white' : 'bg-amber-400/20 text-amber-300'
                                    }`}
                                  >
                                    {t('saveNote')}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingCourseId(courseId); setNoteInput(currentNote); }}
                                  className={`text-[9px] font-medium flex items-center gap-1 transition-colors ${
                                    isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/20 hover:text-white/40'
                                  }`}
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  {currentNote || t('addNote')}
                                </button>
                              )}
                              {currentNote && editingCourseId !== courseId && (
                                <div className={`text-[9.5px] font-medium pl-3 border-l ${
                                  isLight ? 'text-amber-700 border-amber-500' : 'text-amber-300/60 border-amber-400/20'
                                }`}>
                                  {currentNote}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LecturerModal lecturerName={selectedLecturer} isOpen={!!selectedLecturer} onClose={() => setSelectedLecturer(null)} />
      <AttendanceHistoryModal
        course={selectedAttendanceCourse}
        isOpen={!!selectedAttendanceCourse}
        onClose={() => setSelectedAttendanceCourse(null)}
        refreshToken={attendanceRefreshToken}
      />
    </div>
  );
}



