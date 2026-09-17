import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { gallery } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
const schema=z.object({title:z.string().min(2).max(160),category:z.string().max(100).optional(),imageUrl:z.string().url(),description:z.string().max(2000).optional(),published:z.boolean().default(true)});
export async function GET(){try{await requireAdmin();return NextResponse.json(await db.select().from(gallery).orderBy(desc(gallery.createdAt)))}catch(e){return errorResponse(e)}}
export async function POST(req:Request){try{await requireAdmin();const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Données invalides"},{status:400});const [row]=await db.insert(gallery).values(p.data).returning();return NextResponse.json(row,{status:201})}catch(e){return errorResponse(e)}}
export async function PATCH(req:Request){try{await requireAdmin();const b=await req.json();const id=z.string().uuid().safeParse(b.id);const p=schema.partial().safeParse(b);if(!id.success||!p.success)return NextResponse.json({error:"Données invalides"},{status:400});const [row]=await db.update(gallery).set(p.data).where(eq(gallery.id,id.data)).returning();return NextResponse.json(row)}catch(e){return errorResponse(e)}}

export async function DELETE(req:Request){try{await requireAdmin();const b=await req.json();const id=z.string().uuid().safeParse(b.id);if(!id.success)return NextResponse.json({error:"Identifiant invalide"},{status:400});await db.delete(gallery).where(eq(gallery.id,id.data));return NextResponse.json({ok:true})}catch(e){return errorResponse(e)}}
