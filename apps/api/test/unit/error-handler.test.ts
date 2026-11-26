import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';

describe('Global Fastify setErrorHandler RFC 9457 4xx mapping (MVP-04A D4, A13)', () => {
  it('maps native Fastify 415 Unsupported Media Type to application/problem+json with status 415', async () => {
    const app = buildApp({ checkDatabaseHealth: async () => true });
    app.post('/__test-json', async () => ({ ok: true }));

    const response = await app.inject({
      method: 'POST',
      url: '/__test-json',
      headers: { 'content-type': 'application/xml' },
      payload: '<secret>lactose</secret>',
    });

    expect(response.statusCode).toBe(415);
    expect(response.headers['content-type']).toContain('application/problem+json');
    const body = response.json();
    expect(body.status).toBe(415);
    expect(body.type).toBe('unsupported-media-type');
    // A13: never echo request body fragments in error payloads.
    expect(JSON.stringify(body)).not.toContain('lactose');

    await app.close();
  });

  it('maps native Fastify 413 Payload Too Large to application/problem+json with status 413', async () => {
    const app = buildApp({ checkDatabaseHealth: async () => true });
    app.post('/__test-small', { bodyLimit: 16 }, async () => ({ ok: true }));

    const response = await app.inject({
      method: 'POST',
      url: '/__test-small',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ data: 'amendoim'.repeat(10) }),
    });

    expect(response.statusCode).toBe(413);
    expect(response.headers['content-type']).toContain('application/problem+json');
    const body = response.json();
    expect(body.status).toBe(413);
    expect(body.type).toBe('payload-too-large');
    expect(JSON.stringify(body)).not.toContain('amendoim');

    await app.close();
  });
});
