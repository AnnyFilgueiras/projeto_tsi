import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';
import { createDatabaseClient, type DatabaseClient } from '../../src/db/client.js';
import { createTechnicalLogger } from '../../src/support/technical-log/logger.js';

describe('GET /v1/health integration against PostgreSQL (panelada_test)', () => {
  let dbClient: DatabaseClient;

  beforeAll(() => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL must be initialized by integration setup.');
    }
    dbClient = createDatabaseClient(databaseUrl);
  });

  afterAll(async () => {
    await dbClient.close();
  });

  it('verifies real database connectivity in UTC and returns 200 OK', async () => {
    const tzResult = await dbClient.pool.query<{ tz: string }>(
      "SELECT current_setting('TIMEZONE') AS tz",
    );
    expect(tzResult.rows[0]?.tz).toBe('UTC');

    const app = buildApp({
      checkDatabaseHealth: dbClient.checkHealth,
      logger: createTechnicalLogger('silent'),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      version: '0.1.0',
      allergenPackageVersion: PACKAGE_VERSION,
    });

    await app.close();
  });
});
