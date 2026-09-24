"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const LINKS = [
  {
    label: "Accueil",
    href: "/",
    icon: (
      <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    ),
  },
  {
    label: "Services",
    href: "/services",
    icon: (
      <path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3Z" />
    ),
  },
  {
    label: "Boutique",
    href: "/boutique",
    icon: (
      <>
        <path d="M6 7h15l-1.6 7.2a2 2 0 0 1-2 1.6H8.7a2 2 0 0 1-2-1.6L4.2 3.9A1 1 0 0 0 3.2 3H1.5" />
        <circle cx="9.5" cy="20.5" r="1.3" />
        <circle cx="17.5" cy="20.5" r="1.3" />
      </>
    ),
  },
  {
    label: "Galerie",
    href: "/galerie",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.5-3.5a2 2 0 0 0-3 0L6 20" />
      </>
    ),
  },
  {
    label: "Contact",
    href: "/contact",
    icon: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8.1 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.9 2Z" />
    ),
  },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Portail vers <body> : le header a un backdrop-filter qui emprisonnerait
  // sinon le tiroir "position: fixed" dans une boîte de 70px (onglets coupés).
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Voile + tiroir rendus dans <body> via portail (jamais bloqués par le header)
  const overlayDrawer = (
    <>
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
        <div className="nav-drawer-head nav-drawer-head--minimal">
          <span className="nav-drawer-brand">
            <span className="logo-mark nav-drawer-logo" aria-hidden="true">
              FM
            </span>
            <strong className="nav-drawer-title">FABIOLE METAL</strong>
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

        {/* Bouton Connexion tout en haut : visible immédiatement, ne cache rien */}
        <div className="nav-drawer-top">
          <Link
            href="/connexion"
            className="nav-drawer-top-login"
            onClick={close}
            tabIndex={open ? 0 : -1}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Connexion
          </Link>
        </div>

        <div className="nav-drawer-scroll">
          <p className="nav-drawer-label" aria-hidden="true">Menu</p>
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
                <span className="nav-drawer-link-main">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {l.icon}
                  </svg>
                  <span>{l.label}</span>
                </span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            ))}
          </nav>

          {/* Devis compact en bas, petit et discret */}
          <div className="nav-drawer-actions nav-drawer-actions--single">
            <Link
              href="/contact"
              className="nav-drawer-action nav-drawer-action--primary"
              onClick={close}
              tabIndex={open ? 0 : -1}
            >
              Demander un devis gratuit
            </Link>
          </div>
        </div>
      </aside>
    </>
  );

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

      {mounted ? createPortal(overlayDrawer, document.body) : null}
    </>
  );
}
