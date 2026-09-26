import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser, verifyPassword, hashPassword } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const schema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

export async function PUT(req: Request) {
  const rl = await rateLimit(`pwd:${requestIp(req)}`, 8, 15 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  try {
    const session = await requireUser();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Mot de passe invalide (8 caractères minimum)" }, { status: 400 });

    const [u] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!u) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

    const ok = await verifyPassword(parsed.data.currentPassword, u.passwordHash);
    if (!ok) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 401 });

    await db
      .update(users)
      .set({ passwordHash: await hashPassword(parsed.data.newPassword), updatedAt: new Date() })
      .where(eq(users.id, session.userId));

    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
