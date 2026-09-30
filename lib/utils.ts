import { BRAND, CONTACT } from "@/lib/site";

export const WHATSAPP = CONTACT.whatsapp;
export function waLink(message: string) { return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`; }
export function formatXaf(value: number) { return new Intl.NumberFormat("fr-FR").format(value) + " FCFA"; }
export function getAppUrl() { return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""); }
export function orderReference(id: string) { return `${BRAND.orderPrefix}${id.replace(/-/g, "").slice(0, 20).toUpperCase()}`; }
