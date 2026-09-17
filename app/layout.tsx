import "./globals.css";
import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export const metadata = {
  title: "FABIOLE METAL — Métallerie & fabrication sur mesure",
  description:
    "Portails, portes, fenêtres, mobilier métallique et réalisations personnalisées.",
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
            __html: `(function(){try{var t=localStorage.getItem('fm-theme');if(t){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <div className="topbar">Fabrication sur mesure à Bojongo — Portails, portes, mobilier — Devis rapide sur WhatsApp</div>
        <header className="nav">
          <div className="container navin">
            <Link href="/" className="logo">
              <span className="logo-mark">FM</span>
              <span>FABIOLE METAL</span>
            </Link>

            <nav className="links">
              <Link href="/">Accueil</Link>
              <Link href="/a-propos">À propos</Link>
              <Link href="/services">Services</Link>
              <Link href="/boutique">Boutique</Link>
              <Link href="/galerie">Galerie</Link>
              <Link href="/contact">Contact</Link>
            </nav>

            <div className="nav-actions">
              <Link href="/contact" className="btn btn-gold">
                Demander un devis
              </Link>
              <Link href="/compte" className="btn">Compte</Link>
              <Link href="/panier" className="btn">Panier</Link>
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
                <span>FABIOLE METAL</span>
              </Link>
              <p>
                Fabrication métallique sur mesure, soudure et mobilier en fer.
                Portails, portes, fenêtres et réalisations personnalisées.
              </p>
              <div className="trust-bar">
                <span className="trust-pill"><i />Sur mesure</span>
                <span className="trust-pill blue"><i />Atelier local</span>
              </div>
            </div>

            <div>
              <b>FABIOLE METAL</b>
              <p>
                <Link href="/a-propos">À propos</Link>
                <br />
                <Link href="/contact">Contact</Link>
                <br />
                <Link href="/compte">Compte</Link>
              </p>
            </div>

            <div>
              <b>Navigation</b>
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
              <b>Atelier</b>
              <p>
                Face à la mairie de Bojongo
                <br />
                Tél / WhatsApp : +237 678 02 71 16
              </p>
              <Link href="/contact" className="btn btn-gold" style={{ marginTop: 10 }}>
                Demander un devis
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}