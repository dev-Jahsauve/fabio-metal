import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
import { readFile } from "node:fs/promises";
import { join } from "node:path";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_NOT_CONFIGURED");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  const sql = await readFile(join(process.cwd(), "db/seed.sql"), "utf8");
  await client.query(sql);
  console.log("Seed FABIOLE METAL appliqué (idempotent).");
} finally { client.release(); await pool.end(); }
