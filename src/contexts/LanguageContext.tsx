import * as React from 'react';
import { IntlProvider, useIntl } from 'react-intl';
import { translations, Language } from '../locales';
import { TranslationKeys } from '../locales/ru';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  formatMessage: (id: string, values?: Record<string, unknown>) => string;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

function flattenMessages(obj: unknown, prefix = ''): Record<string, string> {
  const msgs: Record<string, string> = {};
  if (!obj || typeof obj !== 'object') return msgs;
  const o = obj as Record<string, unknown>;
  Object.keys(o).forEach((key) => {
    const value = o[key];
    const pref = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      msgs[pref] = value;
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (typeof v === 'string') msgs[`${pref}.${i}`] = v;
        else if (typeof v === 'object' && v !== null) Object.assign(msgs, flattenMessages(v, `${pref}.${i}`));
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(msgs, flattenMessages(value, pref));
    }
  });
  return msgs;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>('ru');

  // Load language from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
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
      try {
        document.cookie = `language=${encodeURIComponent(lang)}; path=/; max-age=${60 * 60 * 24 * 365}`;
      } catch {
        // ignore cookie write failures
      }
    }
  }, []);

  // Update document direction and lang attribute when language changes
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const isRtl = language === 'he';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      const langCode = language === 'ru' ? 'ru' : language === 'he' ? 'he' : 'en';
      document.documentElement.lang = langCode;
    }
  }, [language]);

  const messages = React.useMemo(() => flattenMessages(translations[language]), [language]);
  const langCode = language === 'ru' ? 'ru' : language === 'he' ? 'he' : 'en';

  // Inner provider to access react-intl's useIntl after IntlProvider is mounted
  function InnerProvider({ children, languageProp, setLanguageProp }: { children: React.ReactNode; languageProp: Language; setLanguageProp: (lang: Language) => void }) {
    const intl = useIntl();
    type IntlValues = Parameters<typeof intl.formatMessage>[1];
    const formatMessage = React.useCallback(
      (id: string, values?: IntlValues) => {
        try {
          return intl.formatMessage({ id }, values);
        } catch {
          // fallback to raw translation object if message id isn't present
          const parts = id.split('.');
          let cur: unknown = translations[languageProp] as unknown;
          for (const p of parts) {
            if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[p];
            else { cur = undefined; break; }
          }
          return typeof cur === 'string' ? cur : id;
        }
      },
      [intl, languageProp]
    );

    const value = React.useMemo(
      () => ({ language: languageProp, setLanguage: setLanguageProp, t: translations[languageProp], formatMessage }),
      [languageProp, setLanguageProp, formatMessage]
    );

    return <LanguageContext.Provider value={value as LanguageContextType}>{children}</LanguageContext.Provider>;
  }

  return (
    <IntlProvider locale={langCode} messages={messages} defaultLocale="en">
      <InnerProvider languageProp={language} setLanguageProp={setLanguage}>{children}</InnerProvider>
    </IntlProvider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
