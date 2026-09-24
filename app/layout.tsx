import "./globals.css";
import Link from "next/link";
import CartButton from "@/components/CartButton";
import MobileNav from "@/components/MobileNav";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export const metadata = {
  title: "FABIOLE METAL — Métallerie & fabrication sur mesure",
  description:
    "Portails, portes, fenêtres, mobilier métallique et réalisations personnalisées.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" data-theme="sombre" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fm-theme');if(t!=='clair'&&t!=='sombre'){t='sombre';try{localStorage.setItem('fm-theme',t)}catch(e){}}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','sombre')}})();`,
          }}
        />
      </head>
      <body>
        <div className="topbar">
          <strong>Atelier Bojongo</strong>&nbsp;— Portails · Portes · Mobilier sur
          mesure — Devis rapide sur WhatsApp
        </div>
        <header className="nav">
          <div className="container navin">
            <Link href="/" className="logo" aria-label="FABIOLE METAL — Accueil">
              <span className="logo-mark" aria-hidden="true">
                FM
              </span>
              <span className="logo-text">
                <span>FABIOLE METAL</span>
                <small>Atelier · Bojongo</small>
              </span>
            </Link>

            <nav className="nav-links" aria-label="Navigation principale">
              <Link href="/">Accueil</Link>
              <Link href="/services">Services</Link>
              <Link href="/boutique">Boutique</Link>
              <Link href="/galerie">Galerie</Link>
              <Link href="/contact">Contact</Link>
            </nav>

            <div className="nav-actions">
              <Link
                href="/contact"
                className="btn btn-primary btn-sm nav-cta"
              >
                Demander un devis
              </Link>
              <CartButton />
              <Link
                href="/compte"
                className="btn btn-sm hide-mobile"
                aria-label="Mon compte"
              >
                Compte
              </Link>
              <ThemeSwitcher />
              <MobileNav />
            </div>
          </div>
        </header>

        {children}

        <footer className="footer">
          <div className="container footer-grid">
            <div>
              <Link href="/" className="logo" style={{ marginBottom: 12 }}>
                <span className="logo-mark">FM</span>
                <span className="logo-text">
                  <span>FABIOLE METAL</span>
                  <small>Atelier · Bojongo</small>
                </span>
              </Link>
              <p>
                Fabrication métallique sur mesure, soudure et mobilier en fer.
                Portails, portes, fenêtres et réalisations personnalisées.
              </p>
              <div className="trust-bar">
                <span className="trust-pill">
                  <i /> Sur mesure
                </span>
                <span className="trust-pill blue">
                  <i /> Atelier local
                </span>
              </div>
            </div>

            <div>
              <b>Atelier</b>
              <p>
                <Link href="/a-propos">À propos</Link>
                <br />
                <Link href="/contact">Contact</Link>
                <br />
                <Link href="/compte">Compte</Link>
              </p>
            </div>

            <div>
              <b>Catalogue</b>
              <p>
                <Link href="/services">Services</Link>
                <br />
                <Link href="/boutique">Boutique</Link>
                <br />
                <Link href="/galerie">Galerie</Link>
                <br />
                <Link href="/panier">Panier</Link>
              </p>
            </div>

            <div>
              <b>Contact</b>
              <p>
                Face à la mairie de Bojongo
                <br />
                Tél / WhatsApp : +237 698 30 87 80
              </p>
              <Link
                href="/contact"
                className="btn btn-primary btn-sm"
                style={{ marginTop: 10 }}
              >
                Demander un devis
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
