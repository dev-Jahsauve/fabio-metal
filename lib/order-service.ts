import { eq, sql } from "drizzle-orm";
import { invoices, notifications, orderItems, products, shipments, auditLogs, orders } from "@/lib/db/schema";
import { orderReference } from "@/lib/utils";

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
