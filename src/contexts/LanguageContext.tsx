import * as React from 'react';
import { translations, Language } from '../locales';
import { TranslationKeys } from '../locales/ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>('ru');

  // Load language from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // prefer localStorage, fallback to cookie if present (for SSR continuity)
      let saved = localStorage.getItem('language') as Language | null;
      if (!saved) {
        const match = document.cookie.match(/(?:^|; )language=([^;]+)/);
        if (match && match[1]) saved = decodeURIComponent(match[1]) as Language;
      }
      if (saved && (saved === 'ru' || saved === 'en' || saved === 'he')) {
        setLanguageState(saved);
      }
    }
  }, []);

  // Save language to localStorage when changed
  const setLanguage = React.useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
      // set cookie for SSR: expires in 1 year
      try {
        document.cookie = `language=${encodeURIComponent(lang)}; path=/; max-age=${60 * 60 * 24 * 365}`;
      } catch (e) {
        // ignore cookie write failures
      }
    }
  }, []);

  // Update document direction and lang attribute when language changes
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const isRtl = language === 'he';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      // Set lang attribute to a suitable code
      const langCode = language === 'ru' ? 'ru' : language === 'he' ? 'he' : 'en';
      document.documentElement.lang = langCode;
    }
  }, [language]);

  const value = React.useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
    }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
