import { useState, type FormEvent } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme, THEMES } from '@/app/providers/ThemeProvider';
import TurnstileCaptcha from './TurnstileCaptcha';
import { Lock, User, Fingerprint, ShieldCheck, ArrowRight, XCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const { login, loading, error, setError } = useAuth();
  const { lang, t } = useLanguage();
  const { theme } = useTheme();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const isLight = theme === THEMES.LIGHT;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setError(lang === 'ms' ? 'Isi no. matrik dan kata laluan.' : 'Enter matric no. and password.');
      return;
    }
    if (!captchaToken) {
      setError(lang === 'ms' ? 'Sila selesaikan captcha dahulu.' : 'Please complete the captcha first.');
      return;
    }
    const ok = await login(userId.trim(), password, false, captchaToken);
    if (!ok) {
      setCaptchaToken(null);
      setCaptchaResetKey((k) => k + 1);
    }
  };

  const handleDemoClick = async () => {
    await login('AI210042', 'demo123', true);
  };

  return (
    <div className={`h-full w-full overflow-hidden flex flex-col items-center justify-center p-4 relative transition-colors duration-150 ${
      theme === THEMES.LIGHT ? 'bg-[#f8fafc]' :
      theme === THEMES.OLED ? 'bg-black' :
      theme === THEMES.EMERALD ? 'bg-[#012117]' :
      'bg-[#060E1F]'
    }`}>

      {/* Subtle dot grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: isLight 
          ? 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)' 
          : 'radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />
      
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full blur-[100px] opacity-40 transition-colors duration-500 ${
          isLight ? 'bg-amber-100' : 'bg-amber-400/10'
        }`} />
      </div>

      <div className={`w-full max-w-md rounded-2xl border p-5 sm:p-8 shadow-2xl transition-all duration-300 ${
        isLight 
          ? 'bg-white border-slate-200/90 shadow-slate-200/50' 
          : theme === THEMES.OLED 
            ? 'bg-black border-white/[0.08] backdrop-blur-xl shadow-black/40' 
            : theme === THEMES.EMERALD 
              ? 'bg-[#022e20]/60 border-emerald-500/20 backdrop-blur-xl shadow-black/40' 
              : 'bg-[#0a1428]/60 border-white/[0.08] backdrop-blur-xl shadow-black/40'
      }`}>
        <div className="flex flex-col items-center text-center space-y-1 mb-4">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors duration-150 shadow-inner ${
            isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-400/10 text-amber-400'
          }`}>
            <Fingerprint className="w-4.5 h-4.5" />
          </div>
          <h2 className="text-lg font-black tracking-tight">{t('loginTitle')}</h2>
          <p className={`text-[10px] opacity-75 max-w-[260px] leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}>{t('loginDesc')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className={`flex items-start gap-2.5 rounded-lg p-3 text-xs leading-relaxed border transition-colors ${
              isLight 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : 'bg-rose-950/20 border-rose-900/40 text-rose-400'
            }`}>
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold text-left">{error}</span>
            </div>
          )}

          {/* User Matric */}
          <div className="text-slate-800 dark:text-slate-100">
            <label className={`block text-[11px] font-medium mb-1.5 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              {t('loginMatric')}
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-150 ${
                isFocused === 'userId' 
                  ? (isLight ? 'text-amber-600 font-semibold' : 'text-amber-300') 
                  : (isLight ? 'text-slate-500' : 'text-amber-400/70')
              }`}>
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                maxLength={32}
                autoCapitalize="characters"
                spellCheck={false}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onFocus={() => setIsFocused('userId')}
                onBlur={() => setIsFocused(null)}
                placeholder="AI210042"
                autoComplete="username"
                className={`login-input appearance-none w-full pl-10 pr-4 py-2.5 rounded-md text-xs font-medium focus:outline-none focus:ring-0 focus:shadow-none transition-colors duration-150 border ${
                  isLight 
                    ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500' 
                    : theme === THEMES.OLED 
                      ? 'bg-black border-white/[0.08] text-white placeholder-white/20 focus:border-amber-400/40'
                      : theme === THEMES.EMERALD
                        ? 'bg-[#012117] border-white/[0.08] text-white placeholder-white/20 focus:border-amber-400/40'
                        : 'bg-[#060E1F] border-white/[0.08] text-white placeholder-white/20 focus:border-amber-400/40'
                }`}
              />
            </div>
          </div>

          {/* Password */}
          <div className="text-slate-800 dark:text-slate-100">
            <label className={`block text-[11px] font-medium mb-1.5 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              {t('loginPass')}
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-150 ${
                isFocused === 'password' 
                  ? (isLight ? 'text-amber-600 font-semibold' : 'text-amber-300') 
                  : (isLight ? 'text-slate-500' : 'text-amber-400/70')
              }`}>
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocused('password')}
                onBlur={() => setIsFocused(null)}
                placeholder={lang === 'ms' ? 'Masukkan kata laluan' : 'Enter password'}
                autoComplete="current-password"
                className={`login-input appearance-none w-full pl-10 pr-10 py-2.5 rounded-md text-xs font-medium focus:outline-none focus:ring-0 focus:shadow-none transition-colors duration-150 border ${
                  isLight 
                    ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500' 
                    : theme === THEMES.OLED 
                      ? 'bg-black border-white/[0.08] text-white placeholder-white/20 focus:border-amber-400/40'
                      : theme === THEMES.EMERALD
                        ? 'bg-[#012117] border-white/[0.08] text-white placeholder-white/20 focus:border-amber-400/40'
                        : 'bg-[#060E1F] border-white/[0.08] text-white placeholder-white/20 focus:border-amber-400/40'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${
                  isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/25 hover:text-amber-400'
                }`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Cloudflare Turnstile Captcha */}
          <TurnstileCaptcha
            key={captchaResetKey}
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
            theme={isLight ? 'light' : 'dark'}
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-md font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed mt-1 shadow-md ${
              isLight 
                ? 'bg-[#0B1E43] hover:bg-[#152e63] text-white hover:shadow-lg hover:shadow-slate-900/10' 
                : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/15'
            }`}
          >
            {loading ? (
              <>
                <div className={`w-3.5 h-3.5 border-2 rounded-full animate-spin ${
                  isLight ? 'border-neutral-300 border-t-white' : 'border-slate-950 border-t-transparent'
                }`} />
                <span>{t('authenticating')}</span>
              </>
            ) : (
              <>
                <span>{t('loginTitle')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className={`h-px flex-1 ${isLight ? 'bg-slate-200' : 'bg-white/[0.06]'}`} />
          <span className={`text-[10px] font-medium ${isLight ? 'text-slate-400' : 'text-white/20'}`}>{lang === 'ms' ? 'atau' : 'or'}</span>
          <div className={`h-px flex-1 ${isLight ? 'bg-slate-200' : 'bg-white/[0.06]'}`} />
        </div>

        {/* Demo Mode */}
        <button
          onClick={handleDemoClick}
          disabled={loading}
          type="button"
          className={`w-full py-2.5 px-4 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all duration-150 border ${
            isLight 
              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' 
              : 'bg-transparent hover:bg-white/[0.04] border-white/[0.08] text-amber-300/80'
          }`}
        >
          <span>{t('loginDemo')}</span>
        </button>

      </div>

      {/* Privacy — outside the card */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-center text-slate-500">
        <ShieldCheck className="w-3 h-3 text-emerald-500/60 flex-shrink-0" />
        <span className="max-w-full">{t('privacyNote')}</span>
      </div>

    </div>
  );
}
