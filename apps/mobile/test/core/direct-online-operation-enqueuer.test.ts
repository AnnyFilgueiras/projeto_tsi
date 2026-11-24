import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { LOCAL_MIGRATIONS } from '../../src/core/local-db/migrations';
import { runMigrations } from '../../src/core/local-db/migrator';
import { createFetchHttpClient } from '../../src/core/network/fetch-http-client-adapter';
import { SessionExpiredError } from '../../src/core/network/http-errors';
import { createDirectOnlineOperationEnqueuer } from '../../src/core/sync/direct-online-operation-enqueuer-adapter';
import type { LocalOperationProjectors } from '../../src/core/sync/local-operation-projector';
import type { OperationRequest } from '../../src/core/sync/operation-enqueuer';
import { createFakeFetch, offlineFetch, type FakeReply } from '../support/fake-fetch';
import { createFakeLocalDatabase, type FakeLocalDatabase } from '../support/fake-local-database';
import { createFakeTokenStore, tokenPair } from '../support/fake-token-store';

const OP_ID = '0192f0a0-0000-7000-8000-000000000001';
const DISH_ID = '11111111-1111-4111-8111-111111111111';
const NOW = new Date('2026-11-23T12:00:00.000Z');
const SYNC = 'POST /v1/sync/operations';

const rating: OperationRequest = {
  type: 'rating.register',
  payload: { dishId: DISH_ID, score: 5 },
};

// Projector standing in for a feature's local write (MVP-04F registers the real one).
const projectors: LocalOperationProjectors = {
  'rating.register': async (tx, operation) => {
    if (operation.type !== 'rating.register') return;
    await tx.execute(
      'INSERT INTO ratings_local (id, dish_id, data, rated_on) VALUES (?, ?, ?, ?)',
      [operation.opId, operation.payload.dishId, JSON.stringify(operation.payload), '2026-11-23'],
    );
  },
};

function confirmed(unlocks = {}): FakeReply {
  return {
    status: 200,
    body: {
      results: [{ opId: OP_ID, status: 'confirmed', repeated: false, unlocks }],
      minPackageVersion: '1.0.0',
    },
  };
}

describe('DirectOnlineOperationEnqueuer (ADR-008 Stage 1, P04)', () => {
  let db: FakeLocalDatabase;

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await runMigrations(db, LOCAL_MIGRATIONS);
  });

  afterEach(() => db.close());

  function enqueuer(
    fetchImpl: typeof fetch,
    overrides: Partial<{ projectors: LocalOperationProjectors }> = {},
  ) {
    const http = createFetchHttpClient({
      baseUrl: 'http://api.test',
      fetch: fetchImpl,
      tokenStore: createFakeTokenStore(tokenPair('1')),
      packageVersion: PACKAGE_VERSION,
      now: () => NOW,
    });
    return createDirectOnlineOperationEnqueuer({
      http,
      localDatabase: db,
      projectors: overrides.projectors ?? projectors,
      newOperationId: () => OP_ID,
      now: () => NOW,
    });
  }

  const localRatings = () => db.rows('SELECT id FROM ratings_local');
  const localUnlocks = () => db.rows('SELECT kind, target_id FROM unlocks_local ORDER BY kind');

  it('sends one operation with a generated opId and the client timestamp', async () => {
    const fake = createFakeFetch({ [SYNC]: () => confirmed() });

    const result = await enqueuer(fake.fetch).enqueue(rating);

    expect(fake.requests[0]?.body).toEqual({
      operations: [
        {
          opId: OP_ID,
          type: 'rating.register',
          createdAt: NOW.toISOString(),
          payload: { dishId: DISH_ID, score: 5 },
        },
      ],
    });
    expect(result.opId).toBe(OP_ID);
  });

  it('reuses the opId and createdAt of a retried operation (idempotency key)', async () => {
    const fake = createFakeFetch({ [SYNC]: () => confirmed() });
    const retry: OperationRequest = {
      ...rating,
      opId: OP_ID,
      createdAt: '2026-11-20T08:00:00.000Z',
    };

    await enqueuer(fake.fetch).enqueue(retry);

    expect(fake.requests[0]?.body).toMatchObject({
      operations: [{ opId: OP_ID, createdAt: '2026-11-20T08:00:00.000Z' }],
    });
  });

  it('updates the local copy and records unlocks once the server confirms', async () => {
    const fake = createFakeFetch({
      [SYNC]: () => confirmed({ evolutions: ['e1'], badgeAwards: ['b1'] }),
    });

    const result = await enqueuer(fake.fetch).enqueue(rating);

    expect(result).toMatchObject({
      status: 'confirmed',
      repeated: false,
      localCopy: 'updated',
      unlocks: { evolutions: ['e1'], badgeAwards: ['b1'] },
    });
    expect(localRatings()).toEqual([{ id: OP_ID }]);
    expect(localUnlocks()).toEqual([
      { kind: 'badge', target_id: 'b1' },
      { kind: 'evolution', target_id: 'e1' },
    ]);
  });

  it('returns a typed offline result with the operation to resend and leaves local data intact', async () => {
    const result = await enqueuer(offlineFetch).enqueue(rating);

    expect(result).toMatchObject({
      status: 'unavailable',
      reason: 'offline',
      opId: OP_ID,
      operation: { opId: OP_ID, createdAt: NOW.toISOString() },
    });
    expect(localRatings()).toEqual([]);
  });

  it('treats a 5xx as retryable without touching local data', async () => {
    const fake = createFakeFetch({ [SYNC]: () => ({ status: 503 }) });

    const result = await enqueuer(fake.fetch).enqueue(rating);

    expect(result).toMatchObject({ status: 'unavailable', reason: 'server-error' });
    expect(localRatings()).toEqual([]);
  });

  it('surfaces a per-operation rejection with its Problem and writes nothing', async () => {
    const problem = { type: 'business-rule', title: 'Prato bloqueado', status: 422 };
    const fake = createFakeFetch({
      [SYNC]: () => ({
        status: 200,
        body: {
          results: [{ opId: OP_ID, status: 'rejected', repeated: false, error: problem }],
          minPackageVersion: '1.0.0',
        },
      }),
    });

    const result = await enqueuer(fake.fetch).enqueue(rating);

    expect(result).toEqual({ status: 'rejected', opId: OP_ID, problem });
    expect(localRatings()).toEqual([]);
  });

  it('reports a stale local copy, with nothing half-written, when the projection fails', async () => {
    const fake = createFakeFetch({ [SYNC]: () => confirmed({ evolutions: ['e1'] }) });
    const failing: LocalOperationProjectors = {
      'rating.register': async (tx) => {
        await tx.execute("INSERT INTO meta_sync (key, value) VALUES ('partial', 'x')");
        throw new Error('disk full');
      },
    };

    const result = await enqueuer(fake.fetch, { projectors: failing }).enqueue(rating);

    expect(result).toMatchObject({ status: 'confirmed', localCopy: 'stale' });
    expect(db.rows('SELECT key FROM meta_sync')).toEqual([]);
    expect(localUnlocks()).toEqual([]);
  });

  it('propagates an expired session instead of masking it as offline', async () => {
    const fake = createFakeFetch({
      [SYNC]: () => ({ status: 401 }),
      'POST /v1/sessions/refresh': () => ({ status: 401 }),
    });

    await expect(enqueuer(fake.fetch).enqueue(rating)).rejects.toBeInstanceOf(SessionExpiredError);
  });
});
