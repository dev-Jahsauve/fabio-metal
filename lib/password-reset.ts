import crypto from "node:crypto";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { getAppUrl } from "@/lib/utils";

function hashToken(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }

export async function createPasswordReset(userId: string) {
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(passwordResetTokens).values({ userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 30 * 60_000) });
  return token;
}

export async function consumePasswordReset(token: string) {
  const hash = hashToken(token);
  const [row] = await db.select().from(passwordResetTokens).where(and(eq(passwordResetTokens.tokenHash, hash), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date()))).limit(1);
  if (!row) return null;
  return row;
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const url = `${getAppUrl()}/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;
  if (!apiKey || !from) return { sent: false, url };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [email], subject: "Réinitialisation de votre mot de passe — FABIOLE METAL", html: `<p>Bonjour ${name.replace(/[<>]/g, "")},</p><p>Une demande de réinitialisation de mot de passe a été reçue.</p><p><a href="${url}">Réinitialiser mon mot de passe</a></p><p>Le lien expire dans 30 minutes.</p>` })
  });
  if (!response.ok) throw new Error("RESET_EMAIL_FAILED");
  return { sent: true, url };
}
