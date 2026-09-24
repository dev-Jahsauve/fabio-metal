"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatXaf } from "@/lib/utils";

type Item = {
  id: string;
  productId: string;
  quantity: number;
  name: string;
  slug: string;
  priceXaf: number;
  promoPriceXaf: number | null;
  stock: number;
  imageUrl: string | null;
  published: boolean;
};

function Thumb({ item }: { item: Item }) {
  if (item.imageUrl) {
    return (
      <Link
        href={`/boutique/${item.slug}`}
        className="cart-thumb"
        aria-label={`Voir ${item.name}`}
        tabIndex={-1}
      >
        <img src={item.imageUrl} alt={item.name} loading="lazy" />
      </Link>
    );
  }
  return (
    <div className="cart-thumb cart-thumb-fallback" aria-hidden="true">
      <span>FM</span>
    </div>
  );
}

export default function CartView() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const r = useRouter();

  const load = useCallback(async () => {
    setErr("");
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (res.status === 401) {
        r.push("/connexion?next=/panier");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Impossible de charger le panier.");
        return;
      }
      setItems(data.items ?? []);
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {
      setErr("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }, [r]);

  useEffect(() => {
    load();
  }, [load]);

  async function change(productId: string, quantity: number) {
    if (pendingId) return; // anti double-clic global simple
    setPendingId(productId);
    setErr("");
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Quantité indisponible.");
        return;
      }
      await load();
    } catch {
      setErr("Erreur réseau. Réessayez.");
    } finally {
      setPendingId(null);
    }
  }

  async function removeItem(productId: string) {
    if (pendingId) return;
    if (!window.confirm("Retirer cet article du panier ?")) return;
    setPendingId(productId);
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || "Suppression impossible.");
        return;
      }
      await load();
      window.dispatchEvent(new CustomEvent("cart:updated"));
      r.refresh();
    } catch {
      setErr("Erreur réseau. Réessayez.");
    } finally {
      setPendingId(null);
    }
  }

  const total = items.reduce(
    (s, i) => s + (i.promoPriceXaf ?? i.priceXaf) * i.quantity,
    0
  );

  if (loading) {
    return (
      <div className="cart-list" aria-busy="true" aria-label="Chargement du panier">
        {[0, 1, 2].map((k) => (
          <div className="card cart-item cart-skeleton" key={k}>
            <div className="cart-thumb cart-thumb-fallback">
              <span className="spinner" aria-hidden="true" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="skel skel-title" />
              <div className="skel skel-line" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {err && (
        <p className="error" role="alert" style={{ marginBottom: 12 }}>
          {err}
        </p>
      )}
      {!items.length ? (
        <div className="card">
          <h2>Votre panier est vide.</h2>
          <p>Ajoutez un ouvrage depuis la boutique.</p>
          <Link className="btn btn-primary" href="/boutique">
            Voir la boutique
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {items.map((i) => {
              const unit = i.promoPriceXaf ?? i.priceXaf;
              const busy = pendingId === i.productId;
              return (
                <article className="card cart-item" key={i.productId}>
                  <Thumb item={i} />
                  <div className="cart-info">
                    <h3>
                      <Link href={`/boutique/${i.slug}`}>{i.name}</Link>
                    </h3>
                    <p className="cart-unit">{formatXaf(unit)} l’unité</p>
                    <div className="qty">
                      <button
                        type="button"
                        onClick={() => change(i.productId, i.quantity - 1)}
                        disabled={busy}
                        aria-label={`Réduire la quantité de ${i.name}`}
                      >
                        {busy ? "…" : "−"}
                      </button>
                      <strong aria-live="polite">{i.quantity}</strong>
                      <button
                        type="button"
                        onClick={() => change(i.productId, i.quantity + 1)}
                        disabled={busy || i.quantity >= i.stock}
                        aria-label={`Augmenter la quantité de ${i.name}`}
                        title={i.quantity >= i.stock ? `Stock max : ${i.stock}` : undefined}
                      >
                        {busy ? "…" : "+"}
                      </button>
                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => removeItem(i.productId)}
                        disabled={busy}
                        aria-label={`Retirer ${i.name} du panier`}
                      >
                        Retirer
                      </button>
                    </div>
                    {i.quantity >= i.stock && (
                      <small className="cart-stock">Stock max atteint ({i.stock})</small>
                    )}
                  </div>
                  <strong className="price">{formatXaf(unit * i.quantity)}</strong>
                </article>
              );
            })}
          </div>
          <div className="card cart-summary">
            <h3>Total estimé</h3>
            <div className="price">{formatXaf(total)}</div>
            <p>
              {items.length} article{items.length > 1 ? "s" : ""} · Frais de
              livraison calculés au checkout.
            </p>
            <div className="actions">
              <Link className="btn btn-primary" href="/checkout">
                Passer au checkout
              </Link>
              <Link className="btn" href="/boutique">
                Continuer mes achats
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
