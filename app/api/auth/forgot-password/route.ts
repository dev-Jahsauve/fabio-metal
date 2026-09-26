import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createPasswordReset, sendPasswordResetEmail } from "@/lib/password-reset";
import { rateLimit, requestIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = await rateLimit(`forgot:${requestIp(req)}`, 5, 15 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  const parsed = z.object({ email: z.email().transform(v => v.toLowerCase()) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
  const [user] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (!user) return NextResponse.json({ ok: true, message: "Si un compte existe pour cette adresse, un lien de réinitialisation sera envoyé." });
  const token = await createPasswordReset(user.id);
  try {
    const result = await sendPasswordResetEmail(user.email, user.name, token);
    const body: Record<string, unknown> = { ok: true, message: "Si un compte existe pour cette adresse, un lien de réinitialisation sera envoyé." };
    if (process.env.NODE_ENV !== "production" && !result.sent) body.devResetUrl = result.url;
    return NextResponse.json(body);
  } catch (e) {
    console.error(e);
    // Hors production, on expose le lien même si l'envoi email échoue
    // (ex : domaine expéditeur non vérifié) pour ne jamais bloquer les tests.
    const body: Record<string, unknown> = { ok: true, message: "Si un compte existe pour cette adresse, un lien de réinitialisation sera envoyé." };
    if (process.env.NODE_ENV !== "production") {
      const { getAppUrl } = await import("@/lib/utils");
      body.devResetUrl = `${getAppUrl()}/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;
      body.emailWarning = "L'envoi email a échoué : vérifiez RESEND_API_KEY et le domaine expéditeur.";
    }
    return NextResponse.json(body);
  }
}
