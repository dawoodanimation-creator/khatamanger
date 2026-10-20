import en from './en.json';
import ur from './ur.json';
import { useLedger } from '../state/LedgerContext';
import type { Language } from '../models/ledger';
export type TranslationKey = keyof typeof en;
const translations: Record<Language, Record<TranslationKey, string>> = { en, ur };
export function translate(language: Language, key: TranslationKey, values?: Record<string, string>): string {
  let result = translations[language][key];
  for (const [name, value] of Object.entries(values ?? {})) result = result.replaceAll(`{${name}}`, value);
  return result;
}
export function useI18n() {
  const { ledger } = useLedger();
  const language = ledger.settings.language;
  return { language, direction: language === 'ur' ? 'rtl' as const : 'ltr' as const,
    t: (key: TranslationKey, values?: Record<string, string>) => translate(language, key, values) };
}
