import Link from "next/link";
import { quoteUrl } from "@/lib/site";

/**
 * Action générique pour un produit non achetable directement
 * (personnalisé, sur mesure, prestation) : dirige vers la demande de devis
 * avec l'objet pré-rempli. Template : aucun secteur codé en dur.
 */
export default function QuoteButton({
  name,
  className = "btn btn-gold",
}: {
  name: string;
  className?: string;
}) {
  return (
    <Link className={className} href={quoteUrl(`Demande de devis : ${name}`)}>
      Demander un devis
    </Link>
  );
}
