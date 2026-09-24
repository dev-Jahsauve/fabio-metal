import Link from 'next/link'; import { db } from "@/lib/db"; import { products, categories } from "@/lib/db/schema"; import { eq, desc } from "drizzle-orm"; import { formatXaf, waLink } from "@/lib/utils"; import AddToCartButton from '@/components/AddToCartButton';

function StockPill({ stock }: { stock: number }) {
  if (stock <= 0) return <span className="pill pill-out">Rupture</span>;
  if (stock <= 5) return <span className="pill pill-low">Plus que {stock}</span>;
  return <span className="pill pill-ok">En stock</span>;
}

export default async function Boutique(){
  let ps:any[]=[];
  try{
    ps=await db.select({ p: products, categoryName: categories.name }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(eq(products.published,true)).orderBy(desc(products.createdAt));
  }catch{}
  return <main className="section"><div className="container"><div className="head"><span className="eyebrow">Boutique</span><h1>Catalogue <span className="gradient">FABIOLE METAL</span></h1><p>Réalisations de l’atelier de Bojongo, prix affichés en FCFA. Les prix sont recalculés côté serveur au checkout.</p></div><div className="shop-grid">{ps.map(({p, categoryName})=><article className="product" id={p.slug} key={p.id}><div className="product-media">{p.imageUrl?<img src={p.imageUrl} alt={p.name} loading="lazy"/>:<div className="product-media-fallback" aria-hidden="true">FM</div>}<div className="product-badges">{p.promoPriceXaf?<span className="badge-promo">PROMO</span>:null}</div></div><div className="product-body"><div className="product-top">{categoryName?<span className="pill pill-cat">{categoryName}</span>:<span/>}<StockPill stock={p.stock}/></div><h3 title={p.name}>{p.name}</h3><p className="product-desc">{p.description}</p><div className="price">{formatXaf(p.promoPriceXaf??p.priceXaf)} {p.promoPriceXaf&&<del className="old-price">{formatXaf(p.priceXaf)}</del>}</div><div className="product-actions"><div className="product-actions-main"><AddToCartButton productId={p.id} stock={p.stock}/></div><div className="product-actions-row"><Link className="btn" href={`/boutique/${p.slug}`}>Détails</Link><a className="btn" href={waLink(`Bonjour FABIOLE METAL, je suis intéressé par "${p.name}".`)} target="_blank" rel="noopener">WhatsApp</a></div></div></div></article>)}</div>{!ps.length&&<div className="card"><h3>Catalogue en préparation</h3><p>Ajoutez les articles depuis le dashboard.</p></div>}</div></main>}
