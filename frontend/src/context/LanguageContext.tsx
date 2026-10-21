import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { Locale, translate } from "../i18n/messages";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
const STORAGE_KEY = "helpdesk_locale";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "en" ? "en" : "id";
  });

  const value = useMemo<LanguageContextValue>(() => {
    const setLocale = (next: Locale) => {
      localStorage.setItem(STORAGE_KEY, next);
      setLocaleState(next);
    };
    return {
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    };
  }, [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
