import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, users, payments, shipments, notifications } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { restoreReservedStock, writeAudit } from "@/lib/order-service";

const status = z.enum(["pending","confirmed","processing","shipped","delivered","completed","cancelled","refunded"]);
const allowed: Record<string, string[]> = {
  pending: ["confirmed","cancelled"], confirmed: ["processing","cancelled"], processing: ["shipped","cancelled"],
  shipped: ["delivered"], delivered: ["completed"], completed: [], cancelled: [], refunded: []
};

export async function GET(){
  try { await requireAdmin(); const rows=await db.select({order:orders,userName:users.name,userEmail:users.email,paymentStatus:payments.status,shipmentStatus:shipments.status}).from(orders).innerJoin(users,eq(orders.userId,users.id)).leftJoin(payments,eq(payments.orderId,orders.id)).leftJoin(shipments,eq(shipments.orderId,orders.id)).orderBy(desc(orders.createdAt)); return NextResponse.json(rows); }
  catch(e){ return errorResponse(e); }
}

export async function PATCH(req:Request){
  try {
    const admin=await requireAdmin();
    const p=z.object({id:z.string().uuid(),status}).safeParse(await req.json());
    if(!p.success)return NextResponse.json({error:"Données invalides"},{status:400});
    const updated=await db.transaction(async tx=>{
      const [current]=await tx.select().from(orders).where(eq(orders.id,p.data.id)).limit(1);
      if(!current)throw new Error("ORDER_NOT_FOUND");
      if(current.status===p.data.status)return current;
      if(!allowed[current.status]?.includes(p.data.status)) throw new Error("INVALID_ORDER_TRANSITION");
      const [payment]=await tx.select().from(payments).where(eq(payments.orderId,current.id)).orderBy(desc(payments.createdAt)).limit(1);
      if(p.data.status==="cancelled" && payment?.status==="success") throw new Error("REFUND_REQUIRED");
      if(p.data.status==="cancelled") await restoreReservedStock(tx,current.id);
      const [o]=await tx.update(orders).set({status:p.data.status,updatedAt:new Date()}).where(eq(orders.id,current.id)).returning();
      await tx.insert(notifications).values({userId:current.userId,orderId:current.id,type:`order_${p.data.status}`,title:"Mise à jour de commande",message:`La commande ${current.id.slice(0,8).toUpperCase()} est maintenant ${p.data.status}.`});
      await writeAudit(tx,admin.userId,"order.status_changed","order",current.id,{from:current.status,to:p.data.status});
      return o;
    });
    return NextResponse.json(updated);
  } catch(e){
    if(e instanceof Error&&e.message==='ORDER_NOT_FOUND')return NextResponse.json({error:'Commande introuvable'},{status:404});
    if(e instanceof Error&&e.message==='INVALID_ORDER_TRANSITION')return NextResponse.json({error:'Transition de statut non autorisée.'},{status:409});
    if(e instanceof Error&&e.message==='REFUND_REQUIRED')return NextResponse.json({error:'Cette commande est déjà payée. Créez/traitez d’abord le remboursement avant de l’annuler.'},{status:409});
    return errorResponse(e);
  }
}
