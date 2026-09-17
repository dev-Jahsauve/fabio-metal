import crypto from "node:crypto";
import { getAppUrl } from "@/lib/utils";

const API_URL = "https://api-checkout.cinetpay.com/v2";

function requiredConfig() {
  const apikey = process.env.CINETPAY_APIKEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apikey || !siteId) throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
  return { apikey, siteId };
}

export async function initializeCinetPayPayment(input: {
  transactionId: string; amountXaf: number; orderId: string; customerName: string; customerEmail: string; customerPhone?: string | null;
}) {
  const { apikey, siteId } = requiredConfig();
  if (input.amountXaf <= 0 || input.amountXaf % 5 !== 0) throw new Error("PAYMENT_AMOUNT_INVALID");
  const response = await fetch(`${API_URL}/payment`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey, site_id: siteId, transaction_id: input.transactionId, amount: input.amountXaf, currency: "XAF",
      description: `Commande ${input.orderId}`.replace(/[^a-zA-Z0-9 .-]/g, ""),
      customer_id: input.orderId, customer_name: input.customerName, customer_surname: "",
      customer_email: input.customerEmail, customer_phone_number: input.customerPhone || "",
      customer_country: "CM", notify_url: `${getAppUrl()}/api/payments/cinetpay/webhook`, return_url: `${getAppUrl()}/paiement/retour?order=${encodeURIComponent(input.orderId)}`,
      channels: process.env.CINETPAY_CHANNELS || "ALL", lang: "FR", metadata: input.orderId,
    }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.data?.payment_url) throw new Error("PAYMENT_PROVIDER_ERROR");
  return data;
}

export async function verifyCinetPayTransaction(transactionId: string) {
  const { apikey, siteId } = requiredConfig();
  const response = await fetch(`${API_URL}/payment/check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apikey, site_id: siteId, transaction_id: transactionId }), cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error("PAYMENT_VERIFY_ERROR");
  return data;
}

export function verifyCinetPayHmac(payload: Record<string, string>, receivedToken: string | null) {
  const secret = process.env.CINETPAY_SECRET_KEY;
  if (!secret || !receivedToken) return false;
  const fields = ["cpm_site_id","cpm_trans_id","cpm_trans_date","cpm_amount","cpm_currency","signature","payment_method","cel_phone_num","cpm_phone_prefixe","cpm_language","cpm_version","cpm_payment_config","cpm_page_action","cpm_custom","cpm_designation","cpm_error_message"];
  const message = fields.map((field) => payload[field] || "").join("");
  const expected = crypto.createHmac("sha256", secret).update(message).digest("hex");
  const a = Buffer.from(expected); const b = Buffer.from(receivedToken);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function mapCinetPayStatus(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "ACCEPTED": return "success" as const;
    case "REFUSED": return "failed" as const;
    case "CANCELLED": return "cancelled" as const;
    case "WAITING_FOR_CUSTOMER": return "processing" as const;
    case "PENDING": return "processing" as const;
    default: return "processing" as const;
  }
}
