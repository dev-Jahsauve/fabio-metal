import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { contactRequests } from "@/lib/db/schema";
import { rateLimit, requestIp } from "@/lib/rate-limit";
const schema=z.object({name:z.string().trim().min(2).max(120),phone:z.string().trim().min(6).max(30),email:z.email().optional().or(z.literal("")),subject:z.string().max(180).optional(),message:z.string().trim().min(5).max(4000)});
export async function POST(req:Request){const rl=await rateLimit(`contact:${requestIp(req)}`,5,10*60_000);if(!rl.ok)return NextResponse.json({error:"Trop de demandes. Réessayez plus tard."},{status:429});const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Formulaire invalide"},{status:400});await db.insert(contactRequests).values(p.data);return NextResponse.json({ok:true},{status:201})}
