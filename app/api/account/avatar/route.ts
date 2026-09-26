import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const MAX_BYTES = 2 * 1024 * 1024; // 2 Mo
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  const rl = await rateLimit(`avatar:${requestIp(req)}`, 10, 15 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  try {
    const session = await requireUser();
    const form = await req.formData();
    const file = form.get("avatar");
    if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Format accepté : JPG, PNG ou WebP" }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "Image trop lourde (2 Mo max)" }, { status: 400 });

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filename = `${session.userId}-${Date.now()}.${ext}`;
    const dir = join(process.cwd(), "public", "avatars");
    await mkdir(dir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), bytes);

    return NextResponse.json({ ok: true, url: `/avatars/${filename}` });
  } catch (e) {
    return errorResponse(e);
  }
}
