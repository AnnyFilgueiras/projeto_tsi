import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { LOCAL_MIGRATIONS } from '../../src/core/local-db/migrations';
import { runMigrations } from '../../src/core/local-db/migrator';
import { createFetchHttpClient } from '../../src/core/network/fetch-http-client-adapter';
import { createPreferencesRepository } from '../../src/features/profile/data/preferences-repository';
import { createSaveCulinaryPreferences } from '../../src/features/profile/domain/save-culinary-preferences';
import { createFakeFetch, offlineFetch } from '../support/fake-fetch';
import { createFakeLocalDatabase, type FakeLocalDatabase } from '../support/fake-local-database';
import { createFakeTokenStore, tokenPair } from '../support/fake-token-store';

const PUT = 'PUT /v1/profile/preferences';
const FR = '00000000-0000-4000-8000-0000000000f1';
const TH = '00000000-0000-4000-8000-0000000000f2';

describe('Culinary preferences (RN10)', () => {
  let db: FakeLocalDatabase;

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await runMigrations(db, LOCAL_MIGRATIONS);
  });

  afterEach(() => db.close());

  function repository(fetchImpl: typeof fetch) {
    return createPreferencesRepository({
      http: createFetchHttpClient({
        baseUrl: 'http://api.test',
        fetch: fetchImpl,
        tokenStore: createFakeTokenStore(tokenPair('1')),
        packageVersion: PACKAGE_VERSION,
        now: () => new Date('2026-11-24T14:05:00.000Z'),
      }),
      localDatabase: db,
    });
  }

  const localPreferences = () =>
    db.rows<{ culinary_preferences: string }>('SELECT culinary_preferences FROM profile_local');

  it('sends the chosen cuisines and stores them locally only after the 2xx', async () => {
    const fake = createFakeFetch({ [PUT]: () => ({ status: 204 }) });

    const result = await repository(fake.fetch).save([FR, TH]);

    expect(result).toBe('saved');
    expect(fake.requests[0]?.body).toEqual({ cuisineIds: [FR, TH] });
    expect(localPreferences()).toEqual([{ culinary_preferences: JSON.stringify([FR, TH]) }]);
  });

  it('keeps onboarded_at when it saves preferences', async () => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-24')");
    const fake = createFakeFetch({ [PUT]: () => ({ status: 204 }) });

    await repository(fake.fetch).save([FR]);

    expect(db.rows('SELECT onboarded_at FROM profile_local')).toEqual([
      { onboarded_at: '2026-11-24' },
    ]);
  });

  it.each([
    ['offline', offlineFetch],
    ['5xx', createFakeFetch({ [PUT]: () => ({ status: 503 }) }).fetch],
  ])('reports unavailable and changes nothing locally when %s', async (_, fetchImpl) => {
    expect(await repository(fetchImpl).save([FR])).toBe('unavailable');
    expect(localPreferences()).toEqual([]);
  });

  it('skipping sends nothing', async () => {
    const fake = createFakeFetch({ [PUT]: () => ({ status: 204 }) });

    const result = await createSaveCulinaryPreferences(repository(fake.fetch))([]);

    expect(result).toBe('saved');
    expect(fake.requests).toHaveLength(0);
  });

  it('lists the cuisines of the local catalog index by name', async () => {
    await db.execute(
      "INSERT INTO catalog_index_local (id, data, generated_at) VALUES (1, ?, '2026-11-24')",
      [
        JSON.stringify({
          dishes: [],
          badgeDefinitions: [],
          cuisines: [
            { id: TH, name: 'Tailandesa', continents: ['asia'], totalDishes: 3 },
            { id: FR, name: 'Francesa', continents: ['europa'], totalDishes: 3 },
          ],
        }),
      ],
    );

    expect(await repository(offlineFetch).listCuisines()).toEqual([
      { id: FR, name: 'Francesa' },
      { id: TH, name: 'Tailandesa' },
    ]);
  });

  it('lists no cuisines before the first download set', async () => {
    expect(await repository(offlineFetch).listCuisines()).toEqual([]);
  });
});
