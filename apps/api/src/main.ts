import { buildApp } from './app.js';
import { createDatabaseClient, DEFAULT_DEV_DATABASE_URL } from './db/client.js';
import { createTechnicalLogger } from './support/technical-log/logger.js';

const host = process.env.HOST ?? '0.0.0.0';
const port = Number(process.env.PORT ?? '3000');
const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DEV_DATABASE_URL;

const logger = createTechnicalLogger();
const dbClient = createDatabaseClient(databaseUrl, logger);
const app = buildApp({
  checkDatabaseHealth: dbClient.checkHealth,
  logger,
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  logger.info({ signal }, 'Shutting down API server');
  let exitCode = 0;
  try {
    await app.close();
  } catch (err: unknown) {
    logger.error({ err }, 'Error while closing Fastify server');
    exitCode = 1;
  } finally {
    try {
      await dbClient.close();
    } catch (err: unknown) {
      logger.error({ err }, 'Error while closing PostgreSQL pool');
      exitCode = 1;
    }
  }
  process.exit(exitCode);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

app.listen({ host, port }).catch(async (err: unknown) => {
  logger.error({ err }, 'Failed to start API server');
  await dbClient.close();
  process.exit(1);
});
