import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, paymentEvents, payments, notifications } from "@/lib/db/schema";
import { verifyNelsiusPayment, mapNelsiusStatus } from "@/lib/nelsiuspay";
import { orderReference } from "@/lib/utils";
import { createPaidArtifacts, restoreReservedStock } from "@/lib/order-service";

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
  const eventId = crypto
    .createHash("sha256")
    .update(["nelsiuspay", reference, verified.transactionCode || "", verified.status, String(verified.amount ?? "")].join("|"))
    .digest("hex");

  try {
    await db.transaction(async (tx) => {
      const [payment] = await tx.select().from(payments).where(eq(payments.transactionId, reference)).limit(1);
      if (!payment) throw new Error("PAYMENT_NOT_FOUND");
      const [order] = await tx.select().from(orders).where(eq(orders.id, payment.orderId)).limit(1);
      if (!order) throw new Error("ORDER_NOT_FOUND");

      const inserted = await tx
        .insert(paymentEvents)
        .values({ paymentId: payment.id, provider: "nelsiuspay", eventId, eventType: body.event || verified.status || "unknown", payload: { webhook: body, verified: verified.raw }, status: "received" })
        .onConflictDoNothing({ target: paymentEvents.eventId })
        .returning({ id: paymentEvents.id });
      if (!inserted.length) return;

      if (
        (verified.amount !== undefined && verified.amount !== payment.amountXaf) ||
        (verified.currency && verified.currency !== payment.currency)
      ) {
        await tx.update(paymentEvents).set({ status: "rejected", processedAt: new Date() }).where(eq(paymentEvents.id, inserted[0].id));
        throw new Error("PAYMENT_AMOUNT_MISMATCH");
      }

      // Les états de paiement sont monotones : un paiement confirmé ne peut pas
      // être dégradé par un événement tardif ou en double.
      if (payment.status === "success" && status !== "success") {
        await tx.update(paymentEvents).set({ status: "ignored_terminal_state", processedAt: new Date() }).where(eq(paymentEvents.id, inserted[0].id));
        return;
      }

      await tx
        .update(payments)
        .set({ status, providerReference: verified.transactionCode || null, providerResponse: verified.raw, updatedAt: new Date(), ...(status === "success" ? { paidAt: new Date() } : {}) })
        .where(eq(payments.id, payment.id));

      if (status === "success" && payment.status !== "success") {
        const [updatedOrder] = await tx.update(orders).set({ status: "confirmed", updatedAt: new Date() }).where(eq(orders.id, order.id)).returning();
        await createPaidArtifacts(tx, updatedOrder, order.userId);
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
    });
  } catch (e) {
    if (e instanceof Error && ["PAYMENT_NOT_FOUND", "ORDER_NOT_FOUND", "PAYMENT_AMOUNT_MISMATCH"].includes(e.message)) {
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
