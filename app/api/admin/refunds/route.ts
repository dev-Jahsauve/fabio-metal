import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq, and, sql, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, refunds, orders, notifications } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export async function GET(){try{await requireAdmin();const rows=await db.select({refund:refunds,payment:payments,order:orders}).from(refunds).innerJoin(payments,eq(refunds.paymentId,payments.id)).innerJoin(orders,eq(payments.orderId,orders.id)).orderBy(desc(refunds.createdAt));return NextResponse.json(rows)}catch(e){return errorResponse(e)}}

export async function POST(req:Request){
  try{
    const admin=await requireAdmin();
    const p=z.object({paymentId:z.string().uuid(),amountXaf:z.number().int().positive(),reason:z.string().max(500).optional()}).safeParse(await req.json());
    if(!p.success)return NextResponse.json({error:"Données invalides"},{status:400});
    const [payment]=await db.select().from(payments).where(eq(payments.id,p.data.paymentId)).limit(1);
    if(!payment||payment.status!=="success")return NextResponse.json({error:"Le paiement n'est pas remboursable dans son état actuel."},{status:409});
    const [sumRow]=await db.select({value:sql<number>`coalesce(sum(${refunds.amountXaf}),0)`}).from(refunds).where(and(eq(refunds.paymentId,payment.id),inArray(refunds.status,["pending","processed"])));
    const already=Number(sumRow?.value||0);
    if(p.data.amountXaf+already>payment.amountXaf)return NextResponse.json({error:"Le cumul des remboursements dépasse le paiement."},{status:400});
    const [r]=await db.insert(refunds).values({paymentId:payment.id,amountXaf:p.data.amountXaf,reason:p.data.reason,status:"pending"}).returning();
    await db.insert(notifications).values({userId:admin.userId,orderId:payment.orderId,type:"refund_requested",title:"Remboursement demandé",message:`Un remboursement de ${p.data.amountXaf} XAF est en attente de traitement.`});
    return NextResponse.json({refund:r,notice:"Demande enregistrée. La confirmation du prestataire reste nécessaire."},{status:201});
  }catch(e){return errorResponse(e)}
}

export async function PATCH(req:Request){
  try{
    await requireAdmin();
    const p=z.object({id:z.string().uuid(),status:z.enum(["processed","failed","cancelled"]),providerReference:z.string().max(180).optional()}).safeParse(await req.json());
    if(!p.success)return NextResponse.json({error:"Données invalides"},{status:400});
    const result=await db.transaction(async tx=>{
      const [refund]=await tx.select().from(refunds).where(eq(refunds.id,p.data.id)).limit(1); if(!refund)throw new Error("REFUND_NOT_FOUND");
      const [payment]=await tx.select().from(payments).where(eq(payments.id,refund.paymentId)).limit(1); if(!payment)throw new Error("PAYMENT_NOT_FOUND");
      const [row]=await tx.update(refunds).set({status:p.data.status,providerReference:p.data.providerReference,processedAt:new Date()}).where(eq(refunds.id,refund.id)).returning();
      if(p.data.status==='processed'){
        const [sumRow]=await tx.select({value:sql<number>`coalesce(sum(${refunds.amountXaf}),0)`}).from(refunds).where(and(eq(refunds.paymentId,payment.id),eq(refunds.status,"processed")));
        const refunded=Number(sumRow?.value||0);
        const paymentStatus=refunded>=payment.amountXaf?'refunded':'partially_refunded';
        await tx.update(payments).set({status:paymentStatus,updatedAt:new Date()}).where(eq(payments.id,payment.id));
        if(paymentStatus==='refunded') await tx.update(orders).set({status:'refunded',updatedAt:new Date()}).where(eq(orders.id,payment.orderId));
      }
      return row;
    });
    return NextResponse.json(result);
  }catch(e){if(e instanceof Error&&e.message==='REFUND_NOT_FOUND')return NextResponse.json({error:'Remboursement introuvable'},{status:404});return errorResponse(e)}
}
