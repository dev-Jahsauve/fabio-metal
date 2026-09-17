import { NextResponse } from "next/server";
import { and, eq, lt, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, orders, payments } from "@/lib/db/schema";
import { restoreReservedStock, createPaidArtifacts } from "@/lib/order-service";
import { verifyCinetPayTransaction, mapCinetPayStatus } from "@/lib/payments";
import { orderReference } from "@/lib/utils";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.get("authorization") !== `Bearer ${expected}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const expired = await db.select().from(payments).where(and(inArray(payments.status, ["pending", "processing"]), lt(payments.expiresAt, new Date()))).limit(50);
  let processed = 0;
  for (const payment of expired) {
    try {
      const verified = await verifyCinetPayTransaction(payment.transactionId);
      const providerStatus = verified?.data?.status;
      const status = mapCinetPayStatus(providerStatus);
      await db.transaction(async tx => {
        const [current] = await tx.select().from(payments).where(eq(payments.id, payment.id)).limit(1);
        const [order] = await tx.select().from(orders).where(eq(orders.id, payment.orderId)).limit(1);
        if (!current || !order || current.status === "success") return;
        const amount = Number(verified?.data?.amount);
        if (status === "success" && amount === current.amountXaf && verified?.data?.currency === current.currency) {
          const [updated] = await tx.update(payments).set({ status: "success", providerResponse: verified, updatedAt: new Date(), paidAt: new Date() }).where(eq(payments.id, current.id)).returning();
          const [updatedOrder] = await tx.update(orders).set({ status: "confirmed", updatedAt: new Date() }).where(eq(orders.id, order.id)).returning();
          await createPaidArtifacts(tx, updatedOrder || order, order.userId);
          processed++;
          return;
        }
        await tx.update(payments).set({ status: "expired", providerResponse: verified, updatedAt: new Date() }).where(eq(payments.id, current.id));
        await restoreReservedStock(tx, order.id);
        await tx.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, order.id));
        await tx.insert(notifications).values({ userId: order.userId, orderId: order.id, type: "payment_expired", title: "Paiement expiré", message: `Le paiement de la commande ${orderReference(order.id)} a expiré.` });
        processed++;
      });
    } catch (error) { console.error("payment reconciliation", payment.id, error); }
  }
  return NextResponse.json({ scanned: expired.length, processed });
}
