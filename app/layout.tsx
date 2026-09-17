import "./globals.css";
import Link from "next/link";
import MobileNav from "@/components/MobileNav";

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
    <html lang="fr">
      <body>
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
              <Link href="/compte">Compte</Link>
              <Link href="/panier">Panier</Link>
              <MobileNav />
            </div>
          </div>
        </header>

        {children}

        <footer className="footer">
          <div className="container footer-grid">
            <div>
              <p>
                Fabrication métallique sur mesure, soudure et mobilier en fer.
              </p>
            </div>

            <div>
              <b style={{ color: "#fff" }}>FABIOLE METAL</b>
            </div>

            <div>
              <b style={{ color: "#fff" }}>Navigation</b>
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
              <b style={{ color: "#fff" }}>Atelier</b>
              <p>
                Face à la mairie de Bojongo
                <br />
                Tél / WhatsApp : +237 678 02 71 16
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}