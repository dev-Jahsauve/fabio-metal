import Link from "next/link";
import { BRAND, CONTACT } from "@/lib/site";

// Textes génériques du template : à adapter (coordonnées, délais, garanties)
// à chaque boutique réutilisant ce modèle. Aucune règle propre à un secteur.
export const metadata = { title: `Conditions générales de vente — ${BRAND.name}` };

export default function Cgv() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 820 }}>
        <span className="eyebrow">Informations légales</span>
        <h1>Conditions générales de vente.</h1>
        <div className="card" style={{ marginTop: 18, display: "grid", gap: 14 }}>
          <section>
            <h3>1. Objet</h3>
            <p>
              Les présentes conditions régissent les ventes conclues sur la
              boutique en ligne {BRAND.name} ({CONTACT.address} — {CONTACT.phone}).
              Toute commande implique leur acceptation.
            </p>
          </section>
          <section>
            <h3>2. Produits et prix</h3>
            <p>
              Les prix sont affichés en francs CFA (FCFA) et recalculés côté
              serveur au moment de la commande : seul le montant confirmé après
              validation fait foi. Les articles signalés « sur devis » ne sont
              pas achetables directement : dimensions, finition et prix définitif
              sont convenus avant toute fabrication ou commande.
            </p>
          </section>
          <section>
            <h3>3. Commande et paiement</h3>
            <p>
              La commande est créée en ligne puis payée via notre prestataire de
              paiement (mobile money, cartes selon disponibilité). Elle n'est
              confirmée qu'après vérification du paiement côté serveur ; un
              simple retour sur le site ne constitue jamais une preuve de paiement.
              Une facture est disponible après confirmation.
            </p>
          </section>
          <section>
            <h3>4. Livraison</h3>
            <p>
              Les délais et frais de livraison sont précisés avant validation
              (voir aussi la page <Link href="/retours">Retours & remboursements</Link>).
              Les articles volumineux ou sur mesure peuvent nécessiter une pose
              ou un retrait convenu avec la boutique.
            </p>
          </section>
          <section>
            <h3>5. Droit de rétractation et retours</h3>
            <p>
              Les articles fabriqués sur mesure ne sont ni repris ni échangés,
              sauf défaut avéré. Pour les articles standards, voir les modalités
              sur la page <Link href="/retours">Retours & remboursements</Link>.
            </p>
          </section>
          <section>
            <h3>6. Données personnelles</h3>
            <p>
              Les données de compte et de commande servent uniquement au
              traitement des achats. Voir la page <Link href="/confidentialite">Confidentialité</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
