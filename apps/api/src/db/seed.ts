import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTechnicalLogger } from '../support/technical-log/logger.js';
import { createDatabaseClient, DEFAULT_DEV_DATABASE_URL } from './client.js';

/**
 * Deterministic, idempotent development seed entrypoint.
 *
 * MVP-02 establishes the pipeline; each vertical feature slice (MVP-04A+)
 * extends this function with idempotent fixtures (`ON CONFLICT DO NOTHING`)
 * in the same PR.
 */
export async function runSeed(connectionString: string): Promise<void> {
  const client = createDatabaseClient(connectionString);
  try {
    const healthy = await client.checkHealth();
    if (!healthy) {
      throw new Error('Database connectivity check failed during seed.');
    }
  } finally {
    await client.close();
  }
}

const isMainModule =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const logger = createTechnicalLogger();
  const connectionString = process.env.DATABASE_URL ?? DEFAULT_DEV_DATABASE_URL;
  runSeed(connectionString)
    .then(() => {
      logger.info('Database seed completed (idempotent baseline)');
    })
    .catch((err: unknown) => {
      logger.error({ err }, 'Database seed failed');
      process.exit(1);
    });
}
