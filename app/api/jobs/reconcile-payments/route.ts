import { NextResponse } from "next/server";
import { and, eq, lt, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, orders, paymentEvents, payments } from "@/lib/db/schema";
import { restoreReservedStock, createPaidArtifacts, notifyAdmins, TERMINAL_PAYMENT_STATUSES, FULFILMENT_ORDER_STATUSES } from "@/lib/order-service";
import { verifyNelsiusPayment, mapNelsiusStatus, buildNelsiusEventId } from "@/lib/nelsiuspay";
import { orderReference } from "@/lib/utils";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.get("authorization") !== `Bearer ${expected}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const expired = await db.select().from(payments).where(and(inArray(payments.status, ["pending", "processing"]), lt(payments.expiresAt, new Date()))).limit(50);
  let processed = 0;
  for (const payment of expired) {
    if (payment.provider !== "nelsiuspay") continue;
    try {
      // Absence de réponse : on ne change rien (jamais d'auto-échec sur erreur réseau).
      const verified = await verifyNelsiusPayment(payment.transactionId).catch(() => null);
      if (!verified) continue;
      const mapped = mapNelsiusStatus(verified.status);
      const eventId = buildNelsiusEventId(payment.transactionId, {
        status: verified.status,
        amount: verified.amount,
        transactionCode: verified.transactionCode,
      });
      await db.transaction(async tx => {
        const [current] = await tx.select().from(payments).where(eq(payments.id, payment.id)).limit(1);
        const [order] = await tx.select().from(orders).where(eq(orders.id, payment.orderId)).limit(1);
        if (!current || !order) return;
        // Règle de priorité : terminal déjà atteint (webhook/refresh entre-temps)
        // => on ne réapplique rien.
        if ((TERMINAL_PAYMENT_STATUSES as readonly string[]).includes(current.status)) return;
        // Déduplication partagée webhook/refresh/cron : même résultat déjà
        // traité => on ne réapplique rien (une seule confirmation,
        // une seule restauration de stock, une seule génération d'artefacts).
        const inserted = await tx
          .insert(paymentEvents)
          .values({
            paymentId: payment.id,
            provider: "nelsiuspay",
            eventId,
            eventType: `cron:${verified.status || "unknown"}`,
            payload: { cron: { paymentId: payment.id }, verified: verified.raw },
            status: "received",
          })
          .onConflictDoNothing({ target: paymentEvents.eventId })
          .returning({ id: paymentEvents.id });
        if (!inserted.length) return;
        const eventRowId = inserted[0].id;
        if (mapped === "success" && verified.amount === current.amountXaf && (!verified.currency || verified.currency === current.currency)) {
          await tx.update(payments).set({ status: "success", providerResponse: verified.raw, updatedAt: new Date(), paidAt: new Date() }).where(eq(payments.id, current.id));
          if (order.status === "pending") {
            const [updatedOrder] = await tx.update(orders).set({ status: "confirmed", updatedAt: new Date() }).where(eq(orders.id, order.id)).returning();
            await createPaidArtifacts(tx, updatedOrder || order, order.userId);
          } else if ((FULFILMENT_ORDER_STATUSES as readonly string[]).includes(order.status)) {
            await createPaidArtifacts(tx, order, order.userId);
          } else {
            await notifyAdmins(tx, { orderId: order.id, type: "payment_needs_review", title: "Paiement à vérifier", message: `Paiement ${orderReference(order.id)} confirmé côté prestataire alors que la commande est ${order.status}.` });
          }
          await tx.update(paymentEvents).set({ status: "processed", processedAt: new Date() }).where(eq(paymentEvents.id, eventRowId));
          processed++;
          return;
        }
        // Statut réel du prestataire quand les données sont cohérentes,
        // sinon `expired` (paiement déjà passé après `expiresAt`).
        // Dans tous les cas : aucun auto-échec d'un pending sans réponse,
        // terminal enregistré, annulation seulement si commande encore en attente.
        const amountOk = verified.amount === undefined || verified.amount === current.amountXaf;
        const currencyOk = !verified.currency || verified.currency === current.currency;
        const terminal = (mapped === "failed" || mapped === "cancelled") && amountOk && currencyOk ? mapped : "expired";
        await tx.update(payments).set({ status: terminal, providerResponse: verified.raw, updatedAt: new Date() }).where(eq(payments.id, current.id));
        if (order.status === "pending") {
          await restoreReservedStock(tx, order.id);
          await tx.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, order.id));
          await tx.insert(notifications).values({ userId: order.userId, orderId: order.id, type: terminal === "expired" ? "payment_expired" : "payment_failed", title: terminal === "expired" ? "Paiement expiré" : "Paiement non abouti", message: terminal === "expired" ? `Le paiement de la commande ${orderReference(order.id)} a expiré.` : `Le paiement de la commande ${orderReference(order.id)} n'a pas abouti.` });
        } else {
          await notifyAdmins(tx, { orderId: order.id, type: "payment_needs_review", title: "Paiement à vérifier", message: `Paiement ${orderReference(order.id)} marqué ${terminal} alors que la commande est ${order.status}.` });
        }
        await tx.update(paymentEvents).set({ status: "processed", processedAt: new Date() }).where(eq(paymentEvents.id, eventRowId));
        processed++;
      });
    } catch (error) { console.error("payment reconciliation", payment.id, error); }
  }
  return NextResponse.json({ scanned: expired.length, processed });
}
