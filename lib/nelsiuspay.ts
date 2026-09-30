import crypto from "node:crypto";
import { getAppUrl } from "@/lib/utils";

const API_URL = "https://api.nelsiuspay.com/api/v1";

/**
 * Environnement de paiement EXPLICITE, lu depuis NELSIUSPAY_MODE.
 * - "live" (ou "production") → argent réel, exige une clé sk_live_*.
 * - toute autre valeur (défaut "test") → exige une clé sk_test_*.
 *
 * Garde-fou : une clé live est REFUSÉE en mode test et une clé test est
 * REFUSÉE en mode live. Aucune transaction ne peut donc partir dans le
 * mauvais environnement par erreur de configuration. NELSIUSPAY_MODE est
 * réellement lu ici (initiation + vérification + webhook passent tous par
 * `requiredConfig`), ce n'est pas une variable décorative.
 */
export function getNelsiusEnv(): "test" | "live" {
  return process.env.NELSIUSPAY_MODE === "live" || process.env.NELSIUSPAY_MODE === "production"
    ? "live"
    : "test";
}

function requiredConfig() {
  const apiKey = process.env.NELSIUSPAY_API_KEY;
  if (!apiKey) throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
  const env = getNelsiusEnv();
  if (env === "live" && !apiKey.startsWith("sk_live_")) {
    throw new Error("PAYMENT_WRONG_ENVIRONMENT");
  }
  if (env === "test" && !apiKey.startsWith("sk_test_")) {
    // Une clé live en mode test = argent réel pendant les essais : interdit.
    throw new Error("PAYMENT_WRONG_ENVIRONMENT");
  }
  return { apiKey, env };
}

/**
 * Lien de paiement statique créé depuis le dashboard NelsiusPay
 * (ex : https://nelsius.com/pay/ma-boutique). Mode dégradé : montant fixe,
 * confirmation manuelle côté admin. Optionnel.
 */
export function getNelsiusPaymentLink(): string | null {
  const link = (process.env.NELSIUSPAY_PAYMENT_LINK || "").trim();
  return link.startsWith("http") ? link : null;
}

function authHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Api-Key": apiKey,
  };
}

export type NelsiusCheckoutInput = {
  reference: string;
  amountXaf: number;
  orderId: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
};

/** Extrait l'URL de paiement de la réponse, quel que soit le nom exact du champ. */
export function extractNelsiusPaymentUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const candidates = [
    obj.payment_url,
    obj.checkout_url,
    obj.paymentUrl,
    obj.checkoutUrl,
    obj.redirect_url,
    obj.url,
    obj.link,
    obj.payment_link,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("http")) return c;
  }
  for (const key of ["data", "result", "payload"]) {
    const nested = obj[key];
    if (nested && typeof nested === "object") {
      const found = extractNelsiusPaymentUrl(nested);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Crée une session de checkout hébergé NelsiusPay.
 * Le client est redirigé vers l'URL retournée pour payer
 * (MTN MoMo, Orange Money, Wave, cartes Visa/Mastercard).
 */
export async function initiateNelsiusCheckout(input: NelsiusCheckoutInput) {
  const { apiKey } = requiredConfig();
  if (!Number.isInteger(input.amountXaf) || input.amountXaf <= 0) throw new Error("PAYMENT_AMOUNT_INVALID");
  const appUrl = getAppUrl();
  const response = await fetch(`${API_URL}/checkout/initiate`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      amount: input.amountXaf,
      currency: "XAF",
      customer_email: input.customerEmail || undefined,
      customer_phone: input.customerPhone || undefined,
      reference: input.reference,
      return_url: `${appUrl}/paiement/retour?order=${encodeURIComponent(input.orderId)}`,
      cancel_url: `${appUrl}/paiement/retour?order=${encodeURIComponent(input.orderId)}`,
      metadata: { order_id: input.orderId, customer_name: input.customerName },
    }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("nelsiuspay initiate error", response.status, data);
    throw new Error("PAYMENT_PROVIDER_ERROR");
  }
  const paymentUrl = extractNelsiusPaymentUrl(data);
  if (!paymentUrl) {
    console.error("nelsiuspay initiate: payment URL missing", data);
    throw new Error("PAYMENT_PROVIDER_ERROR");
  }
  return { paymentUrl, raw: data };
}

export type NelsiusStatus = {
  status: string;
  amount?: number;
  currency?: string;
  transactionCode?: string;
  operator?: string;
  raw: unknown;
};

/**
 * Vérification serveur-à-serveur d'une transaction à partir de la référence marchand.
 * C'est la seule preuve de paiement fiable (jamais le retour navigateur seul).
 */
export async function verifyNelsiusPayment(reference: string): Promise<NelsiusStatus> {
  const { apiKey } = requiredConfig();
  const response = await fetch(`${API_URL}/payments/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: { Accept: "application/json", "X-Api-Key": apiKey },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error("PAYMENT_VERIFY_ERROR");
  const payload = (data && typeof data === "object" && "data" in (data as Record<string, unknown>)
    ? (data as Record<string, unknown>).data
    : data) as Record<string, unknown> | null;
  const get = (o: unknown, ...keys: string[]): unknown => {
    if (!o || typeof o !== "object") return undefined;
    const rec = o as Record<string, unknown>;
    for (const k of keys) if (rec[k] !== undefined) return rec[k];
    return undefined;
  };
  const status = String(get(payload, "status") ?? get(data, "status") ?? "pending");
  const amountRaw = get(payload, "amount") ?? get(data, "amount");
  const amount = typeof amountRaw === "number" ? amountRaw : Number(amountRaw);
  return {
    status,
    amount: Number.isFinite(amount) ? amount : undefined,
    currency: (get(payload, "currency") ?? get(data, "currency") ?? undefined) as string | undefined,
    transactionCode: (get(payload, "transaction_code") ?? get(payload, "transactionCode") ?? get(data, "transaction_code") ?? undefined) as string | undefined,
    operator: (get(payload, "operator") ?? get(data, "operator") ?? undefined) as string | undefined,
    raw: data,
  };
}

export function mapNelsiusStatus(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "completed":
    case "success":
    case "paid":
      return "success" as const;
    case "failed":
    case "rejected":
      return "failed" as const;
    case "cancelled":
    case "canceled":
      return "cancelled" as const;
    case "expired":
      return "expired" as const;
    case "pending":
    default:
      return "processing" as const;
  }
}

/**
 * Identifiant déterministe d'un résultat de vérification, partagé par
 * webhook + refresh + cron pour dédupliquer via `paymentEvents.eventId`
 * (contrainte unique existante, aucune nouvelle table).
 * Mêmes entrées => même id ; statut ou montant différent => id différent.
 */
export function buildNelsiusEventId(
  reference: string,
  verified: { status: string; amount?: number; transactionCode?: string }
) {
  return crypto
    .createHash("sha256")
    .update(
      ["nelsiuspay", reference, verified.transactionCode || "", verified.status, String(verified.amount ?? "")].join("|")
    )
    .digest("hex");
}
