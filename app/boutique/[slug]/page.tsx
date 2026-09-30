import { notFound } from 'next/navigation'; import Link from 'next/link'; import { eq, asc, and, ne, desc } from 'drizzle-orm'; import { db } from '@/lib/db'; import { productImages, products } from '@/lib/db/schema'; import { formatXaf, waLink } from '@/lib/utils'; import { BRAND, purchaseState } from '@/lib/site'; import AddToCartButton from '@/components/AddToCartButton'; import QuoteButton from '@/components/QuoteButton';

export default async function Produit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!p || !p.published) return notFound();
  const images = await db.select().from(productImages).where(eq(productImages.productId, p.id)).orderBy(asc(productImages.sortOrder));
  const allImages = [...(p.imageUrl ? [{ imageUrl: p.imageUrl, altText: p.name }] : []), ...images];
  let related: any[] = [];
  try {
    related = p.categoryId
      ? await db.select().from(products).where(and(eq(products.published, true), eq(products.categoryId, p.categoryId), ne(products.id, p.id))).orderBy(desc(products.createdAt)).limit(4)
      : [];
  } catch { }
  const state = purchaseState(p);
  return <main className="section"><div className="container product-detail"><div className="product-detail-image">{allImages.length ? <div className="gallery product-gallery">{allImages.map((im, i) => <img key={i} src={im.imageUrl} alt={im.altText || p.name} />)}</div> : <div className="card">Photo à ajouter</div>}</div><div><span className="eyebrow">{BRAND.name}</span><h1>{p.name}</h1><p className="lead">{p.description}</p><div className="price large">{state === "quote" && <small>À partir de </small>}{formatXaf(p.promoPriceXaf ?? p.priceXaf)} {p.promoPriceXaf && state !== "quote" && <del className="old-price">{formatXaf(p.priceXaf)}</del>}</div><p>{state === "quote" ? "Produit sur devis : prix indicatif, dimensions et finition à valider ensemble." : <>Stock : {p.stock}</>}</p><div className="actions">{state === "quote" ? <QuoteButton name={p.name} /> : state === "unavailable" ? <button className="btn" disabled>Indisponible</button> : <AddToCartButton productId={p.id} stock={p.stock} />}<a className="btn" href={waLink(`Bonjour ${BRAND.name}, je souhaite des informations sur "${p.name}".`)}>Demander un devis</a></div><p style={{ color: 'var(--muted)', marginTop: 18 }}>Les ouvrages sur mesure peuvent être adaptés aux dimensions et finitions souhaitées.</p><Link href="/boutique" className="btn">Retour à la boutique</Link></div></div>
    {related.length > 0 && <div className="container" style={{ marginTop: 32 }}><div className="head"><span className="eyebrow">À découvrir aussi</span><h2>Dans la même catégorie.</h2></div><div className="shop-grid">{related.map((r: any) => <article className="product" key={r.id}><div className="product-media">{r.imageUrl ? <img src={r.imageUrl} alt={r.name} loading="lazy" /> : <div className="product-media-fallback" aria-hidden="true">{BRAND.short}</div>}</div><div className="product-body"><h3 title={r.name}>{r.name}</h3><div className="price">{r.isCustom && <small>À partir de </small>}{formatXaf(r.promoPriceXaf ?? r.priceXaf)}</div><div className="product-actions"><div className="product-actions-main"><Link className="btn" href={`/boutique/${r.slug}`}>Voir</Link></div></div></div></article>)}</div></div>}
  </main>;
}
