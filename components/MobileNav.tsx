"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const TABS: Array<[string, string]> = [
  ["Accueil", "/"],
  ["Services", "/services"],
  ["Boutique", "/boutique"],
  ["Galerie", "/galerie"],
  ["Contact", "/contact"],
  ["À propos", "/a-propos"],
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
          <p className="menu-label">Onglets</p>
          <nav className="menu-tabs" aria-label="Onglets de navigation">
            {TABS.map(([label, href]) => (
              <Link key={href} href={href} onClick={close}>
                {label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>

          <p className="menu-label">Mon espace</p>
          <div className="menu-account">
            <Link href="/connexion" className="btn btn-primary menu-login" onClick={close}>
              <span aria-hidden="true">🔐</span> Se connecter
            </Link>
            <span className="menu-sep">ou</span>
            <Link href="/inscription" className="btn menu-register" onClick={close}>
              Créer un compte <span aria-hidden="true">→</span>
            </Link>
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
