import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, paymentEvents, payments, notifications } from "@/lib/db/schema";
import { verifyCinetPayHmac, verifyCinetPayTransaction, mapCinetPayStatus } from "@/lib/payments";
import { orderReference } from "@/lib/utils";
import { createPaidArtifacts, restoreReservedStock } from "@/lib/order-service";

async function handle(req: Request) {
  const raw = await req.text();
  const params = new URLSearchParams(raw);
  const payload: Record<string, string> = Object.fromEntries(params.entries());
  const token = req.headers.get("x-token");
  if (!verifyCinetPayHmac(payload, token)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  const transactionId = payload.cpm_trans_id;
  if (!transactionId) return NextResponse.json({ error: "Missing transaction" }, { status: 400 });

  const verified = await verifyCinetPayTransaction(transactionId);
  const providerStatus = verified?.data?.status;
  const status = mapCinetPayStatus(providerStatus);
  const amount = Number(verified?.data?.amount);
  const currency = verified?.data?.currency;
  const eventId = crypto.createHash("sha256").update([payload.cpm_site_id, transactionId, payload.cpm_trans_date, payload.cpm_amount, payload.cpm_currency, payload.signature, providerStatus || ""].join("|")).digest("hex");

  await db.transaction(async tx => {
    const [payment] = await tx.select().from(payments).where(eq(payments.transactionId, transactionId)).limit(1);
    if (!payment) throw new Error("PAYMENT_NOT_FOUND");
    const [order] = await tx.select().from(orders).where(eq(orders.id, payment.orderId)).limit(1);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    const inserted = await tx.insert(paymentEvents).values({ paymentId: payment.id, provider: "cinetpay", eventId, eventType: providerStatus || "unknown", payload: verified, status: "received" }).onConflictDoNothing({ target: paymentEvents.eventId }).returning({ id: paymentEvents.id });
    if (!inserted.length) return;

    if (amount !== payment.amountXaf || currency !== payment.currency) {
      await tx.update(paymentEvents).set({ status: "rejected", processedAt: new Date() }).where(eq(paymentEvents.id, inserted[0].id));
      throw new Error("PAYMENT_AMOUNT_MISMATCH");
    }

    // Payment states are monotonic: a confirmed payment cannot be downgraded by a late duplicate/faulty event.
    if (payment.status === "success" && status !== "success") {
      await tx.update(paymentEvents).set({ status: "ignored_terminal_state", processedAt: new Date() }).where(eq(paymentEvents.id, inserted[0].id));
      return;
    }

    await tx.update(payments).set({ status, providerReference: verified?.data?.operator_id || null, providerResponse: verified, updatedAt: new Date(), ...(status === "success" ? { paidAt: new Date() } : {}) }).where(eq(payments.id, payment.id));

    if (status === "success" && payment.status !== "success") {
      const [updatedOrder] = await tx.update(orders).set({ status: "confirmed", updatedAt: new Date() }).where(eq(orders.id, order.id)).returning();
      await createPaidArtifacts(tx, updatedOrder, order.userId);
    }

    if ((status === "failed" || status === "cancelled" || status === "processing" && payment.expiresAt && payment.expiresAt < new Date()) && order.status !== "cancelled" && order.status !== "confirmed" && order.status !== "processing" && order.status !== "shipped" && order.status !== "delivered" && order.status !== "completed" && order.status !== "refunded") {
      await restoreReservedStock(tx, order.id);
      await tx.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, order.id));
      await tx.insert(notifications).values({ userId: order.userId, orderId: order.id, type: "payment_failed", title: "Paiement non abouti", message: `Le paiement de la commande ${orderReference(order.id)} n'a pas abouti.` });
    }
    await tx.update(paymentEvents).set({ status: "processed", processedAt: new Date() }).where(eq(paymentEvents.id, inserted[0].id));
  });
  return NextResponse.json({ received: true });
}

export async function POST(req: Request) { try { return await handle(req); } catch (error) { console.error(error); return NextResponse.json({ received: false }, { status: 500 }); } }
export async function GET() { return NextResponse.json({ ok: true }); }
