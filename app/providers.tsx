"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { SessionProvider } from "next-auth/react";
import { content } from "@/lib/content";

export type Locale = "ar" | "en";
export type Theme = "light" | "dark";

// The Arabic dictionary acts as the canonical shape (English mirrors it
// at runtime). `as const` makes the two literal types disjoint, so we
// alias the shape from the AR branch and cast at consumption time.
export type Dict = typeof content.ar;

type LanguageContextValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Dict;
  toggle: () => void;
  setLocale: (l: Locale) => void;
};

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof document !== "undefined" && document.documentElement.lang === "en") return "en";
    return "ar";
  });

  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("locale")) as Locale | null;
    if (saved === "ar" || saved === "en") setLocaleState(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem("locale", l);
  }, []);

  const toggle = useCallback(() => {
    setLocale(locale === "ar" ? "en" : "ar");
  }, [locale, setLocale]);

  return (
    <LanguageContext.Provider value={{ locale, dir, t: content[locale] as Dict, toggle, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with "light" on SSR; the inline anti-flash script in <head>
  // already set the correct <html data-theme> before React mounts, so
  // there's no visual flash — we sync state to the DOM on mount.
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || "light";
    setThemeState(current);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    if (typeof window !== "undefined") localStorage.setItem("theme", t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
