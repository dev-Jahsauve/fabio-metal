"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const LINKS = [
  { label: "Accueil", href: "/" },
  { label: "Service", href: "/services" },
  { label: "Boutique", href: "/boutique" },
  { label: "Galerie", href: "/galerie" },
  { label: "Contact", href: "/contact" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Fermer lors d'un changement de page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Verrouiller le scroll + touche Échap + focus
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      // Focus trap minimal : garder le focus dans le panneau avec Tab
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <>
      {/* Bouton burger — visible uniquement sur mobile via CSS */}
      <button
        type="button"
        className={`burger${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-controls="menu-mobile"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      {/* Voile */}
      <div
        className={`nav-overlay${open ? " is-open" : ""}`}
        aria-hidden={!open}
        onClick={close}
      />

      {/* Tiroir latéral */}
      <aside
        id="menu-mobile"
        ref={panelRef}
        className={`nav-drawer${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="nav-drawer-head">
          <span className="nav-drawer-brand">
            <span className="logo-mark" aria-hidden="true">
              FM
            </span>
            <span>
              <strong>FABIOLE METAL</strong>
              <small>Atelier · Bojongo</small>
            </span>
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            className="nav-drawer-close"
            aria-label="Fermer le menu"
            onClick={close}
            tabIndex={open ? 0 : -1}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="nav-drawer-links" aria-label="Navigation mobile">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={isActive(l.href) ? "is-active" : undefined}
              tabIndex={open ? 0 : -1}
            >
              <span>{l.label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          ))}
        </nav>

        <div className="nav-drawer-foot nav-drawer-foot--login">
          <Link
            href="/connexion"
            className="btn btn-primary nav-drawer-cta nav-drawer-login"
            onClick={close}
            tabIndex={open ? 0 : -1}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Connexion
          </Link>
        </div>
      </aside>
    </>
  );
}
