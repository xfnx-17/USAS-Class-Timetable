import { useState, useEffect } from 'react';
import { useNextPrayer } from './PrayerTimesWidget';
import { useTheme } from '@/app/providers/ThemeProvider';
import { X, Moon } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { playPrayerChime } from '@/shared/lib/audioNotifier';

export default function PrayerToast() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { lang } = useLanguage();
  
  const { nextPrayer, diffSeconds, currentPrayer, secondsSinceCurrent } = useNextPrayer();

  const [dismissedKey, setDismissedKey] = useState<number | null>(null);
  const [handledKey, setHandledKey] = useState<number | null>(null);
  const [completedKey, setCompletedKey] = useState<number | null>(null);
  const [completedLabel, setCompletedLabel] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // TEST MODE
  const [testMode, setTestMode] = useState(false);
  const [testSeconds, setTestSeconds] = useState(10);

  useEffect(() => {
    const handleTest = () => {
      setTestMode(true);
      setTestSeconds(10);
      setIsCompleted(false);
      setDismissedKey(null);
      setHandledKey(null);
      setCompletedKey(null);
      setCompletedLabel(null);
    };
    window.addEventListener('test-prayer-toast', handleTest);
    return () => window.removeEventListener('test-prayer-toast', handleTest);
  }, []);

  // Normal mode: detect the moment a prayer time is reached
  useEffect(() => {
    if (testMode || !currentPrayer) return;
    if (secondsSinceCurrent < 0 || secondsSinceCurrent > 5) return;
    if (currentPrayer.timestamp === handledKey || currentPrayer.timestamp === dismissedKey) return;
    if (isCompleted && completedKey === currentPrayer.timestamp) return;

    setCompletedKey(currentPrayer.timestamp);
    setCompletedLabel(currentPrayer.label);
    setIsCompleted(true);
    playPrayerChime();
  }, [currentPrayer, secondsSinceCurrent, testMode, handledKey, dismissedKey, isCompleted, completedKey]);

  const [isHiding, setIsHiding] = useState(false);

  const closeToast = () => {
    setIsHiding(true);
    setTimeout(() => {
      setIsHiding(false);
      if (testMode) {
        setTestMode(false);
        setIsCompleted(false);
        setCompletedKey(null);
        setCompletedLabel(null);
        return;
      }
      if (isCompleted && completedKey !== null) {
        setHandledKey(completedKey);
        setIsCompleted(false);
        setCompletedKey(null);
        setCompletedLabel(null);
        return;
      }
      if (nextPrayer) {
        setDismissedKey(nextPrayer.timestamp);
      }
    }, 500);
  };

  // Test mode: countdown
  useEffect(() => {
    if (!testMode) return;

    if (testSeconds > 0) {
      const timer = setTimeout(() => setTestSeconds(s => s - 1), 1000);
      return () => clearTimeout(timer);
    }
    
    if (testSeconds === 0 && !isCompleted) {
      setIsCompleted(true);
      playPrayerChime();
    }
  }, [testMode, testSeconds, isCompleted]);

  // Auto-close after 5 seconds of being completed
  useEffect(() => {
    if (!isCompleted) return;
    const timer = setTimeout(() => {
      setIsHiding(true);
      setTimeout(() => {
        setIsHiding(false);
        if (testMode) {
          setTestMode(false);
          setIsCompleted(false);
          setCompletedKey(null);
          setCompletedLabel(null);
        } else {
          setHandledKey(completedKey);
          setIsCompleted(false);
          setCompletedKey(null);
          setCompletedLabel(null);
        }
      }, 500);
    }, 5000);
    return () => clearTimeout(timer);
  }, [isCompleted, testMode, completedKey]);


  const isVisible = !isHiding && (testMode || Boolean(
    (isCompleted && completedLabel !== null && completedKey !== handledKey)
    || (nextPrayer &&
      nextPrayer.timestamp !== dismissedKey &&
      nextPrayer.timestamp !== handledKey &&
      diffSeconds <= 300 &&
      diffSeconds > 0)
  ));

  const handleDismiss = () => {
    closeToast();
  };

  const currentPrayerLabel = testMode ? 'Maghrib (Test)' : (isCompleted ? completedLabel : nextPrayer?.label);
  const currentDiffSeconds = testMode ? testSeconds : diffSeconds;

  const progressPercent = currentDiffSeconds > 0 && currentDiffSeconds <= 300 
    ? ((300 - currentDiffSeconds) / 300) * 100 
    : 100;

  const minsLeft = Math.floor(currentDiffSeconds / 60);
  const secsLeft = currentDiffSeconds % 60;
  const timeStr = `${String(minsLeft).padStart(2, '0')}:${String(secsLeft).padStart(2, '0')}`;

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] transition-all duration-500 w-[260px] sm:w-[280px] rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-2xl ${
      !isVisible 
        ? 'opacity-0 translate-y-8 scale-95 pointer-events-none'
        : 'opacity-100 translate-y-0 scale-100'
    } ${
      isCompleted
        ? (isLight 
            ? 'bg-emerald-500/30 border-emerald-400/50 text-emerald-900 shadow-emerald-500/20' 
            : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100 shadow-emerald-900/50')
        : (isLight
            ? 'bg-white/40 border-slate-200/50 text-slate-800'
            : 'bg-[#0A1428]/40 border-white/10 text-white')
    }`}>
      <div className="p-3.5 flex items-center gap-3 relative">
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${
          isCompleted 
            ? (isLight ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-700' : 'bg-emerald-500/30 border-emerald-400/50 text-emerald-300')
            : (isLight ? 'bg-amber-100/50 border-amber-200/50 text-amber-600' : 'bg-amber-400/10 border-amber-400/20 text-amber-400')
        }`}>
          <Moon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <h4 className={`text-sm font-bold truncate ${isCompleted ? 'text-current' : (isLight ? 'text-slate-900' : 'text-white')}`}>
            {isCompleted ? currentPrayerLabel : `Azan ${currentPrayerLabel}`}
          </h4>
          <p className={`text-[11px] font-semibold mt-0.5 ${isCompleted ? 'opacity-90' : (isLight ? 'text-slate-500' : 'text-white/60')}`}>
            {isCompleted 
              ? (lang === 'ms' ? 'Dirikanlah solat' : 'Time for prayer')
              : (lang === 'ms' ? `Bermula dalam ${timeStr}` : `Starts in ${timeStr}`)
            }
          </p>
        </div>

        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors ${
            isCompleted 
              ? 'hover:bg-black/10 text-current opacity-70 hover:opacity-100'
              : (isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-white/40 hover:bg-white/10')
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar (Only show during countdown) */}
      {!isCompleted && (
        <div className={`h-1.5 w-[calc(100%-1.5rem)] mx-auto mb-3 rounded-full relative overflow-hidden ${isLight ? 'bg-slate-200/50' : 'bg-white/10'}`}>
          <div 
            className="absolute top-0 left-0 h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: `color-mix(in oklch, #10b981 ${progressPercent}%, #ef4444)` 
            }}
          />
        </div>
      )}
    </div>
  );
}
