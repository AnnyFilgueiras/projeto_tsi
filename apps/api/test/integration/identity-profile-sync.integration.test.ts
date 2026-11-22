import { randomBytes, randomUUID } from 'node:crypto';
import { Writable } from 'node:stream';
import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';
import { createDatabaseClient, type DatabaseClient } from '../../src/db/client.js';
import {
  DEFAULT_SEED_CURATOR_EMAIL,
  DEFAULT_SEED_CURATOR_PASSWORD,
  runSeed,
} from '../../src/db/seed.js';
import { InMemoryKeyProvider } from '../../src/support/field-encryption/index.js';
import { createTechnicalLogger } from '../../src/support/technical-log/logger.js';

describe('MVP-04A integration: identity, FieldCipher AES-256-GCM, encrypted profile, sync, and A13 logs (panelada_test)', () => {
  let dbClient: DatabaseClient;
  let databaseUrl: string;

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL must be initialized by integration setup.');
    }
    databaseUrl = url;
    dbClient = createDatabaseClient(databaseUrl);
    await runSeed(databaseUrl);
  });

  afterAll(async () => {
    await dbClient.close();
  });

  it('A02 / A05 / RN09 / P05: runs full anonymous -> preferences -> encrypted restriction register -> idempotent replay -> key-reused 422 -> physical revoke flow', async () => {
    const rawAesKey = randomBytes(32);
    const keyBase64 = rawAesKey.toString('base64');
    const keyHex = rawAesKey.toString('hex');
    const logChunks: string[] = [];
    const logStream = new Writable({
      write(chunk, _encoding, callback) {
        logChunks.push(String(chunk));
        callback();
      },
    });

    const app = buildApp({
      checkDatabaseHealth: dbClient.checkHealth,
      dbClient,
      keyProvider: new InMemoryKeyProvider({ currentVersion: 1, keys: { 1: rawAesKey } }),
      logger: createTechnicalLogger('debug', logStream),
    });

    try {
      // 1. Anonymous account creation (POST /v1/accounts/anonymous)
      const anonRes = await app.inject({
        method: 'POST',
        url: '/v1/accounts/anonymous',
      });
      expect(anonRes.statusCode).toBe(201);
      const anonBody = anonRes.json() as {
        accountId: string;
        tokens: {
          accessToken: string;
          expiresAt: string;
          refreshToken: string;
          refreshExpiresAt: string;
        };
      };
      expect(anonBody.accountId).toMatch(/^[0-9a-f-]{36}$/i);

      const authHeader = { authorization: `Bearer ${anonBody.tokens.accessToken}` };

      // Verify profile_users row was created atomically with the account (T01).
      const profileRows = await dbClient.pool.query<{ id: string }>(
        'SELECT id FROM profile_users WHERE id = $1',
        [anonBody.accountId],
      );
      expect(profileRows.rows).toHaveLength(1);

      // 2. Preferences update (PUT /v1/profile/preferences)
      const unauthPrefRes = await app.inject({
        method: 'PUT',
        url: '/v1/profile/preferences',
        payload: { cuisineIds: [] },
      });
      expect(unauthPrefRes.statusCode).toBe(401);
      expect(unauthPrefRes.headers['content-type']).toContain('application/problem+json');
      expect(unauthPrefRes.json()).toMatchObject({ type: 'unauthenticated', status: 401 });

      const cuisineId = randomUUID();
      const prefRes = await app.inject({
        method: 'PUT',
        url: '/v1/profile/preferences',
        headers: authHeader,
        payload: { cuisineIds: [cuisineId, cuisineId] },
      });
      expect(prefRes.statusCode).toBe(204);

      const updatedProfile = await dbClient.pool.query<{ culinary_preferences: string[] }>(
        'SELECT culinary_preferences FROM profile_users WHERE id = $1',
        [anonBody.accountId],
      );
      expect(updatedProfile.rows[0]?.culinary_preferences).toEqual([cuisineId]);

      // 3. Register dietary restriction (`amendoim`) via POST /v1/sync/operations
      const registerOpId = randomUUID();
      const registerOp = {
        opId: registerOpId,
        type: 'restriction.register',
        createdAt: '2026-11-21T15:00:00.000Z',
        payload: {
          restrictionType: 'amendoim',
          consentAt: '2026-11-21T15:00:00.000Z',
        },
      };

      const regRes = await app.inject({
        method: 'POST',
        url: '/v1/sync/operations',
        headers: authHeader,
        payload: { operations: [registerOp] },
      });
      expect(regRes.statusCode).toBe(200);
      expect(regRes.json()).toEqual({
        results: [{ opId: registerOpId, status: 'confirmed', repeated: false }],
        minPackageVersion: PACKAGE_VERSION,
      });

      // A05 check: PostgreSQL `profile_restrictions` row must NOT contain "amendoim" in plaintext.
      const dbRestrictions = await dbClient.pool.query<{
        encrypted_type: string;
        iv: string;
        auth_tag: string;
        key_version: number;
      }>(
        'SELECT encrypted_type, iv, auth_tag, key_version FROM profile_restrictions WHERE user_id = $1',
        [anonBody.accountId],
      );
      expect(dbRestrictions.rows).toHaveLength(1);
      expect(JSON.stringify(dbRestrictions.rows[0])).not.toContain('amendoim');
      expect(dbRestrictions.rows[0]?.key_version).toBe(1);

      // A05 / P05 check: `sync_processed_operations` must not store plaintext restriction payload either.
      const dbSyncOps = await dbClient.pool.query(
        'SELECT * FROM sync_processed_operations WHERE account_id = $1 AND op_id = $2',
        [anonBody.accountId, registerOpId],
      );
      expect(dbSyncOps.rows).toHaveLength(1);
      expect(JSON.stringify(dbSyncOps.rows[0])).not.toContain('amendoim');

      // 4. Idempotent replay (same opId + same payload -> repeated: true, no duplicate row).
      const replayRes = await app.inject({
        method: 'POST',
        url: '/v1/sync/operations',
        headers: authHeader,
        payload: { operations: [registerOp] },
      });
      expect(replayRes.statusCode).toBe(200);
      expect(replayRes.json()).toEqual({
        results: [{ opId: registerOpId, status: 'confirmed', repeated: true }],
        minPackageVersion: PACKAGE_VERSION,
      });

      // 5. Same opId + different payload -> 422 `key-reused` per item.
      const reusedRes = await app.inject({
        method: 'POST',
        url: '/v1/sync/operations',
        headers: authHeader,
        payload: {
          operations: [
            {
              ...registerOp,
              payload: {
                restrictionType: 'lactose',
                consentAt: '2026-11-21T15:00:00.000Z',
              },
            },
          ],
        },
      });
      expect(reusedRes.statusCode).toBe(200);
      expect(reusedRes.json()).toMatchObject({
        results: [
          {
            opId: registerOpId,
            status: 'rejected',
            repeated: false,
            error: {
              type: 'key-reused',
              status: 422,
            },
          },
        ],
        minPackageVersion: PACKAGE_VERSION,
      });

      // 6. Batch > 100 operations returns HTTP 413 `batch-too-large`.
      const oversizedBatch = Array.from({ length: 101 }, () => ({
        opId: randomUUID(),
        type: 'restriction.revoke',
        createdAt: '2026-11-21T15:01:00.000Z',
        payload: { restrictionType: 'amendoim' },
      }));
      const tooLargeRes = await app.inject({
        method: 'POST',
        url: '/v1/sync/operations',
        headers: authHeader,
        payload: { operations: oversizedBatch },
      });
      expect(tooLargeRes.statusCode).toBe(413);
      expect(tooLargeRes.headers['content-type']).toContain('application/problem+json');
      expect(tooLargeRes.json()).toMatchObject({ type: 'batch-too-large', status: 413 });

      // 7. Physical revocation (RN09 / ADR-006): row is physically deleted from profile_restrictions.
      const revokeOpId = randomUUID();
      const revokeRes = await app.inject({
        method: 'POST',
        url: '/v1/sync/operations',
        headers: authHeader,
        payload: {
          operations: [
            {
              opId: revokeOpId,
              type: 'restriction.revoke',
              createdAt: '2026-11-21T15:05:00.000Z',
              payload: { restrictionType: 'amendoim' },
            },
          ],
        },
      });
      expect(revokeRes.statusCode).toBe(200);
      expect(revokeRes.json()).toEqual({
        results: [{ opId: revokeOpId, status: 'confirmed', repeated: false }],
        minPackageVersion: PACKAGE_VERSION,
      });

      const afterRevoke = await dbClient.pool.query(
        'SELECT id FROM profile_restrictions WHERE user_id = $1',
        [anonBody.accountId],
      );
      expect(afterRevoke.rows).toHaveLength(0);

      // 8. Trigger validation & domain errors with sensitive values to verify A13 log scrubbing.
      const invalidSyncRes = await app.inject({
        method: 'POST',
        url: '/v1/sync/operations',
        headers: authHeader,
        payload: {
          operations: [
            {
              opId: randomUUID(),
              type: 'restriction.register',
              createdAt: '2026-11-21T15:06:00.000Z',
              payload: { restrictionType: 'amendoim_invalido_a13' },
            },
          ],
        },
      });
      expect(invalidSyncRes.statusCode).toBe(200);
      expect(invalidSyncRes.json()).toMatchObject({
        results: [{ status: 'rejected', error: { status: 422 } }],
      });

      const badRefreshRes = await app.inject({
        method: 'POST',
        url: '/v1/sessions/refresh',
        payload: { refreshToken: 'refresh-secret-value-for-a13-check' },
      });
      expect(badRefreshRes.statusCode).toBe(401);

      const badValidationRes = await app.inject({
        method: 'POST',
        url: '/v1/sessions/refresh',
        payload: { refreshToken: '' },
      });
      expect(badValidationRes.statusCode).toBe(400);
      expect(badValidationRes.headers['content-type']).toContain('application/problem+json');
      expect(badValidationRes.json()).toMatchObject({ type: 'validation', status: 400 });

      // A13 verification: zero leaks of restrictions, refresh tokens, access tokens, or AES key.
      const allLogs = logChunks.join('');
      expect(allLogs.length).toBeGreaterThan(0);
      expect(allLogs).not.toContain('amendoim');
      expect(allLogs).not.toContain('amendoim_invalido_a13');
      expect(allLogs).not.toContain('lactose');
      expect(allLogs).not.toContain(anonBody.tokens.refreshToken);
      expect(allLogs).not.toContain(anonBody.tokens.accessToken);
      expect(allLogs).not.toContain('refresh-secret-value-for-a13-check');
      expect(allLogs).not.toContain(keyBase64);
      expect(allLogs).not.toContain(keyHex);
    } finally {
      await app.close();
    }
  });

  it('ADR-007 / ADR-008: verifies refresh rotation, 60s tolerance, family revocation after 60s, sign-out, and seeded curator sign-in with rate limiting', async () => {
    let now = new Date('2026-11-21T16:00:00.000Z');
    const app = buildApp({
      checkDatabaseHealth: dbClient.checkHealth,
      dbClient,
      clock: () => now,
      rateLimitConfig: { signInMaxAttempts: 3, signInWindowMs: 60_000 },
      logger: createTechnicalLogger('silent'),
    });

    try {
      const anonRes = await app.inject({ method: 'POST', url: '/v1/accounts/anonymous' });
      expect(anonRes.statusCode).toBe(201);
      const { tokens: initialTokens } = anonRes.json() as {
        tokens: { accessToken: string; refreshToken: string };
      };

      // Rotate refresh token at t = +5s.
      now = new Date('2026-11-21T16:00:05.000Z');
      const refresh1 = await app.inject({
        method: 'POST',
        url: '/v1/sessions/refresh',
        payload: { refreshToken: initialTokens.refreshToken },
      });
      expect(refresh1.statusCode).toBe(200);
      const rotatedTokens = refresh1.json() as { accessToken: string; refreshToken: string };
      expect(rotatedTokens.refreshToken).not.toBe(initialTokens.refreshToken);

      // Re-send old refresh token within 60 s -> returns exact same TokenPair.
      now = new Date('2026-11-21T16:00:50.000Z');
      const withinGrace = await app.inject({
        method: 'POST',
        url: '/v1/sessions/refresh',
        payload: { refreshToken: initialTokens.refreshToken },
      });
      expect(withinGrace.statusCode).toBe(200);
      expect(withinGrace.json()).toEqual(rotatedTokens);

      // Replay old refresh token after 60 s -> 401 invalid-refresh and revokes entire family.
      now = new Date('2026-11-21T16:01:06.000Z');
      const replayAfterGrace = await app.inject({
        method: 'POST',
        url: '/v1/sessions/refresh',
        payload: { refreshToken: initialTokens.refreshToken },
      });
      expect(replayAfterGrace.statusCode).toBe(401);
      expect(replayAfterGrace.json()).toMatchObject({ type: 'invalid-refresh', status: 401 });

      // Rotated successor must also be revoked now.
      const revokedSuccessor = await app.inject({
        method: 'POST',
        url: '/v1/sessions/refresh',
        payload: { refreshToken: rotatedTokens.refreshToken },
      });
      expect(revokedSuccessor.statusCode).toBe(401);
      expect(revokedSuccessor.json()).toMatchObject({ type: 'invalid-refresh', status: 401 });

      // Seeded curator sign-in + sign-out + rate limiting.
      const curatorSignIn = await app.inject({
        method: 'POST',
        url: '/v1/sessions/sign-in',
        payload: {
          email: DEFAULT_SEED_CURATOR_EMAIL,
          password: DEFAULT_SEED_CURATOR_PASSWORD,
        },
      });
      expect(curatorSignIn.statusCode).toBe(200);
      const curatorSession = curatorSignIn.json() as {
        accountId: string;
        tokens: { accessToken: string; refreshToken: string };
      };

      const signOutRes = await app.inject({
        method: 'POST',
        url: '/v1/sessions/sign-out',
        headers: { authorization: `Bearer ${curatorSession.tokens.accessToken}` },
      });
      expect(signOutRes.statusCode).toBe(204);

      const postSignOutRefresh = await app.inject({
        method: 'POST',
        url: '/v1/sessions/refresh',
        payload: { refreshToken: curatorSession.tokens.refreshToken },
      });
      expect(postSignOutRefresh.statusCode).toBe(401);

      // Verify seeded restriction types catalog has all 19 controlled entries.
      const restrictionTypesCount = await dbClient.pool.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM profile_restriction_types',
      );
      expect(Number(restrictionTypesCount.rows[0]?.count)).toBe(19);

      // Rate limit check (limit = 3; 1 already consumed above for this email+IP -> 2 more allowed, 4th returns 429).
      const attempt2 = await app.inject({
        method: 'POST',
        url: '/v1/sessions/sign-in',
        payload: { email: DEFAULT_SEED_CURATOR_EMAIL, password: 'wrong-password-1' },
      });
      expect(attempt2.statusCode).toBe(401);

      const attempt3 = await app.inject({
        method: 'POST',
        url: '/v1/sessions/sign-in',
        payload: { email: DEFAULT_SEED_CURATOR_EMAIL, password: 'wrong-password-2' },
      });
      expect(attempt3.statusCode).toBe(401);

      const attempt4 = await app.inject({
        method: 'POST',
        url: '/v1/sessions/sign-in',
        payload: { email: DEFAULT_SEED_CURATOR_EMAIL, password: 'wrong-password-3' },
      });
      expect(attempt4.statusCode).toBe(429);
      expect(attempt4.headers['retry-after']).toBeDefined();
      expect(attempt4.json()).toMatchObject({ type: 'rate-limit-exceeded', status: 429 });
    } finally {
      await app.close();
    }
  });
});
