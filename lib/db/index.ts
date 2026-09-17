import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_NOT_CONFIGURED");
neonConfig.webSocketConstructor = ws;

const globalForDb = globalThis as unknown as { fabiolePool?: Pool };
const pool = globalForDb.fabiolePool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") globalForDb.fabiolePool = pool;

export const db = drizzle({ client: pool, schema });
export { pool };
