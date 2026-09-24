"use client";

import { useEffect, useState } from "react";

type ThemeId = "sombre" | "clair";

function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return "sombre";
  try {
    const saved = window.localStorage.getItem("fm-theme");
    if (saved === "clair" || saved === "sombre") return saved;
  } catch {}
  return "sombre";
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>("sombre");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem("fm-theme", theme);
    } catch {}
  }, [theme, mounted]);

  const isDark = theme === "sombre";

  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
      title={isDark ? "Thème sombre — passer au clair" : "Thème clair — passer au sombre"}
      onClick={() => setTheme(isDark ? "clair" : "sombre")}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb">
          {isDark ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          )}
        </span>
      </span>
      <span className="theme-toggle-label">{isDark ? "Sombre" : "Clair"}</span>
    </button>
  );
}
