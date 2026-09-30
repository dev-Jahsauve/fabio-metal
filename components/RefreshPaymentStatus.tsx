"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const TERMINAL = ["success", "failed", "cancelled", "expired", "refunded", "partially_refunded"];

// Bouton "Actualiser le statut" + revérification automatique discrète
// (toutes les 10 s, 10 fois max) tant que le paiement n'est pas terminal.
// Réutilise les classes .btn existantes : aucun changement de design.
export default function RefreshPaymentStatus({ orderId, initialStatus }: { orderId: string; initialStatus: string }) {
  const r = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const attempts = useRef(0);

  async function refresh(auto: boolean) {
    if (busy) return;
    setBusy(true);
    if (!auto) setErr("");
    try {
      const res = await fetch(`/api/orders/${orderId}/refresh-payment`, { method: "POST", cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!auto) setErr(j.error || "Actualisation impossible");
        return;
      }
      if (j.paymentStatus) setStatus(j.paymentStatus);
      r.refresh();
    } catch {
      if (!auto) setErr("Connexion impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (TERMINAL.includes(status) || attempts.current >= 10) return;
    const id = window.setInterval(() => {
      attempts.current += 1;
      if (attempts.current > 10) {
        window.clearInterval(id);
        return;
      }
      refresh(true);
    }, 10000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (TERMINAL.includes(status)) return null;
  return (
    <div className="actions" style={{ marginTop: 12 }}>
      <button className="btn" onClick={() => refresh(false)} disabled={busy}>
        {busy ? "Vérification…" : "Actualiser le statut"}
      </button>
      {err && <p className="error">{err}</p>}
      <small>Le statut est revérifié auprès de l’opérateur de paiement.</small>
    </div>
  );
}
