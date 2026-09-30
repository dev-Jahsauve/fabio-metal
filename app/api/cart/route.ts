import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cartItems, carts, products } from "@/lib/db/schema";
import { errorResponse } from "@/lib/api";
import { applyCartCookies, getOrCreateCart, resolveCartOwner } from "@/lib/cart";

export async function GET() {
  try {
    const ctx = await resolveCartOwner();
    const cart = await getOrCreateCart(ctx.owner);
    const items = await db.select({ id: cartItems.id, productId: cartItems.productId, quantity: cartItems.quantity, name: products.name, slug: products.slug, priceXaf: products.priceXaf, promoPriceXaf: products.promoPriceXaf, stock: products.stock, imageUrl: products.imageUrl, published: products.published, isCustom: products.isCustom }).from(cartItems).innerJoin(products, eq(cartItems.productId, products.id)).where(eq(cartItems.cartId, cart.id));
    return applyCartCookies(NextResponse.json({ cart, items }), ctx);
  } catch (e) { return errorResponse(e); }
}

export async function POST(req: Request) {
  try {
    const ctx = await resolveCartOwner();
    const input = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(100) }).safeParse(await req.json());
    if (!input.success) return NextResponse.json({ error: "Article ou quantité invalide" }, { status: 400 });
    const [product] = await db.select().from(products).where(and(eq(products.id, input.data.productId), eq(products.published, true))).limit(1);
    if (!product) return NextResponse.json({ error: "Produit indisponible" }, { status: 404 });
    // Produit sur devis (isCustom) : jamais de panier — parcours demande de devis.
    if (product.isCustom) return NextResponse.json({ error: "Cet article nécessite un devis. Utilisez « Demander un devis »." }, { status: 400 });
    const cart = await getOrCreateCart(ctx.owner);
    const [existing] = await db.select().from(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, product.id))).limit(1);
    const nextQty = (existing?.quantity || 0) + input.data.quantity;
    if (nextQty > product.stock) return NextResponse.json({ error: `Stock disponible : ${product.stock}` }, { status: 409 });
    if (existing) await db.update(cartItems).set({ quantity: nextQty, updatedAt: new Date() }).where(eq(cartItems.id, existing.id));
    else await db.insert(cartItems).values({ cartId: cart.id, productId: product.id, quantity: input.data.quantity });
    await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id));
    return applyCartCookies(NextResponse.json({ ok: true }), ctx);
  } catch (e) { return errorResponse(e); }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await resolveCartOwner();
    const input = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(0).max(100) }).safeParse(await req.json());
    if (!input.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    const cart = await getOrCreateCart(ctx.owner);
    const [product] = await db.select({ stock: products.stock }).from(products).where(eq(products.id, input.data.productId)).limit(1);
    if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    if (input.data.quantity > product.stock) return NextResponse.json({ error: `Stock disponible : ${product.stock}` }, { status: 409 });
    if (input.data.quantity === 0) await db.delete(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, input.data.productId)));
    else await db.update(cartItems).set({ quantity: input.data.quantity, updatedAt: new Date() }).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, input.data.productId)));
    await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id));
    return applyCartCookies(NextResponse.json({ ok: true }), ctx);
  } catch (e) { return errorResponse(e); }
}

export async function DELETE(req: Request) {
  try {
    const ctx = await resolveCartOwner();
    const input = z.object({ productId: z.string().uuid() }).safeParse(await req.json());
    if (!input.success) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
    const cart = await getOrCreateCart(ctx.owner);
    await db.delete(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, input.data.productId)));
    return applyCartCookies(NextResponse.json({ ok: true }), ctx);
  } catch (e) { return errorResponse(e); }
}
