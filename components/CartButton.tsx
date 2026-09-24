"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function CartButton() {
  const [count, setCount] = useState(0);
  const [bump, setBump] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const items: { quantity?: number }[] = data.items ?? [];
      const total = items.reduce((s, i) => s + (i.quantity ?? 0), 0);
      setCount((prev) => {
        if (total !== prev && total > prev) {
          setBump(true);
          window.setTimeout(() => setBump(false), 450);
        }
        return total;
      });
    } catch {
      /* silencieux : le bouton reste visible sans badge */
    }
  }, []);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    const onFocus = () => load();
    window.addEventListener("cart:updated", onUpdate);
    window.addEventListener("focus", onFocus);
    const id = window.setInterval(load, 30000);
    return () => {
      window.removeEventListener("cart:updated", onUpdate);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [load]);

  const label =
    count > 0 ? `Voir le panier, ${count} article${count > 1 ? "s" : ""}` : "Voir le panier";

  return (
    <Link
      href="/panier"
      className={`cart-btn${count > 0 ? " has-items" : ""}${bump ? " bump" : ""}`}
      aria-label={label}
      title="Mon panier"
    >
      <span className="cart-btn-icon" aria-hidden="true">
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 7h15l-1.6 7.2a2 2 0 0 1-2 1.6H8.7a2 2 0 0 1-2-1.6L4.2 3.9A1 1 0 0 0 3.2 3H1.5" />
          <circle cx="9.5" cy="20.5" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="17.5" cy="20.5" r="1.4" fill="currentColor" stroke="none" />
          <path d="M9 10.5v3M12 10.5v3M15 10.5v3" opacity="0.55" strokeWidth="1.6" />
        </svg>
      </span>
      <span className="cart-btn-label">Panier</span>
      {count > 0 && (
        <span className="cart-badge" aria-hidden="true">
          {count > 99 ? "99+" : count}
        </span>
      )}
      {/* Lecteur d'écran : annonce le nombre */}
      <span className="sr-only" aria-live="polite">
        {count > 0 ? `${count} article${count > 1 ? "s" : ""} dans le panier` : ""}
      </span>
    </Link>
  );
}
