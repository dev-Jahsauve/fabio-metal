import Link from 'next/link'; import { db } from "@/lib/db"; import { products, categories } from "@/lib/db/schema"; import { and, desc, eq, ilike, or } from "drizzle-orm"; import { formatXaf, waLink } from "@/lib/utils"; import { BRAND, purchaseState } from "@/lib/site"; import AddToCartButton from '@/components/AddToCartButton'; import QuoteButton from '@/components/QuoteButton'; import EyeIcon from '@/components/EyeIcon';

function StockPill({ p }: { p: any }) {
  if (p.isCustom) return <span className="pill pill-cat">Sur devis</span>;
  if (p.stock <= 0) return <span className="pill pill-out">Rupture</span>;
  if (p.stock <= 5) return <span className="pill pill-low">Plus que {p.stock}</span>;
  return <span className="pill pill-ok">En stock</span>;
}

function Price({ p }: { p: any }) {
  // Produit sur devis : le prix affiché n'est qu'indicatif, jamais facturé tel quel.
  if (p.isCustom) return <div className="price"><small>À partir de </small>{formatXaf(p.promoPriceXaf ?? p.priceXaf)}</div>;
  return <div className="price">{formatXaf(p.promoPriceXaf ?? p.priceXaf)} {p.promoPriceXaf && <del className="old-price">{formatXaf(p.priceXaf)}</del>}</div>;
}

function Actions({ p }: { p: any }) {
  const state = purchaseState(p);
  if (state === "quote") return <div className="product-actions"><div className="product-actions-main"><QuoteButton name={p.name} /></div><div className="product-actions-row"><Link className="btn" href={`/boutique/${p.slug}`}><EyeIcon />Détails</Link><a className="btn" href={waLink(`Bonjour ${BRAND.name}, je souhaite un devis pour "${p.name}".`)} target="_blank" rel="noopener">WhatsApp</a></div></div>;
  if (state === "unavailable") return <div className="product-actions"><div className="product-actions-main"><button className="btn" disabled>Indisponible</button></div><div className="product-actions-row"><Link className="btn" href={`/boutique/${p.slug}`}><EyeIcon />Détails</Link></div></div>;
  return <div className="product-actions"><div className="product-actions-main"><AddToCartButton productId={p.id} stock={p.stock} /></div><div className="product-actions-row"><Link className="btn" href={`/boutique/${p.slug}`}><EyeIcon />Détails</Link><a className="btn" href={waLink(`Bonjour ${BRAND.name}, je suis intéressé par "${p.name}".`)} target="_blank" rel="noopener">WhatsApp</a></div></div>;
}

export default async function Boutique({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  const sp = await searchParams;
  const query = (sp.q || "").trim().slice(0, 80);
  const cat = (sp.cat || "").trim();
  let ps: any[] = [];
  let cats: any[] = [];
  try {
    cats = await db.select().from(categories).orderBy(categories.name);
    const conds: any[] = [eq(products.published, true)];
    if (cat) conds.push(eq(products.categoryId, cat));
    if (query) {
      const like = `%${query.replace(/[%_\\]/g, "")}%`;
      conds.push(or(ilike(products.name, like), ilike(products.description, like)));
    }
    ps = await db.select({ p: products, categoryName: categories.name }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(and(...conds)).orderBy(desc(products.createdAt));
  } catch { }
  const catName = cat ? cats.find((c: any) => c.id === cat)?.name : null;
  const filtered = Boolean(query || cat);
  const catHref = (id: string) => `/boutique${query ? `?q=${encodeURIComponent(query)}${id ? `&cat=${id}` : ""}` : id ? `?cat=${id}` : ""}`;
  return <main className="section"><div className="container"><div className="head"><span className="eyebrow">Boutique</span><h1>Catalogue <span className="gradient">{BRAND.name}</span></h1><p>Articles en stock et réalisations sur devis, prix affichés en FCFA.</p></div>
    {cats.length > 0 && <div className="filter-pills" role="tablist" aria-label="Filtrer par catégorie"><Link href={catHref("")} className={!cat ? "active" : ""} role="tab" aria-selected={!cat}>Tout</Link>{cats.map((c: any) => <Link key={c.id} href={catHref(c.id)} role="tab" aria-selected={cat === c.id} className={cat === c.id ? "active" : ""}>{c.name}</Link>)}</div>}
    {filtered && <p className="filter-active">{ps.length} résultat{ps.length > 1 ? "s" : ""}{query && <> pour «&nbsp;{query}&nbsp;»</>}{catName && <> dans {catName}</>} <Link href="/boutique" className="g-cta">Tout effacer →</Link></p>}
    {ps.length ? <div className="shop-grid">{ps.map(({ p, categoryName }) => <article className="product" id={p.slug} key={p.id}><div className="product-media">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} loading="lazy" /> : <div className="product-media-fallback" aria-hidden="true">{BRAND.short}</div>}<div className="product-badges">{p.promoPriceXaf && !p.isCustom ? <span className="badge-promo">PROMO</span> : null}{p.isCustom ? <span className="badge-new">Devis</span> : null}</div></div><div className="product-body"><div className="product-top">{categoryName ? <span className="pill pill-cat">{categoryName}</span> : <span />}<StockPill p={p} /></div><h3 title={p.name}>{p.name}</h3><p className="product-desc">{p.description}</p><Price p={p} /><Actions p={p} /></div></article>)}</div>
      : <div className="card"><h3>{filtered ? "Aucun article trouvé" : "Catalogue en préparation"}</h3><p>{filtered ? "Essayez un autre mot-clé ou une autre catégorie." : "Revenez bientôt."}</p>{filtered && <div className="actions"><Link href="/boutique" className="btn">Voir tout le catalogue</Link></div>}</div>}
  </div></main>;
}
