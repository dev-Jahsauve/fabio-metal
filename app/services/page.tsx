import Link from "next/link"; import ServiceCarousel from "@/components/ServiceCarousel"; import {db} from '@/lib/db'; import {services} from '@/lib/db/schema'; import {asc,eq} from 'drizzle-orm'; import {notFound} from 'next/navigation'; import {FEATURES} from '@/lib/site';

// Photo réelle par service : le nouveau chantier ossature/kiosque a sa propre image,
// les autres gardent leur visuel d'atelier. Pas de simple recyclage d'anciennes photos.
const SERVICE_IMG_BY_SLUG: Record<string, string> = {
  "structures-kiosques-metalliques": "/produits/ossature-kiosque-metallique.jpg",
  "portails-clotures": "/produits/portail-moderne-noir.jpg",
  "portes-metalliques": "/produits/porte-entree-volutes.jpg",
  "fenetres-protections": "/produits/grille-fenetre-volutes.jpg",
  "cuisine-foyer": "/produits/barbecue-sur-pieds.jpg",
  "accessoires-metalliques": "/produits/patere-murale.jpg",
  "salle-a-manger": "/produits/support-marmite.jpg",
  "porte-rideaux": "/produits/panneau-porte-embouti.jpg",
  "fabrication-sur-mesure": "/produits/plateau-rond-renforce.jpg",
};

const SERVICE_IMGS = [
  "/produits/portail-moderne-noir.jpg",
  "/produits/porte-entree-volutes.jpg",
  "/produits/grille-fenetre-volutes.jpg",
  "/produits/barbecue-sur-pieds.jpg",
  "/produits/panneau-porte-embouti.jpg",
  "/produits/support-marmite.jpg",
  "/produits/ossature-kiosque-metallique.jpg",
];

const ICONS = ["POR", "POR", "FEN", "MOB", "RDM", "SUR", "STR"];

const fallback = [
  ['Portails & clôtures','Portails battants/coulissants, grilles, clôtures et ouvrages décoratifs.'],
  ['Portes métalliques','Portes de sécurité et modèles décoratifs sur mesure.'],
  ['Fenêtres & protections','Fenêtres métalliques, grilles de protection et ouvrages adaptés.'],
  ['Salle à manger','Tables, chaises et mobilier métallique sur mesure.'],
  ['Porte-rideaux','Rideaux métalliques pour commerces et locaux.'],
  ['Réalisations sur plan','Vous fournissez un croquis, une photo ou une idée ; le projet est étudié pour fabrication.'],
];

export default async function Services(){
  // Module optionnel du template : boutique uniquement => 404 propre.
  if (!FEATURES.services) return notFound();
  let s:any[]=[];
  try{s=await db.select().from(services).where(eq(services.published,true)).orderBy(asc(services.sortOrder));}catch{}
  const base: string[][] = s.length
    ? s.map(x=>[x.icon || "MET", x.title, x.description || 'Fabrication métallique sur mesure.'])
    : fallback.map(([t,d],i)=>[ICONS[i % ICONS.length], t, d]);
  const items = s.length
    ? s.map((x, i) => [x.icon || "MET", x.title, x.description || "Fabrication métallique sur mesure.", SERVICE_IMG_BY_SLUG[x.slug] || SERVICE_IMGS[i % SERVICE_IMGS.length]])
    : base.map((row,i)=>[...row, SERVICE_IMGS[i % SERVICE_IMGS.length]]);
  return <main className="section"><div className="container"><div className="head"><span className="eyebrow">Services</span><h1>Des ouvrages métalliques conçus pour <span className="gradient">durer.</span></h1><p>Faites défiler les savoir-faire de l’atelier — dont les structures et kiosques sur devis — puis demandez votre devis.</p></div><ServiceCarousel items={items}/><div className="card" style={{marginTop:24}}><h3>Un projet particulier ?</h3><p>Envoyez dimensions, photos ou croquis : l’atelier étudie chaque demande et répond avec un devis.</p><div className="actions"><Link href="/contact" className="btn btn-primary">Demander un devis</Link><Link href="/boutique" className="btn">Voir la boutique</Link><Link href="/galerie" className="btn">Voir le chantier en galerie</Link></div></div></div></main>;
}
