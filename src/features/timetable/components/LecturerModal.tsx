import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { X, User, Mail, Phone, Briefcase, Copy, Check, Loader2 } from 'lucide-react';
import { copyTextToClipboard, sanitizeTextForShare } from '@/shared/lib/security';
import { searchLecturerDirectoryAPI, type LecturerDirectoryEntry } from '@/services/usas/Api';

type LecturerModalProps = {
  lecturerName: string | null;
  isOpen: boolean;
  onClose: () => void;
};

type LookupStatus = 'idle' | 'loading' | 'found' | 'notfound' | 'error' | 'unavailable';

const TITLE_PREFIX = /^(PM\.?\s*DR\.?|DR\.?|PROF\.?|EN\.?|PN\.?|USTAZAH|USTAZ|HAJI|HAJAH)\s+/i;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// In-memory cache so re-opening the same lecturer does not hit the API again.
const directoryCache = new Map<string, LecturerDirectoryEntry | null>();

function stripTitlePrefix(value: string): string {
  return value.replace(TITLE_PREFIX, '').trim();
}

function normalizeName(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function pickBestMatch(list: LecturerDirectoryEntry[], targetName: string): LecturerDirectoryEntry | null {
  const target = normalizeName(targetName);
  if (!target) return null;
  const targetTokens = new Set(target.split(' ').filter(Boolean));

  let best: LecturerDirectoryEntry | null = null;
  let bestScore = 0;

  for (const item of list) {
    const candidate = normalizeName(item.name);
    if (!candidate) continue;
    const tokens = candidate.split(' ').filter(Boolean);
    const overlap = tokens.filter((token) => targetTokens.has(token)).length;
    const isDirectMatch = candidate === target || candidate.includes(target) || target.includes(candidate);
    const isTokenMatch = overlap >= Math.max(2, Math.ceil(targetTokens.size * 0.6));

    if ((isDirectMatch || isTokenMatch) && overlap > bestScore) {
      best = item;
      bestScore = overlap;
    }
  }

  return best;
}

export default function LecturerModal({ lecturerName, isOpen, onClose }: LecturerModalProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const { session } = useAuth();

  const isLight = theme === 'light';
  const copiedTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  const [cachedName, setCachedName] = useState(lecturerName);
  const [entry, setEntry] = useState<LecturerDirectoryEntry | null>(null);
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');

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

  // Resolve the real lecturer record (email, position, extension) from the
  // official USAS staff directory instead of deriving it from the name.
  useEffect(() => {
    if (!isOpen || !cachedName) return;

    if (session?.isDemo) {
      setEntry(null);
      setLookupStatus('unavailable');
      return;
    }

    const cacheKey = normalizeName(cachedName);
    if (directoryCache.has(cacheKey)) {
      const cached = directoryCache.get(cacheKey) ?? null;
      setEntry(cached);
      setLookupStatus(cached ? 'found' : 'notfound');
      return;
    }

    let active = true;
    setEntry(null);
    setLookupStatus('loading');

    searchLecturerDirectoryAPI(session, stripTitlePrefix(cachedName))
      .then((list) => {
        if (!active) return;
        const best = pickBestMatch(list, cachedName);
        directoryCache.set(cacheKey, best);
        setEntry(best);
        setLookupStatus(best ? 'found' : 'notfound');
      })
      .catch(() => {
        if (active) setLookupStatus('error');
      });

    return () => {
      active = false;
    };
  }, [isOpen, cachedName, session]);

  if (!shouldRender || !cachedName) return null;

  const email = entry && EMAIL_PATTERN.test(entry.email) ? entry.email : '';
  const hasPosition = Boolean(entry?.position && entry.position !== '-');
  const hasExt = Boolean(entry?.ext && entry.ext !== '-');
  const hasStaffNo = Boolean(entry?.staffNo);

  const handleCopyEmail = () => {
    if (!email) return;
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
              <p className={`text-[11px] sm:text-xs font-semibold truncate ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                {hasPosition ? entry?.position : 'Pensyarah Universiti Sultan Azlan Shah'}
              </p>
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
          
          {hasPosition && (
            <div className="flex items-start gap-3">
              <Briefcase className="w-4 h-4 text-sky-500 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Jawatan</div>
                <div className={`font-semibold break-words ${isLight ? 'text-slate-700' : 'text-white'}`}>{entry?.position}</div>
              </div>
            </div>
          )}

          {hasExt && (
            <div className={`flex items-start gap-3 ${hasPosition ? 'pt-2 border-t' : ''} text-left ${isLight ? 'border-slate-200' : 'border-white/[0.05]'}`}>
              <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>No. Telefon (Sambungan)</div>
                <div className={`font-semibold break-words ${isLight ? 'text-slate-700' : 'text-white'}`}>{entry?.ext}</div>
              </div>
            </div>
          )}

          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${(hasPosition || hasExt) ? 'pt-2 border-t' : ''} ${isLight ? 'border-slate-200' : 'border-white/[0.05]'}`}>
            <div className="flex items-center gap-3 min-w-0 truncate text-left">
              <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div className="min-w-0 truncate">
                <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>E-mel Rasmi</div>
                {lookupStatus === 'loading' ? (
                  <div className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mencari e-mel pensyarah...</span>
                  </div>
                ) : email ? (
                  <div className={`font-semibold truncate ${isLight ? 'text-slate-600' : 'text-white/80'}`}>{email}</div>
                ) : (
                  <div className={`font-semibold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                    {lookupStatus === 'unavailable' ? 'Tidak tersedia dalam mod demo.' : 'Tiada e-mel rasmi dijumpai dalam direktori.'}
                  </div>
                )}
              </div>
            </div>

            {email && lookupStatus !== 'loading' && (
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
            )}
          </div>

          {hasStaffNo && (
            <div className={`flex items-start gap-3 pt-2 border-t text-left ${isLight ? 'border-slate-200' : 'border-white/[0.05]'}`}>
              <User className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>No. Staf</div>
                <div className={`font-semibold break-words ${isLight ? 'text-slate-700' : 'text-white'}`}>{entry?.staffNo}</div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
