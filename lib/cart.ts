import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cartItems, carts, products } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

/**
 * Panier invité (template) : un visiteur ajoute au panier sans compte.
 * - Connecté → panier rattaché à user_id.
 * - Anonyme → panier rattaché à guest_token (cookie `fm_cart`, uuid v4).
 * - À la connexion, le contenu invité est fusionné dans le panier du compte
 *   (plafonné au stock), puis le panier invité est supprimé.
 * La commande reste réservée aux comptes (connexion exigée au checkout).
 */

export const GUEST_CART_COOKIE = "fm_cart";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CartOwner = { userId: string } | { guestToken: string };

export async function resolveCartOwner() {
  const session = await getSession().catch(() => null);
  const store = await cookies();
  const raw = store.get(GUEST_CART_COOKIE)?.value;
  const guestToken = raw && UUID_RE.test(raw) ? raw : null;
  if (session?.userId) {
    if (guestToken) await mergeGuestCart(session.userId, guestToken);
    return {
      owner: { userId: session.userId } as CartOwner,
      setGuestToken: null as string | null,
      // Cookie invité consommé : on le supprime après fusion (ou panier vide).
      clearGuestCookie: Boolean(guestToken),
    };
  }
  if (guestToken) {
    return { owner: { guestToken } as CartOwner, setGuestToken: null as string | null, clearGuestCookie: false };
  }
  const fresh = crypto.randomUUID();
  return { owner: { guestToken: fresh } as CartOwner, setGuestToken: fresh, clearGuestCookie: false };
}

export async function getOrCreateCart(owner: CartOwner) {
  if ("userId" in owner) {
    const [existing] = await db.select().from(carts).where(eq(carts.userId, owner.userId)).limit(1);
    if (existing) return existing;
    const [created] = await db.insert(carts).values({ userId: owner.userId }).returning();
    return created;
  }
  const [existing] = await db.select().from(carts).where(eq(carts.guestToken, owner.guestToken)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(carts).values({ guestToken: owner.guestToken }).returning();
  return created;
}

async function mergeGuestCart(userId: string, guestToken: string) {
  const [guest] = await db.select().from(carts).where(eq(carts.guestToken, guestToken)).limit(1);
  if (!guest) return;
  const userCart = await getOrCreateCart({ userId });
  if (guest.id === userCart.id) return;
  const items = await db
    .select({ productId: cartItems.productId, quantity: cartItems.quantity })
    .from(cartItems)
    .where(eq(cartItems.cartId, guest.id));
  for (const item of items) {
    const [product] = await db
      .select({ stock: products.stock, published: products.published })
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);
    if (!product || !product.published) continue;
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, userCart.id), eq(cartItems.productId, item.productId)))
      .limit(1);
    const next = Math.min((existing?.quantity || 0) + item.quantity, Math.max(product.stock, 0));
    if (next <= 0) continue;
    if (existing) {
      await db.update(cartItems).set({ quantity: next, updatedAt: new Date() }).where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({ cartId: userCart.id, productId: item.productId, quantity: next });
    }
  }
  await db.delete(cartItems).where(eq(cartItems.cartId, guest.id));
  await db.delete(carts).where(eq(carts.id, guest.id));
}

export function applyCartCookies(
  res: NextResponse,
  opts: { setGuestToken: string | null; clearGuestCookie: boolean }
) {
  if (opts.setGuestToken) {
    res.cookies.set(GUEST_CART_COOKIE, opts.setGuestToken, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }
  if (opts.clearGuestCookie) res.cookies.delete(GUEST_CART_COOKIE);
  return res;
}
