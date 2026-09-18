"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const TABS: Array<[string, string]> = [
  ["Accueil", "/"],
  ["Services", "/services"],
  ["Boutique", "/boutique"],
  ["Galerie", "/galerie"],
  ["À propos", "/a-propos"],
  ["Contact", "/contact"],
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open ]);

  const close = () => setOpen(false);

  return (
    <div className="mobile-nav" ref={ref}>
      <button
        className="btn btn-icon burger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">{open ? "✕" : "☰"}</span>
      </button>

      {open && (
        <div className="menu-dropdown" role="menu" aria-label="Menu">
          <nav className="menu-tabs" aria-label="Onglets de navigation">
            {TABS.map(([label, href]) => (
              <Link key={href} href={href} onClick={close}>
                {label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>

          <div className="menu-cta">
            <Link href="/contact" className="btn btn-primary menu-devis" onClick={close}>
              Demander un devis
            </Link>
            <Link href="/connexion" className="btn menu-login" onClick={close}>
              <span aria-hidden="true">🔐</span> Se connecter
            </Link>
            <p className="menu-hint">
              Pas de compte ?{" "}
              <Link href="/inscription" onClick={close}>
                Créer un compte
              </Link>
            </p>
            <div className="menu-row">
              <Link href="/compte" onClick={close}>
                Mon compte
              </Link>
              <span aria-hidden="true">·</span>
              <Link href="/panier" onClick={close}>
                Mon panier
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
