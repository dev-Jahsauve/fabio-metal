import "./globals.css";
import Link from "next/link";
import CartButton from "@/components/CartButton";
import MobileNav from "@/components/MobileNav";
import SearchBox from "@/components/SearchBox";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { BRAND, CONTACT, FEATURES } from "@/lib/site";
import { getAppUrl } from "@/lib/utils";

const APP_URL = getAppUrl();

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${BRAND.name} — Boutique en ligne`,
    template: `%s — ${BRAND.name}`,
  },
  description: `Catalogue ${BRAND.name} : articles en stock et réalisations sur devis. Commande en ligne et paiement sécurisé.`,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: BRAND.name,
    title: `${BRAND.name} — Boutique en ligne`,
    description: `Articles en stock et réalisations sur devis. Commande en ligne et paiement sécurisé.`,
    images: [{ url: "/og-cover.jpg", width: 1200, height: 630, alt: BRAND.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — Boutique en ligne`,
    description: `Articles en stock et réalisations sur devis.`,
    images: ["/og-cover.jpg"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

function AccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

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
          <strong>{CONTACT.city || BRAND.baseline}</strong>&nbsp;— Catalogue en ligne — Réponse rapide sur WhatsApp
        </div>
        <header className="nav">
          <div className="container navin">
            <Link href="/" className="logo" aria-label={`${BRAND.name} — Accueil`}>
              <span className="logo-mark" aria-hidden="true">
                {BRAND.short}
              </span>
              <span className="logo-text">
                <span>{BRAND.name}</span>
                <small>{BRAND.baseline}</small>
              </span>
            </Link>

            <nav className="nav-links" aria-label="Navigation principale">
              <Link href="/">Accueil</Link>
              <Link href="/boutique">Boutique</Link>
              {FEATURES.services && <Link href="/services">Services</Link>}
              {FEATURES.gallery && <Link href="/galerie">Galerie</Link>}
              <Link href="/contact">Contact</Link>
            </nav>

            <div className="nav-actions">
              {FEATURES.search && (
                <div className="hide-mobile">
                  <SearchBox />
                </div>
              )}
              <CartButton />
              <Link
                href="/compte"
                className="btn btn-sm btn-icon"
                aria-label="Mon compte"
                title="Mon compte"
              >
                <AccountIcon />
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
                <span className="logo-mark">{BRAND.short}</span>
                <span className="logo-text">
                  <span>{BRAND.name}</span>
                  <small>{BRAND.baseline}</small>
                </span>
              </Link>
              <p>
                Articles en stock et réalisations sur devis, commandables en
                ligne avec paiement sécurisé.
              </p>
            </div>

            <div>
              <b>Boutique</b>
              <p>
                <Link href="/boutique">Catalogue</Link>
                <br />
                {FEATURES.services && (<><Link href="/services">Services</Link><br /></>)}
                {FEATURES.gallery && (<><Link href="/galerie">Galerie</Link><br /></>)}
                <Link href="/panier">Panier</Link>
                <br />
                <Link href="/contact">Demander un devis</Link>
              </p>
            </div>

            <div>
              <b>Aide</b>
              <p>
                <Link href="/cgv">Conditions de vente</Link>
                <br />
                <Link href="/retours">Retours & remboursements</Link>
                <br />
                <Link href="/confidentialite">Confidentialité</Link>
                <br />
                <Link href="/a-propos">À propos</Link>
              </p>
            </div>

            <div>
              <b>Contact</b>
              <p>
                {CONTACT.address}
                <br />
                Tél / WhatsApp : {CONTACT.phone}
              </p>
              <Link
                href="/contact"
                className="btn btn-primary btn-sm"
                style={{ marginTop: 10 }}
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
