import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { LOCAL_MIGRATIONS } from '../../src/core/local-db/migrations';
import { runMigrations } from '../../src/core/local-db/migrator';
import { createFetchHttpClient } from '../../src/core/network/fetch-http-client-adapter';
import { NetworkUnavailableError } from '../../src/core/network/http-errors';
import { createDownloadSetSync } from '../../src/core/sync/download-set-sync';
import { createFakeFetch, type FakeReply } from '../support/fake-fetch';
import { createFakeLocalDatabase, type FakeLocalDatabase } from '../support/fake-local-database';
import { createFakeTokenStore, tokenPair } from '../support/fake-token-store';

const NOW = new Date('2026-11-23T12:00:00.000Z');
const DISH_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const DISH_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function downloadSet(overrides: Record<string, unknown> = {}) {
  return {
    version: 'v2',
    generatedAt: NOW.toISOString(),
    minPackageVersion: '1.0.0',
    profile: { name: 'Ana', culinaryPreferences: ['c1'] },
    restrictions: [{ restrictionType: 'leite', consentAt: '2026-11-01T00:00:00.000Z' }],
    pantry: [],
    utensils: [],
    plans: [],
    candidates: [{ id: 's1', status: 'candidate', dish: { dishId: DISH_A, name: 'Moqueca' } }],
    ratings: [{ id: 'r1', dishId: DISH_A, score: 4, date: '2026-11-20' }],
    badgeAwards: [{ definitionId: 'b1', unlockedAt: '2026-11-20T00:00:00.000Z' }],
    evolutionUnlocks: ['e1'],
    catalogIndex: { dishes: [], cuisines: [], badgeDefinitions: [] },
    restrictionTypes: [],
    recipesToDownload: [
      { dishId: DISH_A, updatedAt: '2026-11-22T00:00:00.000Z', photoHash: 'h-a' },
      { dishId: DISH_B, updatedAt: '2026-11-22T00:00:00.000Z' },
    ],
    ...overrides,
  };
}

describe('DownloadSetSync (ADR-008 layer 1, UC10, A05)', () => {
  let db: FakeLocalDatabase;
  let photos: string[][];

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await runMigrations(db, LOCAL_MIGRATIONS);
    photos = [];
  });

  afterEach(() => db.close());

  function sync(routes: Record<string, () => FakeReply>) {
    const fake = createFakeFetch(routes);
    const http = createFetchHttpClient({
      baseUrl: 'http://api.test',
      fetch: fake.fetch,
      tokenStore: createFakeTokenStore(tokenPair('1')),
      packageVersion: PACKAGE_VERSION,
      now: () => NOW,
    });
    const downloader = createDownloadSetSync({
      http,
      localDatabase: db,
      ensurePhotos: async (hashes) => {
        photos.push([...hashes]);
      },
      now: () => NOW,
    });
    return { fake, downloader };
  }

  const recipe = (dishId: string): FakeReply => ({
    status: 200,
    body: { id: dishId, name: dishId },
  });
  const meta = () =>
    Object.fromEntries(
      db
        .rows<{ key: string; value: string }>('SELECT key, value FROM meta_sync')
        .map((r) => [r.key, r.value]),
    );

  it('writes the layer-1 copy, recipes and sync metadata', async () => {
    const { downloader } = sync({
      'GET /v1/sync/download-set': () => ({ status: 200, body: downloadSet() }),
      [`GET /v1/recipes/${DISH_A}`]: () => recipe(DISH_A),
      [`GET /v1/recipes/${DISH_B}`]: () => recipe(DISH_B),
    });

    const outcome = await downloader.pull();

    expect(outcome).toEqual({
      status: 'updated',
      version: 'v2',
      recipesDownloaded: 2,
      minPackageVersion: '1.0.0',
    });
    expect(db.rows('SELECT name, culinary_preferences FROM profile_local')).toEqual([
      { name: 'Ana', culinary_preferences: '["c1"]' },
    ]);
    expect(db.rows('SELECT restriction_type FROM restrictions_local')).toEqual([
      { restriction_type: 'leite' },
    ]);
    expect(db.rows('SELECT suggestion_id, dish_id FROM candidates_local')).toEqual([
      { suggestion_id: 's1', dish_id: DISH_A },
    ]);
    expect(db.rows('SELECT id FROM ratings_local')).toEqual([{ id: 'r1' }]);
    expect(db.rows('SELECT kind, target_id FROM unlocks_local ORDER BY kind')).toEqual([
      { kind: 'badge', target_id: 'b1' },
      { kind: 'evolution', target_id: 'e1' },
    ]);
    expect(db.rows('SELECT dish_id, photo_hash FROM recipes_local ORDER BY dish_id')).toEqual([
      { dish_id: DISH_A, photo_hash: 'h-a' },
      { dish_id: DISH_B, photo_hash: null },
    ]);
    expect(photos).toEqual([['h-a']]);
    expect(meta()).toEqual({ downloadSetVersion: 'v2', lastSyncAt: NOW.toISOString() });
  });

  it('deletes a revoked restriction locally (RN09: revocation removes the row)', async () => {
    await db.execute(
      "INSERT INTO restrictions_local (restriction_type, consent_at) VALUES ('ovo', '2026-01-01')",
    );
    const { downloader } = sync({
      'GET /v1/sync/download-set': () => ({
        status: 200,
        body: downloadSet({ restrictions: [], recipesToDownload: [] }),
      }),
    });

    await downloader.pull();

    expect(db.rows('SELECT * FROM restrictions_local')).toEqual([]);
  });

  it('keeps the device-only onboarding mark when the profile is refreshed', async () => {
    await db.execute("INSERT INTO profile_local (id, onboarded_at) VALUES (1, '2026-11-23')");
    const { downloader } = sync({
      'GET /v1/sync/download-set': () => ({
        status: 200,
        body: downloadSet({ recipesToDownload: [] }),
      }),
    });

    await downloader.pull();

    expect(db.rows('SELECT name, onboarded_at FROM profile_local')).toEqual([
      { name: 'Ana', onboarded_at: '2026-11-23' },
    ]);
  });

  it('skips recipes whose local version is already current', async () => {
    await db.execute(
      'INSERT INTO recipes_local (dish_id, updated_at, data, downloaded_at) VALUES (?, ?, ?, ?)',
      [DISH_B, '2026-11-22T00:00:00.000Z', '{}', '2026-11-22'],
    );
    const { fake, downloader } = sync({
      'GET /v1/sync/download-set': () => ({ status: 200, body: downloadSet() }),
      [`GET /v1/recipes/${DISH_A}`]: () => recipe(DISH_A),
    });

    const outcome = await downloader.pull();

    expect(outcome).toMatchObject({ recipesDownloaded: 1 });
    expect(fake.requests.some((r) => r.url.endsWith(DISH_B))).toBe(false);
  });

  it('sends the stored version and only stamps lastSyncAt on 304', async () => {
    await db.execute("INSERT INTO meta_sync (key, value) VALUES ('downloadSetVersion', 'v2')");
    const { fake, downloader } = sync({ 'GET /v1/sync/download-set': () => ({ status: 304 }) });

    const outcome = await downloader.pull();

    expect(outcome).toEqual({ status: 'unchanged' });
    expect(fake.requests[0]?.url).toContain('version=v2');
    expect(meta()).toEqual({ downloadSetVersion: 'v2', lastSyncAt: NOW.toISOString() });
  });

  it('does not store the version when a recipe fails, so the next pull retries it', async () => {
    const { downloader } = sync({
      'GET /v1/sync/download-set': () => ({ status: 200, body: downloadSet() }),
      [`GET /v1/recipes/${DISH_A}`]: () => {
        throw new TypeError('Network request failed');
      },
    });

    await expect(downloader.pull()).rejects.toBeInstanceOf(NetworkUnavailableError);

    expect(meta().downloadSetVersion).toBeUndefined();
  });
});
