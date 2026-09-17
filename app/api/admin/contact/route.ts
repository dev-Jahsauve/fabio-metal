import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactRequests } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
export async function GET(){try{await requireAdmin();return NextResponse.json(await db.select().from(contactRequests).orderBy(desc(contactRequests.createdAt)))}catch(e){return errorResponse(e)}}
export async function PATCH(req:Request){try{await requireAdmin();const p=z.object({id:z.string().uuid(),status:z.enum(["new","read","handled"])}).safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Données invalides"},{status:400});const [row]=await db.update(contactRequests).set({status:p.data.status,handledAt:p.data.status==="handled"?new Date():null}).where(eq(contactRequests.id,p.data.id)).returning();return NextResponse.json(row)}catch(e){return errorResponse(e)}}
