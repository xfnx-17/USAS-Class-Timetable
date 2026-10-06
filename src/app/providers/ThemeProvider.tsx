import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import type { ThemeContextValue, ThemeName } from '@/shared/types/usas';
import { normalizeThemeName } from '@/shared/lib/storage';

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ViewTransitionLike = {
  ready: Promise<void>;
  finished: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionLike;
};

export const THEMES: Record<string, ThemeName> = {
  NAVY: 'navy',
  OLED: 'oled',
  EMERALD: 'emerald',
  LIGHT: 'light',
};

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeName>(() => {
    try {
      return normalizeThemeName(localStorage.getItem('usas_theme'));
    } catch {
      return THEMES.NAVY;
    }
  });

  const isTransitioning = useRef(false);

  const changeTheme = (newTheme: ThemeName, e?: React.MouseEvent) => {
    if (isTransitioning.current) return;
    
    const nextTheme = normalizeThemeName(newTheme);
    const viewDocument = document as DocumentWithViewTransition;
    
    if (!viewDocument.startViewTransition || !e) {
      setTheme(nextTheme);
      try { localStorage.setItem('usas_theme', nextTheme); } catch {}
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    const transition = viewDocument.startViewTransition(() => {
      const root = document.documentElement;
      root.classList.remove('theme-light', 'theme-navy', 'theme-oled', 'theme-emerald');
      root.classList.add(`theme-${nextTheme}`);
      if (nextTheme === THEMES.LIGHT) {
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
      }
      
      setTheme(nextTheme);
      try { localStorage.setItem('usas_theme', nextTheme); } catch {}
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ],
        },
        {
          duration: 250,
          easing: 'ease-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });

    transition.finished.finally(() => {
      isTransitioning.current = false;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-navy', 'theme-oled', 'theme-emerald');
    root.classList.add(`theme-${theme}`);

    if (theme === THEMES.LIGHT) {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
