import { eq, sql } from "drizzle-orm";
import { invoices, notifications, orderItems, products, shipments, auditLogs, orders, users } from "@/lib/db/schema";
import { orderReference } from "@/lib/utils";

// Statuts de paiement définitifs : webhook, refresh et cron ne doivent plus
// réinterroger ni modifier un paiement dans l'un de ces états.
export const TERMINAL_PAYMENT_STATUSES = [
  "success",
  "failed",
  "cancelled",
  "expired",
  "refunded",
  "partially_refunded",
] as const;

// Commandes en cours de traitement après confirmation : un succès tardif ne
// doit jamais les faire revenir en arrière.
export const FULFILMENT_ORDER_STATUSES = [
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "completed",
] as const;

export async function createPaidArtifacts(tx: any, order: any, userId: string) {
  await tx.insert(shipments).values({ orderId: order.id }).onConflictDoNothing();
  await tx.insert(invoices).values({ orderId: order.id, invoiceNumber: `FM-${new Date().getFullYear()}-${orderReference(order.id)}`, status: "paid", subtotalXaf: order.subtotalXaf, deliveryFeeXaf: order.deliveryFeeXaf, discountXaf: order.discountXaf, taxXaf: order.taxXaf, totalXaf: order.totalXaf, currency: order.currency, issuedAt: new Date(), paidAt: new Date() }).onConflictDoNothing();
  await tx.insert(notifications).values({ userId, orderId: order.id, type: "payment_confirmed", title: "Paiement confirmé", message: `Le paiement de la commande ${orderReference(order.id)} a été confirmé.` });
}

/** Restore reserved stock exactly once. The order-level marker makes retries/webhooks safe. */
export async function restoreReservedStock(tx: any, orderId: string) {
  const [order] = await tx.select({ id: orders.id, stockReleasedAt: orders.stockReleasedAt }).from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || order.stockReleasedAt) return false;
  const items = await tx.select({ productId: orderItems.productId, quantity: orderItems.quantity }).from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const item of items) await tx.update(products).set({ stock: sql`${products.stock} + ${item.quantity}`, updatedAt: new Date() }).where(eq(products.id, item.productId));
  await tx.update(orders).set({ stockReleasedAt: new Date(), updatedAt: new Date() }).where(eq(orders.id, orderId));
  return true;
}

export async function writeAudit(tx: any, actorUserId: string | null, action: string, entityType: string, entityId: string | null, metadata: any = null) {
  await tx.insert(auditLogs).values({ actorUserId, action, entityType, entityId, metadata });
}

/** Notifie tous les admins (revue manuelle) sans jamais exposer de détail au client. */
export async function notifyAdmins(tx: any, values: { orderId?: string | null; type: string; title: string; message: string }) {
  const admins = await tx.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  if (!admins.length) return 0;
  await tx.insert(notifications).values(admins.map((a: { id: string }) => ({ userId: a.id, ...values })));
  return admins.length;
}
