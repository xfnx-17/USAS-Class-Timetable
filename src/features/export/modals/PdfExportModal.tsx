import { useState, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useModalA11y } from '@/shared/lib/useModalA11y';
import { extractDayName, sortDayLabels } from '@/shared/lib/dayFormat';
import { buildCourseColorMap } from '@/shared/lib/courseColors';
import {
  X, Download, Smartphone, RotateCw, ChevronDown, Plus, Minus, FileBadge, ImagePlus
} from 'lucide-react';
import FormalA4Preview from '../components/FormalA4Preview';
import { useWallpaperBackground } from '../hooks/useWallpaperBackground';
import { useExportDownload } from '../hooks/useExportDownload';
import WallpaperPreview from '../components/WallpaperPreview';
import {
  getLockscreenThemeConfig, getWallpaperSpacerHeights, parseTimeToMinutes,
  type ContentDetail, type ExportTheme, type WallpaperDesign, type WallpaperPreset,
} from '../lib/wallpaperExportHelpers';

type PdfExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ExportMode = 'FORMAL_A4' | 'WALLPAPER';
type ExportFileType = 'PDF' | 'PNG';
export default function PdfExportModal({ isOpen, onClose }: PdfExportModalProps) {
  const modalRef = useModalA11y(isOpen, onClose);
  const { timetableData, session, timeFormat } = useAuth();
  const { lang, t } = useLanguage();
  const { theme } = useTheme();

  const isLight = theme === 'light';

  // Modes: 'FORMAL_A4' | 'WALLPAPER'
  const [exportMode, setExportMode] = useState<ExportMode>('FORMAL_A4');
  const [exportFileType, setExportFileType] = useState<ExportFileType>('PDF');

  // Device Wallpaper Presets: 'phone' (iPhone, 9:16) | 'android' (9:20) | 'tablet' (4:3) | 'desktop' (16:9) | 'square' (1:1)
  const [wallpaperPreset, setWallpaperPreset] = useState<WallpaperPreset>('phone');

  // Content Detail Customizer: 'CODE' | 'DETAILS'
  const [contentDetail, setContentDetail] = useState<ContentDetail>('DETAILS');
  const [wallpaperDesign, setWallpaperDesign] = useState<WallpaperDesign>('GRID');

  const [ratioDropdownOpen, setRatioDropdownOpen] = useState(false);
  const [detailDropdownOpen, setDetailDropdownOpen] = useState(false);

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewHeight, setPreviewHeight] = useState(0);
  const [userZoom, setUserZoom] = useState(1);
  const [exportTheme, setExportTheme] = useState<ExportTheme>('light');
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [wallpaperTopAdjustment, setWallpaperTopAdjustment] = useState(0);
  const [wallpaperBottomAdjustment, setWallpaperBottomAdjustment] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setExportTheme(theme === 'light' ? 'light' : 'dark');
    }
  }, [theme, isOpen]);

  useEffect(() => {
    setUserZoom(1);
  }, [exportMode]);

  const finalScale = previewScale * userZoom;

  const renderFloatingZoomWidget = (isLightBg: boolean) => (
    <div className={`absolute top-6 left-4 z-30 w-fit flex items-center gap-1.5 p-1 rounded-xl shadow-lg border backdrop-blur-md transition-all pointer-events-auto ${isLightBg
        ? 'bg-white/40 border-slate-200/50 text-slate-700 shadow-slate-900/5'
        : 'bg-[#0A1428]/40 border-white/10 text-white/95 shadow-black/20'
      }`}>
      <button
        onClick={(e) => { e.stopPropagation(); setUserZoom(prev => Math.max(0.5, prev - 0.1)); }}
        className={`p-1.5 rounded-lg transition-all ${isLightBg ? 'hover:bg-slate-100/80 text-slate-600' : 'hover:bg-white/[0.08] text-white/80'
          }`}
        title="Zoom Out"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); setUserZoom(1); }}
        className={`px-2 py-1 rounded-lg text-[10.5px] font-extrabold transition-all min-w-[42px] text-center ${isLightBg ? 'hover:bg-slate-100/80 text-slate-700' : 'hover:bg-white/[0.08] text-white/90'
          }`}
        title="Reset Zoom"
      >
        {Math.round(userZoom * 100)}%
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); setUserZoom(prev => Math.min(2.5, prev + 0.1)); }}
        className={`p-1.5 rounded-lg transition-all ${isLightBg ? 'hover:bg-slate-100/80 text-slate-600' : 'hover:bg-white/[0.08] text-white/80'
          }`}
        title="Zoom In"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );


  const timetableDays = timetableData?.days;
  const allCourses = useMemo(() => timetableData?.timetable || [], [timetableData?.timetable]);
  const courseColorMap = useMemo(() => buildCourseColorMap(allCourses), [allCourses]);
  const studentName = timetableData?.studentName || session?.user_id || '';
  const matricNo = session?.user_id || '';
  const programName = timetableData?.program || '';
  const semesterStr = timetableData?.semester || '';

  const pdfRef = useRef<HTMLDivElement | null>(null);
  const previewShellRef = useRef<HTMLDivElement | null>(null);
  const wallpaperRef = useRef<HTMLDivElement | null>(null);
  const { exporting, progress, progressStatus, handleDownload } = useExportDownload({
    mode: exportMode,
    fileType: exportFileType,
    preset: wallpaperPreset,
    theme: exportTheme,
    matricNo,
    lang,
    pdfRef,
    wallpaperRef,
  });

  const normalizeGroup = (groupStr?: string) => {
    if (!groupStr) return '';
    const raw = String(groupStr).trim();
    const match = raw.match(/^(?:GRP|G)\s*0*(\d+)$/i);
    if (match) return `Group ${match[1]}`;
    if (/^A$/i.test(raw)) return 'Group A';
    return raw.replace(/^GRP/i, 'Group ');
  };

  const daysList = useMemo(() => {
    if (timetableDays && timetableDays.length > 0) {
      return sortDayLabels(Array.from(new Set(timetableDays)));
    }
    const defaultOrder = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'];
    const daysInCourses = new Set(allCourses.map(c => extractDayName(c.day)).filter(Boolean));
    const baseDays = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'];
    const extraDays = defaultOrder.filter(d => daysInCourses.has(d) && !baseDays.includes(d));
    return [...baseDays, ...extraDays];
  }, [timetableDays, allCourses]);



  const {
    wallpaperBackground,
    wallpaperBackgroundBlurred,
    wallpaperBackgroundName,
    wallpaperBackgroundError,
    brightDayLabels,
    wallpaperBackgroundInputRef,
    loadWallpaperBackground,
    clearWallpaperBackground,
  } = useWallpaperBackground({
    wallpaperRef,
    exportMode,
    exportTheme,
    wallpaperPreset,
    wallpaperTopAdjustment,
    wallpaperBottomAdjustment,
    daysList,
  });

  // Courses sorted by weekday then start time, so the formal table can merge
  // consecutive rows of the same day into a single day cell (rowSpan).
  // Stable unique colour per course (shared with the card and grid views).

  const pdfCourses = useMemo(() => {
    const order = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'];
    return [...allCourses].sort((a, b) => {
      const da = order.indexOf(extractDayName(a.day));
      const db = order.indexOf(extractDayName(b.day));
      if (da !== db) return da - db;
      return (parseTimeToMinutes(a.start_time || a.jadual) ?? 0) - (parseTimeToMinutes(b.start_time || b.jadual) ?? 0);
    });
  }, [allCourses]);

  useEffect(() => {
    if (isOpen) {
      setAnimate(false);
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
    if (!shouldRender || exportMode === 'WALLPAPER') return;

    const previewWidth = exportMode === 'FORMAL_A4' ? 840 : 920;
    const updateScale = () => {
      if (!previewShellRef.current) return;
      const availableWidth = previewShellRef.current.clientWidth || previewWidth;
      const baseScale = Math.min(1, availableWidth / previewWidth);
      const mobileBoost = window.innerWidth < 640 ? 0.9 : window.innerWidth < 1024 ? 0.95 : 1;
      const nextScale = Math.max(0.72, baseScale * mobileBoost);
      setPreviewScale(Number(nextScale.toFixed(3)));
    };

    const updateHeight = () => {
      if (!pdfRef.current) return;
      setPreviewHeight(pdfRef.current.offsetHeight || 0);
    };

    updateScale();
    updateHeight();

    const shellObserver = typeof ResizeObserver !== 'undefined' && previewShellRef.current
      ? new ResizeObserver(updateScale)
      : null;
    if (shellObserver && previewShellRef.current) shellObserver.observe(previewShellRef.current);

    const contentObserver = typeof ResizeObserver !== 'undefined' && pdfRef.current
      ? new ResizeObserver(updateHeight)
      : null;
    if (contentObserver && pdfRef.current) contentObserver.observe(pdfRef.current);

    window.addEventListener('resize', updateScale);

    return () => {
      shellObserver?.disconnect();
      contentObserver?.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [shouldRender, exportMode, contentDetail, wallpaperPreset, daysList, allCourses.length]);

  if (!shouldRender) return null;


  const fileTypeOptions: Array<{ id: ExportFileType; label: string }> = [
    { id: 'PDF', label: 'PDF' },
    { id: 'PNG', label: 'PNG' },
  ];

  const ratioOptions: Array<{ id: WallpaperPreset; label: string }> = [
    { id: 'phone', label: 'iPhone (9:16)' },
    { id: 'android', label: 'Android (9:20)' },
    { id: 'tablet', label: `${t('tabletPreset')} (4:3)` },
    { id: 'desktop', label: `${t('desktopPreset')} (16:9)` },
    { id: 'square', label: `${t('squarePreset')} (1:1)` },
  ];

  const detailOptions: Array<{ id: ContentDetail; label: string }> = [
    { id: 'CODE', label: t('codeOnly') },
    { id: 'DETAILS', label: t('details') },
  ];

  const themeOptions: Array<{ id: ExportTheme; label: string }> = [
    { id: 'dark', label: t('themeDark') },
    { id: 'light', label: t('themeLight') },
    { id: 'emerald', label: t('themeEmerald') },
    { id: 'oled', label: t('themeOled') },
    { id: 'warm', label: t('themeWarm') },
  ];

  const currentSpacers = getWallpaperSpacerHeights(wallpaperPreset, wallpaperDesign, wallpaperTopAdjustment, wallpaperBottomAdjustment);
  const lockscreenConfig = getLockscreenThemeConfig(exportTheme);
  const showTopPositionControl = wallpaperDesign === 'GRID';

  return (
    <div ref={modalRef} data-lenis-prevent role="dialog" aria-modal="true" aria-label="Eksport Jadual" className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md transition-all duration-200 touch-pan-y overscroll-contain ${animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
      }`}>

      {/* Spacious Modal Frame */}
      <div className={`rounded-xl w-[96vw] max-w-6xl h-[92dvh] max-h-[92dvh] border flex flex-col min-h-0 overflow-hidden my-auto transition-all duration-200 transform ${animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${isLight
          ? 'bg-white border-slate-200 shadow-2xl text-slate-800'
          : 'bg-[#0A1428]/95 border-white/10 text-white shadow-2xl'
        }`}>

        {/* Header */}
        <div className={`p-3 sm:p-4 border-b flex items-start sm:items-center justify-between gap-3 flex-shrink-0 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.06] bg-[#0A1428]/95'
          }`}>
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <img src={isLight ? '/usas-logo-light.png' : '/usas-logo-dark.png'} alt="USAS Logo" className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0 mt-0.5 sm:mt-0" />
            <div className="min-w-0">
              <h3 className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{t('exportPdfTitle')}</h3>
              <p className={`text-[10px] sm:text-xs mt-1 transition-colors ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Eksport Dokumen Rasmi A4 atau Custom Wallpaper Lockscreen peranti
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

        {/* Scrollable Body */}
        <div data-lenis-prevent className="p-3 sm:p-4 flex-1 min-h-0 overflow-y-auto space-y-3.5 sm:space-y-4 touch-pan-y overscroll-contain">

          {/* Main Mode Tabs */}
          <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/[0.03] border-white/[0.04]'
            }`}>
            <button
              onClick={() => setExportMode('FORMAL_A4')}
              aria-label={lang === 'en' ? 'Formal document' : 'Dokumen rasmi'}
              className={`py-2 px-3 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-2 transition-all min-w-0 ${exportMode === 'FORMAL_A4'
                  ? (isLight ? 'bg-[#0B1E43] text-white shadow-md' : 'bg-amber-400 text-slate-950 shadow-md')
                  : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/40 hover:text-white')
                }`}
            >
              <FileBadge className="w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Formal</span>
            </button>

            <button
              onClick={() => setExportMode('WALLPAPER')}
              aria-label={lang === 'en' ? 'Wallpaper lockscreen' : 'Wallpaper skrin kunci'}
              className={`py-2 px-3 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-2 transition-all min-w-0 ${exportMode === 'WALLPAPER'
                  ? (isLight ? 'bg-[#0B1E43] text-white shadow-md' : 'bg-amber-400 text-slate-950 shadow-md')
                  : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/40 hover:text-white')
                }`}
            >
              <Smartphone className="w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Wallpaper Lockscreen</span>
            </button>
          </div>

          {exportMode !== 'WALLPAPER' && (
            <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-[11px] font-medium transition-colors ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.02] border-white/[0.04] text-white/70'
              }`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${isLight ? 'text-amber-800' : 'text-amber-400/90'
                }`}>Format Muat Turun:</span>
              <div className="flex flex-wrap items-center gap-1">
                {fileTypeOptions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setExportFileType(item.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-all min-w-0 ${exportFileType === item.id
                        ? (isLight ? 'bg-[#0B1E43] text-white border-slate-800 shadow-sm' : 'bg-amber-400 text-slate-950 border-amber-400')
                        : (isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100/50' : 'bg-white/[0.02] border-white/10 text-white/50')
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MINIMALIST CUSTOMIZERS (Horizontal Segmented Controls for Height Reduction) */}
          {exportMode !== 'FORMAL_A4' && (
            <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between text-[11px] font-medium transition-colors relative ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.02] border-white/[0.04] text-white/70'
              }`}>

              {/* Invisible overlay to close dropdowns on clicking outside */}
              {(ratioDropdownOpen || detailDropdownOpen || themeDropdownOpen) && (
                <div
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRatioDropdownOpen(false);
                    setDetailDropdownOpen(false);
                    setThemeDropdownOpen(false);
                  }}
                />
              )}

              <div data-wallpaper-controls className={`grid grid-cols-1 sm:grid-cols-2 ${exportMode === 'WALLPAPER' ? 'xl:grid-cols-[minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,1.8fr)]' : 'xl:grid-cols-2'} items-center gap-3 xl:gap-4 w-full relative z-40`}>
                {/* 1. Device Ratio Selector (WALLPAPER only) */}
                {exportMode === 'WALLPAPER' && (
                  <div className="flex flex-col items-stretch gap-1.5 w-full min-w-0 xl:max-w-[230px] relative z-40">
                    <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${isLight ? 'text-amber-800' : 'text-amber-400/90'
                      }`}>{t('deviceRatio')}:</span>
                    <div className="relative w-full sm:w-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRatioDropdownOpen(!ratioDropdownOpen);
                          setDetailDropdownOpen(false);
                          setThemeDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all shadow-sm w-full ${isLight
                            ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            : 'bg-white/[0.04] border-white/10 text-white/90 hover:bg-white/[0.08]'
                          }`}
                      >
                        <span>
                          {wallpaperPreset === 'phone' && 'iPhone (9:16)'}
                          {wallpaperPreset === 'android' && 'Android (9:20)'}
                          {wallpaperPreset === 'tablet' && `${t('tabletPreset')} (4:3)`}
                          {wallpaperPreset === 'desktop' && `${t('desktopPreset')} (16:9)`}
                          {wallpaperPreset === 'square' && `${t('squarePreset')} (1:1)`}
                        </span>
                        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${ratioDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {ratioDropdownOpen && (
                        <div className={`static sm:absolute mt-2 sm:mt-1 left-0 right-0 sm:right-auto w-full sm:w-44 rounded-xl border shadow-xl py-1 z-[60] transition-all ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0A1428] border-white/10 text-white'
                          }`}>
                          {ratioOptions.map((item) => (
                            <button
                              key={item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setWallpaperPreset(item.id);
                                setRatioDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition-colors flex items-center justify-between ${wallpaperPreset === item.id
                                  ? (isLight ? 'text-amber-800 bg-amber-50/50' : 'text-amber-400 bg-amber-400/5')
                                  : ''
                                }`}
                            >
                              <span>{item.label}</span>
                              {wallpaperPreset === item.id && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Content Detail Selector */}
                <div className="flex flex-col items-stretch gap-1.5 w-full min-w-0 xl:max-w-[230px] relative z-20">
                  <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${isLight ? 'text-amber-800' : 'text-amber-400/90'
                    }`}>{t('cardContent')}:</span>
                  <div className="relative w-full sm:w-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailDropdownOpen(!detailDropdownOpen);
                        setRatioDropdownOpen(false);
                        setThemeDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all shadow-sm w-full ${isLight
                          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          : 'bg-white/[0.04] border-white/10 text-white/90 hover:bg-white/[0.08]'
                        }`}
                    >
                      <span>
                        {contentDetail === 'CODE' && t('codeOnly')}
                        {contentDetail === 'DETAILS' && t('details')}
                      </span>
                      <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${detailDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {detailDropdownOpen && (
                      <div className={`static sm:absolute mt-2 sm:mt-1 right-0 left-0 sm:left-auto w-full sm:w-36 rounded-xl border shadow-xl py-1 z-[60] transition-all ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0A1428] border-white/10 text-white'
                        }`}>
                        {detailOptions.map((item) => (
                          <button
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setContentDetail(item.id);
                              setDetailDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition-colors flex items-center justify-between ${contentDetail === item.id
                                ? (isLight ? 'text-amber-800 bg-amber-50/50' : 'text-amber-400 bg-amber-400/5')
                                : ''
                              }`}
                          >
                            <span>{item.label}</span>
                            {contentDetail === item.id && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Timetable Theme Selector */}
                <div className="flex flex-col items-stretch gap-1.5 w-full min-w-0 xl:max-w-[230px] relative z-20">
                  <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${isLight ? 'text-amber-800' : 'text-amber-400/90'
                    }`}>{t('tableTheme')}:</span>
                  <div className="relative w-full sm:w-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setThemeDropdownOpen(!themeDropdownOpen);
                        setRatioDropdownOpen(false);
                        setDetailDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all shadow-sm w-full ${isLight
                          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          : 'bg-white/[0.04] border-white/10 text-white/90 hover:bg-white/[0.08]'
                        }`}
                    >
                      <span>
                        {exportTheme === 'light' ? t('themeLight') :
                          exportTheme === 'emerald' ? t('themeEmerald') :
                            exportTheme === 'oled' ? t('themeOled') :
                              exportTheme === 'warm' ? t('themeWarm') :
                                t('themeDark')}
                      </span>
                      <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${themeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {themeDropdownOpen && (
                      <div className={`static sm:absolute mt-2 sm:mt-1 right-0 left-0 sm:left-auto w-full sm:w-36 rounded-xl border shadow-xl py-1 z-[60] transition-all ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0A1428] border-white/10 text-white'
                        }`}>
                        {themeOptions.map((item) => (
                          <button
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExportTheme(item.id);
                              setThemeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition-colors flex items-center justify-between ${exportTheme === item.id
                                ? (isLight ? 'text-amber-800 bg-amber-50/50' : 'text-amber-400 bg-amber-400/5')
                                : ''
                              }`}
                          >
                            <span>{item.label}</span>
                            {exportTheme === item.id && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {exportMode === 'WALLPAPER' && (
                  <div className="flex flex-col items-stretch gap-1.5 w-full min-w-0 relative z-20">
                    <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${isLight ? 'text-amber-800' : 'text-amber-400/90'}`}>{t('wallpaperBackground')}:</span>
                    <input
                      ref={wallpaperBackgroundInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      aria-label={t('chooseWallpaperBackground')}
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        event.currentTarget.value = '';
                        void loadWallpaperBackground(file);
                      }}
                    />
                    <div className="flex gap-1.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => wallpaperBackgroundInputRef.current?.click()}
                        title={wallpaperBackgroundName || t('chooseWallpaperBackground')}
                        className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-left text-[11px] font-semibold ${isLight
                          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          : 'bg-white/[0.04] border-white/10 text-white/80 hover:bg-white/[0.08]'
                        }`}
                      >
                        <ImagePlus className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{wallpaperBackgroundName || t('chooseWallpaperBackground')}</span>
                      </button>
                      {wallpaperBackground && (
                        <button
                          type="button"
                          onClick={clearWallpaperBackground}
                          aria-label={t('removeWallpaperBackground')}
                          title={t('removeWallpaperBackground')}
                          className={`self-stretch rounded-lg border px-2 ${isLight
                            ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            : 'bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/[0.08]'
                          }`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {wallpaperBackgroundError && <span role="alert" className="text-[9px] text-rose-400">{t(wallpaperBackgroundError)}</span>}
                  </div>
                )}

                {exportMode === 'WALLPAPER' && (
                  <div className="flex flex-col gap-1.5 w-full min-w-0 relative z-20">
                    <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${isLight ? 'text-amber-800' : 'text-amber-400/90'
                      }`}>{t('tablePosition')}:</span>
                    <div className="flex items-center gap-2">
                      <div className={`grid ${showTopPositionControl ? 'grid-cols-2' : 'grid-cols-1'} gap-2 flex-1 min-w-0`}>
                      {showTopPositionControl && (
                      <label className={`min-w-0 rounded-lg border px-2 py-1 ${isLight
                          ? 'bg-white border-slate-200'
                          : 'bg-white/[0.04] border-white/10'
                        }`}>
                          <span className={`flex justify-between gap-1 text-[9px] font-semibold ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                          <span>{t('positionTop')}</span><span>{currentSpacers.top}px</span>
                        </span>
                        <input
                          type="range"
                          min={12}
                          max={currentSpacers.topMax}
                          step={1}
                          value={currentSpacers.top}
                          onChange={(e) => setWallpaperTopAdjustment(Number(e.target.value) - currentSpacers.topBase)}
                          className={`usas-range w-full cursor-pointer ${isLight ? '' : 'usas-range-dark'}`}
                          aria-label={t('adjustWallpaperTopAria')}
                        />
                      </label>
                      )}
                      <label className={`min-w-0 rounded-lg border px-2 py-1 ${isLight
                          ? 'bg-white border-slate-200'
                          : 'bg-white/[0.04] border-white/10'
                        }`}>
                          <span className={`flex justify-between gap-1 text-[9px] font-semibold ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                          <span>{t('positionBottom')}</span><span>{currentSpacers.bottom}px</span>
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={currentSpacers.bottomMax}
                          step={1}
                          value={currentSpacers.bottom}
                          onChange={(e) => setWallpaperBottomAdjustment(Number(e.target.value) - currentSpacers.bottomBase)}
                          className={`usas-range w-full cursor-pointer ${isLight ? '' : 'usas-range-dark'}`}
                          aria-label={t('adjustWallpaperBottomAria')}
                        />
                      </label>
                      </div>
                    {((showTopPositionControl && wallpaperTopAdjustment !== 0) || wallpaperBottomAdjustment !== 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          setWallpaperTopAdjustment(0);
                          setWallpaperBottomAdjustment(0);
                        }}
                        className={`self-center rounded p-1 transition-colors ${isLight
                            ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                            : 'text-white/40 hover:bg-white/[0.08] hover:text-white/80'
                          }`}
                        aria-label={t('resetWallpaperPositionAria')}
                        title={t('resetPosition')}
                      >
                        <RotateCw className="h-3 w-3" />
                      </button>
                    )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── MODE 1: FORMAL PRINTABLE A4 DOCUMENT ── */}
          {exportMode === 'FORMAL_A4' && (
            <FormalA4Preview
              previewShellRef={previewShellRef}
              pdfRef={pdfRef}
              previewHeight={previewHeight}
              finalScale={finalScale}
              renderFloatingZoomWidget={renderFloatingZoomWidget}
              isLight={isLight}
              exportTheme={exportTheme}
              semesterStr={semesterStr}
              studentName={studentName}
              matricNo={matricNo}
              programName={programName}
              lang={lang}
              pdfCourses={pdfCourses}
              normalizeGroup={normalizeGroup}
              t={t}
              timeFormat={timeFormat}
            />
          )}

          {exportMode === 'WALLPAPER' && (
            <WallpaperPreview
              isLight={isLight}
              wallpaperDesign={wallpaperDesign}
              setWallpaperDesign={setWallpaperDesign}
              t={t}
              renderFloatingZoomWidget={renderFloatingZoomWidget}
              wallpaperPreset={wallpaperPreset}
              contentDetail={contentDetail}
              timeFormat={timeFormat}
              wallpaperBackground={wallpaperBackground}
              wallpaperBackgroundBlurred={wallpaperBackgroundBlurred}
              currentSpacers={currentSpacers}
              wallpaperRef={wallpaperRef}
              userZoom={userZoom}
              allCourses={allCourses}
              courseColorMap={courseColorMap}
              daysList={daysList}
              brightDayLabels={brightDayLabels}
              exportTheme={exportTheme}
              lockscreenConfig={lockscreenConfig}
            />
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 sm:p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.06] bg-[#0A1428]/95'
          }`}>
          <div className="text-[10px] italic text-center sm:text-left order-2 sm:order-1 flex-1">
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
              {lang === 'en' ? '* For best quality, download via Chrome on a laptop/desktop.' : '* Untuk kualiti terbaik, muat turun melalui Chrome di komputer.'}
            </span>
          </div>

          <div className="flex flex-row items-center justify-end gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              onClick={onClose}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all flex-1 sm:flex-none text-center ${isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border-white/10'
                }`}
            >
              {t('cancel')}
            </button>

            <button
              onClick={handleDownload}
              disabled={exporting}
              aria-label={exporting
                ? (lang === 'en' ? 'Generating download' : 'Menjana muat turun')
                : (lang === 'en' ? 'Download' : 'Muat Turun')}
              className={`px-4 sm:px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all flex-1 sm:flex-none ${isLight
                  ? 'bg-[#0B1E43] hover:bg-[#152e63] text-white shadow-slate-900/10'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/10'
                }`}
            >
              {exporting ? (
                <>
                  <RotateCw className="w-4 h-4 sm:w-3.5 sm:h-3.5 animate-spin flex-shrink-0" />
                  <span className="hidden sm:inline truncate">{lang === 'en' ? 'Generating...' : 'Menjana...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">{lang === 'en' ? 'Download' : 'Muat Turun'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {exporting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md rounded-xl overflow-hidden">
          <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-4 text-center max-w-xs w-full shadow-2xl transition-all duration-300 ${isLight
              ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/10'
              : 'bg-[#0A1428]/95 border-white/10 text-white shadow-black/40'
            }`}>
            {/* Circular Gauge Meter */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Circular SVG Gauge */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className={isLight ? 'stroke-slate-100' : 'stroke-white/[0.04]'}
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-amber-500 transition-all duration-300 ease-out"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 - (progress / 100) * (2 * Math.PI * 34)}
                  strokeLinecap="round"
                />
              </svg>
              {/* Center percentage counter */}
              <div className="absolute flex flex-col items-center justify-center">
                <span data-export-progress-value className="text-lg font-black tracking-tight">{progress}%</span>
              </div>
            </div>

            {/* Gauge Info Text */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
                {lang === 'en' ? 'Exporting File' : 'Mengeksport Fail'}
              </h3>
              <p className="text-[11px] font-medium opacity-80 min-h-[32px] flex items-center justify-center px-2">
                {progressStatus}
              </p>
            </div>

            <div className={`relative w-full h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/[0.04]'}`}>
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
