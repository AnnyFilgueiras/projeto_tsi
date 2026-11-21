import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createTechnicalLogger } from '../support/technical-log/logger.js';
import { createDatabaseClient, DEFAULT_DEV_DATABASE_URL } from './client.js';

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../drizzle',
);

export async function runMigrations(connectionString: string): Promise<void> {
  const client = createDatabaseClient(connectionString);
  try {
    await migrate(client.db, { migrationsFolder });
  } finally {
    await client.close();
  }
}

const isMainModule =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const logger = createTechnicalLogger();
  const connectionString = process.env.DATABASE_URL ?? DEFAULT_DEV_DATABASE_URL;
  runMigrations(connectionString)
    .then(() => {
      logger.info({ migrationsFolder }, 'Database migrations applied');
    })
    .catch((err: unknown) => {
      logger.error({ err }, 'Database migration failed');
      process.exit(1);
    });
}
