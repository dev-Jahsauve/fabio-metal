import Link from "next/link";
import { BRAND, CONTACT } from "@/lib/site";

export const metadata = { title: `Politique de confidentialité — ${BRAND.name}` };

export default function Confidentialite() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 820 }}>
        <span className="eyebrow">Informations légales</span>
        <h1>Politique de confidentialité.</h1>
        <div className="card" style={{ marginTop: 18, display: "grid", gap: 14 }}>
          <section>
            <h3>1. Données collectées</h3>
            <p>
              {BRAND.name} collecte uniquement les données nécessaires : identité
              et contact du compte, adresses de livraison, contenu des commandes
              et demandes de devis. Les identifiants de paiement sont traités
              par le prestataire de paiement, jamais stockés sur ce site.
            </p>
          </section>
          <section>
            <h3>2. Utilisation</h3>
            <p>
              Ces données servent au traitement des commandes, à la livraison,
              au support client et aux obligations comptables. Aucune revente à
              des tiers.
            </p>
          </section>
          <section>
            <h3>3. Sécurité</h3>
            <p>
              Les mots de passe sont chiffrés, les sessions sont protégées et
              l'accès à l'administration est réservé. Les prix et statuts de
              paiement sont toujours vérifiés côté serveur.
            </p>
          </section>
          <section>
            <h3>4. Vos droits</h3>
            <p>
              Vous pouvez demander la modification ou la suppression de vos
              données personnelles à tout moment via la page{" "}
              <Link href="/contact">Contact</Link> ({CONTACT.phone}). Les
              factures conservées pour la comptabilité sont exclues de la
              suppression pendant leur durée légale.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
