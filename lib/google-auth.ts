export type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: string | boolean;
};

function getClientId() {
  // Côté serveur : préférer la variable privée (non exposée au navigateur).
  const id = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_CLIENT_ID_NOT_CONFIGURED");
  return id.trim().replace(/^["']|["']$/g, "");
}

const ALLOWED_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const clientId = getClientId();
  // Vérification via l'endpoint officiel Google (sans dépendance supplémentaire).
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("GOOGLE_TOKEN_INVALID");
  const data = (await res.json()) as Record<string, unknown>;
  // 1. Émetteur : doit être Google.
  const iss = String(data.iss || "");
  if (!ALLOWED_ISSUERS.has(iss)) throw new Error("GOOGLE_ISSUER_MISMATCH");
  // 2. Audience : doit être exactement notre Client ID (anti-substitution).
  const aud = String(data.aud || "");
  if (aud !== clientId) throw new Error("GOOGLE_AUDIENCE_MISMATCH");
  // 3. Expiration avec petite tolérance d'horloge (60s).
  const exp = Number(data.exp || 0);
  if (exp && exp * 1000 < Date.now() - 60_000) throw new Error("GOOGLE_TOKEN_EXPIRED");
  const email = String(data.email || "").toLowerCase().trim();
  if (!email) throw new Error("GOOGLE_EMAIL_MISSING");
  // Google peut renvoyer "true"/"1" ou boolean.
  const verified = data.email_verified;
  if (verified !== undefined && verified !== true && verified !== "true" && verified !== "1") {
    throw new Error("GOOGLE_EMAIL_NOT_VERIFIED");
  }
  const sub = String(data.sub || "");
  if (!sub) throw new Error("GOOGLE_SUB_MISSING");
  const name = String(data.name || data.given_name || email.split("@")[0] || "Client Google");
  return { sub, email, name, picture: typeof data.picture === "string" ? data.picture : undefined, email_verified: data.email_verified as string | boolean | undefined };
}

export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
}
