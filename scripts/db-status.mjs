import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL_NOT_CONFIGURED');
const pool=new Pool({connectionString:process.env.DATABASE_URL});
const client=await pool.connect();
try{const r=await client.query("select current_database() as database, current_user as user, version() as version");console.log(JSON.stringify(r.rows[0],null,2));const t=await client.query("select table_name from information_schema.tables where table_schema='public' order by table_name");console.log(`Tables: ${t.rows.map(x=>x.table_name).join(', ')}`)}finally{client.release();await pool.end()}
