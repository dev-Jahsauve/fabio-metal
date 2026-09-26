import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { addresses, auditLogs, cartItems, carts, notifications, orderItems, orders, payments, products, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { initiateNelsiusCheckout, getNelsiusPaymentLink } from "@/lib/nelsiuspay";
import { restoreReservedStock } from "@/lib/order-service";
import { getAppUrl, orderReference } from "@/lib/utils";

const schema = z.object({
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(100) })).min(1).max(50),
  note: z.string().max(2000).optional(),
  addressId: z.string().uuid().optional(),
  address: z.object({ recipientName: z.string().min(2).max(120), phone: z.string().min(6).max(30), addressLine: z.string().min(4).max(500), city: z.string().min(2).max(100), region: z.string().max(100).optional() }).optional()
}).superRefine((v, ctx) => { if (!v.addressId && !v.address) ctx.addIssue({ code: "custom", path: ["address"], message: "Adresse de livraison requise" }); });

export async function POST(req: Request) {
  let effectiveIdempotencyKey = "";
  try {
    const session = await requireUser();
    const parsed = schema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json({ error: "Panier ou adresse invalides" }, { status: 400 });
    const input = parsed.data;
    const rawIdempotencyKey = req.headers.get("Idempotency-Key")?.trim() || crypto.randomUUID();
    const idempotencyKey = `${session.userId}:${rawIdempotencyKey}`.slice(0, 120);
    effectiveIdempotencyKey = idempotencyKey;
    const [existingOrder] = await db.select().from(orders).where(and(eq(orders.idempotencyKey, idempotencyKey), eq(orders.userId, session.userId))).limit(1);
    if (existingOrder) { const [existingPayment] = await db.select().from(payments).where(eq(payments.orderId, existingOrder.id)).orderBy(sql`${payments.createdAt} DESC`).limit(1); return NextResponse.json({ orderId: existingOrder.id, reference: orderReference(existingOrder.id), paymentUrl: existingPayment?.paymentUrl || null, reused: true }); }
    const quantities = new Map<string, number>(); for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
    const ids = [...quantities.keys()];

    // The database unique index on idempotency_key is the final concurrency guard.
    const result = await db.transaction(async (tx) => {
      const found = await tx.select().from(products).where(and(inArray(products.id, ids), eq(products.published, true)));
      if (found.length !== ids.length) throw new Error("PRODUCT_UNAVAILABLE");
      const rows: Array<{ product: any; quantity: number; unitPrice: number }> = [];
      for (const productId of ids) {
        const quantity = quantities.get(productId)!;
        const [updated] = await tx.update(products).set({ stock: sql`${products.stock} - ${quantity}`, updatedAt: new Date() }).where(and(eq(products.id, productId), eq(products.published, true), sql`${products.stock} >= ${quantity}`)).returning();
        if (!updated) throw new Error("INSUFFICIENT_STOCK");
        const unitPrice = updated.promoPriceXaf ?? updated.priceXaf;
        rows.push({ product: updated, quantity, unitPrice });
        if (updated.stock <= updated.lowStockThreshold) {
          const admins = await tx.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
          if (admins.length) await tx.insert(notifications).values(admins.map(a => ({ userId: a.id, type: "low_stock", title: "Stock faible", message: `${updated.name} est à ${updated.stock} unité(s).` })));
        }
      }
      const subtotal = rows.reduce((sum, r) => sum + r.unitPrice * r.quantity, 0);
      const deliveryFee = Number.parseInt(process.env.DEFAULT_DELIVERY_FEE_XAF || "0", 10) || 0;
      const total = subtotal + deliveryFee;
      if (!Number.isInteger(total) || total <= 0) throw new Error("PAYMENT_AMOUNT_INVALID");

      let addressSnapshot = { recipientName: null as string | null, phone: null as string | null, addressLine: null as string | null, city: null as string | null, region: null as string | null };
      if (input.addressId) {
        const [a] = await tx.select().from(addresses).where(and(eq(addresses.id, input.addressId), eq(addresses.userId, session.userId))).limit(1);
        if (!a) throw new Error("ADDRESS_NOT_FOUND");
        addressSnapshot = { recipientName: a.recipientName, phone: a.phone, addressLine: a.addressLine, city: a.city, region: a.region };
      } else if (input.address) {
        addressSnapshot = {
          recipientName: input.address.recipientName,
          phone: input.address.phone,
          addressLine: input.address.addressLine,
          city: input.address.city,
          region: input.address.region ?? null,
        };
        await tx.insert(addresses).values({
          userId: session.userId,
          recipientName: input.address.recipientName,
          phone: input.address.phone,
          addressLine: input.address.addressLine,
          city: input.address.city,
          region: input.address.region ?? null,
          label: "Commande",
        });
      }

      const [order] = await tx.insert(orders).values({ idempotencyKey, userId: session.userId, subtotalXaf: subtotal, deliveryFeeXaf: deliveryFee, discountXaf: 0, taxXaf: 0, currency: "XAF", totalXaf: total, customerNote: input.note, ...({ shippingRecipientName: addressSnapshot.recipientName, shippingPhone: addressSnapshot.phone, shippingAddressLine: addressSnapshot.addressLine, shippingCity: addressSnapshot.city, shippingRegion: addressSnapshot.region }) }).returning();
      await tx.insert(orderItems).values(rows.map(r => ({ orderId: order.id, productId: r.product.id, productNameSnapshot: r.product.name, skuSnapshot: r.product.sku, quantity: r.quantity, unitPriceXaf: r.unitPrice })));
      const transactionId = `FM${order.id.replaceAll("-", "")}`;
      const [payment] = await tx.insert(payments).values({ orderId: order.id, provider: "nelsiuspay", transactionId, amountXaf: total, currency: "XAF", status: "pending", expiresAt: new Date(Date.now() + 30 * 60_000) }).returning();
      await tx.insert(notifications).values({ userId: session.userId, orderId: order.id, type: "order_created", title: "Commande créée", message: `Votre commande ${orderReference(order.id)} est en attente de paiement.` });
      const adminsForOrder = await tx.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
      if (adminsForOrder.length) await tx.insert(notifications).values(adminsForOrder.map(a => ({ userId: a.id, orderId: order.id, type: "new_order", title: "Nouvelle commande", message: `Une nouvelle commande ${orderReference(order.id)} attend un paiement.` })));
      await tx.insert(auditLogs).values({ actorUserId: session.userId, action: "order.created", entityType: "order", entityId: order.id, metadata: { totalXaf: total, itemCount: rows.length } });
      const [userCart] = await tx.select({ id: carts.id }).from(carts).where(eq(carts.userId, session.userId)).limit(1); if (userCart) await tx.delete(cartItems).where(eq(cartItems.cartId, userCart.id));
      return { order, payment, rows };
    });

    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user) throw new Error("USER_NOT_FOUND");
    let gateway;
    try {
      gateway = await initiateNelsiusCheckout({ reference: result.payment.transactionId, amountXaf: result.order.totalXaf, orderId: result.order.id, customerName: user.name, customerEmail: user.email, customerPhone: user.phone });
    } catch (providerError: any) {
      // Mode dégradé : pas de clé API mais un lien de paiement statique NelsiusPay
      // configuré → le client paie via ce lien, l'admin confirme manuellement.
      if (providerError?.message === "PAYMENT_PROVIDER_NOT_CONFIGURED") {
        const staticLink = getNelsiusPaymentLink();
        if (staticLink) {
          await db.update(payments).set({ status: "pending", paymentUrl: staticLink, providerResponse: { mode: "static-link" }, updatedAt: new Date() }).where(eq(payments.id, result.payment.id));
          return NextResponse.json({ orderId: result.order.id, reference: orderReference(result.order.id), paymentUrl: staticLink, manual: true });
        }
      }
      await db.transaction(async (tx) => {
        await tx.update(payments).set({ status: "failed", updatedAt: new Date() }).where(eq(payments.id, result.payment.id));
        await restoreReservedStock(tx, result.order.id);
        await tx.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, result.order.id));
        await tx.insert(notifications).values({ userId: session.userId, orderId: result.order.id, type: "payment_failed", title: "Paiement non initialisé", message: `Le paiement de la commande ${orderReference(result.order.id)} n'a pas pu être initialisé.` });
      });
      throw providerError;
    }
    try {
      await db.update(payments).set({ status: "processing", paymentUrl: gateway.paymentUrl, providerResponse: gateway.raw, updatedAt: new Date() }).where(eq(payments.id, result.payment.id));
    } catch (storageError) {
      console.error(storageError);
      return NextResponse.json({ error: "La transaction de paiement a été créée, mais son enregistrement local est temporairement indisponible. Le webhook reste actif." }, { status: 503 });
    }
    return NextResponse.json({ orderId: result.order.id, reference: orderReference(result.order.id), paymentUrl: gateway.paymentUrl });
  } catch (e: any) {
    if (e?.message === "PRODUCT_UNAVAILABLE") return NextResponse.json({ error: "Un article du panier n'est plus disponible." }, { status: 409 });
    if (e?.message === "INSUFFICIENT_STOCK") return NextResponse.json({ error: "Stock insuffisant pour au moins un article." }, { status: 409 });
    if (e?.message === "PAYMENT_AMOUNT_INVALID") return NextResponse.json({ error: "Le montant de commande n'est pas compatible avec le prestataire de paiement." }, { status: 400 });
    if (e?.message === "ADDRESS_NOT_FOUND") return NextResponse.json({ error: "Adresse introuvable." }, { status: 404 });
    if (e?.message === "PAYMENT_PROVIDER_NOT_CONFIGURED") return NextResponse.json({ error: "Le paiement en ligne n'est pas encore configuré côté serveur." }, { status: 503 });
    if (e?.message === "PAYMENT_PROVIDER_ERROR") return NextResponse.json({ error: "Le prestataire de paiement n'a pas pu initialiser la transaction." }, { status: 502 });
    if (e?.code === "23505" && effectiveIdempotencyKey) { const [existing] = await db.select().from(orders).where(eq(orders.idempotencyKey, effectiveIdempotencyKey)).limit(1); if (existing) { const [payment] = await db.select().from(payments).where(eq(payments.orderId, existing.id)).orderBy(sql`${payments.createdAt} DESC`).limit(1); return NextResponse.json({ orderId: existing.id, reference: orderReference(existing.id), paymentUrl: payment?.paymentUrl || null, reused: true }); } }
    return errorResponse(e);
  }
}

export async function GET() {
  try {
    const session = await requireUser();
    let effectiveIdempotencyKey = "";
    const rows = await db.select().from(orders).where(eq(orders.userId, session.userId)).orderBy(sql`${orders.createdAt} DESC`);
    return NextResponse.json(rows);
  } catch (e) { return errorResponse(e); }
}
