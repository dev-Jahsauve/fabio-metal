import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import ProfileSettings from "@/components/ProfileSettings";

export const metadata = {
  title: "Paramètres — FABIOLE METAL",
  description: "Gérez votre profil, votre photo et vos identifiants.",
};

export default async function Parametres() {
  const u = await getCurrentUser();
  if (!u)
    return (
      <main className="section">
        <div className="container">
          <div className="card">
            <h1>Paramètres</h1>
            <p>Connectez-vous pour gérer votre profil et vos identifiants.</p>
            <Link className="btn btn-gold" href="/connexion?next=/parametres">
              Connexion
            </Link>
          </div>
        </div>
      </main>
    );

  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Mon compte</span>
        <h1>Paramètres</h1>
        <p style={{ color: "var(--muted)" }}>
          Bonjour {u.name} — ajoutez votre photo de profil et gérez vos identifiants comme vous voulez.
        </p>
        <div className="actions" style={{ marginTop: 12 }}>
          <Link className="btn" href="/compte">
            ← Retour à mon espace
          </Link>
          <Link className="btn" href="/boutique">
            Voir la boutique
          </Link>
        </div>
        <ProfileSettings />
      </div>
    </main>
  );
}
