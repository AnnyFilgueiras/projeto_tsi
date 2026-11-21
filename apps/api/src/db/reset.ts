import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTechnicalLogger } from '../support/technical-log/logger.js';
import { createDatabaseClient, DEFAULT_DEV_DATABASE_URL } from './client.js';
import { runMigrations } from './migrate.js';
import { runSeed } from './seed.js';
import { assertResettableDatabaseUrl } from './test-guard.js';

/**
 * Recreates schemas from scratch, applies all Drizzle migrations, and runs the
 * idempotent development seed. Restricted to `*_dev` and `*_test` databases.
 */
export async function runReset(connectionString: string): Promise<void> {
  const safeUrl = assertResettableDatabaseUrl(connectionString);
  const client = createDatabaseClient(safeUrl);
  try {
    await client.pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE;');
    await client.pool.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.pool.query('CREATE SCHEMA public;');
  } finally {
    await client.close();
  }

  await runMigrations(safeUrl);
  await runSeed(safeUrl);
}

const isMainModule =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const logger = createTechnicalLogger();
  const connectionString = process.env.DATABASE_URL ?? DEFAULT_DEV_DATABASE_URL;
  runReset(connectionString)
    .then(() => {
      logger.info('Database reset completed');
    })
    .catch((err: unknown) => {
      logger.error({ err }, 'Database reset failed');
      process.exit(1);
    });
}
