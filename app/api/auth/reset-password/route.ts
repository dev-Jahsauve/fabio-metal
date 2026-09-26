import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { consumePasswordReset } from "@/lib/password-reset";
import { hashPassword } from "@/lib/auth";
import { rateLimit, requestIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = await rateLimit(`reset:${requestIp(req)}`, 10, 15 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  const parsed = z.object({ token: z.string().min(40).max(100), password: z.string().min(8).max(128) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Lien ou mot de passe invalide" }, { status: 400 });
  const row = await consumePasswordReset(parsed.data.token);
  if (!row) return NextResponse.json({ error: "Lien de réinitialisation invalide ou expiré" }, { status: 400 });
  await db.transaction(async tx => {
    await tx.update(users).set({ passwordHash: await hashPassword(parsed.data.password), updatedAt: new Date() }).where(eq(users.id, row.userId));
    await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id));
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row.userId));
  });
  return NextResponse.json({ ok: true });
}
