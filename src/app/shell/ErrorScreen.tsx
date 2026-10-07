import { ArrowLeft, RefreshCw, ShieldAlert, WifiOff } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme, THEMES } from '@/app/providers/ThemeProvider';
import { getOwnRecordValue } from '@/shared/lib/security';

type ErrorScreenProps = {
  status: 404 | 500 | 502 | 503 | 504;
  title?: string;
  message?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  offline?: boolean;
};

const defaultCopy: Record<ErrorScreenProps['status'], { title: string; message: string; primary: string; secondary: string }> = {
  404: {
    title: 'Page not found',
    message: 'The route you opened does not exist in this app.',
    primary: 'Go home',
    secondary: 'Back',
  },
  500: {
    title: 'App error',
    message: 'Something broke while loading the page.',
    primary: 'Reload',
    secondary: 'Go home',
  },
  502: {
    title: 'Bad gateway',
    message: 'The upstream service returned a bad response.',
    primary: 'Try again',
    secondary: 'Go home',
  },
  503: {
    title: 'Service unavailable',
    message: 'The service is temporarily unavailable.',
    primary: 'Retry',
    secondary: 'Go home',
  },
  504: {
    title: 'Gateway timeout',
    message: 'The request took too long to complete.',
    primary: 'Retry',
    secondary: 'Go home',
  },
};

export default function ErrorScreen({
  status,
  title,
  message,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  offline = false,
}: ErrorScreenProps) {
  const { lang } = useLanguage();
  const { theme } = useTheme();

  const isLight = theme === THEMES.LIGHT;
  const copy = getOwnRecordValue<typeof defaultCopy[404]>(defaultCopy, status) || defaultCopy[404];
  const heading = title || copy.title;
  const body = message || copy.message;
  const primary = primaryLabel || copy.primary;
  const secondary = secondaryLabel || copy.secondary;

  return (
    <div
      className={`relative min-h-[100svh] w-full overflow-hidden px-4 py-4 sm:px-6 sm:py-8 ${
        isLight ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#060E1F] text-slate-100'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-[100px] opacity-40 ${isLight ? 'bg-amber-200' : 'bg-amber-500/10'}`} />
        <div className={`absolute bottom-0 right-0 h-96 w-96 rounded-full blur-[120px] opacity-30 ${isLight ? 'bg-sky-200' : 'bg-sky-500/10'}`} />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-3xl items-center">
        <div
          className={`w-full rounded-[28px] border p-5 shadow-2xl backdrop-blur-xl sm:p-8 ${
            isLight ? 'bg-white border-slate-200 shadow-slate-200/60' : 'bg-[#0A1428]/95 border-white/[0.08] shadow-black/40'
          }`}
        >
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide shadow-sm ${
            isLight
              ? 'border-slate-200 bg-slate-100/50 text-[#0B1E43]'
              : 'border-white/10 bg-white/5 text-slate-300'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
            <span>USAS Class Timetable</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[auto,minmax(0,1fr)] sm:items-center sm:gap-5">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border sm:h-16 sm:w-16 ${
                offline
                  ? 'bg-sky-500/10 border-sky-400/20 text-sky-400'
                  : isLight
                    ? 'bg-amber-50 border-amber-200 text-amber-600'
                    : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
              }`}
            >
              {offline ? <WifiOff className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>

            <div className="min-w-0">
              <div className={`text-[10px] font-black uppercase tracking-[0.24em] ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                {lang === 'ms' ? 'Ralat aplikasi' : 'Application error'}
              </div>
              <h1 className="mt-1 text-[clamp(1.75rem,4.5vw,3rem)] font-black tracking-tight text-balance">
                {heading}
              </h1>
            </div>
          </div>

          <p className={`mt-4 max-w-2xl text-sm leading-relaxed sm:text-base ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {body}
          </p>

          <div className={`mt-6 rounded-2xl border p-4 sm:p-5 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/[0.06] bg-white/[0.03]'}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
              {lang === 'ms' ? 'Apa yang boleh dibuat' : 'What you can do'}
            </p>
            <ul className={`mt-3 space-y-2 text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              <li>Reload the page after the network is back.</li>
              <li>Return to the landing page or login screen.</li>
              <li>Check whether the requested route is correct.</li>
            </ul>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onPrimary}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all ${
                isLight ? 'bg-[#0B1E43] text-white hover:bg-[#152e63]' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              {primary}
            </button>
            <button
              type="button"
              onClick={onSecondary}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-bold transition-all ${
                isLight ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50' : 'border-white/[0.08] bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              {secondary}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



