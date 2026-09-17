import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, createSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const schema = z.object({ name: z.string().trim().min(2).max(120), email: z.email().max(190).transform(v => v.toLowerCase()), password: z.string().min(8).max(128), phone: z.string().trim().max(30).optional() });
export async function POST(req: Request) {
  const rl = await rateLimit(`register:${requestIp(req)}`, 5, 15 * 60_000); if (!rl.ok) return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  try {
    const parsed = schema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1); if (exists.length) return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
    const [u] = await db.insert(users).values({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, passwordHash: await hashPassword(parsed.data.password) }).returning({ id: users.id, role: users.role });
    await createSession(u.id, u.role); return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Inscription impossible" }, { status: 500 }); }
}
