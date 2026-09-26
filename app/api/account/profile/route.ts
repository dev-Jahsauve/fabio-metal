import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(190).transform((v) => v.toLowerCase()),
  phone: z.string().trim().max(30).optional().transform((v) => (v === "" ? undefined : v)),
  avatarUrl: z.string().trim().max(500).optional().transform((v) => (v === "" ? null : v)),
});

export async function GET() {
  try {
    const session = await requireUser();
    const [u] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!u) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    return NextResponse.json({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatarUrl: (u as unknown as Record<string, unknown>).avatarUrl ?? null,
      googleLinked: Boolean((u as unknown as Record<string, unknown>).googleSub),
      role: u.role,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireUser();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    const [current] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!current) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

    // Email déjà utilisé par un autre compte ?
    if (parsed.data.email !== current.email.toLowerCase()) {
      const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
      if (taken) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }

    const patch: Record<string, unknown> = {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      updatedAt: new Date(),
    };
    if (parsed.data.avatarUrl !== undefined) patch.avatarUrl = parsed.data.avatarUrl;

    try {
      await db.update(users).set(patch as Partial<typeof users.$inferInsert>).where(eq(users.id, session.userId));
    } catch {
      // Base non migrée (avatar_url absent) : réessayer sans avatar.
      delete patch.avatarUrl;
      await db.update(users).set(patch as Partial<typeof users.$inferInsert>).where(eq(users.id, session.userId));
    }

    const [updated] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        avatarUrl: (updated as unknown as Record<string, unknown>).avatarUrl ?? null,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
