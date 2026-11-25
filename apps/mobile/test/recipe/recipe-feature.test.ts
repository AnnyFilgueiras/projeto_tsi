import { LOCAL_MIGRATIONS } from '../../src/core/local-db/migrations';
import { runMigrations } from '../../src/core/local-db/migrator';
import type { HttpClient } from '../../src/core/network/http-client';
import { HttpError, NetworkUnavailableError } from '../../src/core/network/http-errors';
import { createCandidatesReader } from '../../src/features/recipe/data/candidates-reader';
import { createCookingStateRepository } from '../../src/features/recipe/data/cooking-state-repository';
import {
  createRecipeRepository,
  type RecipePhotoStore,
} from '../../src/features/recipe/data/recipe-repository';
import { createRecipeFeature, type Recipe } from '../../src/features/recipe/domain';
import { createFakeLocalDatabase, type FakeLocalDatabase } from '../support/fake-local-database';
import { BASE_DISH_ID, CATALOG_INDEX, DISH_ID, PHOTO_HASH, recipe } from './fixtures';

const NOW = new Date('2026-11-24T12:00:00.000Z');
const PHOTO_URI = `file:///photos/${PHOTO_HASH}.webp`;

type Reply = Recipe | Error;

describe('recipe feature: LoadRecipe, StartCooking and cooking state (A04, ADR-008)', () => {
  let db: FakeLocalDatabase;
  let calls: string[];
  let reply: Reply;
  let photoReply: 'ok' | Error;
  let storedPhotos: Set<string>;

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await runMigrations(db, LOCAL_MIGRATIONS);
    calls = [];
    reply = recipe();
    photoReply = 'ok';
    storedPhotos = new Set();
  });

  afterEach(() => db.close());

  function feature() {
    const http: HttpClient = {
      async call(operationId, options) {
        calls.push(`${operationId} ${JSON.stringify(options.path)}`);
        if (reply instanceof Error) throw reply;
        return { status: 200, data: reply } as never;
      },
    };
    const photos: RecipePhotoStore = {
      async getLocalUri(hash) {
        return storedPhotos.has(hash) ? `file:///photos/${hash}.webp` : null;
      },
      async ensureDownloaded(hashes) {
        calls.push(`photos ${hashes.join(',')}`);
        if (photoReply instanceof Error) throw photoReply;
        hashes.forEach((hash) => storedPhotos.add(hash));
      },
    };
    return createRecipeFeature({
      recipes: createRecipeRepository({ http, localDatabase: db, photos }),
      cooking: createCookingStateRepository(db),
      candidates: createCandidatesReader(db),
      now: () => NOW,
    });
  }

  function seedLocalRecipe(data: Recipe = recipe()) {
    db.rows(
      `INSERT INTO recipes_local (dish_id, updated_at, photo_hash, data, downloaded_at)
       VALUES (?, ?, ?, ?, ?) RETURNING dish_id`,
      [
        data.dishId,
        data.updatedAt,
        data.photo.hash,
        JSON.stringify(data),
        '2026-11-23T09:30:00.000Z',
      ],
    );
  }

  const seedCatalog = (index: unknown = CATALOG_INDEX) =>
    db.rows(
      'INSERT INTO catalog_index_local (id, data, generated_at) VALUES (1, ?, ?) RETURNING id',
      [JSON.stringify(index), NOW.toISOString()],
    );

  const seedRestriction = (code: string) =>
    db.rows(
      'INSERT INTO restrictions_local (restriction_type, consent_at) VALUES (?, ?) RETURNING 1',
      [code, NOW.toISOString()],
    );

  const cookingRows = () =>
    db.rows<{ dish_id: string; current_step: number }>(
      'SELECT dish_id, current_step FROM local_cooking_state',
    );

  describe('LoadRecipe', () => {
    it('opens a downloaded recipe without touching the network', async () => {
      seedLocalRecipe();
      seedCatalog();
      storedPhotos.add(PHOTO_HASH);

      const view = await feature().loadRecipe(DISH_ID);

      expect(calls).toEqual([]);
      expect(view).toMatchObject({
        status: 'downloaded',
        photoUri: PHOTO_URI,
        downloadedAt: new Date('2026-11-23T09:30:00.000Z'),
        cuisineName: 'Tailandesa',
        currentStep: null,
        evolution: { locked: false },
        safety: { showAlert: false, allergenState: 'verified' },
      });
    });

    it('revalidates allergens against the local restrictions', async () => {
      seedLocalRecipe();
      seedRestriction('amendoim');

      const view = await feature().loadRecipe(DISH_ID);

      expect(view.status === 'downloaded' && view.safety).toMatchObject({
        showAlert: true,
        matchedAllergens: ['amendoim'],
      });
    });

    it('shows a not-downloaded recipe from the API without storing it', async () => {
      const view = await feature().loadRecipe(DISH_ID);

      expect(view).toMatchObject({ status: 'remote', recipe: { name: 'Pad Thai' } });
      expect(calls).toEqual([`getRecipe {"dishId":"${DISH_ID}"}`]);
      expect(db.rows('SELECT dish_id FROM recipes_local')).toEqual([]);
    });

    it('reports offline when the recipe is not downloaded and the API is unreachable', async () => {
      reply = new NetworkUnavailableError('offline');

      await expect(feature().loadRecipe(DISH_ID)).resolves.toEqual({ status: 'offline' });
    });

    it('reports not-found for an unknown dish', async () => {
      reply = new HttpError(404, undefined);

      await expect(feature().loadRecipe(DISH_ID)).resolves.toEqual({ status: 'not-found' });
    });

    it('locks an evolution whose base dish was not completed (RN02)', async () => {
      seedLocalRecipe();
      seedCatalog({
        ...CATALOG_INDEX,
        dishes: [CATALOG_INDEX.dishes[0], { ...CATALOG_INDEX.dishes[1], baseDishId: BASE_DISH_ID }],
      });

      const view = await feature().loadRecipe(DISH_ID);

      expect(view.status === 'downloaded' && view.evolution).toEqual({
        locked: true,
        baseDish: { id: BASE_DISH_ID, name: 'Aglio e Olio' },
      });
    });

    it('opens an evolution once it is unlocked', async () => {
      seedLocalRecipe(recipe({ baseDishId: BASE_DISH_ID }));
      db.rows(
        "INSERT INTO unlocks_local (kind, target_id, unlocked_at) VALUES ('evolution', ?, NULL) RETURNING 1",
        [DISH_ID],
      );

      const view = await feature().loadRecipe(DISH_ID);

      expect(view.status === 'downloaded' && view.evolution.locked).toBe(false);
    });
  });

  describe('StartCooking', () => {
    it('downloads recipe and photo, then stores both with step 0 in one go', async () => {
      const result = await feature().startCooking(DISH_ID);

      expect(result).toEqual({ status: 'started' });
      expect(calls).toEqual([`getRecipe {"dishId":"${DISH_ID}"}`, `photos ${PHOTO_HASH}`]);
      expect(db.rows('SELECT dish_id, photo_hash, downloaded_at FROM recipes_local')).toEqual([
        { dish_id: DISH_ID, photo_hash: PHOTO_HASH, downloaded_at: NOW.toISOString() },
      ]);
      expect(cookingRows()).toEqual([{ dish_id: DISH_ID, current_step: 0 }]);
    });

    it('does not download again when the dish is already cooking', async () => {
      const recipes = feature();
      await recipes.startCooking(DISH_ID);
      await recipes.saveStep(DISH_ID, 2);
      calls = [];

      await expect(recipes.startCooking(DISH_ID)).resolves.toEqual({ status: 'already-cooking' });
      expect(calls).toEqual([]);
      expect(cookingRows()).toEqual([{ dish_id: DISH_ID, current_step: 2 }]);
    });

    it('starts from the local copy without the network (A04)', async () => {
      seedLocalRecipe();

      await expect(feature().startCooking(DISH_ID)).resolves.toEqual({ status: 'started' });
      expect(calls).toEqual([]);
      expect(cookingRows()).toEqual([{ dish_id: DISH_ID, current_step: 0 }]);
    });

    it.each([
      ['recipe', () => (reply = new NetworkUnavailableError('offline'))],
      ['photo', () => (photoReply = new NetworkUnavailableError('offline'))],
    ])('writes nothing when the %s download fails offline', async (_label, breakNetwork) => {
      breakNetwork();

      await expect(feature().startCooking(DISH_ID)).resolves.toEqual({ status: 'offline' });
      expect(db.rows('SELECT dish_id FROM recipes_local')).toEqual([]);
      expect(cookingRows()).toEqual([]);
    });
  });

  describe('cooking state', () => {
    it('keeps the saved step across app restarts', async () => {
      await feature().startCooking(DISH_ID);
      await feature().saveStep(DISH_ID, 3);

      const reopened = await feature().loadRecipe(DISH_ID);

      expect(reopened.status === 'downloaded' && reopened.currentStep).toBe(3);
    });

    it('lists dishes in preparation for the Kitchen tab and clears finished ones', async () => {
      const cooking = createCookingStateRepository(db);
      await feature().startCooking(DISH_ID);

      expect(await cooking.listActive()).toEqual([
        { dishId: DISH_ID, startedAt: NOW, currentStep: 0 },
      ]);

      await cooking.finish(DISH_ID);
      expect(await cooking.listActive()).toEqual([]);
    });
  });
});
