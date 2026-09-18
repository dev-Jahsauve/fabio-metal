export const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || "237698308780";
export function waLink(message: string) { return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`; }
export function formatXaf(value: number) { return new Intl.NumberFormat("fr-FR").format(value) + " FCFA"; }
export function getAppUrl() { return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; }
export function orderReference(id: string) { return `FM${id.replace(/-/g, "").slice(0, 20).toUpperCase()}`; }
