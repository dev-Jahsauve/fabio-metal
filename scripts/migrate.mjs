import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL_NOT_CONFIGURED');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (id varchar(160) PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const files = (await readdir(join(process.cwd(), 'db/migrations'))).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const id = file.replace(/\.sql$/, '');
    const existing = await client.query('SELECT id FROM schema_migrations WHERE id = $1', [id]);
    if (existing.rows.length) { console.log(`Migration ${id} already applied.`); continue; }
    const sql = await readFile(join(process.cwd(), 'db/migrations', file), 'utf8');
    console.log(`Applying ${id}...`);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [id]);
      await client.query('COMMIT');
      console.log(`Migration ${id} applied.`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally { client.release(); await pool.end(); }
