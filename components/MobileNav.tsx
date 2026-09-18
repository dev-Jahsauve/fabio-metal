"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const MAIN_LINKS: Array<[string, string]> = [
  ["Accueil", "/"],
  ["Services", "/services"],
  ["Boutique", "/boutique"],
  ["Galerie", "/galerie"],
  ["Contact", "/contact"],
  ["À propos", "/a-propos"],
];

const SPACE_LINKS: Array<[string, string]> = [
  ["Mon compte", "/compte"],
  ["Panier", "/panier"],
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  return (
    <div className="mobile-nav">
      <button
        className="btn btn-icon burger"
        aria-expanded={open}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">{open ? "✕" : "☰"}</span>
      </button>

      {open && (
        <>
          <div
            className="drawer-overlay"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navigation"
          >
            <div className="drawer-header">
              <span className="logo">
                <span className="logo-mark" aria-hidden="true">
                  FM
                </span>
                <span className="logo-text">
                  <span>FABIOLE METAL</span>
                  <small>Atelier · Bojongo</small>
                </span>
              </span>
              <button
                className="btn btn-icon"
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <div className="drawer-body">
              <section>
                <div className="drawer-section-title">Navigation</div>
                <nav className="drawer-links" aria-label="Navigation principale">
                  {MAIN_LINKS.map(([label, href]) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                    >
                      {label}
                      <span aria-hidden="true">→</span>
                    </Link>
                  ))}
                </nav>
              </section>

              <section>
                <div className="drawer-section-title">Espace client</div>
                <nav className="drawer-links" aria-label="Espace client">
                  {SPACE_LINKS.map(([label, href]) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                    >
                      {label}
                      <span aria-hidden="true">→</span>
                    </Link>
                  ))}
                </nav>
              </section>

              <div className="drawer-cta">
                <Link
                  href="/contact"
                  className="btn btn-primary"
                  onClick={() => setOpen(false)}
                >
                  Demander un devis
                </Link>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
