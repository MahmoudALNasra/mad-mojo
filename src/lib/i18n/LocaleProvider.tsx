"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dictionaries, type DictKey, type Locale } from "./dictionaries";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: DictKey) => string;
  /** Picks the right language variant from a pair of strings. */
  pick: (en: string, es: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `mm_locale=${l};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: DictKey) => dictionaries[locale][key] ?? dictionaries.en[key] ?? key,
    [locale]
  );

  const pick = useCallback(
    (enText: string, esText: string) =>
      locale === "es" && esText ? esText : enText,
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, pick }),
    [locale, setLocale, t, pick]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
