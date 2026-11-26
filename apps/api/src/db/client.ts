import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { Tx } from '../shared/tx.js';
import type { TechnicalLogger } from '../support/technical-log/logger.js';

export const DEFAULT_DEV_DATABASE_URL =
  'postgresql://panelada:panelada@localhost:5432/panelada_dev';

// pg >= 8 lets any of these URL parameters replace the explicit `ssl` option wholesale,
// which would silently drop the pinned CA, so they are removed when a CA is configured.
const SSL_URL_PARAMS = ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat'];

export interface PoolConfig {
  readonly connectionString: string;
  readonly ssl?: { readonly ca: string; readonly rejectUnauthorized: true };
}

/**
 * Builds the pg Pool connection settings. Local Docker Postgres has no TLS, so without
 * `DATABASE_SSL_CA` nothing changes. Supabase signs its certificate with its own CA, which is
 * not in Node's trust store: pinning it keeps full verification instead of disabling it.
 */
export function resolvePoolConfig(
  connectionString: string,
  env: NodeJS.ProcessEnv = process.env,
): PoolConfig {
  // Secret fields in hosting dashboards are often single-line, so accept literal "\n".
  const ca = env.DATABASE_SSL_CA?.trim().replace(/\\n/g, '\n');
  if (!ca) {
    return { connectionString };
  }

  const url = new URL(connectionString);
  for (const param of SSL_URL_PARAMS) {
    url.searchParams.delete(param);
  }

  return {
    connectionString: url.toString(),
    ssl: { ca, rejectUnauthorized: true },
  };
}

export interface DatabaseClient {
  readonly pool: pg.Pool;
  readonly db: NodePgDatabase;
  checkHealth(): Promise<boolean>;
  withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export function createDatabaseClient(
  connectionString: string,
  logger?: TechnicalLogger,
): DatabaseClient {
  const pool = new pg.Pool({
    ...resolvePoolConfig(connectionString),
    connectionTimeoutMillis: 5000,
  });

  // Prevent unhandled EventEmitter errors on idle client disconnects from crashing Node.
  pool.on('error', (err) => {
    logger?.error({ err }, 'Unexpected error on idle PostgreSQL pool client');
  });

  const db = drizzle(pool);

  return {
    pool,
    db,
    async checkHealth(): Promise<boolean> {
      try {
        await pool.query('SELECT 1');
        return true;
      } catch {
        return false;
      }
    },
    async withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
      return db.transaction(async (rawTx) => fn(rawTx as unknown as Tx));
    },
    async close(): Promise<void> {
      await pool.end();
    },
  };
}
