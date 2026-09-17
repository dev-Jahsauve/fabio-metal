import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { getSession, requireAdmin } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { errorResponse } from "@/lib/api";

const productSchema = z.object({
  name: z.string().trim().min(2).max(160), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  description: z.string().max(5000).nullable().optional(), categoryId: z.string().uuid().nullable().optional(),
  priceXaf: z.number().int().nonnegative(), promoPriceXaf: z.number().int().nonnegative().nullable().optional(), imageUrl: z.string().url().nullable().optional(),
  stock: z.number().int().nonnegative(), lowStockThreshold: z.number().int().nonnegative().max(100000).default(2), isCustom: z.boolean().default(true), published: z.boolean().default(true), sku: z.string().trim().max(80).nullable().optional()
}).superRefine((v, ctx) => {
  if (v.promoPriceXaf != null && v.promoPriceXaf > v.priceXaf) ctx.addIssue({ code: "custom", path: ["promoPriceXaf"], message: "Le prix promotionnel ne peut pas dépasser le prix normal." });
  if (v.priceXaf % 5 !== 0) ctx.addIssue({ code: "custom", path: ["priceXaf"], message: "Le prix doit être un multiple de 5 XAF pour le paiement en ligne." });
  if (v.promoPriceXaf != null && v.promoPriceXaf % 5 !== 0) ctx.addIssue({ code: "custom", path: ["promoPriceXaf"], message: "Le prix promotionnel doit être un multiple de 5 XAF." });
});

export async function GET() { try { const session = await getSession(); const rows = session?.role === "admin" ? await db.select().from(products).orderBy(desc(products.createdAt)) : await db.select().from(products).where(eq(products.published, true)).orderBy(desc(products.createdAt)); return NextResponse.json(rows); } catch (e) { return errorResponse(e); } }

async function validateCategory(id: string | null | undefined) { if (!id) return true; const [row] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, id)).limit(1); return !!row; }

export async function POST(req: Request) { try { await requireAdmin(); const parsed = productSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json({ error: "Données produit invalides", details: parsed.error.flatten() }, { status: 400 }); if (!(await validateCategory(parsed.data.categoryId))) return NextResponse.json({ error: "Catégorie introuvable" }, { status: 400 }); const [p] = await db.insert(products).values(parsed.data).returning(); return NextResponse.json(p, { status: 201 }); } catch (e) { return errorResponse(e); } }

export async function PATCH(req: Request) { try { await requireAdmin(); const body = await req.json(); const id = z.string().uuid().safeParse(body.id); if (!id.success) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 }); const parsed = productSchema.partial().safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Données produit invalides", details: parsed.error.flatten() }, { status: 400 }); if (!(await validateCategory(parsed.data.categoryId))) return NextResponse.json({ error: "Catégorie introuvable" }, { status: 400 }); const [p] = await db.update(products).set({ ...parsed.data, updatedAt: new Date() }).where(eq(products.id, id.data)).returning(); if (!p) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 }); return NextResponse.json(p); } catch (e) { return errorResponse(e); } }

export async function DELETE(req: Request) { try { await requireAdmin(); const body = await req.json(); const id = z.string().uuid().safeParse(body.id); if (!id.success) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 }); const [p] = await db.update(products).set({ published: false, updatedAt: new Date() }).where(eq(products.id, id.data)).returning({ id: products.id }); if (!p) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 }); return NextResponse.json({ ok: true }); } catch (e) { return errorResponse(e); } }
