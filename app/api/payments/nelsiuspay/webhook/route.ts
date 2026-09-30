import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, paymentEvents, payments, notifications } from "@/lib/db/schema";
import { verifyNelsiusPayment, mapNelsiusStatus, buildNelsiusEventId } from "@/lib/nelsiuspay";
import { orderReference } from "@/lib/utils";
import { createPaidArtifacts, restoreReservedStock, notifyAdmins, TERMINAL_PAYMENT_STATUSES, FULFILMENT_ORDER_STATUSES } from "@/lib/order-service";

type NelsiusWebhookBody = {
  event?: string;
  data?: {
    transaction_code?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    status?: string;
    operator?: string;
  };
};

async function handle(req: Request) {
  let body: NelsiusWebhookBody;
  try {
    body = (await req.json()) as NelsiusWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const reference = body?.data?.reference;
  if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

  // La doc NelsiusPay ne documente pas de signature HMAC : on ne fait jamais
  // confiance au payload seul et on re-vérifie côté serveur (recommandé par NelsiusPay).
  let verified;
  try {
    verified = await verifyNelsiusPayment(reference);
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 502 });
  }
  const status = mapNelsiusStatus(verified.status);
  const eventId = buildNelsiusEventId(reference, {
    status: verified.status,
    amount: verified.amount,
    transactionCode: verified.transactionCode,
  });

  try {
    const outcome = await db.transaction(async (tx) => {
      const [payment] = await tx.select().from(payments).where(eq(payments.transactionId, reference)).limit(1);
      if (!payment) throw new Error("PAYMENT_NOT_FOUND");
      const [order] = await tx.select().from(orders).where(eq(orders.id, payment.orderId)).limit(1);
      if (!order) throw new Error("ORDER_NOT_FOUND");

      const inserted = await tx
        .insert(paymentEvents)
        .values({ paymentId: payment.id, provider: "nelsiuspay", eventId, eventType: body.event || verified.status || "unknown", payload: { webhook: body, verified: verified.raw }, status: "received" })
        .onConflictDoNothing({ target: paymentEvents.eventId })
        .returning({ id: paymentEvents.id });
      if (!inserted.length) return { deduped: true as const };

      if (
        (verified.amount !== undefined && verified.amount !== payment.amountXaf) ||
        (verified.currency && verified.currency !== payment.currency)
      ) {
        // Incohérence tracée et validée (commit) : aucune confirmation, aucun
        // changement de statut. Même règle que refresh/cron.
        await tx.update(paymentEvents).set({ status: "rejected", processedAt: new Date() }).where(eq(paymentEvents.id, inserted[0].id));
        return { mismatch: true as const };
      }

      // Règle de priorité : un paiement déjà terminal (success, failed,
      // cancelled, expired, refunded...) n'est jamais modifié par un événement
      // plus ancien ou rejoué. Première décision terminale conservée.
      if ((TERMINAL_PAYMENT_STATUSES as readonly string[]).includes(payment.status)) {
        await tx.update(paymentEvents).set({ status: "ignored_terminal_state", processedAt: new Date() }).where(eq(paymentEvents.id, inserted[0].id));
        return { ignored: true as const };
      }

      await tx
        .update(payments)
        .set({ status, providerReference: verified.transactionCode || null, providerResponse: verified.raw, updatedAt: new Date(), ...(status === "success" ? { paidAt: new Date() } : {}) })
        .where(eq(payments.id, payment.id));

      if (status === "success" && payment.status !== "success") {
        if (order.status === "pending") {
          const [updatedOrder] = await tx.update(orders).set({ status: "confirmed", updatedAt: new Date() }).where(eq(orders.id, order.id)).returning();
          await createPaidArtifacts(tx, updatedOrder, order.userId);
        } else if ((FULFILMENT_ORDER_STATUSES as readonly string[]).includes(order.status)) {
          // Commande déjà avancée par un autre chemin : on enregistre le
          // paiement sans jamais la faire revenir en arrière.
          await createPaidArtifacts(tx, order, order.userId);
        } else {
          // Commande finalisée autrement (annulée/remboursée) : pas de bascule
          // automatique, revue manuelle côté administration.
          await notifyAdmins(tx, { orderId: order.id, type: "payment_needs_review", title: "Paiement à vérifier", message: `Paiement ${orderReference(order.id)} confirmé côté prestataire alors que la commande est ${order.status}.` });
        }
      }

      if (
        (status === "failed" || status === "cancelled" || (status === "expired" && payment.expiresAt && payment.expiresAt < new Date())) &&
        !["cancelled", "confirmed", "processing", "shipped", "delivered", "completed", "refunded"].includes(order.status)
      ) {
        await restoreReservedStock(tx, order.id);
        await tx.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, order.id));
        await tx.insert(notifications).values({ userId: order.userId, orderId: order.id, type: "payment_failed", title: "Paiement non abouti", message: `Le paiement de la commande ${orderReference(order.id)} n'a pas abouti.` });
      }
      await tx.update(paymentEvents).set({ status: "processed", processedAt: new Date() }).where(eq(paymentEvents.id, inserted[0].id));
      return { processed: true as const };
    });
    if (outcome && "mismatch" in outcome) {
      return NextResponse.json({ error: "PAYMENT_AMOUNT_MISMATCH" }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof Error && ["PAYMENT_NOT_FOUND", "ORDER_NOT_FOUND"].includes(e.message)) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ received: false }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
