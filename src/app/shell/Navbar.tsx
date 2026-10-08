import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import type { LanguageCode } from '@/shared/types/usas';
import { 
  Menu, RefreshCw, WifiOff, Sun, Moon, 
  ArrowRight, Globe, ChevronDown, Check 
} from 'lucide-react';

type NavbarProps = {
  onOpenTools: () => void;
  onOpenPdfModal?: () => void;
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
  view: 'landing' | 'login' | 'app';
};

const LANGUAGES: { code: LanguageCode; label: string; short: string; native: string }[] = [
  { code: 'en', label: 'English', short: 'EN', native: 'English' },
  { code: 'ms', label: 'Bahasa Melayu', short: 'BM', native: 'Bahasa Melayu' },
  { code: 'zh', label: 'Chinese (Simplified)', short: '中文', native: '简体中文' },
  { code: 'ta', label: 'Tamil', short: 'தமிழ்', native: 'தமிழ்' },
];

export default function Navbar({ onOpenTools, onNavigateHome, onNavigateLogin, view }: NavbarProps) {
  const { session, refreshTimetable, loading, isOffline, timeFormat, setTimeFormat } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { theme, changeTheme, THEMES } = useTheme();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'light';

  // Handle clicking outside of language menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    if (langMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [langMenuOpen]);

  const activeLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <header className={`sticky top-0 h-12 sm:h-14 flex-shrink-0 border-b px-4 sm:px-6 relative z-50 transition-colors duration-150 ${isLight
        ? 'bg-white border-slate-200 text-slate-800'
        : `${
            theme === THEMES.OLED ? 'bg-black/98' :
            theme === THEMES.EMERALD ? 'bg-[#012117]/98' :
            'bg-[#060E1F]/98'
          } border-white/[0.06] backdrop-blur-md text-white`
      }`}>
      <div className="h-full w-full flex items-center justify-between">

        {/* Left: Brand & Badges */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 min-w-0 cursor-pointer select-none"
          >
            <img src={isLight ? '/usas-logo-light.png' : '/usas-logo-dark.png'} alt="USAS Emblem" className={`w-8 h-8 object-contain ${isLight ? 'drop-shadow-[0_2px_8px_rgba(16,47,97,0.15)]' : 'drop-shadow-[0_2px_8px_rgba(255,204,0,0.2)]'}`} />
            <div className="flex flex-col justify-center text-left leading-none min-w-0">
              <h2 className={`max-w-[11rem] sm:max-w-none truncate text-[11px] sm:text-[12px] font-semibold tracking-tight leading-none whitespace-nowrap ${isLight ? 'text-slate-800' : 'text-white'}`}>
                USAS Class Timetable
              </h2>
              <p className={`hidden sm:block text-[9px] font-bold uppercase tracking-[0.15em] mt-0.5 whitespace-nowrap ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                Universiti Sultan Azlan Shah
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            {session?.isDemo && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold border flex-shrink-0 ${isLight
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-amber-400/10 text-amber-400 border-amber-400/15'
                }`}>
                {t('demoMode')}
              </span>
            )}
            {isOffline && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold border flex-shrink-0 ${isLight
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                <WifiOff className="w-2.5 h-2.5" /> {t('offlineMode')}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 min-w-0 justify-end">
          
          {/* Custom Language Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              aria-label="Select Language"
              className={`h-7 px-2 flex items-center gap-1 rounded-md text-[11px] font-semibold transition-all border ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-amber-300'
              }`}
            >
              <Globe className="w-3 h-3 opacity-70" />
              <span>{activeLangObj.short}</span>
              <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-150 ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {langMenuOpen && (
              <div 
                className={`absolute right-0 mt-1.5 w-44 rounded-xl border p-1 shadow-2xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 ${
                  isLight
                    ? 'bg-white/95 border-slate-200 shadow-slate-900/15 text-slate-800'
                    : 'bg-[#0A1428]/95 border-white/10 shadow-black/60 text-white'
                }`}
              >
                <div className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                  Select Language
                </div>
                {LANGUAGES.map((item) => {
                  const isSelected = item.code === lang;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLang(item.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                        isSelected
                          ? (isLight ? 'bg-amber-50 text-amber-800 font-bold' : 'bg-amber-400/15 text-amber-300 font-bold')
                          : (isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/[0.06] text-white/80')
                      }`}
                    >
                      <div className="flex flex-col leading-snug">
                        <span>{item.native}</span>
                        <span className={`text-[9.5px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                          {item.label}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Theme Switcher Button */}
          <button
            onClick={(e) => changeTheme(theme === THEMES.LIGHT ? THEMES.NAVY : THEMES.LIGHT, e)}
            aria-label="Toggle theme"
            className={`h-7 w-7 flex items-center justify-center rounded-md text-xs transition-all border ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-amber-300'
            }`}
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          {!session && view === 'landing' && (
            <button
              onClick={onNavigateLogin}
              aria-label={lang === 'ms' ? 'Ke log masuk' : lang === 'zh' ? '登录' : lang === 'ta' ? 'உள்நுழைக' : 'Login'}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-semibold transition-colors ${isLight
                  ? 'bg-[#0B1E43] text-white hover:bg-[#152e63]'
                  : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                }`}
            >
              {lang === 'ms' ? 'Log Masuk' : lang === 'zh' ? '登录' : lang === 'ta' ? 'உள்நுழைக' : 'Login'}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {session && (
            <>
              <button
                type="button"
                onClick={() => setTimeFormat(timeFormat === '24h' ? '12h' : '24h')}
                aria-label={lang === 'ms'
                  ? `Format masa ${timeFormat === '24h' ? '24 jam' : '12 jam'}. Tukar format`
                  : `Time format ${timeFormat}. Switch format`}
                title={lang === 'ms' ? 'Tukar format jam' : 'Switch time format'}
                className={`h-7 min-w-10 px-1.5 rounded-md border text-[10px] font-bold transition-colors ${isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-amber-300'
                }`}
              >
                {timeFormat.toUpperCase()}
              </button>

              {/* Refresh */}
              <button
                onClick={refreshTimetable}
                disabled={loading}
                aria-label="Refresh timetable"
                className={`p-1.5 rounded-md transition-colors disabled:opacity-30 ${isLight
                    ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                  }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Tools menu */}
              <button
                onClick={onOpenTools}
                aria-label="Open tools and export"
                className={`p-1.5 rounded-md transition-colors ${isLight
                    ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                  }`}
              >
                <Menu className="w-4 h-4" />
              </button>

            </>
          )}
        </div>

      </div>
    </header>
  );
}
