import Link from "next/link";

type Variant = "admin-login" | "admin-forbidden" | "login";

// Page d'erreur d'accès : messages simples et rassurants, sans code technique,
// sans détail interne, sans confirmation de l'existence d'une donnée d'autrui.
// Réutilise les classes existantes (.card, .btn) : aucun nouveau design.
export default function AccessDenied({ variant, next }: { variant: Variant; next?: string }) {
  const loginHref = next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion";
  if (variant === "admin-login") {
    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="card">
            <span className="eyebrow">Espace réservé</span>
            <h1>Administration protégée.</h1>
            <p>Connectez-vous avec un compte administrateur pour accéder à la gestion.</p>
            <div className="actions">
              <Link className="btn btn-gold" href="/connexion?next=/admin">
                Se connecter
              </Link>
              <Link className="btn" href="/">
                Retour à l’accueil
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }
  if (variant === "admin-forbidden") {
    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="card">
            <span className="eyebrow">Accès refusé</span>
            <h1>Espace réservé à l’administration.</h1>
            <p>
              Votre compte est bien connecté, mais il ne dispose pas des droits nécessaires pour voir
              cette page. Si vous pensez qu’il s’agit d’une erreur, contactez-nous sur WhatsApp.
            </p>
            <div className="actions">
              <Link className="btn btn-gold" href="/compte">
                Voir mon compte
              </Link>
              <Link className="btn" href="/boutique">
                Retour à la boutique
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="card">
          <span className="eyebrow">Espace privé</span>
          <h1>Connexion requise.</h1>
          <p>Connectez-vous pour accéder à cette page. Vos données restent strictement personnelles.</p>
          <div className="actions">
            <Link className="btn btn-gold" href={loginHref}>
              Connexion
            </Link>
            <Link className="btn" href="/">
              Retour à l’accueil
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
