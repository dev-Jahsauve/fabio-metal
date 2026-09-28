/**
 * N'autorise que les redirections internes (anti open-redirect via ?next=).
 * Exemples valides : "/compte", "/admin", "/produits?x=1"
 * Tout le reste (http://, //evil.com, javascript:, ...) -> fallback.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/compte"): string {
  if (!next) return fallback;
  if (next.length > 500) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (/[\\\s]/.test(next)) return fallback;
  const lower = next.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) return fallback;
  return next;
}
