import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword, createSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { rateLimit, requestIp } from "@/lib/rate-limit";
const schema = z.object({ email: z.email().transform(v => v.toLowerCase()), password: z.string().min(1).max(128) });
export async function POST(req: Request) {
  const rl = await rateLimit(`login:${requestIp(req)}`, 10, 15 * 60_000); if (!rl.ok) return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  try {
    const p = schema.safeParse(await req.json()); if (!p.success) return NextResponse.json({ error: "Identifiants invalides" }, { status: 400 });
    const [u] = await db.select().from(users).where(eq(users.email, p.data.email)).limit(1);
    if (!u || !(await verifyPassword(p.data.password, u.passwordHash))) return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, u.id));
    await createSession(u.id, u.role); return NextResponse.json({ ok: true, role: u.role });
  } catch { return NextResponse.json({ error: "Connexion impossible" }, { status: 500 }); }
}
