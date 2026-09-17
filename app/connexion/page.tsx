"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card">
          <span className="eyebrow">Espace sécurisé</span>
          <h1>Connexion</h1>
          <form className="form" onSubmit={go}>
            <label>
              Email
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Mot de passe
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {err && <p className="error">{err}</p>}
            <button className="btn btn-gold" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
          <p>
            <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
          </p>
          <p style={{ color: "var(--muted)" }}>
            Pas encore de compte ? <Link href="/inscription">Créer un compte</Link>
          </p>
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
