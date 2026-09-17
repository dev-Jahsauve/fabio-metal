import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export async function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = new Date();
  const resetAt = new Date(Date.now() + windowMs);
  try {
    const result = await db.execute(sql`
      INSERT INTO rate_limits (key, count, reset_at, updated_at)
      VALUES (${key}, 1, ${resetAt}, ${now})
      ON CONFLICT (key) DO UPDATE
      SET count = CASE WHEN rate_limits.reset_at <= ${now} THEN 1 ELSE rate_limits.count + 1 END,
          reset_at = CASE WHEN rate_limits.reset_at <= ${now} THEN ${resetAt} ELSE rate_limits.reset_at END,
          updated_at = ${now}
      RETURNING count, reset_at
    `);
    const row = result.rows[0] as { count: number; reset_at: string | Date } | undefined;
    if (!row) return { ok: true, remaining: limit - 1 };
    const count = Number(row.count);
    if (count > limit) return { ok: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((new Date(row.reset_at).getTime() - Date.now()) / 1000)) };
    return { ok: true, remaining: Math.max(0, limit - count) };
  } catch {
    // Availability of the database-backed limiter is preferred. If the DB is temporarily unavailable,
    // the endpoint itself will fail anyway; do not keep a misleading in-memory limiter in serverless.
    return { ok: true, remaining: limit - 1 };
  }
}

export function requestIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
