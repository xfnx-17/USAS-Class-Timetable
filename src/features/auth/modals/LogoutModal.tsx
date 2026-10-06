import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useModalA11y } from '@/shared/lib/useModalA11y';
import { LogOut } from 'lucide-react';

type LogoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  const modalRef = useModalA11y(isOpen, onClose);
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const [animate, setAnimate] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnimate(false);
      setShouldRender(true);
      let raf1 = 0;
      let raf2 = 0;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setAnimate(true));
      });
      document.body.style.overflow = 'hidden';
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
        document.body.style.overflow = '';
      };
    } else {
      setAnimate(false);
      document.body.style.overflow = '';
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const isLight = theme === 'light';

  const copy = {
    title: lang === 'ms' ? 'Log Keluar' : 'Log Out',
    desc: lang === 'ms' 
      ? 'Adakah anda pasti untuk menamatkan sesi ini? Data jadual akan dipadam dari pelayar anda buat sementara waktu.' 
      : 'Are you sure you want to end this session? All timetable data will be cleared from your browser cache.',
    cancel: lang === 'ms' ? 'Batal' : 'Cancel',
    confirm: lang === 'ms' ? 'Ya, Log Keluar' : 'Yes, Log Out',
  };

  return (
    <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Log Keluar" className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200 touch-none ${
      animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
    }`}>
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      />

      <div 
        className={`relative w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden flex flex-col transform transition-all duration-200 ${
          animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${
          isLight 
            ? 'bg-white border-slate-200' 
            : 'bg-[#0A1428]/95 border-white/10 text-white'
        }`}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.06] bg-[#0A1428]/95'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <LogOut className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-red-600' : 'text-red-400'}`} />
            <h2 className={`text-sm sm:text-base font-bold tracking-wide truncate ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {copy.title}
            </h2>
          </div>
        </div>

        <div className="p-5">
          <p className={`text-[13px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
            {copy.desc}
          </p>
        </div>

        <div className={`px-5 py-4 border-t flex items-center justify-end gap-2 ${
          isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.06] bg-[#0A1428]/95'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
              isLight 
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm' 
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border-white/10'
            }`}
          >
            {copy.cancel}
          </button>
          
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
              isLight 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20' 
                : 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
            }`}
          >
            {copy.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
