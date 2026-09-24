"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Status = "idle" | "loading" | "success" | "error";

export default function AddToCartButton({
  productId,
  stock = 1,
}: {
  productId: string;
  stock?: number;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const r = useRouter();

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function add() {
    // Anti double-clic : ignore si déjà en cours ou en succès récent
    if (status === "loading" || status === "success") return;
    if (stock <= 0) return;
    setStatus("loading");
    setMsg("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        r.push("/connexion?next=/panier");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        setMsg(data.error || "Impossible d'ajouter au panier.");
        return;
      }
      setStatus("success");
      setMsg("Ajouté au panier.");
      window.dispatchEvent(new CustomEvent("cart:updated"));
      r.refresh();
      // Retour à l'état normal après 2,5 s pour permettre un nouvel ajout
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setStatus("idle");
      }, 2500);
    } catch {
      setStatus("error");
      setMsg("Erreur réseau. Réessayez.");
    }
  }

  const loading = status === "loading";
  const success = status === "success";
  const disabled = loading || success || stock <= 0;

  return (
    <div className="add-cart">
      <button
        type="button"
        className={`btn btn-primary add-cart-btn${success ? " is-success" : ""}`}
        disabled={disabled}
        onClick={add}
        aria-live="polite"
        aria-busy={loading}
      >
        {stock <= 0 ? (
          "Rupture de stock"
        ) : loading ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Ajout en cours…
          </>
        ) : success ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Ajouté !
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Ajouter au panier
          </>
        )}
      </button>
      {msg && (
        <small className={status === "error" ? "add-cart-msg error" : "add-cart-msg success"}>
          {msg}{" "}
          {success && (
            <Link href="/panier" className="add-cart-link">
              Voir le panier →
            </Link>
          )}
        </small>
      )}
    </div>
  );
}
