import { NextResponse } from "next/server";
import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
const schema=z.object({title:z.string().min(2).max(160),slug:z.string().regex(/^[a-z0-9-]+$/).max(180),description:z.string().max(2000).optional(),icon:z.string().max(40).optional(),published:z.boolean().default(true),sortOrder:z.number().int().min(0).default(0)});
export async function GET(){try{return NextResponse.json(await db.select().from(services).where(eq(services.published,true)).orderBy(asc(services.sortOrder)))}catch(e){return errorResponse(e)}}
export async function POST(req:Request){try{await requireAdmin();const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Données invalides"},{status:400});const [row]=await db.insert(services).values(p.data).returning();return NextResponse.json(row,{status:201})}catch(e){return errorResponse(e)}}
export async function PATCH(req:Request){try{await requireAdmin();const b=await req.json();const id=z.string().uuid().safeParse(b.id);const p=schema.partial().safeParse(b);if(!id.success||!p.success)return NextResponse.json({error:"Données invalides"},{status:400});const [row]=await db.update(services).set(p.data).where(eq(services.id,id.data)).returning();return NextResponse.json(row)}catch(e){return errorResponse(e)}}

export async function DELETE(req:Request){try{await requireAdmin();const b=await req.json();const id=z.string().uuid().safeParse(b.id);if(!id.success)return NextResponse.json({error:"Identifiant invalide"},{status:400});await db.delete(services).where(eq(services.id,id.data));return NextResponse.json({ok:true})}catch(e){return errorResponse(e)}}
