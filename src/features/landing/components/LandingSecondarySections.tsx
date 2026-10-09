import { useState } from 'react';
import { Download, ExternalLink, Play, Send, ShieldAlert } from 'lucide-react';
import type { LanguageCode, ThemeName } from '@/shared/types/usas';
import { THEMES } from '@/app/providers/ThemeProvider';
import { usePwaInstall } from '@/features/pwa/hooks/usePwaInstall';
import type { LandingCopy } from '../data/landingCopy';

type LandingSecondarySectionsProps = {
  copy: LandingCopy;
  isLight: boolean;
  lang: LanguageCode;
  theme: ThemeName;
};

export default function LandingSecondarySections({ copy, isLight, lang, theme }: LandingSecondarySectionsProps) {
  const { installed, promptInstall } = usePwaInstall();
  const [installMessage, setInstallMessage] = useState('');

  const handleInstall = async () => {
    if (installed) {
      setInstallMessage(lang === 'ms' ? 'Aplikasi sudah dipasang.' : 'App is already installed.');
      return;
    }
    const result = await promptInstall();
    setInstallMessage(result === 'accepted'
      ? (lang === 'ms' ? 'Aplikasi berjaya dipasang.' : 'App installed successfully.')
      : result === 'dismissed'
        ? (lang === 'ms' ? 'Pemasangan dibatalkan.' : 'Installation was cancelled.')
        : lang === 'ms'
          ? 'Buka menu pelayar, kemudian pilih Tambah ke Skrin Utama atau Pasang Aplikasi.'
          : 'Open your browser menu, then choose Add to Home Screen or Install App.');
  };

  return (
    <>
        {/* Install App (PWA) Suggestion Section */}
        <div className={`mt-24 rounded-2xl border p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 justify-between text-center sm:text-left transition-all hover:shadow-lg ${
          isLight
            ? 'bg-gradient-to-br from-amber-50 to-white border-amber-200/60 shadow-sm'
            : 'bg-gradient-to-br from-amber-900/10 to-transparent border-amber-500/20 shadow-xl'
        }`}>
          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
            <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-inner ${
              isLight ? 'bg-white border border-amber-100 shadow-amber-500/10' : 'bg-[#0A1428] border border-amber-500/30 shadow-black'
            }`}>
              <Download className={`w-8 h-8 sm:w-10 sm:h-10 ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className={`text-lg font-black tracking-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {copy.installTitle}
              </h3>
              <p className={`text-[11px] sm:text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                {copy.installDesc}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button onClick={() => void handleInstall()} className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 ${
              isLight
                ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-amber-500/20'
                : 'bg-amber-400 text-slate-900 hover:bg-amber-300 hover:shadow-amber-400/20'
            }`}>
              {copy.installTitle}
            </button>
            {installMessage && <p role="status" className="mt-2 max-w-48 text-[10px] leading-snug opacity-70">{installMessage}</p>}
          </div>
        </div>

        {/* Video Tutorial Walkthrough Section */}
        <div id="guide-video" className="mt-24 max-w-2xl mx-auto space-y-6 scroll-mt-24">
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-lg font-black tracking-tight text-amber-500">{copy.videoTitle}</h3>
            <p className="text-xs opacity-75">{copy.videoDesc}</p>
          </div>

          <div
            className={`group rounded-2xl border p-4 transition-all duration-300 relative overflow-hidden aspect-[4/3] sm:aspect-video min-h-[220px] sm:min-h-0 flex items-center justify-center cursor-pointer shadow-md ${isLight
              ? 'bg-slate-100/50 border-slate-200'
              : 'bg-white/[0.015] border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.025]'
              }`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity z-0" />

            <div className="h-16 w-16 rounded-full bg-[#0A1428]/80 backdrop-blur border border-white/20 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:text-amber-300 transition-all duration-300 shadow-xl z-10">
              <Play className="w-6 h-6 fill-amber-400 group-hover:fill-amber-300 translate-x-[1px]" />
            </div>

            <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[8px] tracking-widest font-mono text-white/50 z-10 select-none">
              <span>0:00 / 0:59</span>
              <div className="flex-1 mx-3 h-[2px] rounded-full bg-white/20 overflow-hidden">
                <div className="w-[18%] h-full bg-amber-500 rounded-full" />
              </div>
              <span>1080P HD</span>
            </div>
          </div>
        </div>

        {/* Previous STEM Projects */}
        <div className="mt-24 max-w-2xl mx-auto space-y-6">
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-lg font-black tracking-tight text-amber-500">{copy.botsTitle}</h3>
            <p className="text-xs opacity-75">{copy.botsDesc}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {copy.bots.map((bot, idx) => (
              <a
                key={idx}
                href={bot.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[140px] hover:shadow-lg ${isLight
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
                  }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest ${bot.color}`}>
                        TELEGRAM
                      </span>
                      <span className="text-[10px] opacity-40 font-bold font-mono">{bot.tag}</span>
                    </div>
                    <Send className="w-3.5 h-3.5 opacity-45 hover:opacity-100 hover:text-amber-500 transition-all" />
                  </div>
                  <h4 className="font-extrabold text-sm text-left">{bot.name}</h4>
                  <p className="text-[11px] opacity-70 leading-relaxed text-left">{bot.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Join STEM USAS Membership Card */}
        <div className="mt-24 max-w-2xl mx-auto">
          <div className={`rounded-2xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden transition-all duration-300 hover:shadow-xl ${isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-gradient-to-br from-amber-500/[0.03] to-transparent border-white/[0.05] hover:border-white/[0.08]'
            }`}>
            <div className="space-y-3 text-center sm:text-left max-w-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                <img
                  src="/stem-logo.png"
                  alt="Persatuan Sains Teknologi & Multimedia"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md"
                />
                <div className="space-y-1">
                  <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black tracking-widest bg-amber-500/10 text-amber-500">
                    {lang === 'ms' ? 'KEAHLIAN' : lang === 'zh' ? '会员注册' : lang === 'ta' ? 'உறுப்பினர்' : 'MEMBERSHIP'}
                  </span>
                  <h3 className="text-lg font-black tracking-tight leading-tight">{copy.joinTitle}</h3>
                </div>
              </div>
              <p className="text-xs opacity-70 leading-relaxed">{copy.joinDesc}</p>
            </div>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSchZH3A3wvlq2RQE47KorzGNLqDgX48zc4PP46kapENjnBiBA/viewform?fbzx=7657887268860346255&pli=1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-full text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-900 transition-all transform hover:scale-105 shadow-md shrink-0 uppercase tracking-widest font-mono"
            >
              <span>{copy.joinButton}</span>
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5px]" />
            </a>
          </div>
        </div>

        {/* Security & Data Privacy Disclaimer Card */}
        <div className={`mt-12 border rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 max-w-2xl mx-auto ${isLight
          ? 'bg-amber-50/40 border-amber-200/50 text-amber-900 shadow-sm'
          : 'bg-amber-500/[0.02] border-amber-500/10 text-slate-300'
          }`}>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/10 text-amber-400'
            }`}>
            <ShieldAlert className="w-5.5 h-5.5" />
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className={`text-xs font-black tracking-wider uppercase ${isLight ? 'text-amber-850' : 'text-amber-400'}`}>
              {copy.disclaimerTitle}
            </h3>
            <p className="text-xs leading-relaxed opacity-75">
              {copy.disclaimerText}
            </p>
            <a
              href="https://github.com/zis3c/USAS-Class-Timetable/blob/main/docs/PRIVACY.md"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs font-bold underline underline-offset-2"
            >
              {copy.privacyLink}
            </a>
          </div>
        </div>

        {/* Technical Helpdesk Section */}
        <div className="mt-12 max-w-2xl mx-auto text-slate-800 dark:text-slate-100">
          <div className={`rounded-2xl border p-6 flex flex-col md:flex-row items-stretch justify-between gap-6 relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : theme === THEMES.EMERALD
                ? 'bg-gradient-to-br from-emerald-500/[0.04] to-transparent border-emerald-500/20 hover:border-emerald-500/30'
                : theme === THEMES.OLED
                  ? 'bg-black border-white/[0.08] hover:border-white/[0.12]'
                  : 'bg-gradient-to-br from-amber-500/[0.02] to-transparent border-white/[0.05] hover:border-white/[0.08]'
          }`}>

            {/* Left Column: Helpdesk Information */}
            <div className="flex-1 flex flex-col justify-between text-left space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black tracking-widest uppercase text-emerald-500 select-none">
                    {copy.helpdeskTag}
                  </span>
                </div>
                <h3 className={`text-lg font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {copy.helpdeskTitle}
                </h3>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400 opacity-70'}`}>
                  {copy.helpdeskDesc}
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <div className="flex -space-x-2">
                  <div className={`h-6 w-6 rounded-full bg-amber-500 text-slate-950 font-bold border ${theme === THEMES.OLED ? 'border-black' : 'border-white dark:border-slate-950'} flex items-center justify-center text-[9px] select-none shadow-sm`}>
                    CS
                  </div>
                  <div className={`h-6 w-6 rounded-full bg-blue-500 text-white font-bold border ${theme === THEMES.OLED ? 'border-black' : 'border-white dark:border-slate-950'} flex items-center justify-center text-[9px] select-none shadow-sm`}>
                    TE
                  </div>
                  <div className={`h-6 w-6 rounded-full bg-emerald-500 text-white font-bold border ${theme === THEMES.OLED ? 'border-black' : 'border-white dark:border-slate-950'} flex items-center justify-center text-[9px] select-none shadow-sm`}>
                    ST
                  </div>
                </div>
                <span className={`text-[9.5px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400 opacity-50'}`}>
                  {copy.helpdeskTeam}
                </span>
              </div>
            </div>

            {/* Right Column: CTA Block */}
            <div className="flex-1 flex flex-col justify-center items-stretch">
              <a
                href="https://t.me/STEMUSAS"
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex flex-col items-center justify-center gap-2.5 p-5 rounded-xl border text-center transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 shadow-sm'
                    : theme === THEMES.EMERALD
                      ? 'bg-white/[0.015] border-emerald-500/15 hover:bg-white/[0.03] hover:border-emerald-500/30'
                      : theme === THEMES.OLED
                        ? 'bg-white/[0.015] border-white/[0.06] hover:bg-white/[0.035] hover:border-white/[0.1]'
                        : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.035] hover:border-white/[0.08]'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Send className="w-5 h-5 fill-[#0088cc]/20" />
                </div>
                <div className="space-y-0.5">
                  <h4 className={`font-extrabold text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {copy.helpdeskCta}
                  </h4>
                  <p className={`text-[10px] font-extrabold tracking-wider uppercase leading-none mt-1 ${
                    theme === THEMES.EMERALD ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    @STEMUSAS
                  </p>
                </div>
                <span className={`text-[9px] font-semibold leading-none ${isLight ? 'text-slate-500' : 'text-slate-400 opacity-40'}`}>
                  {copy.helpdeskResponse}
                </span>
              </a>
            </div>

          </div>
        </div>

    </>
  );
}
