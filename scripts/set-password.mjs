// Change le mot de passe d'un compte existant.
// Usage : node scripts/set-password.mjs <email> <nouveau-mot-de-passe>
// Le mot de passe doit contenir au moins 8 caractères.
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const [email, newPassword] = process.argv.slice(2);
if (!email || !newPassword) {
  console.error("Usage : node scripts/set-password.mjs <email> <nouveau-mot-de-passe>");
  process.exit(1);
}
if (newPassword.length < 8) {
  console.error("ERREUR : le mot de passe doit contenir au moins 8 caracteres.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("ERREUR : DATABASE_URL non configure (.env.local).");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  const { rows } = await client.query("SELECT id, role FROM users WHERE email = $1", [email.toLowerCase()]);
  if (!rows.length) {
    console.error(`ERREUR : aucun compte avec l'email ${email}.`);
    process.exit(1);
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await client.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [hash, rows[0].id]);
  console.log(`Mot de passe mis a jour pour ${email} (role : ${rows[0].role}).`);
} finally {
  client.release();
  await pool.end();
}
