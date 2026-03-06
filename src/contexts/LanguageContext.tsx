import * as React from 'react';
import { useIntl, IntlShape } from 'react-intl';
import { translations, Language } from '../locales';
import { TranslationKeys } from '../locales/ru';
import useAppStore from '@/stores/useAppStore';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  formatMessage: (id: string, values?: Parameters<IntlShape['formatMessage']>[1]) => string;
}

export function flattenMessages(obj: unknown, prefix = ''): Record<string, string> {
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

export function useLanguage(): LanguageContextType {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const intl = useIntl();

  // create a wrapper that accepts either a string id or a MessageDescriptor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatMessage = React.useCallback((descriptor: any, values?: any) => {
    try {
      let res: unknown;
      if (typeof descriptor === 'string') {
        res = intl.formatMessage({ id: descriptor }, values);
      } else {
        res = intl.formatMessage(descriptor, values);
      }
      return typeof res === 'string' ? res : String(res);
    } catch {
      // fallback to raw translation object if message id isn't present
      const id = typeof descriptor === 'string' ? descriptor : (descriptor && descriptor.id) || '';
      const parts = id.split('.');
      let cur: unknown = translations[language] as unknown;
      for (const p of parts) {
        if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[p];
        else { cur = undefined; break; }
      }
      return typeof cur === 'string' ? cur : id;
    }
  }, [intl, language]);

  return React.useMemo(
    () => ({ language, setLanguage, t: translations[language], formatMessage }),
    [language, setLanguage, formatMessage]
  );
}
