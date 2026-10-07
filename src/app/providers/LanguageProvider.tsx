import { createContext, useContext, useState, type ReactNode } from 'react';
import { translations } from '@/shared/i18n/translations';
import type { LanguageContextValue, LanguageCode } from '@/shared/types/usas';
import { lookupTranslationValue } from '@/shared/lib/translation';
import { getOwnRecordValue } from '@/shared/lib/security';

const LanguageContext = createContext<LanguageContextValue | null>(null);

const VALID_LANGUAGES: LanguageCode[] = ['en', 'ms', 'zh', 'ta'];

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem('usas_lang') as LanguageCode;
      return VALID_LANGUAGES.includes(saved) ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = (nextLang: LanguageCode | ((prev: LanguageCode) => LanguageCode)) => {
    setLangState((prev) => {
      const resolved = typeof nextLang === 'function' ? nextLang(prev) : nextLang;
      const valid = VALID_LANGUAGES.includes(resolved) ? resolved : 'en';
      try {
        localStorage.setItem('usas_lang', valid);
      } catch {
        // ignore storage failures
      }
      return valid;
    });
  };

  const toggleLanguage = () => {
    setLang((prev) => {
      const idx = VALID_LANGUAGES.indexOf(prev);
      const nextIdx = (idx + 1) % VALID_LANGUAGES.length;
      return VALID_LANGUAGES.at(nextIdx) ?? 'en';
    });
  };

  const t = (key: string) => {
    const activeDict = getOwnRecordValue<typeof translations.en>(translations, lang) || translations.en;
    const activeValue = lookupTranslationValue(activeDict, key);
    if (activeValue) return activeValue;

    const fallbackValue = lookupTranslationValue(translations.en, key) || lookupTranslationValue(translations.ms, key);
    if (fallbackValue) return fallbackValue;

    if (key.startsWith('days.')) return key.replace(/^days\./i, '');
    if (key.startsWith('shortDays.')) return key.replace(/^shortDays\./i, '');

    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
