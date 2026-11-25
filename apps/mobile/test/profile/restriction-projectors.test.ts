import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { LOCAL_MIGRATIONS } from '../../src/core/local-db/migrations';
import { runMigrations } from '../../src/core/local-db/migrator';
import { createFetchHttpClient } from '../../src/core/network/fetch-http-client-adapter';
import { createDirectOnlineOperationEnqueuer } from '../../src/core/sync/direct-online-operation-enqueuer-adapter';
import { restrictionProjectors } from '../../src/features/profile/data/restriction-repository';
import { createFakeFetch, offlineFetch, type FakeReply } from '../support/fake-fetch';
import { createFakeLocalDatabase, type FakeLocalDatabase } from '../support/fake-local-database';
import { createFakeTokenStore, tokenPair } from '../support/fake-token-store';

const OP_ID = '0192f0a0-0000-7000-8000-000000000077';
const NOW = new Date('2026-11-24T14:05:00.000Z');
const CONSENT_AT = '2026-11-24T14:04:30.000Z';
const SYNC = 'POST /v1/sync/operations';

const reply = (status: 'confirmed' | 'rejected'): FakeReply => ({
  status: 200,
  body: {
    results: [
      status === 'confirmed'
        ? { opId: OP_ID, status, repeated: false, unlocks: {} }
        : { opId: OP_ID, status, error: { type: 'about:blank', title: 'x', status: 422 } },
    ],
    minPackageVersion: '1.0.0',
  },
});

describe('restriction projectors (RN09, ADR-008: local copy only after the server confirms)', () => {
  let db: FakeLocalDatabase;

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await runMigrations(db, LOCAL_MIGRATIONS);
  });

  afterEach(() => db.close());

  function enqueuer(fetchImpl: typeof fetch) {
    return createDirectOnlineOperationEnqueuer({
      http: createFetchHttpClient({
        baseUrl: 'http://api.test',
        fetch: fetchImpl,
        tokenStore: createFakeTokenStore(tokenPair('1')),
        packageVersion: PACKAGE_VERSION,
        now: () => NOW,
      }),
      localDatabase: db,
      projectors: restrictionProjectors,
      newOperationId: () => OP_ID,
      now: () => NOW,
    });
  }

  const register = {
    type: 'restriction.register',
    payload: { restrictionType: 'amendoim', consentAt: CONSENT_AT },
  } as const;
  const localRestrictions = () =>
    db.rows('SELECT restriction_type, consent_at FROM restrictions_local');

  it('stores the restriction with its consentAt once the server confirms', async () => {
    const fake = createFakeFetch({ [SYNC]: () => reply('confirmed') });

    const result = await enqueuer(fake.fetch).enqueue(register);

    expect(result.status).toBe('confirmed');
    expect(localRestrictions()).toEqual([{ restriction_type: 'amendoim', consent_at: CONSENT_AT }]);
  });

  it('writes nothing while offline', async () => {
    const result = await enqueuer(offlineFetch).enqueue(register);

    expect(result.status).toBe('unavailable');
    expect(localRestrictions()).toEqual([]);
  });

  it('writes nothing when the server rejects', async () => {
    const fake = createFakeFetch({ [SYNC]: () => reply('rejected') });

    await enqueuer(fake.fetch).enqueue(register);

    expect(localRestrictions()).toEqual([]);
  });

  it('keeps one row per code and refreshes consentAt on a repeated register', async () => {
    await db.execute(
      "INSERT INTO restrictions_local (restriction_type, consent_at) VALUES ('amendoim', '2026-01-01T00:00:00.000Z')",
    );
    const fake = createFakeFetch({ [SYNC]: () => reply('confirmed') });

    await enqueuer(fake.fetch).enqueue(register);

    expect(localRestrictions()).toEqual([{ restriction_type: 'amendoim', consent_at: CONSENT_AT }]);
  });

  it('removes the restriction on a confirmed revoke', async () => {
    await db.execute(
      "INSERT INTO restrictions_local (restriction_type, consent_at) VALUES ('amendoim', ?)",
      [CONSENT_AT],
    );
    const fake = createFakeFetch({ [SYNC]: () => reply('confirmed') });

    await enqueuer(fake.fetch).enqueue({
      type: 'restriction.revoke',
      payload: { restrictionType: 'amendoim' },
    });

    expect(localRestrictions()).toEqual([]);
  });
});
