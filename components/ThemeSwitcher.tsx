"use client";

import { useEffect, useState } from "react";

const THEMES = [
  { id: "sombre", label: "Sombre", dot: "#FF6B1A" },
  { id: "clair", label: "Clair", dot: "#E8590C" },
  { id: "ocean", label: "Océan", dot: "#0284C7" },
  { id: "energie", label: "Énergie", dot: "#DC2626" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return "sombre";
  const saved = window.localStorage.getItem("fm-theme") as ThemeId | null;
  if (saved && THEMES.some((t) => t.id === saved)) return saved;
  return "sombre";
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>("sombre");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem("fm-theme", theme);
    } catch {}
  }, [theme]);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="theme-switcher">
      <button
        type="button"
        className="btn theme-btn"
        aria-expanded={open}
        aria-label="Changer de thème"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="theme-dot" style={{ backgroundColor: current.dot }} />
        {current.label}
      </button>
      {open && (
        <div className="theme-panel" role="menu">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === t.id}
              className={`theme-option${theme === t.id ? " active" : ""}`}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
            >
              <span className="theme-dot" style={{ backgroundColor: t.dot }} />
              {t.label}
              {theme === t.id && <span className="theme-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
