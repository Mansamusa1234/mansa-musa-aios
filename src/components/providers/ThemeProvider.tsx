"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(t: Theme): ResolvedTheme {
  return t === "system" ? getSystemTheme() : t;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mmtheme") as Theme | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeState(stored);
      }
    } catch {}
  }, []);

  // Apply dark class to html
  useEffect(() => {
    const root = document.documentElement;
    const resolved = resolveTheme(theme);
    root.classList.toggle("dark", resolved === "dark");
    root.setAttribute("data-theme", resolved);
  }, [theme]);

  // System theme change listener
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.classList.toggle("dark", mq.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem("mmtheme", t); } catch {}
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: resolveTheme(theme), setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
