import React, { useState, useEffect } from 'react';
import { X, Moon, Clock, Calendar as CalendarIcon, MapPin, ChevronDown } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { fetchPrayerTimesAPI } from '@/services/jakim/JakimApi';
import type { WaktuSolatPrayer } from '@/shared/types/usas';
import { formatCountdown } from '../components/PrayerTimesWidget';
import { usePrayerZone } from '../components/PrayerTimesWidget';

interface PrayerTimesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormattedPrayer = {
  id: string;
  label: string;
  unix: number;
  timeStr: string;
  passed: boolean;
  isNext: boolean;
};

const PRAYER_ZONES = [
  { value: 'PRK02', label: 'Kuala Kangsar (PRK02)' },
  { value: 'WLY01', label: 'Kuala Lumpur (WLY01)' },
  { value: 'SGR01', label: 'Shah Alam (SGR01)' },
  { value: 'JHR04', label: 'Johor Bahru (JHR04)' },
  { value: 'KDH01', label: 'Alor Setar (KDH01)' },
  { value: 'KTN01', label: 'Kota Bharu (KTN01)' },
  { value: 'MLK01', label: 'Melaka City (MLK01)' },
  { value: 'NGS02', label: 'Seremban (NGS02)' },
  { value: 'PHG02', label: 'Kuantan (PHG02)' },
  { value: 'PLS01', label: 'Kangar (PLS01)' },
  { value: 'PNG01', label: 'Pulau Pinang (PNG01)' },
  { value: 'TRG01', label: 'K. Terengganu (TRG01)' },
  { value: 'SBH05', label: 'Kota Kinabalu (SBH05)' },
  { value: 'SWK08', label: 'Kuching (SWK08)' },
];

function PrayerZoneDropdown({
  value,
  onChange,
  isLight,
}: {
  value: string;
  onChange: (val: string) => void;
  isLight: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleGlobalClick = () => setOpen(false);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [open]);

  const selectedOption = PRAYER_ZONES.find(opt => opt.value === value);
  const labelText = selectedOption ? selectedOption.label : value;

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-semibold transition-all shadow-sm justify-between max-w-[150px] sm:max-w-[180px] ${
          isLight
            ? 'bg-white border-amber-200 text-amber-800 hover:bg-amber-50 shadow-amber-100/50'
            : 'bg-amber-400/10 border-amber-400/20 text-amber-200 hover:bg-amber-400/20'
        }`}
      >
        <MapPin className="w-3 h-3 opacity-70" />
        <span className="truncate">{labelText}</span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          data-lenis-prevent
          className={`absolute top-full right-0 mt-1 z-50 rounded-lg border shadow-xl max-h-48 overflow-y-auto usas-scrollbar focus:outline-none transition-all py-1 min-w-[160px] ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#0E1B35] border-white/10 text-white'
          }`}
        >
          {PRAYER_ZONES.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors ${
                opt.value === value
                  ? (isLight ? 'bg-amber-100 font-bold text-amber-900' : 'bg-amber-400/20 font-bold text-amber-300')
                  : (isLight ? 'hover:bg-slate-100' : 'hover:bg-white/[0.05]')
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PrayerTimesModal({ isOpen, onClose }: PrayerTimesModalProps) {
  const { session } = useAuth();
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const isLight = theme === 'light';

  const [prayers, setPrayers] = useState<FormattedPrayer[]>([]);
  const [zone, setZone] = usePrayerZone();
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
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

  // Update current time every second
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Fetch data
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);
    
    fetchPrayerTimesAPI(session, zone).then((res) => {
      if (active && res?.success && res.data?.prayers) {
        const todayDate = new Date().getDate();
        
        // Find today's prayer object from the month's array
        const todayPrayers = res.data.prayers.find((p: WaktuSolatPrayer) => p.day === todayDate);
        
        if (todayPrayers) {
          const makeTime = (unix: number) => {
            const date = new Date(unix * 1000);
            const hours = date.getHours();
            const mins = date.getMinutes();
            return `${hours % 12 || 12}:${mins.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
          };

          const raw = [
            { id: 'fajr', label: 'Subuh', unix: todayPrayers.fajr },
            { id: 'dhuhr', label: 'Zohor', unix: todayPrayers.dhuhr },
            { id: 'asr', label: 'Asar', unix: todayPrayers.asr },
            { id: 'maghrib', label: 'Maghrib', unix: todayPrayers.maghrib },
            { id: 'isha', label: 'Isyak', unix: todayPrayers.isha },
          ];

          // Determine passed and next
          const currentUnix = Math.floor(Date.now() / 1000);
          let foundNext = false;
          
          const formatted = raw.map(p => {
            const passed = p.unix <= currentUnix;
            let isNext = false;
            if (!passed && !foundNext) {
              isNext = true;
              foundNext = true;
            }
            return {
              ...p,
              timeStr: makeTime(p.unix),
              passed,
              isNext,
            };
          });

          setPrayers(formatted);
        }
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [isOpen, session, zone]);

  // Recalculate passed/next dynamically based on current `now`
  const dynamicPrayers = React.useMemo(() => {
    const currentUnix = Math.floor(now.getTime() / 1000);
    const nextIndex = prayers.findIndex(p => p.unix > currentUnix);
    return prayers.map((p, index) => ({
      ...p,
      passed: p.unix <= currentUnix,
      isNext: index === nextIndex,
    }));
  }, [prayers, now]);

  const nextPrayer = dynamicPrayers.find(p => p.isNext);
  const diffSeconds = nextPrayer ? nextPrayer.unix - Math.floor(now.getTime() / 1000) : 0;

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200 ${
      animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
    }`}>
      <div 
        className={`rounded-xl w-full max-w-[92vw] sm:max-w-2xl border flex flex-col min-h-0 overflow-hidden relative transition-all duration-200 transform max-h-[85dvh] sm:max-h-[90dvh] ${
          animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${
          isLight 
            ? 'bg-white border-slate-200 shadow-xl text-slate-800' 
            : 'bg-[#0A1428]/95 border-white/10 text-white shadow-2xl'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-start sm:items-center justify-between gap-3 flex-shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.06] bg-[#0A1428]/95'
        }`}>
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
            }`}>
              <Moon className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <h3 className={`text-sm sm:text-base font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>Waktu Solat</h3>
              <p className={`text-[11px] sm:text-xs font-semibold truncate ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                {lang === 'ms' ? 'Jadual waktu solat harian' : 'Daily prayer times schedule'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {session?.isDemo && (
              <button
                onClick={() => window.dispatchEvent(new Event('test-prayer-toast'))}
                className={`flex-shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors border ${
                  isLight 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
              >
                Test Toast
              </button>
            )}
            <button
              onClick={onClose}
              className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
                isLight ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600' : 'text-white/30 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div data-lenis-prevent className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto usas-scrollbar touch-pan-y overscroll-contain">
          {/* Header Info - ALWAYS SHOW */}
          <div className="flex items-center justify-between gap-2">
            <PrayerZoneDropdown value={zone} onChange={setZone} isLight={isLight} />
            <div className={`flex items-center gap-1.5 text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              <CalendarIcon className="w-3.5 h-3.5 opacity-70" />
              <span>{now.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
              <Clock className={`w-8 h-8 animate-spin ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
              <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Loading...</span>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Hero Countdown */}
              <div className={`p-5 rounded-xl border flex flex-col justify-center gap-1 shadow-sm text-center ${
                isLight 
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50 shadow-amber-900/5' 
                  : 'bg-gradient-to-br from-amber-500/[0.04] to-orange-500/[0.02] border-amber-500/15'
              }`}>
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isLight ? 'text-amber-600/80' : 'text-amber-400/70'}`}>
                  {nextPrayer ? `Next Prayer: ${nextPrayer.label}` : 'All Prayers Completed'}
                </div>
                <div className={`text-4xl font-black tabular-nums tracking-tight ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                  {nextPrayer ? formatCountdown(diffSeconds) : '--:--:--'}
                </div>
              </div>

              {/* Minimalist Prayer Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {dynamicPrayers.map((prayer) => (
                  <div 
                    key={prayer.id}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all ${
                      prayer.isNext
                        ? (isLight 
                            ? 'bg-amber-100 border-amber-300 shadow-sm' 
                            : 'bg-amber-400/15 border-amber-400/40')
                        : (isLight
                            ? 'bg-slate-50 border-slate-100'
                            : 'bg-white/[0.02] border-white/[0.04]')
                    } ${prayer.passed && !prayer.isNext ? 'opacity-40 grayscale' : 'opacity-100'}`}
                  >
                    <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${
                      prayer.isNext 
                        ? (isLight ? 'text-amber-700' : 'text-amber-400')
                        : (isLight ? 'text-slate-400' : 'text-white/40')
                    }`}>
                      {prayer.label}
                    </span>
                    <span className={`text-sm tabular-nums font-bold ${
                      prayer.isNext 
                        ? (isLight ? 'text-amber-800' : 'text-amber-300')
                        : (isLight ? 'text-slate-700' : 'text-white/80')
                    }`}>
                      {prayer.timeStr}
                    </span>
                  </div>
                ))}
              </div>

              <div className={`text-center pt-2 pb-1 text-[9px] uppercase tracking-widest font-bold ${
                isLight ? 'text-slate-400' : 'text-white/30'
              }`}>
                Powered by API Waktu Solat JAKIM
              </div>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
