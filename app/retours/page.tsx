import Link from "next/link";
import { BRAND, CONTACT } from "@/lib/site";

export const metadata = { title: `Retours & remboursements — ${BRAND.name}` };

export default function Retours() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 820 }}>
        <span className="eyebrow">Informations légales</span>
        <h1>Retours & remboursements.</h1>
        <div className="card" style={{ marginTop: 18, display: "grid", gap: 14 }}>
          <section>
            <h3>1. Articles standards</h3>
            <p>
              Un article standard non utilisé, dans son état d'origine, peut
              être signalé sous 7 jours après réception via la page{" "}
              <Link href="/contact">Contact</Link> en précisant la référence de
              commande. Après validation, le remboursement est effectué par le
              même moyen de paiement, sous un délai indicatif de 7 à 15 jours.
            </p>
          </section>
          <section>
            <h3>2. Articles sur mesure</h3>
            <p>
              Les articles fabriqués sur mesure ou personnalisés (marqués
              « sur devis ») ne sont ni repris ni remboursés, sauf défaut de
              fabrication avéré : dans ce cas, réparation, remplacement ou
              remboursement au choix de la boutique.
            </p>
          </section>
          <section>
            <h3>3. Paiement non abouti</h3>
            <p>
              Si un paiement est débité sans commande confirmée, contactez-nous
              avec la référence et le numéro de transaction : la situation est
              vérifiée côté prestataire puis régularisée (confirmation ou
              remboursement), sans démarche supplémentaire de votre part.
            </p>
          </section>
          <section>
            <h3>4. Suivi</h3>
            <p>
              L'état de votre commande et de votre paiement est consultable à
              tout moment dans <Link href="/compte">votre compte</Link>. Pour
              toute question : {CONTACT.phone}.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
