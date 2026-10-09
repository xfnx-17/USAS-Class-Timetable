import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme, THEMES } from '@/app/providers/ThemeProvider';
import { getOwnRecordValue } from '@/shared/lib/security';
import { LANDING_COPY } from '../data/landingCopy';
import LandingSecondarySections from '../components/LandingSecondarySections';
import {
  Download, Moon, Share2, AlertTriangle, ArrowRight,
  Play, Instagram, Github, ScanLine, ArrowUp
} from 'lucide-react';

type LandingPageProps = {
  onNavigateLogin?: () => void;
  onGoToLogin?: () => void;
};

export default function LandingPage({ onNavigateLogin, onGoToLogin }: LandingPageProps) {
  const handleLogin = onNavigateLogin || onGoToLogin || (() => {});
  const { lang, t } = useLanguage();
  const { theme } = useTheme();
  const [scrollY, setScrollY] = useState(0);

  // 3D Card Hover Perspective State
  const [mouseRotate, setMouseRotate] = useState({ x: 0, y: 0 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMouseRotate({
      x: -(y / (rect.height / 2)) * 8,
      y: (x / (rect.width / 2)) * 8
    });
    setIsHoveringCard(true);
  };

  const handleMouseLeave = () => {
    setMouseRotate({ x: 0, y: 0 });
    setIsHoveringCard(false);
  };

  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || document.documentElement.scrollTop;
          setScrollY(currentScrollY);
          
          const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          if (windowHeight > 0) {
            setScrollPercent(currentScrollY / windowHeight);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initialize on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLight = theme === THEMES.LIGHT;

  const copy = getOwnRecordValue<typeof LANDING_COPY.en>(LANDING_COPY, lang) || LANDING_COPY.en;
  const steps = copy.steps;

  return (
    <div className={`relative isolate overflow-hidden min-h-[120svh] ${
      theme === THEMES.LIGHT ? 'bg-[#f8fafc] text-slate-800' :
      theme === THEMES.OLED ? 'bg-black text-slate-100' :
      theme === THEMES.EMERALD ? 'bg-[#012117] text-slate-100' :
      'bg-[#060E1F] text-slate-100'
    }`}>
      
      {/* Interactive Scroll Progress Line */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent">
        <div 
          className={`h-full ${isLight ? 'bg-amber-500' : 'bg-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'}`}
          style={{ width: `${scrollPercent * 100}%` }} 
        />
      </div>

      {/* Dynamic Background Blurs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Colorful Glowing Ambient Blobs */}
        <div className={`absolute -top-40 left-1/2 -translate-x-1/2 h-[380px] w-[min(600px,90vw)] rounded-full blur-[120px] opacity-40 ${isLight ? 'bg-gradient-to-tr from-amber-200 to-sky-200' : 'bg-gradient-to-tr from-amber-500/10 to-indigo-500/10'
          }`} />
        <div className={`absolute top-20 right-10 h-80 w-80 rounded-full blur-[100px] opacity-35 ${isLight ? 'bg-amber-200' : 'bg-amber-500/5'
          }`} />
        <div className={`absolute top-60 left-10 h-96 w-96 rounded-full blur-[100px] opacity-35 ${isLight ? 'bg-sky-200' : 'bg-sky-500/5'
          }`} />
      </div>

      {/* SECTION 1: Above-the-fold Viewport (Hero Area) */}
      <section className="relative w-full min-h-[calc(100svh-3.5rem)] lg:min-h-[calc(100vh-3.5rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pb-12 lg:pb-28 border-b border-slate-200/10 dark:border-white/5 overflow-hidden">
        
        <div className="max-w-3xl w-full text-center space-y-6 z-10 relative">
          
          {/* Eyebrow Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-wide transition-all shadow-sm mx-auto animate-fade-in ${isLight ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-amber-500/20 bg-amber-500/10 text-amber-400'}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{copy.eyebrow}</span>
          </div>

          {/* Main Hero Header */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-balance">
            {copy.titlePrefix}
            <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 bg-clip-text text-transparent drop-shadow-sm">
              {copy.titleHighlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base leading-relaxed opacity-75 max-w-2xl mx-auto text-balance font-medium">
            {copy.subtitle}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              onClick={handleLogin}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full text-[11px] sm:text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20 uppercase tracking-wider"
            >
              <span>{copy.cta}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <a
              href="#guide-video"
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-3 rounded-full text-[11px] sm:text-xs font-bold border transition-colors ${
                isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 text-slate-300'
              }`}
            >
              <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current opacity-70" />
              <span>{copy.ctaSecondary}</span>
            </a>
          </div>

        </div>

        {/* Desktop Scroll-Down Prompt */}
        <div className="hidden lg:flex absolute bottom-5 left-1/2 -translate-x-1/2 flex-col items-center gap-2.5 z-20">
          <span className="text-[9px] font-black tracking-[0.2em] uppercase opacity-60 text-slate-500 dark:text-slate-400 select-none">
            {lang === 'ms' ? 'Skrol ke Bawah' : lang === 'zh' ? '向下滚动' : lang === 'ta' ? 'கீழே உருட்டவும்' : 'Scroll Down'}
          </span>
          {/* Sleek Mouse Wheel Icon */}
          <div className="w-5.5 h-9 rounded-full border-2 border-slate-300 dark:border-white/25 flex justify-center p-1.5 opacity-70">
            <div className="w-1 h-2 bg-amber-500 rounded-full animate-scroll-wheel" />
          </div>
        </div>

      </section>

      {/* SECTION 2: Scrollable Content Wrapper */}
      <section className="relative mx-auto max-w-4xl px-4 sm:px-6 py-20 space-y-24">

        {/* 3D Mockup & Features Playground Grid */}
        <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto items-stretch">

          {/* Left Column: Interactive 3D Mockup */}
          <div
            className="relative w-full cursor-pointer h-full"
            style={{ perspective: '1200px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={`rounded-2xl border p-4 sm:p-5 shadow-2xl origin-top-center h-full flex flex-col justify-between ${
                isHoveringCard ? 'transition-none' : 'transition-transform duration-300 ease-out'
              } ${isLight
                ? 'border-slate-200 bg-white/95'
                : 'border-white/[0.08] bg-[#0A1428]/95'
                }`}
              style={isMobile ? undefined : {
                transform: `rotateX(${mouseRotate.x}deg) rotateY(${mouseRotate.y}deg) scale(1) translateY(0px)`,
                transformStyle: 'preserve-3d',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitFontSmoothing: 'antialiased',
                opacity: 1
              }}
            >
              {/* Mockup Header */}
              <div
                className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pb-3 mb-4 border-b border-slate-200/50 dark:border-white/10 text-[9px] sm:text-[10px] font-bold opacity-60"
                style={{ transform: 'translateZ(30px)' }}
              >
                <span>MATRIK: AI210042</span>
                <span className={`px-2 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/[0.06] text-amber-300'}`}>
                  {copy.previewTitle}
                </span>
                <span>PROGRAM: CS</span>
              </div>

              {/* Mockup Grid Rows */}
              <div className="space-y-3 flex-1 flex flex-col justify-between" style={{ transform: 'translateZ(10px)' }}>
                {[
                  {
                    day: t('days.ISNIN'),
                    time: '8:30 AM - 10:30 AM',
                    code: 'CSC2103',
                    course: lang === 'ms' ? 'Struktur Data & Algoritma' : lang === 'zh' ? '数据结构与算法' : lang === 'ta' ? 'தரவு கட்டமைப்புகள்' : 'Data Structures & Algorithms',
                    loc: lang === 'ms' ? 'Makmal 3' : lang === 'zh' ? '3号计算机房' : lang === 'ta' ? 'ஆய்வகம் 3' : 'Lab 3',
                    theme: {
                      accent: isLight ? 'border-l-emerald-500' : 'border-l-emerald-400',
                      border: isLight ? 'border-emerald-500/20' : 'border-emerald-500/30',
                      bg: isLight ? 'bg-emerald-500/[0.08]' : 'bg-emerald-500/[0.15]',
                      text: isLight ? 'text-emerald-700' : 'text-emerald-350',
                      badge: isLight
                        ? 'bg-emerald-600 text-white border-emerald-600/30'
                        : 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                    }
                  },
                  {
                    day: t('days.SELASA'),
                    time: '9:00 AM - 12:00 PM',
                    code: 'BIT2043',
                    course: lang === 'ms' ? 'Pembangunan Aplikasi Web' : lang === 'zh' ? 'Web 应用程序开发' : lang === 'ta' ? 'வலை பயன்பாட்டு உருவாக்கம்' : 'Web Application Development',
                    loc: lang === 'ms' ? 'Makmal Perisian' : lang === 'zh' ? '软件实验室' : lang === 'ta' ? 'மென்பொருள் ஆய்வகம்' : 'Software Lab',
                    theme: {
                      accent: isLight ? 'border-l-blue-500' : 'border-l-blue-400',
                      border: isLight ? 'border-blue-500/20' : 'border-blue-500/30',
                      bg: isLight ? 'bg-blue-500/[0.08]' : 'bg-blue-500/[0.15]',
                      text: isLight ? 'text-blue-700' : 'text-blue-350',
                      badge: isLight
                        ? 'bg-blue-600 text-white border-blue-600/30'
                        : 'bg-blue-500/30 text-blue-300 border-blue-500/50'
                    }
                  },
                  {
                    day: t('days.RABU'),
                    time: '2:00 PM - 5:00 PM',
                    code: 'SEC3303',
                    course: lang === 'ms' ? 'Keselamatan Rangkaian' : lang === 'zh' ? '网络安全与防御' : lang === 'ta' ? 'பிணைய பாதுகாப்பு' : 'Network Security & Defense',
                    loc: lang === 'ms' ? 'Dewan Kuliah 2' : lang === 'zh' ? '第 2 讲堂' : lang === 'ta' ? 'விரிவுரை அரங்கம் 2' : 'Lecture Hall 2',
                    theme: {
                      accent: isLight ? 'border-l-amber-500' : 'border-l-amber-400',
                      border: isLight ? 'border-amber-500/20' : 'border-amber-500/30',
                      bg: isLight ? 'bg-amber-500/[0.08]' : 'bg-amber-500/[0.15]',
                      text: isLight ? 'text-amber-700' : 'text-amber-350',
                      badge: isLight
                        ? 'bg-amber-600 text-white border-amber-600/30'
                        : 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                    }
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-300 ${item.theme.bg} ${item.theme.border} border-l-[3px] ${item.theme.accent}`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[9px]">
                      <span className={`font-bold uppercase tracking-wider ${item.theme.text}`}>
                        {item.day}
                      </span>
                      <span className="opacity-60 text-[9px] font-mono">{item.time}</span>
                    </div>
                    <div className="my-1">
                      <div className="text-[10px] font-extrabold line-clamp-1">{item.course}</div>
                    </div>
                    <div className="flex items-center justify-between text-[8px] opacity-75">
                      <span className={`px-1 py-0.5 rounded font-black font-mono border ${item.theme.badge}`}>
                        {item.code}
                      </span>
                      <span className="font-semibold">{item.loc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mockup Footer Indicator */}
              <div
                className="mt-4 pt-2 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-[8px] font-semibold opacity-40 uppercase tracking-widest"
                style={{ transform: 'translateZ(20px)' }}
              >
                <span />
                <span>STEM USAS</span>
              </div>
            </div>
          </div>

          {/* Right Column: Workflow Steps */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                {lang === 'ms' ? 'ALIRAN PENGGUNA' : lang === 'zh' ? '使用流程' : lang === 'ta' ? 'பயன்பாட்டு முறை' : 'USER WORKFLOW'}
              </span>
              <h3 className="text-xl font-black tracking-tight">{copy.featuresTitle}</h3>
              <p className="text-xs opacity-75 leading-relaxed">{copy.featuresDesc}</p>
            </div>

            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all duration-300 ${isLight
                    ? 'bg-white border-slate-200/80 shadow-sm'
                    : 'bg-white/[0.015] border-white/[0.04]'
                    }`}
                >
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-xs font-black font-mono shrink-0">
                    {step.n}
                  </div>
                  <div className="space-y-0.5 text-left">
                    <h4 className="text-xs font-extrabold">{step.title}</h4>
                    <p className="text-[11px] opacity-70 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Feature Bento Grid */}
        <div className="mt-24 space-y-6">
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-lg font-black tracking-tight text-amber-500">{copy.suiteTitle}</h3>
            <p className="text-xs opacity-75">{copy.suiteDesc}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">

            {/* Card 1: Downloadable Formats */}
            <div className={`md:col-span-2 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[160px] ${isLight ? 'bg-white border-slate-200/60 shadow-sm' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
              }`}>
              <div className="space-y-2 max-w-full sm:max-w-[52%]">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/[0.06] text-amber-300'
                    }`}>
                    <Download className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-left">{copy.card1Title}</h4>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed text-left">
                  {copy.card1Desc}
                </p>
              </div>

              {/* Graphical Stack Representation Inside Bento Card */}
              <div className="absolute right-3 bottom-0 top-6 w-32 hidden sm:block pointer-events-none" style={{ perspective: '800px' }}>
                <div className="absolute right-0 bottom-[-10px] w-14 h-24 rounded-lg bg-amber-500/10 border border-amber-500/20 rotate-[-12deg] shadow-lg flex flex-col p-1 gap-1 text-[4px] leading-none select-none">
                  <div className="h-2 w-full bg-amber-500/20 rounded-sm" />
                  <div className="h-1 bg-white/20 rounded-sm" />
                  <div className="h-1 bg-white/20 rounded-sm" />
                </div>
                <div className="absolute right-6 bottom-[-5px] w-20 h-16 rounded-md bg-slate-500/10 border border-slate-500/25 rotate-[8deg] shadow-lg flex flex-col p-1 gap-1 text-[3px] leading-none select-none">
                  <div className="h-1.5 w-full bg-slate-500/20 rounded-sm" />
                  <div className="grid grid-cols-3 gap-0.5">
                    <div className="h-6 bg-white/10 rounded-sm" />
                    <div className="h-6 bg-white/10 rounded-sm" />
                    <div className="h-6 bg-white/10 rounded-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Calendar Sync */}
            <div className={`md:col-span-1 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg flex flex-col justify-between min-h-[160px] ${isLight ? 'bg-white border-slate-200/60 shadow-sm' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
              }`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/[0.06] text-amber-300'
                    }`}>
                    <Moon className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-left">{copy.card2Title}</h4>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed text-left">
                  {copy.card2Desc}
                </p>
              </div>
            </div>

            {/* Card 3: WhatsApp & QR Sharing */}
            <div className={`md:col-span-1 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg flex flex-col justify-between min-h-[160px] ${isLight ? 'bg-white border-slate-200/60 shadow-sm' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
              }`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/[0.06] text-amber-300'
                    }`}>
                    <Share2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-left">{copy.card3Title}</h4>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed text-left">
                  {copy.card3Desc}
                </p>
              </div>
            </div>

            {/* Card 4: Clash Detection & Attendance */}
            <div className={`md:col-span-2 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[160px] ${isLight ? 'bg-white border-slate-200/60 shadow-sm' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
              }`}>
              <div className="space-y-2 max-w-full sm:max-w-[52%]">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/[0.06] text-amber-300'
                    }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-left">{copy.card4Title}</h4>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed text-left">
                  {copy.card4Desc}
                </p>
              </div>

              {/* Decorative Mini Widgets */}
              <div className="absolute right-5 bottom-4 hidden sm:flex items-center gap-3 pointer-events-none">
                <div className="px-2 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-[8px] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{copy.clashAlert}</span>
                </div>
                <div className="relative h-10 w-10 flex items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[9px] font-black text-emerald-500">
                  95%
                </div>
              </div>
            </div>

            {/* Card 5: Smart QR Attendance Scan */}
            <div className={`md:col-span-3 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[140px] ${isLight ? 'bg-white border-slate-200/60 shadow-sm' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
              }`}>
              <div className="space-y-2 max-w-full sm:max-w-[70%]">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/[0.06] text-amber-300'
                    }`}>
                    <ScanLine className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-left">{copy.card5Title}</h4>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed text-left">
                  {copy.card5Desc}
                </p>
              </div>

              {/* Decorative Mini Widgets */}
              <div className="absolute right-6 bottom-4 top-4 hidden sm:flex flex-col items-center justify-center gap-2 pointer-events-none opacity-80">
                <div className="h-14 w-14 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 flex items-center justify-center relative">
                  <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-amber-500"></div>
                  <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-amber-500"></div>
                  <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-amber-500"></div>
                  <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-amber-500"></div>
                  <div className="h-[2px] w-full bg-amber-500/50 absolute top-1/2 -translate-y-1/2 rounded-full"></div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <LandingSecondarySections copy={copy} isLight={isLight} lang={lang} theme={theme} />

        {/* Footer */}
        <footer className="mt-12 sm:mt-20 border-t border-slate-200/40 dark:border-white/5 pt-5 sm:pt-6 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 text-[9px] uppercase tracking-[0.25em] opacity-60">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-amber-500">STEM USAS</span>
            <span className="opacity-30 text-[8px]">-</span>
            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>zis3c</span>
            <span className="opacity-30 text-[8px]">-</span>
            {import.meta.env.VITE_GIT_COMMIT ? (
              <a
                href={`https://github.com/zis3c/USAS-Class-Timetable/commit/${import.meta.env.VITE_GIT_COMMIT}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`Build ${import.meta.env.VITE_GIT_COMMIT}`}
                className="text-slate-500 hover:text-amber-500"
              >
                build {import.meta.env.VITE_GIT_COMMIT.slice(0, 7)}
              </a>
            ) : (
              <span className="text-slate-500">build local</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://www.instagram.com/persatuan.stem.usas/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={`h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 transition-all shadow-sm ${
                theme === THEMES.EMERALD
                  ? 'hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/30'
                  : 'hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500/30'
              }`}
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.tiktok.com/@persatuan.stem.usas"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className={`h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 transition-all shadow-sm ${
                theme === THEMES.EMERALD
                  ? 'hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/30'
                  : 'hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500/30'
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.18 1.02.99 2.4 1.52 3.82 1.63V9.79c-1.39-.08-2.76-.56-3.88-1.42-.49-.38-.91-.84-1.25-1.37v9.06c.05 1.54-.37 3.08-1.2 4.35-1.12 1.68-2.95 2.82-4.97 3.12-1.62.29-3.31.05-4.78-.68-1.84-.88-3.25-2.52-3.86-4.51-.59-1.85-.38-3.92.58-5.61 1.02-1.78 2.8-3.03 4.84-3.41 1.02-.2 2.07-.15 3.08.13V8.87c-.8-.23-1.65-.28-2.48-.15-1.2.18-2.32.79-3.15 1.69-.99 1.04-1.47 2.47-1.31 3.89.14 1.48.92 2.83 2.11 3.69.96.72 2.14 1.09 3.34 1.05 1.22-.01 2.41-.49 3.27-1.36.81-.84 1.22-2 1.2-3.17V.02z" />
              </svg>
            </a>
            <a
              href="https://github.com/zis3c/USAS-Class-Timetable"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className={`h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 transition-all shadow-sm ${
                theme === THEMES.EMERALD
                  ? 'hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/30'
                  : 'hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500/30'
              }`}
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </footer>

      </section>

      {/* Floating Scroll-to-Top Button */}
      <button
        onClick={() => {
          const lenis = (window as Window & { usasLenis?: { scrollTo: (target: number, options?: { duration?: number }) => void } }).usasLenis;
          if (lenis) {
            lenis.scrollTo(0, { duration: 1.5 });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 p-3 sm:p-4 rounded-full shadow-2xl border transition-all duration-300 transform backdrop-blur-[2px] ${
          scrollY > 300 ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'
        } ${
          isLight 
            ? 'bg-white/20 border-white/40 text-slate-800 hover:bg-white/40 hover:text-amber-600 shadow-slate-200/50' 
            : 'bg-[#0B1426]/20 border-amber-500/20 text-white hover:bg-[#0B1426]/40 hover:border-amber-500/50 hover:text-amber-400 shadow-black/50'
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

    </div>
  );
}
