import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import {
  createTechnicalLogger,
  REDACTED_LOG_PATHS,
} from '../../src/support/technical-log/logger.js';

describe('technical logger redaction (A13, A05)', () => {
  it('redacts dietary restrictions, credentials, tokens, sync restriction payloads, and encryption material from log output', () => {
    const chunks: string[] = [];
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(String(chunk));
        callback();
      },
    });

    const logger = createTechnicalLogger('info', destination);
    logger.info(
      {
        req: {
          headers: { authorization: 'Bearer super-secret-jwt' },
          body: {
            refreshToken: 'body-refresh-secret',
            operations: [
              {
                opId: '11111111-1111-4111-8111-111111111111',
                type: 'restriction.register',
                payload: { restrictionType: 'castanha_caju', consentAt: '2026-11-21T12:00:00Z' },
              },
            ],
          },
        },
        password: 'my-password-123',
        refreshToken: 'refresh-secret',
        restrictions: ['amendoim', 'lactose'],
        restrictionType: 'peixe',
        jwtSecret: 'jwt-signing-key-secret',
        masterKey: 'aes-master-key-secret',
        payload: {
          restrictions: ['leite'],
          restrictionType: 'ovo',
          ciphertext: 'enc-bytes',
          encryptionKey: 'raw-aes-key',
        },
        reqBody: {
          nested: {
            restrictions: ['soja'],
            password: 'nested-password',
          },
        },
        safeField: 'visible-value',
      },
      'sanitization check',
    );

    const output = chunks.join('');
    expect(output).toContain('visible-value');
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('super-secret-jwt');
    expect(output).not.toContain('my-password-123');
    expect(output).not.toContain('refresh-secret');
    expect(output).not.toContain('body-refresh-secret');
    expect(output).not.toContain('amendoim');
    expect(output).not.toContain('lactose');
    expect(output).not.toContain('leite');
    expect(output).not.toContain('soja');
    expect(output).not.toContain('peixe');
    expect(output).not.toContain('ovo');
    expect(output).not.toContain('castanha_caju');
    expect(output).not.toContain('jwt-signing-key-secret');
    expect(output).not.toContain('aes-master-key-secret');
    expect(output).not.toContain('nested-password');
    expect(output).not.toContain('enc-bytes');
    expect(output).not.toContain('raw-aes-key');
    expect(REDACTED_LOG_PATHS).toContain('restrictions');
    expect(REDACTED_LOG_PATHS).toContain('restrictionType');
    expect(REDACTED_LOG_PATHS).toContain('req.headers.authorization');
  });
});
