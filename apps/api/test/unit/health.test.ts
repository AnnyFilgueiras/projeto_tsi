import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';
import { createTechnicalLogger } from '../../src/support/technical-log/logger.js';

describe('GET /v1/health (OpenAPI System contract)', () => {
  it('returns 200 OK with API version and allergen package version when database is healthy', async () => {
    const app = buildApp({
      checkDatabaseHealth: async () => true,
      logger: createTechnicalLogger('silent'),
      apiVersion: '0.1.0',
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

  it('returns 503 RFC 9457 Problem Details when database connectivity check returns false', async () => {
    const app = buildApp({
      checkDatabaseHealth: async () => false,
      logger: createTechnicalLogger('silent'),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/health',
    });

    expect(response.statusCode).toBe(503);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toMatchObject({
      type: 'service-unavailable',
      status: 503,
    });

    await app.close();
  });

  it('returns 503 RFC 9457 Problem Details when database check throws', async () => {
    const app = buildApp({
      checkDatabaseHealth: async () => {
        throw new Error('ECONNREFUSED');
      },
      logger: createTechnicalLogger('silent'),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/health',
    });

    expect(response.statusCode).toBe(503);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toMatchObject({
      type: 'service-unavailable',
      status: 503,
    });

    await app.close();
  });
});
