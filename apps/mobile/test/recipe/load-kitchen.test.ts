import { LOCAL_MIGRATIONS } from '../../src/core/local-db/migrations';
import { runMigrations } from '../../src/core/local-db/migrator';
import type { HttpClient } from '../../src/core/network/http-client';
import { createCandidatesReader } from '../../src/features/recipe/data/candidates-reader';
import { createCookingStateRepository } from '../../src/features/recipe/data/cooking-state-repository';
import {
  createRecipeRepository,
  type RecipePhotoStore,
} from '../../src/features/recipe/data/recipe-repository';
import { createRecipeFeature, type Recipe } from '../../src/features/recipe/domain';
import { createFakeLocalDatabase, type FakeLocalDatabase } from '../support/fake-local-database';
import { BASE_DISH_ID, CATALOG_INDEX, CUISINE_ID, DISH_ID, PHOTO_HASH, recipe } from './fixtures';

const NOW = new Date('2026-11-24T12:00:00.000Z');
const OTHER_PHOTO = 'b'.repeat(64);

describe('loadKitchen: Em preparo and Candidatas from the local copy (#81, A04)', () => {
  let db: FakeLocalDatabase;
  let calls: string[];
  let storedPhotos: Set<string>;

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await runMigrations(db, LOCAL_MIGRATIONS);
    calls = [];
    storedPhotos = new Set();
  });

  afterEach(() => db.close());

  function feature() {
    const http: HttpClient = {
      async call(operationId) {
        calls.push(operationId);
        throw new Error('the Kitchen tab must not call the API');
      },
    };
    const photos: RecipePhotoStore = {
      async getLocalUri(hash) {
        return storedPhotos.has(hash) ? `file:///photos/${hash}.webp` : null;
      },
      async ensureDownloaded(hashes) {
        calls.push(`photos ${hashes.join(',')}`);
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
      [data.dishId, data.updatedAt, data.photo.hash, JSON.stringify(data), NOW.toISOString()],
    );
  }

  function seedCooking(dishId: string, step: number) {
    db.rows(
      'INSERT INTO local_cooking_state (dish_id, started_at, current_step) VALUES (?, ?, ?) RETURNING 1',
      [dishId, NOW.toISOString(), step],
    );
  }

  function seedCandidate(suggestionId: string, dishId: string, name: string, photoHash?: string) {
    const item = {
      id: suggestionId,
      status: 'candidate',
      dish: {
        dishId,
        name,
        cuisineId: CUISINE_ID,
        prepTimeMinutes: 20,
        difficulty: 'easy',
        allergenState: 'verified',
        ...(photoHash ? { photoHash } : {}),
      },
    };
    db.rows(
      'INSERT INTO candidates_local (suggestion_id, dish_id, data) VALUES (?, ?, ?) RETURNING 1',
      [suggestionId, dishId, JSON.stringify(item)],
    );
  }

  const seedCatalog = () =>
    db.rows(
      'INSERT INTO catalog_index_local (id, data, generated_at) VALUES (1, ?, ?) RETURNING id',
      [JSON.stringify(CATALOG_INDEX), NOW.toISOString()],
    );

  it('is empty on a fresh device', async () => {
    await expect(feature().loadKitchen()).resolves.toEqual({ cooking: [], candidates: [] });
  });

  it('lists dishes in progress with their saved step, photo and seal', async () => {
    seedLocalRecipe();
    seedCooking(DISH_ID, 2);
    storedPhotos.add(PHOTO_HASH);

    const { cooking } = await feature().loadKitchen();

    expect(cooking).toEqual([
      {
        dishId: DISH_ID,
        name: 'Pad Thai',
        photoUri: `file:///photos/${PHOTO_HASH}.webp`,
        currentStep: 2,
        stepCount: 4,
        allergenState: 'verified',
        alert: null,
      },
    ]);
    expect(calls).toEqual([]);
  });

  it('flags a dish in progress that hits a restriction added after it was started (A06)', async () => {
    seedLocalRecipe();
    seedCooking(DISH_ID, 0);
    db.rows(
      'INSERT INTO restrictions_local (restriction_type, consent_at) VALUES (?, ?) RETURNING 1',
      ['amendoim', NOW.toISOString()],
    );

    const { cooking } = await feature().loadKitchen();

    expect(cooking[0]?.alert).toMatchObject({ matchedAllergens: ['amendoim'] });
  });

  it('skips a cooking row without an offline copy', async () => {
    seedCooking(DISH_ID, 1);

    await expect(feature().loadKitchen()).resolves.toEqual({ cooking: [], candidates: [] });
  });

  it('lists candidates newest first with the cuisine name from the catalog', async () => {
    seedCatalog();
    seedCandidate('s-1', BASE_DISH_ID, 'Aglio e Olio', OTHER_PHOTO);
    seedCandidate('s-2', DISH_ID, 'Pad Thai');
    storedPhotos.add(OTHER_PHOTO);

    const { candidates } = await feature().loadKitchen();

    expect(candidates).toEqual([
      {
        suggestionId: 's-2',
        dishId: DISH_ID,
        name: 'Pad Thai',
        cuisineName: 'Tailandesa',
        prepTimeMinutes: 20,
        allergenState: 'verified',
        photoUri: null,
      },
      {
        suggestionId: 's-1',
        dishId: BASE_DISH_ID,
        name: 'Aglio e Olio',
        cuisineName: 'Tailandesa',
        prepTimeMinutes: 20,
        allergenState: 'verified',
        photoUri: `file:///photos/${OTHER_PHOTO}.webp`,
      },
    ]);
    // Opening the tab never spends data: uncached photos stay as placeholders.
    expect(calls).toEqual([]);
  });

  it('leaves the cuisine empty before the catalog is synced', async () => {
    seedCandidate('s-1', DISH_ID, 'Pad Thai');

    const { candidates } = await feature().loadKitchen();

    expect(candidates[0]).toMatchObject({ cuisineName: null });
  });

  it('hides a candidate that is already in progress and repeated dishes', async () => {
    seedLocalRecipe();
    seedCooking(DISH_ID, 0);
    seedCandidate('s-1', DISH_ID, 'Pad Thai');
    seedCandidate('s-2', BASE_DISH_ID, 'Aglio e Olio');
    seedCandidate('s-3', BASE_DISH_ID, 'Aglio e Olio');

    const { cooking, candidates } = await feature().loadKitchen();

    expect(cooking.map((dish) => dish.dishId)).toEqual([DISH_ID]);
    expect(candidates.map((dish) => dish.suggestionId)).toEqual(['s-3']);
  });
});
