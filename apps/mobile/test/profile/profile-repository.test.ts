import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { LOCAL_MIGRATIONS } from '../../src/core/local-db/migrations';
import { runMigrations } from '../../src/core/local-db/migrator';
import { createFetchHttpClient } from '../../src/core/network/fetch-http-client-adapter';
import { createDirectOnlineOperationEnqueuer } from '../../src/core/sync/direct-online-operation-enqueuer-adapter';
import { createProfileRepository } from '../../src/features/profile/data/profile-repository';
import { restrictionProjectors } from '../../src/features/profile/data/restriction-repository';
import { createRevokeRestriction } from '../../src/features/profile/domain/revoke-restriction';
import { createFakeFetch } from '../support/fake-fetch';
import { createFakeLocalDatabase, type FakeLocalDatabase } from '../support/fake-local-database';
import { createFakeTokenStore, tokenPair } from '../support/fake-token-store';

const OP_ID = '0192f0a0-0000-7000-8000-000000000078';
const NOW = new Date('2026-11-24T14:05:00.000Z');

describe('ProfileRepository (local profile snapshot)', () => {
  let db: FakeLocalDatabase;

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await runMigrations(db, LOCAL_MIGRATIONS);
  });

  afterEach(() => db.close());

  it('reads an empty profile before onboarding', async () => {
    await expect(createProfileRepository(db).read()).resolves.toEqual({
      restrictions: [],
      consentAt: null,
      preferences: [],
      lastSyncAt: null,
    });
  });

  it('reads restrictions, the first consent, preferences and the last sync', async () => {
    await db.execute(
      `INSERT INTO restrictions_local (restriction_type, consent_at) VALUES
       ('leite', '2026-11-24T15:00:00.000Z'), ('amendoim', '2026-11-23T14:05:00.000Z')`,
    );
    await db.execute(
      `INSERT INTO profile_local (id, culinary_preferences) VALUES (1, '["c-1","c-2"]')`,
    );
    await db.execute(
      `INSERT INTO meta_sync (key, value) VALUES ('lastSyncAt', '2026-11-24T14:32:00.000Z')`,
    );

    await expect(createProfileRepository(db).read()).resolves.toEqual({
      restrictions: ['amendoim', 'leite'],
      consentAt: new Date('2026-11-23T14:05:00.000Z'),
      preferences: ['c-1', 'c-2'],
      lastSyncAt: new Date('2026-11-24T14:32:00.000Z'),
    });
  });

  it('keeps the other restriction and the consent when one of two is revoked', async () => {
    await db.execute(
      `INSERT INTO restrictions_local (restriction_type, consent_at)
       VALUES ('amendoim', '2026-11-23T14:05:00.000Z'), ('soja', '2026-11-23T14:05:00.000Z')`,
    );

    await expect(
      createRevokeRestriction({ enqueuer: confirmingEnqueuer() })({ code: 'amendoim' }),
    ).resolves.toEqual({ status: 'removed' });

    const profile = await createProfileRepository(db).read();
    expect(profile.restrictions).toEqual(['soja']);
    expect(profile.consentAt).toEqual(new Date('2026-11-23T14:05:00.000Z'));
  });

  it('has no consent on record after the last restriction is revoked (RN09)', async () => {
    await db.execute(
      `INSERT INTO restrictions_local (restriction_type, consent_at)
       VALUES ('amendoim', '2026-11-23T14:05:00.000Z')`,
    );

    await expect(
      createRevokeRestriction({ enqueuer: confirmingEnqueuer() })({ code: 'amendoim' }),
    ).resolves.toEqual({ status: 'removed' });

    const profile = await createProfileRepository(db).read();
    expect(profile.restrictions).toEqual([]);
    expect(profile.consentAt).toBeNull();
  });

  /** Online enqueuer whose server confirms every operation, so the projector applies it. */
  function confirmingEnqueuer() {
    return createDirectOnlineOperationEnqueuer({
      http: createFetchHttpClient({
        baseUrl: 'http://api.test',
        fetch: createFakeFetch({
          'POST /v1/sync/operations': () => ({
            status: 200,
            body: {
              results: [{ opId: OP_ID, status: 'confirmed', repeated: false, unlocks: {} }],
              minPackageVersion: '1.0.0',
            },
          }),
        }).fetch,
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
});
