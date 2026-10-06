import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { Download, X } from 'lucide-react';

export default function PwaInstallPrompt() {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const isLight = theme === 'light';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the browser from showing its default install prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).deferredPrompt = e;
      setDeferredPrompt(e);
      // Update UI to notify the user they can add to home screen
      setIsVisible(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).deferredPrompt) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDeferredPrompt((window as any).deferredPrompt);
      setIsVisible(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;

    // Prompt no longer needed; clear it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).deferredPrompt = null;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-20 left-4 right-4 sm:right-auto sm:left-6 sm:bottom-6 sm:max-w-sm z-50 p-3 sm:p-4 rounded-xl shadow-2xl border hidden sm:flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300 transform translate-y-0 backdrop-blur-[2px] ${isLight
        ? 'bg-white/20 border-white/40 text-slate-800 shadow-slate-200/50'
        : 'bg-[#0B1426]/20 border-amber-500/20 text-white shadow-black/50'
      }`}>
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
          }`}>
          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-[13px] sm:text-sm font-bold leading-tight truncate">
            {lang === 'ms' ? 'Pasang Aplikasi' : 'Install App'}
          </h4>
          <p className={`text-[9.5px] sm:text-[10px] mt-0.5 leading-snug truncate ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
            {lang === 'ms' ? 'Tambah ke skrin utama untuk akses pantas.' : 'Add to home screen for faster access.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          onClick={handleInstallClick}
          className={`px-2.5 py-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-colors ${isLight
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-amber-400 text-slate-900 hover:bg-amber-300'
            }`}
        >
          {lang === 'ms' ? 'Pasang' : 'Install'}
        </button>
        <button
          onClick={handleDismiss}
          className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-white/40 hover:bg-white/10'
            }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
