import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products, gallery, services } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

// Remet en boutique les produits issus des photos du dossier assets/
// (copies web dans public/produits/). Idempotent : relance sans doublon.
// Inclut les 5 nouveaux médias : 2 produits (porte 2 battants, coffre moto),
// 1 service (ossature/kiosque) + 5 entrées galerie (dont 2 vidéos).
const CATS = [
  ["Portails & clôtures", "portails-clotures"],
  ["Portes métalliques", "portes-metalliques"],
  ["Fenêtres & protections", "fenetres-protections"],
  ["Barbecue & foyer", "cuisine-foyer"],
  ["Accessoires métalliques", "accessoires-metalliques"],
] as const;

type P = {
  cat: string; sku: string; name: string; slug: string; desc: string;
  price: number; promo: number | null; img: string; stock: number; custom: boolean;
};

const ITEMS: P[] = [
  { cat: "portails-clotures", sku: "FM-PORT-001", name: "Portail moderne tôle + lames — sur mesure", slug: "portail-moderne-tole-noir", desc: "Grand portail en tôle renforcée avec lames horizontales et arcs décoratifs, fabrication de l'atelier Bojongo. Dimensions et motorisation sur devis. Prix indicatif pour ~4 m pose comprise.", price: 790000, promo: 745000, img: "/produits/portail-moderne-noir.jpg", stock: 2, custom: true },
  { cat: "portes-metalliques", sku: "FM-PORT-002", name: "Porte d'entrée fer forgé + grille fenêtre", slug: "porte-entree-fer-forge-volutes", desc: "Porte d'entrée noire à volutes avec serrure, assortie à sa grille de fenêtre. Ensemble posé par l'atelier, peinture antirouille incluse.", price: 145000, promo: 129000, img: "/produits/porte-entree-volutes.jpg", stock: 3, custom: false },
  { cat: "portes-metalliques", sku: "FM-PORT-003", name: "Porte décorative + grille antivol", slug: "porte-decorative-grille-antivol", desc: "Ensemble 2 panneaux emboutis gris + grille antivol à volutes. Idéal entrée + protection, finition peinture au choix.", price: 135000, promo: 119000, img: "/produits/porte-decorative-grille.jpg", stock: 4, custom: false },
  { cat: "portes-metalliques", sku: "FM-PORT-004", name: "Panneau de porte tôle emboutie (l'unité)", slug: "panneau-porte-tole-emboutie", desc: "Panneau brut en tôle emboutie motif diamant, à peindre et assembler. Vendu à l'unité, découpe sur demande.", price: 45000, promo: null, img: "/produits/panneau-porte-embouti.jpg", stock: 12, custom: false },
  { cat: "cuisine-foyer", sku: "FM-FOY-001", name: "Barbecue / grill sur pieds", slug: "barbecue-grill-sur-pieds", desc: "Grill à charbon sur pieds avec grille chromée et étagère basse, soudures renforcées. Parfait pour maison et petit commerce.", price: 35000, promo: 29500, img: "/produits/barbecue-sur-pieds.jpg", stock: 6, custom: false },
  { cat: "cuisine-foyer", sku: "FM-FOY-002", name: "Support marmite / trépied foyer (l'unité)", slug: "support-marmite-foyer", desc: "Support rond en fer pour marmite, cuisson au feu de bois ou charbon. Fabrication atelier, diamètre standard.", price: 5000, promo: null, img: "/produits/support-marmite.jpg", stock: 24, custom: false },
  { cat: "accessoires-metalliques", sku: "FM-ACC-001", name: "Patère murale en fer forgé", slug: "patere-murale-fer-forge", desc: "Crochet mural robuste pour rideaux, vêtements ou ustensiles. Pose visserie incluse sur demande.", price: 2500, promo: null, img: "/produits/patere-murale.jpg", stock: 30, custom: false },
  { cat: "cuisine-foyer", sku: "FM-FOY-003", name: "Plateau / fond métallique renforcé sur mesure", slug: "plateau-rond-renforce", desc: "Disque métallique renforcé avec cadre, base de brasero, couvercle de cuve ou fond sur mesure selon vos dimensions.", price: 18000, promo: null, img: "/produits/plateau-rond-renforce.jpg", stock: 8, custom: true },
  { cat: "fenetres-protections", sku: "FM-FEN-001", name: "Grille de fenêtre fer forgé à volutes", slug: "grille-fenetre-volutes", desc: "Grille de protection peinte avec volutes et rosaces, cadre renforcé. Dimensions standard ou sur mesure, pose par l'atelier.", price: 28000, promo: 24500, img: "/produits/grille-fenetre-volutes.jpg", stock: 10, custom: false },
  { cat: "fenetres-protections", sku: "FM-FEN-002", name: "Grille de fenêtre motif géométrique sur mesure", slug: "grille-fenetre-motif-geometrique", desc: "Grille à motif géométrique soudée en atelier, finition brute à peindre ou peinture au choix. Motif et dimensions personnalisables.", price: 22000, promo: null, img: "/produits/grille-fenetre-motif.jpg", stock: 8, custom: true },
  // --- Nouveaux médias du 30/09/2026 (assets/1.jpeg, 2.jpeg, 3.jpeg) ---
  // 2.jpeg = porte 2 battants → PRODUIT vendable (prix/stock/panier) + galerie.
  { cat: "portes-metalliques", sku: "FM-PORT-005", name: "Porte métallique 2 battants + motifs emboutis", slug: "porte-metallique-2-battants-motifs", desc: "Porte 2 battants en fer peint avec barreaux, poignée et 2 motifs emboutis. Serrure incluse, dimensions standard ou sur mesure, pose par l'atelier.", price: 95000, promo: 89000, img: "/produits/porte-metallique-2-battants.jpg", stock: 3, custom: false },
  // 3.jpeg = coffre moto → PRODUIT (accessoire vendable) + vitrine LIVRAISON.
  { cat: "accessoires-metalliques", sku: "FM-ACC-002", name: "Coffre / malle de livraison moto en tôle", slug: "coffre-malle-livraison-moto", desc: "Malle arrière moto en tôle peinte avec serrure, fabriquée à l'atelier. Idéale livraison / transport. Dimensions adaptables selon la moto.", price: 28000, promo: null, img: "/produits/coffre-livraison-moto.jpg", stock: 5, custom: true },
];

// 1.jpeg = ossature/kiosque en chantier → SERVICE sur devis (pas de stock) + galerie.
// 1.mp4 / 2.mp4 = atelier en action → GALERIE vidéos (preuve de savoir-faire), pas en boutique.
const GALLERY_ITEMS = [
  { title: "Porte métallique 2 battants + motifs", category: "Portes", imageUrl: "/produits/porte-metallique-2-battants.jpg", description: "Porte 2 battants peinte, barreaux + motifs emboutis, serrure incluse." },
  { title: "Coffre de livraison moto en tôle", category: "Livraison", imageUrl: "/produits/coffre-livraison-moto.jpg", description: "Malle arrière moto fabriquée à l'atelier — illustre aussi notre capacité de livraison." },
  { title: "Ossature / kiosque métallique en chantier", category: "Structures", imageUrl: "/produits/ossature-kiosque-metallique.jpg", description: "Charpente métallique (kiosque / local) en cours d'assemblage à l'atelier Bojongo. Sur devis." },
  { title: "Atelier en action — vidéo 1", category: "Atelier", imageUrl: "/produits/atelier-fabrication-1.mp4", description: "Démonstration du savoir-faire : fabrication et soudure à l'atelier." },
  { title: "Atelier en action — vidéo 2", category: "Atelier", imageUrl: "/produits/atelier-fabrication-2.mp4", description: "Démonstration du savoir-faire : fabrication et soudure à l'atelier." },
] as const;

const SERVICE_ITEMS = [
  {
    title: "Structures & kiosques métalliques",
    slug: "structures-kiosques-metalliques",
    description: "Ossatures, kiosques, hangars et locaux métalliques assemblés sur site. Étude, fabrication et montage sur devis — voir photo de chantier et vidéos d'atelier en galerie.",
    icon: "STR",
    sortOrder: 6,
  },
  // Chaque catégorie produit a son service : le foyer et les accessoires
  // manquaient (barbecue, marmite, plateau, patère, coffre moto).
  {
    title: "Barbecue & foyer",
    slug: "cuisine-foyer",
    description: "Barbecues sur pieds, supports marmite et plateaux renforcés fabriqués à l'atelier, à l'unité ou sur mesure.",
    icon: "FOY",
    sortOrder: 7,
  },
  {
    title: "Accessoires métalliques",
    slug: "accessoires-metalliques",
    description: "Patères murales, coffres de livraison moto et petits accessoires en fer forgé ou en tôle.",
    icon: "ACC",
    sortOrder: 8,
  },
] as const;

export async function POST() {
  try {
    await requireAdmin();
    for (const [name, slug] of CATS) {
      const [row] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1);
      if (!row) await db.insert(categories).values({ name, slug });
    }
    let restored = 0;
    for (const it of ITEMS) {
      const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, it.cat)).limit(1);
      const values = {
        categoryId: cat?.id ?? null, sku: it.sku, name: it.name, slug: it.slug,
        description: it.desc, priceXaf: it.price, promoPriceXaf: it.promo,
        imageUrl: it.img, stock: it.stock, isCustom: it.custom, published: true,
        updatedAt: new Date(),
      };
      const [done] = await db.insert(products).values(values)
        .onConflictDoUpdate({ target: products.slug, set: { ...values } })
        .returning({ id: products.id });
      if (done) restored++;
    }
    // Le produit de test reste archivé (des commandes s'y réfèrent) : la boutique
    // n'affiche que les produits publiés.
    await db.update(products).set({ published: false, updatedAt: new Date() }).where(eq(products.slug, "portail-metallique-test")).catch(() => {});
    // Galerie : ajoute les 5 nouveaux médias s'ils n'existent pas déjà (idempotent).
    let galleryAdded = 0;
    for (const g of GALLERY_ITEMS) {
      const [exists] = await db.select({ id: gallery.id }).from(gallery).where(eq(gallery.imageUrl, g.imageUrl)).limit(1);
      if (!exists) {
        await db.insert(gallery).values({ title: g.title, category: g.category, imageUrl: g.imageUrl, description: g.description, published: true });
        galleryAdded++;
      }
    }
    // Services : ossature/kiosque (1.jpeg) = prestation sur devis, pas un produit en stock.
    // + les 2 services manquants pour couvrir toutes les catégories produits.
    let serviceAdded = 0;
    for (const s of SERVICE_ITEMS) {
      const [exists] = await db.select({ id: services.id }).from(services).where(eq(services.slug, s.slug)).limit(1);
      if (!exists) {
        await db.insert(services).values({ ...s, published: true });
        serviceAdded++;
      }
    }
    const rows = await db.select().from(products).where(eq(products.published, true));
    return NextResponse.json({ ok: true, restored, published: rows.length, products: rows, galleryAdded, serviceAdded });
  } catch (e) { return errorResponse(e); }
}
