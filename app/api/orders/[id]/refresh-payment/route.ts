import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, orders, paymentEvents, payments } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { verifyNelsiusPayment, mapNelsiusStatus, buildNelsiusEventId } from "@/lib/nelsiuspay";
import { createPaidArtifacts, restoreReservedStock, notifyAdmins, FULFILMENT_ORDER_STATUSES } from "@/lib/order-service";
import { orderReference } from "@/lib/utils";

// États terminaux : aucune re-vérification prestataire nécessaire.
const TERMINAL = ["success", "failed", "cancelled", "expired", "refunded", "partially_refunded"];

// Re-vérification manuelle d'un paiement par le client (bouton "Actualiser" +
// polling court sur /paiement/retour). Mêmes gardes que le webhook :
// re-vérification serveur-à-serveur, contrôle montant/devise, jamais de
// rétrogradation d'un succès, restitution du stock une seule fois.
// Idempotence partagée avec webhook/cron via `paymentEvents.eventId`
// (contrainte unique existante) : même résultat vérifié => même id,
// un seul traitement appliqué même si webhook + refresh arrivent ensemble.
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    const rl = await rateLimit(`refresh-pay:${session.userId}`, 10, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Trop de tentatives. Réessayez dans un instant." }, { status: 429 });

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order || (order.userId !== session.userId && session.role !== "admin")) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }
    const [payment] = await db.select().from(payments).where(eq(payments.orderId, order.id)).limit(1);
    if (!payment) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    if (TERMINAL.includes(payment.status)) {
      return NextResponse.json({ orderId: order.id, reference: orderReference(order.id), paymentStatus: payment.status, orderStatus: order.status, reverified: false });
    }

    // Absence de réponse prestataire : on ne change rien (jamais d'auto-échec).
    const verified = await verifyNelsiusPayment(payment.transactionId).catch(() => null);
    if (!verified) return NextResponse.json({ error: "Vérification impossible pour le moment." }, { status: 502 });
    const status = mapNelsiusStatus(verified.status);
    const eventId = buildNelsiusEventId(payment.transactionId, {
      status: verified.status,
      amount: verified.amount,
      transactionCode: verified.transactionCode,
    });

    const result = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(payments).where(eq(payments.id, payment.id)).limit(1);
      const [ord] = await tx.select().from(orders).where(eq(orders.id, order.id)).limit(1);
      if (!current || !ord) throw new Error("NOT_FOUND");
      // Règle de priorité : un paiement déjà terminal n'est jamais modifié par
      // une vérification plus ancienne ou rejouée (première décision conservée).
      if (TERMINAL.includes(current.status)) return { paymentStatus: current.status, orderStatus: ord.status, deduped: false, mismatch: false };

      // Déduplication : si le webhook (ou un refresh précédent) a déjà traité
      // exactement ce résultat, on renvoie l'état frais sans rien réappliquer.
      const inserted = await tx
        .insert(paymentEvents)
        .values({
          paymentId: payment.id,
          provider: "nelsiuspay",
          eventId,
          eventType: `refresh:${verified.status || "unknown"}`,
          payload: { refresh: { orderId: order.id }, verified: verified.raw },
          status: "received",
        })
        .onConflictDoNothing({ target: paymentEvents.eventId })
        .returning({ id: paymentEvents.id });
      if (!inserted.length) {
        const [freshPay] = await tx.select().from(payments).where(eq(payments.id, payment.id)).limit(1);
        const [freshOrd] = await tx.select().from(orders).where(eq(orders.id, order.id)).limit(1);
        return { paymentStatus: freshPay.status, orderStatus: freshOrd.status, deduped: true, mismatch: false };
      }
      const eventRowId = inserted[0].id;

      // Montant/devise incohérents : on ne valide rien, on ne modifie rien
      // (tracé `rejected`, commit conservé pour audit).
      if (
        (verified.amount !== undefined && verified.amount !== current.amountXaf) ||
        (verified.currency && verified.currency !== current.currency)
      ) {
        await tx.update(paymentEvents).set({ status: "rejected", processedAt: new Date() }).where(eq(paymentEvents.id, eventRowId));
        return { paymentStatus: current.status, orderStatus: ord.status, deduped: false, mismatch: true };
      }

      // Toujours pending/processing côté prestataire : conserver l'état,
      // sans réécrire inutilement ni transformer en échec.
      if (status === current.status) {
        await tx.update(paymentEvents).set({ status: "processed", processedAt: new Date() }).where(eq(paymentEvents.id, eventRowId));
        return { paymentStatus: current.status, orderStatus: ord.status, deduped: false, mismatch: false };
      }

      await tx.update(payments).set({
        status, providerReference: verified.transactionCode || null, providerResponse: verified.raw,
        updatedAt: new Date(), ...(status === "success" ? { paidAt: new Date() } : {}),
      }).where(eq(payments.id, current.id));
      let orderStatus = ord.status;
      if (status === "success") {
        if (ord.status === "pending") {
          const [updated] = await tx.update(orders).set({ status: "confirmed", updatedAt: new Date() }).where(eq(orders.id, ord.id)).returning();
          await createPaidArtifacts(tx, updated, ord.userId);
          orderStatus = "confirmed";
        } else if ((FULFILMENT_ORDER_STATUSES as readonly string[]).includes(ord.status)) {
          await createPaidArtifacts(tx, ord, ord.userId);
        } else {
          await notifyAdmins(tx, { orderId: ord.id, type: "payment_needs_review", title: "Paiement à vérifier", message: `Paiement ${orderReference(ord.id)} confirmé côté prestataire alors que la commande est ${ord.status}.` });
        }
      }
      if (
        (status === "failed" || status === "cancelled" || (status === "expired" && current.expiresAt && current.expiresAt < new Date())) &&
        !["cancelled", "confirmed", "processing", "shipped", "delivered", "completed", "refunded"].includes(ord.status)
      ) {
        await restoreReservedStock(tx, ord.id);
        await tx.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, ord.id));
        await tx.insert(notifications).values({ userId: ord.userId, orderId: ord.id, type: "payment_failed", title: "Paiement non abouti", message: `Le paiement de la commande ${orderReference(ord.id)} n'a pas abouti.` });
        orderStatus = "cancelled";
      }
      await tx.update(paymentEvents).set({ status: "processed", processedAt: new Date() }).where(eq(paymentEvents.id, eventRowId));
      return { paymentStatus: status, orderStatus, deduped: false, mismatch: false };
    });

    if (result.mismatch) {
      return NextResponse.json({ error: "Incohérence de montant. Contactez-nous sur WhatsApp." }, { status: 409 });
    }

    return NextResponse.json({ orderId: order.id, reference: orderReference(order.id), paymentStatus: result.paymentStatus, orderStatus: result.orderStatus, reverified: !result.deduped });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    return errorResponse(e);
  }
}
