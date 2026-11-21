import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { Tx } from '../shared/tx.js';
import type { TechnicalLogger } from '../support/technical-log/logger.js';

export const DEFAULT_DEV_DATABASE_URL =
  'postgresql://panelada:panelada@localhost:5432/panelada_dev';

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
    connectionString,
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
