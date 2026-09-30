import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

const globalForDb = globalThis as unknown as { fabiolePool?: Pool };

function getPool(): Pool {
  // Évaluation paresseuse : l'import du module ne doit jamais casser le
  // build (la collecte des routes s'exécute sans variables d'environnement).
  // L'erreur n'est levée qu'à la première requête réelle.
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_NOT_CONFIGURED");
  if (!globalForDb.fabiolePool) {
    globalForDb.fabiolePool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return globalForDb.fabiolePool;
}

// Client paresseux : chaque appel est délégué au pool réel, créé à la demande.
const lazyClient = new Proxy({} as Pool, {
  get(_target, prop) {
    const target = getPool() as unknown as Record<PropertyKey, unknown>;
    const value = target[prop];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(target)
      : value;
  },
});

export const db = drizzle({ client: lazyClient, schema });
