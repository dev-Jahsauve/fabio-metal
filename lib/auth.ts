import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const COOKIE = "fabiole_session";
function getSecret() { const value = process.env.AUTH_SECRET; if (!value || value.length < 32) throw new Error("AUTH_SECRET_NOT_CONFIGURED"); return new TextEncoder().encode(value); }
export async function hashPassword(password: string) { return bcrypt.hash(password, 12); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }
export async function createSession(userId: string, role: "customer" | "admin") { const token = await new SignJWT({ userId, role, jti: crypto.randomUUID() }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(getSecret()); (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 }); }
export async function destroySession() { (await cookies()).set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 }); }
export async function getSession() { const token = (await cookies()).get(COOKIE)?.value; if (!token) return null; try { return (await jwtVerify(token, getSecret())).payload as { userId: string; role: "customer" | "admin"; jti?: string }; } catch { return null; } }
export async function requireUser() { const session = await getSession(); if (!session) throw new Error("UNAUTHENTICATED"); const [user] = await db.select({id:users.id,role:users.role}).from(users).where(eq(users.id,session.userId)).limit(1); if (!user) throw new Error("UNAUTHENTICATED"); return { ...session, role: user.role } as { userId:string; role:"customer"|"admin"; jti?:string }; }
export async function requireAdmin() { const session = await requireUser(); if (session.role !== "admin") throw new Error("FORBIDDEN"); return session; }
export async function getCurrentUser() { const session = await requireUser().catch(()=>null); if (!session) return null; const [result] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1); return result || null; }
