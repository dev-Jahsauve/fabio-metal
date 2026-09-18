"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const AUTH_IMG =
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1000&q=80&auto=format&fit=crop";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const r = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setErr("Les mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    setErr("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(j.error || "Réinitialisation impossible");
      return;
    }
    setMsg("Mot de passe modifié. Redirection vers la connexion...");
    setTimeout(() => r.push("/connexion"), 1200);
  }
  return (
    <main className="section">
      <div className="container auth">
        <div className="auth-visual">
          <img src={AUTH_IMG} alt="Ouvrage métallique terminé" />
          <div className="auth-visual-text">
            <strong>Dernière étape.</strong>
            <span>Choisissez un nouveau mot de passe d’au moins 8 caractères.</span>
          </div>
        </div>
        <div className="card auth-card">
          <span className="eyebrow">Sécurité</span>
          <h1>Nouveau mot de passe</h1>
          {!token ? (
            <>
              <p className="error">Lien invalide ou expiré. Refaites une demande.</p>
              <div className="auth-links">
                <p><Link href="/mot-de-passe-oublie">← Redemander un lien</Link></p>
              </div>
            </>
          ) : (
            <>
              <p className="auth-sub">Créez votre nouveau mot de passe ci-dessous.</p>
              <form className="form" onSubmit={submit}>
                <label>
                  Nouveau mot de passe
                  <input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" />
                </label>
                <label>
                  Confirmer
                  <input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Répétez le mot de passe" />
                </label>
                {err && <p className="error">{err}</p>}
                {msg && <p className="success">{msg}</p>}
                <button className="btn btn-primary" disabled={busy || !token}>
                  {busy ? "Modification..." : "Modifier le mot de passe →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPassword() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
