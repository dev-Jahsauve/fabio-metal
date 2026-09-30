import { notFound } from 'next/navigation'; import Link from 'next/link'; import { getCurrentUser } from '@/lib/auth'; import { db } from '@/lib/db'; import { and, eq } from 'drizzle-orm'; import { orders, orderItems, payments, shipments, invoices } from '@/lib/db/schema'; import { formatXaf, orderReference } from '@/lib/utils';
import RefreshPaymentStatus from '@/components/RefreshPaymentStatus';
import AccessDenied from '@/components/AccessDenied';

const orderFr: Record<string, string> = { pending: 'En attente', confirmed: 'Confirmée', processing: 'En préparation', shipped: 'Expédiée', delivered: 'Livrée', completed: 'Terminée', cancelled: 'Annulée', refunded: 'Remboursée' };
const payFr: Record<string, string> = { success: 'Confirmé', pending: 'En vérification', processing: 'En vérification', failed: 'Non abouti', cancelled: 'Non abouti', expired: 'Non abouti', refunded: 'Remboursé', partially_refunded: 'Partiellement remboursé' };
const shipFr: Record<string, string> = { pending: 'En préparation', preparing: 'En préparation', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' };

// Parcours client générique : 5 étapes lisibles, aucun code technique.
// Annulée/remboursée => bandeau dédié plutôt que progression.
const STEPS = ['Commande créée', 'Paiement confirmé', 'En préparation', 'Expédiée', 'Livrée'];
const STEP_INDEX: Record<string, number> = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4, completed: 4 };

function Stepper({ status }: { status: string }) {
  if (status === 'cancelled' || status === 'refunded') {
    return <p className="order-alert">{status === 'cancelled' ? 'Commande annulée. Le stock a été libéré et aucun montant n’est dû.' : 'Commande remboursée. Le remboursement a été traité.'}</p>;
  }
  const active = STEP_INDEX[status] ?? 0;
  return (
    <ol className="stepper" aria-label="Suivi de commande">
      {STEPS.map((label, i) => (
        <li key={label} className={i < active ? 'done' : i === active ? 'current' : ''} aria-current={i === active ? 'step' : undefined}>
          <span className="step-dot" aria-hidden="true">{i < active ? '✓' : i + 1}</span>
          <span className="step-label">{label}</span>
        </li>
      ))}
    </ol>
  );
}

export default async function Commande({ params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  const { id } = await params;
  if (!u) return <AccessDenied variant="login" next={`/commandes/${id}`} />;
  const [o] = await db.select().from(orders).where(u.role === 'admin' ? eq(orders.id, id) : and(eq(orders.id, id), eq(orders.userId, u.id))).limit(1);
  if (!o) return notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
  const [p] = await db.select().from(payments).where(eq(payments.orderId, o.id)).limit(1);
  const [s] = await db.select().from(shipments).where(eq(shipments.orderId, o.id)).limit(1);
  const [i] = await db.select().from(invoices).where(eq(invoices.orderId, o.id)).limit(1);
  return <main className="section"><div className="container"><span className="eyebrow">Commande</span><h1>{orderReference(o.id)}</h1><Stepper status={o.status} /><div className="cards"><div className="card"><h3>Statut</h3><p>{orderFr[o.status] || o.status}</p><p>Paiement : {payFr[p?.status || ''] || p?.status || '—'}</p><p>Livraison : {shipFr[s?.status || ''] || s?.status || '—'}</p><img src="/produits/coffre-livraison-moto.jpg" alt="Coffre de livraison moto fabriqué à l'atelier" loading="lazy" style={{ width: '100%', maxWidth: 280, borderRadius: 8, marginTop: 10 }} /><small style={{ display: 'block', marginTop: 6 }}>Petits colis par moto, gros ouvrages posés par l’atelier.</small>{p && <RefreshPaymentStatus orderId={o.id} initialStatus={p.status} />}</div><div className="card"><h3>Total</h3><div className="price">{formatXaf(o.totalXaf)}</div><p>Sous-total : {formatXaf(o.subtotalXaf)}<br />Livraison : {formatXaf(o.deliveryFeeXaf)}</p></div></div><div className="card" style={{ marginTop: 18 }}><h2>Articles</h2>{items.map(x => <p key={x.id}>{x.productNameSnapshot} × {x.quantity} — {formatXaf(x.unitPriceXaf * x.quantity)}</p>)}{i && <p><Link className="btn" href={`/factures/${i.id}`}>Voir la facture</Link></p>}</div></div></main>;
}
