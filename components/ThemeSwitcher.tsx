"use client";

import { useEffect, useState } from "react";

const THEMES = [
  { id: "sombre", label: "Sombre", dot: "#2F7DE1" },
  { id: "clair", label: "Clair", dot: "#135FBD" },
  { id: "ocean", label: "Océan", dot: "#12A8CC" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return "sombre";
  const saved = window.localStorage.getItem("fm-theme") as ThemeId | null;
  if (saved && THEMES.some((t) => t.id === saved)) return saved;
  // Migration : ancien thème orange/énergie -> sombre pro
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest?.(".theme-switcher");
      if (!el) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open ]);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="theme-switcher">
      <button
        type="button"
        className="btn btn-sm theme-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Changer de thème"
        title={`Thème : ${current.label}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="theme-dot" style={{ backgroundColor: current.dot }} />
        <span className="hide-mobile">{current.label}</span>
      </button>
      {open && (
        <div className="theme-panel" role="menu" aria-label="Choisir un thème">
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
