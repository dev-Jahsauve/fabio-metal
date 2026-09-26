"use client";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordField from "@/components/PasswordField";
import GoogleLoginButton from "@/components/GoogleLoginButton";

const AUTH_IMG = "/produits/porte-decorative-grille.jpg";

export default function Inscription() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const r = useRouter();
  async function go(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const x = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const j = await x.json();
      if (!x.ok) {
        setErr(j.error || "Inscription impossible");
        return;
      }
      r.push("/compte");
      r.refresh();
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="section">
      <div className="container auth">
        <div className="auth-visual">
          <img src={AUTH_IMG} alt="Structure métallique en construction" />
          <div className="auth-visual-text">
            <strong>Rejoignez l’atelier.</strong>
            <span>Un compte pour commander, suivre et discuter de vos ouvrages.</span>
          </div>
        </div>
        <div className="card auth-card">
          <span className="eyebrow">Créer un compte</span>
          <h1>Votre espace client</h1>
          <p className="auth-sub">Gratuit, en moins d’une minute. Vos données restent privées.</p>
          <form className="form" onSubmit={go}>
            <label>
              Nom
              <input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom complet" />
            </label>
            <label>
              Email
              <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
            </label>
            <label>
              Téléphone
              <input autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237..." />
            </label>
            <PasswordField label="Mot de passe" value={password} onChange={setPassword} autoComplete="new-password" placeholder="8 caractères minimum" minLength={8} />
            {err && <p className="error">{err}</p>}
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Création..." : "Créer mon compte →"}
            </button>
          </form>
          <div className="auth-divider" aria-hidden="true">
            <span>ou</span>
          </div>
          <Suspense>
            <GoogleLoginButton label="S'inscrire avec Google" />
          </Suspense>
          <div className="auth-links">
            <p>
              Déjà inscrit ? <Link href="/connexion">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
