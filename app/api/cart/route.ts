import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cartItems, carts, products } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

async function getOrCreateCart(userId: string) {
  const existing = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await db.insert(carts).values({ userId }).returning();
  return created;
}

export async function GET() { try { const s = await requireUser(); const cart = await getOrCreateCart(s.userId); const items = await db.select({ id: cartItems.id, productId: cartItems.productId, quantity: cartItems.quantity, name: products.name, slug: products.slug, priceXaf: products.priceXaf, promoPriceXaf: products.promoPriceXaf, stock: products.stock, imageUrl: products.imageUrl, published: products.published }).from(cartItems).innerJoin(products, eq(cartItems.productId, products.id)).where(eq(cartItems.cartId, cart.id)); return NextResponse.json({ cart, items }); } catch (e) { return errorResponse(e); } }

export async function POST(req: Request) { try { const s = await requireUser(); const input = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(100) }).safeParse(await req.json()); if (!input.success) return NextResponse.json({ error: "Article ou quantité invalide" }, { status: 400 }); const [product] = await db.select().from(products).where(and(eq(products.id, input.data.productId), eq(products.published, true))).limit(1); if (!product) return NextResponse.json({ error: "Produit indisponible" }, { status: 404 }); const cart = await getOrCreateCart(s.userId); const [existing] = await db.select().from(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, product.id))).limit(1); const nextQty = (existing?.quantity || 0) + input.data.quantity; if (nextQty > product.stock) return NextResponse.json({ error: `Stock disponible : ${product.stock}` }, { status: 409 }); if (existing) await db.update(cartItems).set({ quantity: nextQty, updatedAt: new Date() }).where(eq(cartItems.id, existing.id)); else await db.insert(cartItems).values({ cartId: cart.id, productId: product.id, quantity: input.data.quantity }); await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id)); return NextResponse.json({ ok: true }); } catch (e) { return errorResponse(e); } }

export async function PATCH(req: Request) { try { const s = await requireUser(); const input = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(0).max(100) }).safeParse(await req.json()); if (!input.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 }); const cart = await getOrCreateCart(s.userId); const [product] = await db.select({ stock: products.stock }).from(products).where(eq(products.id, input.data.productId)).limit(1); if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 }); if (input.data.quantity > product.stock) return NextResponse.json({ error: `Stock disponible : ${product.stock}` }, { status: 409 }); if (input.data.quantity === 0) await db.delete(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, input.data.productId))); else await db.update(cartItems).set({ quantity: input.data.quantity, updatedAt: new Date() }).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, input.data.productId))); await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id)); return NextResponse.json({ ok: true }); } catch (e) { return errorResponse(e); } }

export async function DELETE(req: Request) { try { const s = await requireUser(); const input = z.object({ productId: z.string().uuid() }).safeParse(await req.json()); if (!input.success) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 }); const cart = await getOrCreateCart(s.userId); await db.delete(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, input.data.productId))); return NextResponse.json({ ok: true }); } catch (e) { return errorResponse(e); } }
