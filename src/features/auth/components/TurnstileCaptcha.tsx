import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  siteKey?: string;
  className?: string;
  size?: 'normal' | 'compact' | 'flexible';
}

export default function TurnstileCaptcha({
  onVerify,
  onExpire,
  onError,
  theme = 'auto',
  siteKey = (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
  className = '',
  size = 'flexible',
}: TurnstileCaptchaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(() => typeof window !== 'undefined' && !!window.turnstile);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.turnstile) {
      setIsScriptReady(true);
      return;
    }

    const scriptId = 'cloudflare-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsScriptReady(true);
      };
      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          setIsScriptReady(true);
          clearInterval(checkInterval);
        }
      }, 50);
      return () => clearInterval(checkInterval);
    }
  }, []);

  useEffect(() => {
    if (!isScriptReady || !containerRef.current || !window.turnstile) return;

    // Clean up existing widget if theme or props change
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Ignore cleanup errors
      }
      widgetIdRef.current = null;
    }

    try {
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: (token: string) => {
          onVerify(token);
        },
        'expired-callback': () => {
          onExpire?.();
        },
        'error-callback': () => {
          onError?.();
        },
      });
      widgetIdRef.current = widgetId;
    } catch (err) {
      console.warn('Turnstile render warning:', err);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [isScriptReady, theme, siteKey]);

  return (
    <div className={`w-full flex items-center my-2 min-h-[65px] ${className || 'justify-center'}`}>
      <div ref={containerRef} />
    </div>
  );
}
