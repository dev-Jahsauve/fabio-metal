import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession, hashPassword } from "@/lib/auth";
import { verifyGoogleIdToken } from "@/lib/google-auth";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const schema = z.object({ idToken: z.string().min(10).max(8000) });

export async function POST(req: Request) {
  const rl = await rateLimit(`google:${requestIp(req)}`, 10, 15 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Jeton Google manquant" }, { status: 400 });

    let profile;
    try {
      profile = await verifyGoogleIdToken(parsed.data.idToken);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "GOOGLE_TOKEN_INVALID";
      if (msg === "GOOGLE_CLIENT_ID_NOT_CONFIGURED") {
        return NextResponse.json(
          { error: "Connexion Google non configurée. Ajoutez GOOGLE_CLIENT_ID dans .env.local." },
          { status: 501 }
        );
      }
      return NextResponse.json({ error: "Connexion Google impossible. Réessayez." }, { status: 401 });
    }

    // Chercher par google_sub si la colonne existe, sinon par email.
    let existing: typeof users.$inferSelect | undefined;
    try {
      const bySub = await db.select().from(users).where(eq((users as unknown as Record<string, unknown>).googleSub as never, profile.sub)).limit(1).catch(() => []);
      if (bySub.length) existing = bySub[0] as typeof users.$inferSelect;
    } catch {
      // colonne absente : on passe à la recherche par email
    }
    if (!existing) {
      const [byEmail] = await db.select().from(users).where(eq(users.email, profile.email)).limit(1);
      if (byEmail) existing = byEmail;
    }

    if (existing) {
      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        })
        .where(eq(users.id, existing.id));
      // Lier le compte Google si la colonne existe et est vide.
      try {
        if (!(existing as unknown as Record<string, unknown>).googleSub) {
          await db
            .update(users)
            .set({ ...( { googleSub: profile.sub } as object) } as Partial<typeof users.$inferInsert>)
            .where(eq(users.id, existing.id));
        }
      } catch {
        // colonne absente : connexion quand même réussie
      }
      await createSession(existing.id, existing.role);
      return NextResponse.json({ ok: true, role: existing.role });
    }

    // Nouveau compte via Google : mot de passe aléatoire (jamais utilisé), email vérifié.
    const randomPassword = `google-${crypto.randomUUID()}-${Date.now()}`;
    const values: typeof users.$inferInsert = {
      name: profile.name.slice(0, 120),
      email: profile.email,
      passwordHash: await hashPassword(randomPassword),
      emailVerifiedAt: new Date(),
    };
    // Ajouter google_sub si la colonne existe (migration 0003).
    try {
      (values as unknown as Record<string, unknown>).googleSub = profile.sub;
      const [created] = await db.insert(users).values(values).returning({ id: users.id, role: users.role });
      await createSession(created.id, created.role);
      return NextResponse.json({ ok: true, role: created.role });
    } catch {
      // Fallback sans google_sub (base non migrée).
      delete (values as unknown as Record<string, unknown>).googleSub;
      const [created] = await db.insert(users).values(values).returning({ id: users.id, role: users.role });
      await createSession(created.id, created.role);
      return NextResponse.json({ ok: true, role: created.role });
    }
  } catch {
    return NextResponse.json({ error: "Connexion Google impossible" }, { status: 500 });
  }
}
