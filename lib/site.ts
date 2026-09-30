/**
 * Configuration générique du template e-commerce.
 *
 * Ce fichier est le SEUL endroit où l'identité de la boutique est définie.
 * Les données FABIOLE METAL ci-dessous sont des valeurs de démonstration :
 * pour réutiliser le template, modifiez ces constantes (ou les variables
 * d'environnement NEXT_PUBLIC_*) sans toucher au reste du code.
 *
 * Aucune logique métier (paiement, stock, commandes) ne dépend de ces valeurs.
 */

// Marque — démo : FABIOLE METAL. Préfixe court utilisé dans les références
// de commande (ex : FM3FA2...). 2 à 4 lettres majuscules.
export const BRAND = {
  name: "FABIOLE METAL",
  short: "FM",
  baseline: "Atelier · Bojongo",
  orderPrefix: "FM",
};

// Coordonnées — démo. WhatsApp sans "+" ni espaces, surchargeable par env.
export const CONTACT = {
  address: "Face à la mairie de Bojongo",
  city: "Bojongo",
  phone: "+237 698 30 87 80",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "237698308780",
};

// Modules optionnels : passez un flag à `false` pour adapter le template à
// une boutique sans cette rubrique (ex : boutique uniquement, sans services).
export const FEATURES = {
  services: true,
  gallery: true,
  search: true,
  quotes: true,
} as const;

/**
 * État d'achat générique d'un produit (template, pas de règle métier
 * spécifique à un secteur) :
 * - "buyable" : achetable directement (panier puis commande) ;
 * - "quote" : nécessite une demande de devis (produit personnalisé / sur
 *   mesure / prestation). Jamais de panier ni de paiement direct ;
 * - "unavailable" : non publié ou sans stock.
 *
 * La colonne `isCustom` en base porte le sens générique "nécessite un devis".
 */
export type PurchaseState = "buyable" | "quote" | "unavailable";

export function purchaseState(product: {
  published: boolean;
  stock: number;
  isCustom: boolean;
}): PurchaseState {
  if (!product.published) return "unavailable";
  if (product.isCustom) return "quote";
  if (product.stock <= 0) return "unavailable";
  return "buyable";
}

/** Lien vers la demande de devis pour un produit (ou un service). */
export function quoteUrl(subject: string) {
  return `/contact?objet=${encodeURIComponent(subject)}`;
}
