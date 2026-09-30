"use client";
import { useEffect, useState } from 'react';

type Product = { id: string; name: string; slug: string; priceXaf: number; promoPriceXaf: number | null; stock: number; published: boolean; imageUrl: string | null; description: string | null; sku: string | null; categoryId: string | null };
const tabs = [['products', 'Produits'], ['orders', 'Commandes'], ['categories', 'Catégories'], ['gallery', 'Galerie'], ['services', 'Services'], ['customers', 'Clients'], ['payments', 'Paiements'], ['refunds', 'Remboursements'], ['contact', 'Messages'], ['logs', 'Journal']];
const money = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

// Les 5 nouveaux médias reçus (déjà copiés dans public/produits/ avec des noms propres).
// Explication du classement :
// - PRODUIT = objet vendable (prix + stock + panier) → onglet Produits + Boutique.
// - SERVICE = prestation sur devis, pas de stock (chantier, gros ouvrage) → onglet Services.
// - GALERIE = vitrine photo/vidéo de l'atelier → onglet Galerie + page /galerie + accueil.
// - LIVRAISON = preuve/illustration du transport (pas un onglet à part : statuts dans Commandes,
//   photo affichée au checkout + suivi commande).
const NEW_MEDIA = [
  { file: '/produits/porte-metallique-2-battants.jpg', kind: 'image', label: 'Porte 2 battants (ex 2.jpeg)', target: 'PRODUIT + GALERIE', why: 'Objet fini, vendable au détail : va en Boutique avec prix (95 000 FCFA, promo 89 000) et stock. Doublon en Galerie comme référence visuelle.' },
  { file: '/produits/coffre-livraison-moto.jpg', kind: 'image', label: 'Coffre moto (ex 3.jpeg)', target: 'PRODUIT + LIVRAISON', why: 'Accessoire vendable (28 000 FCFA) ET preuve de livraison : sa photo illustre aussi la section Livraison au checkout et sur le suivi commande.' },
  { file: '/produits/ossature-kiosque-metallique.jpg', kind: 'image', label: 'Ossature kiosque (ex 1.jpeg)', target: 'SERVICE + GALERIE', why: 'Chantier en cours, pas un article en stock : va en Services (« Structures & kiosques », sur devis) + Galerie. Jamais en Boutique.' },
  { file: '/produits/atelier-fabrication-1.mp4', kind: 'video', label: 'Vidéo atelier 1 (ex 1.mp4)', target: 'GALERIE', why: 'Démo du savoir-faire : vitrine uniquement. Les produits n’acceptent que des images, les vidéos vivent dans la Galerie (lecteur intégré).' },
  { file: '/produits/atelier-fabrication-2.mp4', kind: 'video', label: 'Vidéo atelier 2 (ex 2.mp4)', target: 'GALERIE', why: 'Idem : preuve d’atelier, visible sur /galerie et l’accueil. Pas vendable, pas de prix.' },
];

const IMAGE_SUGGESTIONS = [
  '/produits/portail-moderne-noir.jpg',
  '/produits/porte-entree-volutes.jpg',
  '/produits/porte-decorative-grille.jpg',
  '/produits/panneau-porte-embouti.jpg',
  '/produits/barbecue-sur-pieds.jpg',
  '/produits/support-marmite.jpg',
  '/produits/patere-murale.jpg',
  '/produits/plateau-rond-renforce.jpg',
  '/produits/grille-fenetre-volutes.jpg',
  '/produits/grille-fenetre-motif.jpg',
  '/produits/porte-metallique-2-battants.jpg',
  '/produits/coffre-livraison-moto.jpg',
  '/produits/ossature-kiosque-metallique.jpg',
  '/produits/atelier-fabrication-1.mp4',
  '/produits/atelier-fabrication-2.mp4',
];

export default function AdminConsole({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts), [tab, setTab] = useState('products'), [orders, setOrders] = useState<any[]>([]), [data, setData] = useState<any[]>([]), [categories, setCategories] = useState<any[]>([]), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: '', slug: '', description: '', priceXaf: '', promoPriceXaf: '', imageUrl: '', stock: '1', sku: '', categoryId: '' });
  const load = async () => { const map: any = { orders: '/api/admin/orders', categories: '/api/admin/categories', gallery: '/api/admin/gallery', services: '/api/admin/services', customers: '/api/admin/customers', payments: '/api/admin/payments', refunds: '/api/admin/refunds', contact: '/api/admin/contact', logs: '/api/admin/audit-logs' }; if (!map[tab]) return; const r = await fetch(map[tab], { cache: 'no-store' }); if (r.ok) setData(await r.json()) };
  useEffect(() => { fetch('/api/admin/categories', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).then(setCategories) }, []); useEffect(() => { if (tab === 'orders') load(); else if (tab !== 'products') load() }, [tab]);
  async function addProduct(e: React.FormEvent) { e.preventDefault(); setBusy(true); setMsg(''); const body = { ...f, priceXaf: Number(f.priceXaf), promoPriceXaf: f.promoPriceXaf ? Number(f.promoPriceXaf) : null, imageUrl: f.imageUrl || null, stock: Number(f.stock), sku: f.sku || null, categoryId: f.categoryId || null }; const r = await fetch('/api/products', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json(); setBusy(false); if (!r.ok) { setMsg(j.error || 'Erreur'); return } setProducts([j, ...products]); setMsg('Article ajouté.'); setF({ name: '', slug: '', description: '', priceXaf: '', promoPriceXaf: '', imageUrl: '', stock: '1', sku: '', categoryId: '' }) }
  async function archive(id: string) { if (!confirm('Archiver cet article ?')) return; const r = await fetch('/api/products', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) }); if (r.ok) setProducts(products.map(p => p.id === id ? { ...p, published: false } : p)) }
  async function restoreAssets() { if (!confirm('Publier / vérifier les produits + galerie + service issus des photos (dont les 5 nouveaux médias) ?')) return; setBusy(true); setMsg('Vérification...'); const r = await fetch('/api/admin/restore-assets', { method: 'POST' }); const j = await r.json().catch(() => ({})); setBusy(false); if (!r.ok) { setMsg(j.error || 'Restauration impossible'); return } if (j.products) setProducts(j.products); const g = j.galleryAdded ?? 0, s = j.serviceAdded ?? 0; setMsg(g === 0 && s === 0 ? `Déjà à jour : ${j.published ?? j.restored ?? 12} produit(s) en ligne, galerie et services à jour.` : `Terminé : ${j.published ?? j.restored ?? 12} produit(s) en ligne · ${g} photo(s)/vidéo(s) ajoutée(s) · ${s} service(s) ajouté(s).`); }
  async function updateOrder(id: string, status: string) { const r = await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) }); if (r.ok) load(); else alert((await r.json()).error || 'Impossible de modifier la commande') }
  async function addResource(endpoint: string, body: any) { const r = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json(); if (!r.ok) { alert(j.error || 'Erreur'); return } load() }
  function prefillProduct(file: string) {
    if (file.includes('porte-metallique-2-battants')) setF({ name: 'Porte métallique 2 battants + motifs emboutis', slug: 'porte-metallique-2-battants-motifs', description: "Porte 2 battants en fer peint avec barreaux, poignée et 2 motifs emboutis. Serrure incluse, pose par l'atelier.", priceXaf: '95000', promoPriceXaf: '89000', imageUrl: file, stock: '3', sku: 'FM-PORT-005', categoryId: categories.find((c: any) => c.slug === 'portes-metalliques')?.id || '' });
    else if (file.includes('coffre-livraison')) setF({ name: 'Coffre / malle de livraison moto en tôle', slug: 'coffre-malle-livraison-moto', description: "Malle arrière moto en tôle peinte avec serrure, fabriquée à l'atelier. Dimensions adaptables.", priceXaf: '28000', promoPriceXaf: '', imageUrl: file, stock: '5', sku: 'FM-ACC-002', categoryId: categories.find((c: any) => c.slug === 'accessoires-metalliques')?.id || '' });
    else setF({ ...f, imageUrl: file });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  return <div><div className="admin-tabs">{tabs.map(([k, l]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
    {tab === 'products' && <>
      <div className="card" style={{ margin: '25px 0 0' }}>
        <h3 style={{ margin: '0 0 4px' }}>Les 5 nouveaux médias reçus — où vont-ils ?</h3>
        <small>En un clic ci-dessous tout est publié au bon endroit. Détail par fichier :</small>
        <div className="shop-grid" style={{ marginTop: 14 }}>
          {NEW_MEDIA.map(m => <article className="product" key={m.file}>
            {m.kind === 'image' ? <img src={m.file} alt={m.label} loading="lazy" /> : <video src={m.file} controls preload="metadata" style={{ width: '100%', borderRadius: 8 }} />}
            <div className="product-body">
              <span className="pill pill-cat">{m.target}</span>
              <h3 style={{ fontSize: 15 }}>{m.label}</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>{m.why}</p>
              <small style={{ wordBreak: 'break-all' }}>{m.file}</small>
              {m.kind === 'image' && m.target.includes('PRODUIT') && <div style={{ marginTop: 8 }}><button className="btn" onClick={() => prefillProduct(m.file)}>Pré-remplir le formulaire ↓</button></div>}
            </div>
          </article>)}
        </div>
        <div className="card" style={{ marginTop: 14, background: 'var(--card-alt, #fafafa)' }}>
          <strong>Règle simple :</strong>
          <small style={{ display: 'block', marginTop: 6, lineHeight: 1.6 }}>
            PRODUIT = vendable (prix + stock + bouton panier) → Boutique.<br />
            SERVICE = prestation sur devis, sans stock (ex : ossature/kiosque 1.jpeg) → page Services.<br />
            GALERIE = vitrine photos/vidéos (dont les 2 mp4) → page Galerie + accueil.<br />
            LIVRAISON = pas un onglet : statuts dans Commandes + photo du coffre-moto affichée au checkout et sur le suivi pour rassurer le client.
          </small>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 14 }}>
          <button className="btn btn-gold" onClick={restoreAssets} disabled={busy}>{busy ? 'Publication...' : 'Publier les 5 médias au bon endroit'}</button>
          {msg && <small>{msg}</small>}
        </div>
      </div>
      <form className="card form" onSubmit={addProduct} style={{ margin: '25px 0' }}>
        <h3>Ajouter un article</h3>
        <div className="form-grid">
          <input placeholder="Nom" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required />
          <input placeholder="Slug" value={f.slug} onChange={e => setF({ ...f, slug: e.target.value })} required />
          <input placeholder="SKU / référence" value={f.sku} onChange={e => setF({ ...f, sku: e.target.value })} />
          <input placeholder="Prix FCFA (multiple de 5)" type="number" min="0" step="5" value={f.priceXaf} onChange={e => setF({ ...f, priceXaf: e.target.value })} required />
          <input placeholder="Prix promo" type="number" min="0" step="5" value={f.promoPriceXaf} onChange={e => setF({ ...f, promoPriceXaf: e.target.value })} />
          <input placeholder="Stock" type="number" min="0" value={f.stock} onChange={e => setF({ ...f, stock: e.target.value })} />
          <select value={f.categoryId} onChange={e => setF({ ...f, categoryId: e.target.value })}><option value="">Sans catégorie</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
        <input placeholder="URL image (/produits/... ou https://...)" value={f.imageUrl} onChange={e => setF({ ...f, imageUrl: e.target.value })} list="fm-images" />
        <datalist id="fm-images">{IMAGE_SUGGESTIONS.map(u => <option key={u} value={u} />)}</datalist>
        {f.imageUrl && (f.imageUrl.endsWith('.mp4') ? <small style={{ color: '#a33' }}>Les vidéos (.mp4) ne vont pas en Produit : ajoutez-les dans l’onglet Galerie.</small> : <img src={f.imageUrl} alt="Aperçu" style={{ maxWidth: 220, borderRadius: 8, marginTop: 8 }} />)}
        <textarea placeholder="Description" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
        {msg && <small>{msg}</small>}
        <button className="btn btn-gold" disabled={busy}>{busy ? 'Enregistrement...' : 'Publier l’article'}</button>
      </form>
      <div className="shop-grid">{products.map(x => <article className="product" key={x.id}>{x.imageUrl && <img src={x.imageUrl} alt={x.name} />}<div className="product-body"><h3>{x.name}</h3><p>SKU : {x.sku || '—'}<br />Stock : {x.stock}<br />{x.published ? 'Publié' : 'Archivé'}</p><div className="price">{money(x.promoPriceXaf ?? x.priceXaf)}</div>{x.published && <button className="btn" onClick={() => archive(x.id)}>Archiver</button>}</div></article>)}</div>
    </>}
    {tab === 'orders' && <div className="order-list">{data.map(x => <article className="card" key={x.order.id}><div><strong>{x.order.id.slice(0, 8).toUpperCase()}</strong><p>{x.userName} · {x.userEmail}<br />Paiement : {x.paymentStatus || '—'} · Livraison : {x.shipmentStatus || '—'}</p></div><div><strong>{money(x.order.totalXaf)}</strong><select value={x.order.status} onChange={e => updateOrder(x.order.id, e.target.value)}><option value="pending">pending</option><option value="confirmed">confirmed</option><option value="processing">processing</option><option value="shipped">shipped</option><option value="delivered">delivered</option><option value="completed">completed</option><option value="cancelled">cancelled</option><option value="refunded">refunded</option></select></div></article>)}</div>}
    {tab === 'categories' && <ResourceForm title="Catégories" fields={[['name', 'Nom'], ['slug', 'Slug']]} onSubmit={v => addResource('/api/admin/categories', v)} rows={data} labels={['name', 'slug']} />}
    {tab === 'gallery' && <><div className="card" style={{ margin: '25px 0 0' }}><h3 style={{ margin: 0 }}>Astuce Galerie</h3><small>Images (.jpg) et vidéos (.mp4) acceptées. Les 5 nouveaux médias sont déjà proposés ci-dessous — un clic suffit, ou utilisez le bouton de l’onglet Produits.</small></div><ResourceForm title="Galerie" fields={[['title', 'Titre'], ['category', 'Catégorie'], ['imageUrl', 'URL image ou vidéo (/produits/... ou https://...)'], ['description', 'Description']]} onSubmit={v => addResource('/api/admin/gallery', { ...v, published: true })} rows={data} labels={['title', 'category', 'imageUrl']} suggestions={IMAGE_SUGGESTIONS} /></>}
    {tab === 'services' && <><div className="card" style={{ margin: '25px 0 0' }}><h3 style={{ margin: 0 }}>Quand créer un Service plutôt qu’un Produit ?</h3><small>Un gros ouvrage sur devis et sans stock (ex : ossature/kiosque de 1.jpeg) → Service « Structures & kiosques métalliques ». Un objet fini avec prix et stock (ex : porte, coffre) → Produit.</small></div><ResourceForm title="Services" fields={[['title', 'Titre'], ['slug', 'Slug'], ['description', 'Description'], ['icon', 'Icône']]} onSubmit={v => addResource('/api/admin/services', { ...v, published: true, sortOrder: 0 })} rows={data} labels={['title', 'slug', 'description']} /></>}
    {tab === 'customers' && <List title="Clients" rows={data} render={x => <div><strong>{x.name}</strong><p>{x.email} · {x.phone || 'sans téléphone'} · {x.role}</p></div>} />}
    {tab === 'payments' && <List title="Paiements" rows={data} render={x => <div><strong>{x.payment.transactionId}</strong><p>{x.userName} · {money(x.payment.amountXaf)} · {x.payment.status}</p></div>} />}
    {tab === 'refunds' && <RefundList rows={data} reload={load} />}
    {tab === 'logs' && <List title="Journal d’audit" rows={data} render={x => <div><strong>{x.action}</strong><p>{x.entityType} · {x.entityId || '—'}<br />{new Date(x.createdAt).toLocaleString('fr-FR')}</p></div>} />}
    {tab === 'contact' && <List title="Messages" rows={data} render={x => <div><strong>{x.subject || 'Demande de contact'}</strong><p>{x.name} · {x.phone} · {x.status}<br />{x.message}</p></div>} />}
  </div>
}
function List({ title, rows, render }: { title: string; rows: any[]; render: (x: any) => React.ReactNode }) { return <section><h2>{title}</h2><div className="order-list">{rows.map((x, i) => <article className="card" key={x.id || x.payment?.id || i}>{render(x)}</article>)}{!rows.length && <div className="card">Aucun élément.</div>}</div></section> }
function ResourceForm({ title, fields, onSubmit, rows, labels, suggestions }: { title: string; fields: string[][]; onSubmit: (v: any) => void; rows: any[]; labels: string[]; suggestions?: string[] }) {
  const [v, setV] = useState<Record<string, string>>({});
  return <section><h2>{title}</h2><form className="card form" onSubmit={e => { e.preventDefault(); onSubmit(v); setV({}) }}><div className="form-grid">{fields.map(([k, l]) => <input key={k} placeholder={l} value={v[k] || ''} onChange={e => setV({ ...v, [k]: e.target.value })} required={k !== 'description' && k !== 'icon'} list={k === 'imageUrl' && suggestions ? 'fm-gallery' : undefined} />)}</div>{suggestions && <datalist id="fm-gallery">{suggestions.map(u => <option key={u} value={u} />)}</datalist>}{v.imageUrl && (v.imageUrl.endsWith('.mp4') ? <video src={v.imageUrl} controls preload="metadata" style={{ maxWidth: 320, borderRadius: 8 }} /> : v.imageUrl.startsWith('/') || v.imageUrl.startsWith('http') ? <img src={v.imageUrl} alt="Aperçu" style={{ maxWidth: 220, borderRadius: 8 }} /> : null)}<button className="btn btn-gold">Ajouter</button></form><div className="order-list" style={{ marginTop: 20 }}>{rows.map(x => <article className="card" key={x.id}>{x.imageUrl && (x.imageUrl.endsWith('.mp4') ? <video src={x.imageUrl} controls preload="metadata" style={{ width: '100%', borderRadius: 8 }} /> : <img src={x.imageUrl} alt={x.title || ''} style={{ width: '100%', borderRadius: 8 }} />)}{labels.map(k => <p key={k}><strong>{k}:</strong> {x[k] || '—'}</p>)}</article>)}</div></section>
}
function RefundList({ rows, reload }: { rows: any[]; reload: () => void }) { return <section><h2>Remboursements</h2><div className="order-list">{rows.map(x => <article className="card" key={x.refund.id}><p><strong>{money(x.refund.amountXaf)}</strong> · {x.refund.status}<br />Transaction : {x.payment.transactionId}</p>{x.refund.status === 'pending' && <div className="actions"><button className="btn" onClick={async () => { await fetch('/api/admin/refunds', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: x.refund.id, status: 'processed', providerReference: prompt('Référence prestataire (optionnel)') || undefined }) }); reload() }}>Marquer traité</button><button className="btn" onClick={async () => { await fetch('/api/admin/refunds', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: x.refund.id, status: 'failed' }) }); reload() }}>Échec</button></div>}</article>)}</div></section> }
