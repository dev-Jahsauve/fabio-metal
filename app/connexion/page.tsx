"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const AUTH_IMG =
  "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1000&q=80&auto=format&fit=crop";

function ConnexionForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const r = useRouter();
  const params = useSearchParams();
  async function go(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const x = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await x.json();
      if (!x.ok) {
        setErr(j.error || "Connexion impossible");
        return;
      }
      const next = params.get("next");
      r.push(next || (j.role === "admin" ? "/admin" : "/compte"));
      r.refresh();
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="section">
      <div className="container auth">
        <div className="auth-visual">
          <img src={AUTH_IMG} alt="Étincelles de soudure à l'atelier" />
          <div className="auth-visual-text">
            <strong>Bon retour à l’atelier.</strong>
            <span>Suivez vos commandes et commandez vos ouvrages en quelques clics.</span>
          </div>
        </div>
        <div className="card auth-card">
          <span className="eyebrow">Espace sécurisé</span>
          <h1>Connexion</h1>
          <p className="auth-sub">Accédez à votre compte client pour suivre vos commandes.</p>
          <form className="form" onSubmit={go}>
            <label>
              Email
              <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
            </label>
            <label>
              Mot de passe
              <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </label>
            {err && <p className="error">{err}</p>}
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter →"}
            </button>
          </form>
          <div className="auth-links">
            <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
            <p>
              Pas encore de compte ? <Link href="/inscription">Créer un compte</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Connexion() {
  return (
    <Suspense>
      <ConnexionForm />
    </Suspense>
  );
}
