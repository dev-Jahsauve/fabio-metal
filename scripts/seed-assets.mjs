import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_NOT_CONFIGURED");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  // 1. Catégories complémentaires (idempotent)
  await client.query(`
    INSERT INTO categories (name, slug) VALUES
    ('Portails & clotures','portails-clotures'),
    ('Portes metalliques','portes-metalliques'),
    ('Fenetres & protections','fenetres-protections'),
    ('Mobilier metallique','mobilier-metallique'),
    ('Porte-rideaux','porte-rideaux'),
    ('Barbecue & foyer','cuisine-foyer'),
    ('Accessoires metalliques','accessoires-metalliques')
    ON CONFLICT (slug) DO NOTHING;
  `);

  // 2. Produits issus des photos reelles de l'atelier.
  // Prix alignes sur le marche camerounais (portail grillage ~173k pose,
  // porte blindee normalisee ~634k, porte acier ~69k — generateur CYPE Cameroun).
  // Tous les prix sont des multiples de 5 (contrainte applicative).
  await client.query(`
    INSERT INTO products
      (category_id, sku, name, slug, description, price_xaf, promo_price_xaf, image_url, stock, is_custom, published)
    VALUES
      ((SELECT id FROM categories WHERE slug='portails-clotures'),
       'FM-PORT-001', 'Portail moderne tole + lames — sur mesure',
       'portail-moderne-tole-noir',
       'Grand portail en tole renforcee avec lames horizontales et arcs decoratifs, fabrication de l''atelier Bojongo. Dimensions et motorisation sur devis. Prix indicatif pour ~4 m pose comprise.',
       850000, 789000, '/produits/portail-moderne-noir.jpg', 2, true, true),
      ((SELECT id FROM categories WHERE slug='portes-metalliques'),
       'FM-PORT-002', 'Porte d''entree fer forge + grille fenetre',
       'porte-entree-fer-forge-volutes',
       'Porte d''entree noire a volutes avec serrure, assortie a sa grille de fenetre. Ensemble pose par l''atelier, peinture antirouille incluse.',
       145000, 129000, '/produits/porte-entree-volutes.jpg', 3, false, true),
      ((SELECT id FROM categories WHERE slug='portes-metalliques'),
       'FM-PORT-003', 'Porte decorative + grille antivol',
       'porte-decorative-grille-antivol',
       'Ensemble 2 panneaux emboutis gris + grille antivol a volutes. Ideal entree + protection, finition peinture au choix.',
       135000, 119000, '/produits/porte-decorative-grille.jpg', 4, false, true),
      ((SELECT id FROM categories WHERE slug='portes-metalliques'),
       'FM-PORT-004', 'Panneau de porte tole emboutie (l''unite)',
       'panneau-porte-tole-emboutie',
       'Panneau brut en tole emboutie motif diamant, a peindre et assembler. Vendu a l''unite, decoupe sur demande.',
       45000, NULL, '/produits/panneau-porte-embouti.jpg', 12, false, true),
      ((SELECT id FROM categories WHERE slug='cuisine-foyer'),
       'FM-FOY-001', 'Barbecue / grill sur pieds',
       'barbecue-grill-sur-pieds',
       'Grill a charbon sur pieds avec grille chromée et etagere basse, soudures renforcees. Parfait pour maison et petit commerce.',
       35000, 29500, '/produits/barbecue-sur-pieds.jpg', 6, false, true),
      ((SELECT id FROM categories WHERE slug='cuisine-foyer'),
       'FM-FOY-002', 'Support marmite / trepied foyer (l''unite)',
       'support-marmite-foyer',
       'Support rond en fer pour marmite, cuisson au feu de bois ou charbon. Fabrication atelier, diametre standard.',
       5000, NULL, '/produits/support-marmite.jpg', 24, false, true),
      ((SELECT id FROM categories WHERE slug='accessoires-metalliques'),
       'FM-ACC-001', 'Patere murale en fer forge',
       'patere-murale-fer-forge',
       'Crochet mural robuste pour rideaux, vetements ou ustensiles. Pose visserie incluse sur demande.',
       2500, NULL, '/produits/patere-murale.jpg', 30, false, true),
      ((SELECT id FROM categories WHERE slug='cuisine-foyer'),
       'FM-FOY-003', 'Plateau / fond metallique renforce sur mesure',
       'plateau-rond-renforce',
       'Disque metallique renforce avec cadre, base de brasero, couvercle de cuve ou fond sur mesure selon vos dimensions.',
       18000, NULL, '/produits/plateau-rond-renforce.jpg', 8, true, true),
      ((SELECT id FROM categories WHERE slug='fenetres-protections'),
       'FM-FEN-001', 'Grille de fenetre fer forge a volutes',
       'grille-fenetre-volutes',
       'Grille de protection peinte avec volutes et rosaces, cadre renforce. Dimensions standard ou sur mesure, pose par l''atelier.',
       28000, 24500, '/produits/grille-fenetre-volutes.jpg', 10, false, true),
      ((SELECT id FROM categories WHERE slug='fenetres-protections'),
       'FM-FEN-002', 'Grille de fenetre motif geometrique sur mesure',
       'grille-fenetre-motif-geometrique',
       'Grille a motif geometrique soudee en atelier, finition brute a peindre ou peinture au choix. Motif et dimensions personnalisables.',
       22000, NULL, '/produits/grille-fenetre-motif.jpg', 8, true, true)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      price_xaf = EXCLUDED.price_xaf,
      promo_price_xaf = EXCLUDED.promo_price_xaf,
      image_url = EXCLUDED.image_url,
      stock = EXCLUDED.stock,
      category_id = EXCLUDED.category_id,
      published = true,
      updated_at = NOW();
  `);

  // 3. Galerie : les 8 realisations reelles (idempotent par image_url unique partielle)
  await client.query(`
    INSERT INTO gallery (title, category, image_url, description, published)
    SELECT * FROM (VALUES
      ('Portail moderne tole + lames','Portails','/produits/portail-moderne-noir.jpg','Portail pose par l''atelier, tole renforcee et arcs decoratifs.', true),
      ('Porte d''entree + grille volutes','Portes','/produits/porte-entree-volutes.jpg','Ensemble porte d''entree et grille de fenetre en fer forge.', true),
      ('Porte decorative + grille antivol','Portes','/produits/porte-decorative-grille.jpg','Panneaux emboutis et grille de securite avant peinture.', true),
      ('Panneaux tole emboutie','Atelier','/produits/panneau-porte-embouti.jpg','Panneaux bruts en cours de fabrication a l''atelier.', true),
      ('Barbecue sur pieds','Foyer','/produits/barbecue-sur-pieds.jpg','Grill a charbon soude et peint a l''atelier.', true),
      ('Supports marmite','Foyer','/produits/support-marmite.jpg','Trepieds et supports de cuisson en fer rond.', true),
      ('Patere murale','Accessoires','/produits/patere-murale.jpg','Petite ferronnerie : crochet mural en fer.', true),
      ('Plateau renforce sur mesure','Atelier','/produits/plateau-rond-renforce.jpg','Disque renforce : base, couvercle ou fond de cuve.', true),
      ('Grille fenetre a volutes','Fenetres','/produits/grille-fenetre-volutes.jpg','Grille de protection peinte, volutes et rosaces forgees.', true),
      ('Grille fenetre motif geometrique','Fenetres','/produits/grille-fenetre-motif.jpg','Grille brute en cours de fabrication, motif sur mesure.', true)
    ) AS v(title, category, image_url, description, published)
    WHERE NOT EXISTS (SELECT 1 FROM gallery g WHERE g.image_url = v.image_url);
  `);

  const { rows: prods } = await client.query(
    `SELECT slug, price_xaf, promo_price_xaf FROM products WHERE published = true ORDER BY created_at DESC`
  );
  const { rows: gal } = await client.query(
    `SELECT COUNT(*)::int AS n FROM gallery WHERE published = true`
  );
  console.log(`Produits publies : ${prods.length}`);
  for (const p of prods) console.log(` - ${p.slug} : ${p.price_xaf} FCFA` + (p.promo_price_xaf ? ` (promo ${p.promo_price_xaf})` : ""));
  console.log(`Photos galerie publiees : ${gal[0].n}`);
} finally {
  client.release();
  await pool.end();
}
