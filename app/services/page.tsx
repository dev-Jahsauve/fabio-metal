import Link from "next/link"; import ServiceCarousel from "@/components/ServiceCarousel"; import {db} from '@/lib/db'; import {services} from '@/lib/db/schema'; import {asc,eq} from 'drizzle-orm';

const SERVICE_IMGS = [
  "/produits/portail-moderne-noir.jpg",
  "/produits/porte-entree-volutes.jpg",
  "/produits/grille-fenetre-volutes.jpg",
  "/produits/barbecue-sur-pieds.jpg",
  "/produits/panneau-porte-embouti.jpg",
  "/produits/support-marmite.jpg",
];

const ICONS = ["POR", "POR", "FEN", "MOB", "RDM", "SUR"];

const fallback = [
  ['Portails & clôtures','Portails battants/coulissants, grilles, clôtures et ouvrages décoratifs.'],
  ['Portes métalliques','Portes de sécurité et modèles décoratifs sur mesure.'],
  ['Fenêtres & protections','Fenêtres métalliques, grilles de protection et ouvrages adaptés.'],
  ['Salle à manger','Tables, chaises et mobilier métallique sur mesure.'],
  ['Porte-rideaux','Rideaux métalliques pour commerces et locaux.'],
  ['Réalisations sur plan','Vous fournissez un croquis, une photo ou une idée ; le projet est étudié pour fabrication.'],
];

export default async function Services(){
  let s:any[]=[];
  try{s=await db.select().from(services).where(eq(services.published,true)).orderBy(asc(services.sortOrder));}catch{}
  const base: string[][] = s.length
    ? s.map(x=>[x.icon || "MET", x.title, x.description || 'Fabrication métallique sur mesure.'])
    : fallback.map(([t,d],i)=>[ICONS[i % ICONS.length], t, d]);
  const items = base.map((row,i)=>[...row, SERVICE_IMGS[i % SERVICE_IMGS.length]]);
  return <main className="section"><div className="container"><div className="head"><span className="eyebrow">Services</span><h1>Des ouvrages métalliques conçus pour <span className="gradient">durer.</span></h1><p>Faites défiler les savoir-faire de l’atelier, puis demandez votre devis.</p></div><ServiceCarousel items={items}/><div className="card" style={{marginTop:24}}><h3>Un projet particulier ?</h3><p>Envoyez dimensions, photos ou croquis : l’atelier étudie chaque demande et répond avec un devis.</p><div className="actions"><Link href="/contact" className="btn btn-primary">Demander un devis</Link><Link href="/boutique" className="btn">Voir la boutique</Link></div></div></div></main>;
}
