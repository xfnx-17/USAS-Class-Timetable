import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { X, User, Mail, Building, Clock, Copy, Check } from 'lucide-react';
import { copyTextToClipboard, sanitizeTextForShare } from '@/shared/lib/security';

type LecturerModalProps = {
  lecturerName: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function LecturerModal({ lecturerName, isOpen, onClose }: LecturerModalProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const isLight = theme === 'light';
  const copiedTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  const [cachedName, setCachedName] = useState(lecturerName);

  useEffect(() => {
    if (lecturerName) setCachedName(lecturerName);
  }, [lecturerName]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      let raf1: number;
      let raf2: number;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setAnimate(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }

    setAnimate(false);
    const timer = setTimeout(() => setShouldRender(false), 200);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!shouldRender || !cachedName) return null;

  const emailName = cachedName
    .replace(/^(DR\.|EN\.|PN\.|USTAZ|PM DR\.|PROF\.)\s*/i, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.');

  const email = `${emailName || 'pensyarah'}@usas.edu.my`;

  const handleCopyEmail = () => {
    void copyTextToClipboard(email);
    if (!mountedRef.current) return;
    setCopied(true);
    if (copiedTimerRef.current !== null) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      setCopied(false);
      copiedTimerRef.current = null;
    }, 2000);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200 ${
      animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
    }`}>
      
      <div className={`rounded-xl w-full max-w-[92vw] sm:max-w-md border pt-4 px-4 sm:px-6 pb-6 space-y-5 relative transition-all duration-200 transform ${
        animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      } ${
        isLight 
          ? 'bg-white border-slate-200 shadow-xl text-slate-800' 
          : 'bg-[#0A1428]/95 border-white/10 text-white shadow-2xl'
      }`}>
        {/* Left-Aligned Icon Modal Header */}
        <div className="flex items-start sm:items-center justify-between gap-3 pt-0 flex-shrink-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
            }`}>
              <User className="w-6 h-6" />
            </div>
            <div className="text-left min-w-0">
              <h3 className={`text-sm sm:text-base font-bold leading-tight truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{sanitizeTextForShare(cachedName, 160)}</h3>
              <p className={`text-[11px] sm:text-xs font-semibold truncate ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Pensyarah Universiti Sultan Azlan Shah</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-white/30 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className={`space-y-3 text-xs p-4 rounded-xl border shadow-inner ${
          isLight ? 'bg-slate-50/50 border-slate-200/80' : 'bg-white/[0.02] border-white/[0.05]'
        }`}>
          
          <div className="flex items-start gap-3">
            <Building className="w-4 h-4 text-sky-500 flex-shrink-0" />
            <div className="text-left min-w-0">
              <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Fakulti / Jabatan</div>
              <div className={`font-semibold break-words ${isLight ? 'text-slate-700' : 'text-white'}`}>Fakulti Teknologi & Sains Maklumat (FTMK)</div>
            </div>
          </div>

          <div className={`flex items-start gap-3 pt-2 border-t text-left ${isLight ? 'border-slate-200' : 'border-white/[0.05]'}`}>
            <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Waktu Konsultasi Pelajar</div>
              <div className={`font-semibold break-words ${isLight ? 'text-slate-700' : 'text-white'}`}>Selasa & Khamis (02:00 PM - 04:00 PM)</div>
            </div>
          </div>

          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-white/[0.05]'}`}>
            <div className="flex items-center gap-3 min-w-0 truncate text-left">
              <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div className="min-w-0 truncate">
                <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>E-mel Rasmi</div>
                <div className={`font-semibold truncate ${isLight ? 'text-slate-600' : 'text-white/80'}`}>{email}</div>
              </div>
            </div>

            <button
              onClick={handleCopyEmail}
              className={`w-full sm:w-auto p-2 rounded-md text-xs font-semibold transition-all flex-shrink-0 flex items-center justify-center gap-1 border ${
                isLight 
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700' 
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-amber-400 border-amber-400/20'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Disalin' : 'Salin'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
