import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  checkInvariants,
  type AllergenCode,
  type AllergenState,
} from '@panelada/allergen-rules/invariants';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';
import { createDatabaseClient, type DatabaseClient } from '../../src/db/client.js';
import {
  DEFAULT_SEED_CURATOR_EMAIL,
  DEFAULT_SEED_CURATOR_PASSWORD,
  runSeed,
} from '../../src/db/seed.js';
import { DISH_IDS } from '../../src/db/seed-catalog-data.js';
import { DrizzleCatalogRepository } from '../../src/modules/catalog/internal/repository.js';
import {
  InMemoryPhotoStorage,
  LocalDiskPhotoStorage,
} from '../../src/modules/catalog/public/photo-storage.js';
import { isWebpBuffer } from '../../src/modules/importer/internal/photo-processor.js';
import { InMemoryKeyProvider } from '../../src/support/field-encryption/index.js';

function buildMultipartForm(
  fields: Record<string, string>,
  file?: {
    readonly fieldName: string;
    readonly filename: string;
    readonly contentType: string;
    readonly data: Buffer;
  },
): { readonly contentType: string; readonly payload: Buffer } {
  const boundary = `----PaneladaBoundary${randomBytes(8).toString('hex')}`;
  const chunks: Buffer[] = [];

  for (const [name, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
        'utf8',
      ),
    );
  }

  if (file) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`,
        'utf8',
      ),
    );
    chunks.push(file.data);
    chunks.push(Buffer.from('\r\n', 'utf8'));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    payload: Buffer.concat(chunks),
  };
}

describe('MVP-04B integration: catalog, manual curation, PublicationGate, WebP photos, and idempotent seed (panelada_test)', () => {
  let dbClient: DatabaseClient;
  let databaseUrl: string;
  let seedPhotoDir: string;

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL must be initialized by integration setup.');
    }
    databaseUrl = url;
    dbClient = createDatabaseClient(databaseUrl);
    seedPhotoDir = await mkdtemp(path.join(os.tmpdir(), 'panelada-seed-photos-'));
    await runSeed(databaseUrl, { photoStorageDir: seedPhotoDir });
  });

  afterAll(async () => {
    await dbClient.close();
    await rm(seedPhotoDir, { recursive: true, force: true });
  });

  it('UC12 / RN17 / RN21 / RN22 / ADR-012 / P05: executes full manual curation lifecycle, enforces curator RBAC, blocks incomplete proposals via PublicationGate, isolates unpublished/discarded proposals from CatalogRead, and serves immutable WebP photos', async () => {
    const photoStorage = new InMemoryPhotoStorage();
    const app = buildApp({
      checkDatabaseHealth: dbClient.checkHealth,
      dbClient,
      keyProvider: new InMemoryKeyProvider({ currentVersion: 1, keys: { 1: randomBytes(32) } }),
      photoStorage,
    });
    const catalogRead = new DrizzleCatalogRepository(dbClient.db);
    const suffix = randomBytes(3).toString('hex');

    try {
      // 1. Unauthenticated request is rejected with 401.
      const unauthRes = await app.inject({
        method: 'GET',
        url: '/v1/curation/proposals',
      });
      expect(unauthRes.statusCode).toBe(401);
      expect(unauthRes.json().type).toBe('unauthenticated');

      // 2. Regular user account (anonymous role = 'user') receives 403 forbidden-role on curation routes.
      const anonRes = await app.inject({ method: 'POST', url: '/v1/accounts/anonymous' });
      expect(anonRes.statusCode).toBe(201);
      const userToken = (anonRes.json() as { tokens: { accessToken: string } }).tokens.accessToken;

      const forbiddenRes = await app.inject({
        method: 'GET',
        url: '/v1/curation/proposals',
        headers: { authorization: `Bearer ${userToken}` },
      });
      expect(forbiddenRes.statusCode).toBe(403);
      expect(forbiddenRes.json().type).toBe('forbidden-role');

      // 3. Curator sign-in via seeded credentials.
      const signInRes = await app.inject({
        method: 'POST',
        url: '/v1/sessions/sign-in',
        payload: {
          email: DEFAULT_SEED_CURATOR_EMAIL,
          password: DEFAULT_SEED_CURATOR_PASSWORD,
        },
      });
      expect(signInRes.statusCode).toBe(200);
      const curatorToken = (signInRes.json() as { tokens: { accessToken: string } }).tokens
        .accessToken;
      const authHeaders = (idemKey?: string): Record<string, string> => ({
        authorization: `Bearer ${curatorToken}`,
        ...(idemKey ? { 'Idempotency-Key': idemKey } : {}),
      });

      // 4. Negative ADR-014 invariant: leite without lactose and lactoseFree = false -> 422.
      const invalidMilkRes = await app.inject({
        method: 'POST',
        url: '/v1/curation/ingredients',
        headers: authHeaders(randomUUID()),
        payload: {
          name: `Leite inválido ${suffix}`,
          allergens: ['leite'],
          lactoseFree: false,
        },
      });
      expect(invalidMilkRes.statusCode).toBe(422);
      expect(invalidMilkRes.json().type).toBe('business-rule');

      // 5. Idempotency P05: register ingredient, replay same key -> same id; different payload -> 422 key-reused.
      const fixedKey = randomUUID();
      const milkRes1 = await app.inject({
        method: 'POST',
        url: '/v1/curation/ingredients',
        headers: authHeaders(fixedKey),
        payload: {
          name: `Leite teste ${suffix}`,
          allergens: ['leite', 'lactose'],
        },
      });
      expect(milkRes1.statusCode).toBe(201);
      const milkId = (milkRes1.json() as { id: string }).id;

      const milkReplay = await app.inject({
        method: 'POST',
        url: '/v1/curation/ingredients',
        headers: authHeaders(fixedKey),
        payload: {
          name: `Leite teste ${suffix}`,
          allergens: ['leite', 'lactose'],
        },
      });
      expect(milkReplay.statusCode).toBe(201);
      expect(milkReplay.json().id).toBe(milkId);

      const milkConflict = await app.inject({
        method: 'POST',
        url: '/v1/curation/ingredients',
        headers: authHeaders(fixedKey),
        payload: {
          name: `Outro leite ${suffix}`,
          allergens: ['leite', 'lactose'],
        },
      });
      expect(milkConflict.statusCode).toBe(422);
      expect(milkConflict.json().type).toBe('key-reused');

      // 6. Register remaining base catalog items (lactose-free milk, wheat, egg, utensil, cuisine, substitution).
      const lfMilkRes = await app.inject({
        method: 'POST',
        url: '/v1/curation/ingredients',
        headers: authHeaders(randomUUID()),
        payload: {
          name: `Leite zero lactose ${suffix}`,
          allergens: ['leite'],
          lactoseFree: true,
        },
      });
      expect(lfMilkRes.statusCode).toBe(201);
      const lfMilkId = (lfMilkRes.json() as { id: string }).id;

      const wheatRes = await app.inject({
        method: 'POST',
        url: '/v1/curation/ingredients',
        headers: authHeaders(randomUUID()),
        payload: {
          name: `Trigo teste ${suffix}`,
          allergens: ['trigo_centeio_cevada_aveia'],
        },
      });
      expect(wheatRes.statusCode).toBe(201);
      const wheatId = (wheatRes.json() as { id: string }).id;

      const utensilRes = await app.inject({
        method: 'POST',
        url: '/v1/curation/utensils',
        headers: authHeaders(randomUUID()),
        payload: { name: `Frigideira teste ${suffix}` },
      });
      expect(utensilRes.statusCode).toBe(201);
      const utensilId = (utensilRes.json() as { id: string }).id;

      const cuisineRes = await app.inject({
        method: 'POST',
        url: '/v1/curation/cuisines',
        headers: authHeaders(randomUUID()),
        payload: { name: `Culinária teste ${suffix}`, continents: ['europe'] },
      });
      expect(cuisineRes.statusCode).toBe(201);
      const cuisineId = (cuisineRes.json() as { id: string }).id;

      // Negative A06/RN22: substitution omitting allergen declared on canonical substitute returns 422.
      const omitAllergenSubRes = await app.inject({
        method: 'POST',
        url: '/v1/curation/substitutions',
        headers: authHeaders(randomUUID()),
        payload: {
          ingredientId: milkId,
          substituteId: lfMilkId,
          substituteAllergens: [],
        },
      });
      expect(omitAllergenSubRes.statusCode).toBe(422);
      expect(omitAllergenSubRes.json().type).toBe('business-rule');

      const subRes = await app.inject({
        method: 'POST',
        url: '/v1/curation/substitutions',
        headers: authHeaders(randomUUID()),
        payload: {
          ingredientId: milkId,
          substituteId: lfMilkId,
          substituteAllergens: ['leite'],
        },
      });
      expect(subRes.statusCode).toBe(201);
      expect(subRes.json().allergenState).toBe('verified');

      // 7. Negative A06: creating recipe directly as `verified` returns 400 validation.
      const alreadyVerifiedRes = await app.inject({
        method: 'POST',
        url: '/v1/curation/recipes',
        headers: authHeaders(randomUUID()),
        payload: {
          name: `Crepe inválido ${suffix}`,
          cuisineId,
          baseDishId: null,
          prepTimeMinutes: 20,
          difficulty: 'easy',
          ingredients: [
            { ingredientId: wheatId, quantity: '1', unit: 'xícara' },
            { ingredientId: milkId, quantity: '1', unit: 'xícara' },
          ],
          utensilIds: [utensilId],
          steps: ['Misture e doure.'],
          allergens: ['trigo_centeio_cevada_aveia', 'leite', 'lactose'],
          allergenState: 'verified',
          sourceName: 'Fonte de teste',
          sourceUrl: 'https://example.org/crepe',
        },
      });
      expect(alreadyVerifiedRes.statusCode).toBe(400);
      expect(alreadyVerifiedRes.json().type).toBe('validation');

      // 8. Submit valid manual recipe proposal -> 201 proposed.
      const submitRes = await app.inject({
        method: 'POST',
        url: '/v1/curation/recipes',
        headers: authHeaders(randomUUID()),
        payload: {
          name: `Crepe curado ${suffix}`,
          cuisineId,
          baseDishId: null,
          prepTimeMinutes: 30,
          difficulty: 'easy',
          ingredients: [
            { ingredientId: wheatId, quantity: '1', unit: 'xícara' },
            { ingredientId: milkId, quantity: '1', unit: 'xícara' },
          ],
          utensilIds: [utensilId],
          steps: ['Bata a massa.', 'Doure dos dois lados.'],
          allergens: ['trigo_centeio_cevada_aveia', 'leite', 'lactose'],
          allergenState: 'source_declared',
          sourceName: 'Receita da dupla',
          sourceUrl: 'https://example.org/crepe-simples',
        },
      });
      expect(submitRes.statusCode).toBe(201);
      const proposalId = (submitRes.json() as { id: string }).id;
      expect(submitRes.json().publicationState).toBe('proposed');
      expect(submitRes.json().origin).toBe('manual');

      // 9. RN21: Unapproved proposal MUST NOT appear in CatalogRead or GET /v1/recipes/{dishId}.
      expect(await catalogRead.getApprovedRecipe(proposalId)).toBeNull();
      expect((await catalogRead.listApprovedDishes()).some((d) => d.dishId === proposalId)).toBe(
        false,
      );
      const unpubRecipeRes = await app.inject({
        method: 'GET',
        url: `/v1/recipes/${proposalId}`,
        headers: { authorization: `Bearer ${userToken}` },
      });
      expect(unpubRecipeRes.statusCode).toBe(404);

      // 10. PublicationGate blocks approval without photo (422 publication-gate).
      const blockedApproveRes = await app.inject({
        method: 'POST',
        url: `/v1/curation/proposals/${proposalId}/approve`,
        headers: authHeaders(randomUUID()),
      });
      expect(blockedApproveRes.statusCode).toBe(422);
      expect(blockedApproveRes.json().type).toBe('publication-gate');
      expect(
        (blockedApproveRes.json().violations as Array<{ code: string }>).map((v) => v.code),
      ).toContain('photo_without_attribution');

      // 11. Attach photo rejects disallowed license (422) and non-image payload (415).
      const brunoFixture = await readFile(
        path.resolve(
          process.cwd(),
          '../../docs/fase2/04-contratos/bruno/panelada-curadoria/fixtures/dish-example.jpg',
        ),
      );
      const badLicenseForm = buildMultipartForm(
        {
          author: 'Dupla',
          sourceUrl: 'https://example.org/photo',
          license: 'cc_by_nc',
          modified: 'false',
        },
        {
          fieldName: 'image',
          filename: 'dish-example.jpg',
          contentType: 'image/jpeg',
          data: brunoFixture,
        },
      );
      const badLicenseRes = await app.inject({
        method: 'PUT',
        url: `/v1/curation/proposals/${proposalId}/photo`,
        headers: {
          authorization: `Bearer ${curatorToken}`,
          'content-type': badLicenseForm.contentType,
        },
        payload: badLicenseForm.payload,
      });
      expect(badLicenseRes.statusCode).toBe(422);
      expect(badLicenseRes.json().type).toBe('business-rule');

      const fakeImageForm = buildMultipartForm(
        {
          author: 'Dupla',
          sourceUrl: 'https://example.org/photo',
          license: 'own_work',
          modified: 'false',
        },
        {
          fieldName: 'image',
          filename: 'fake.webp',
          contentType: 'image/webp',
          data: Buffer.from('not a valid image', 'utf8'),
        },
      );
      const fakeImageRes = await app.inject({
        method: 'PUT',
        url: `/v1/curation/proposals/${proposalId}/photo`,
        headers: {
          authorization: `Bearer ${curatorToken}`,
          'content-type': fakeImageForm.contentType,
        },
        payload: fakeImageForm.payload,
      });
      expect(fakeImageRes.statusCode).toBe(415);
      expect(fakeImageRes.json().type).toBe('unsupported-media-type');

      // 12. Attach valid photo with TASL attribution -> 200 DishPhoto.
      const validPhotoForm = buildMultipartForm(
        {
          author: 'Dupla (foto de teste)',
          title: 'Crepe curado',
          sourceUrl: 'https://example.org/dish-example',
          license: 'own_work',
          modified: 'false',
        },
        {
          fieldName: 'image',
          filename: 'dish-example.jpg',
          contentType: 'image/jpeg',
          data: brunoFixture,
        },
      );
      const attachPhotoRes = await app.inject({
        method: 'PUT',
        url: `/v1/curation/proposals/${proposalId}/photo`,
        headers: {
          authorization: `Bearer ${curatorToken}`,
          'content-type': validPhotoForm.contentType,
        },
        payload: validPhotoForm.payload,
      });
      expect(attachPhotoRes.statusCode).toBe(200);
      const photoHash = (attachPhotoRes.json() as { hash: string }).hash;
      expect(photoHash).toMatch(/^[a-f0-9]{64}$/);

      // 13. Negative: verify rejects confirmedAllergenFree = true when allergens are present.
      const contradictoryVerifyRes = await app.inject({
        method: 'POST',
        url: `/v1/curation/proposals/${proposalId}/verify`,
        headers: authHeaders(randomUUID()),
        payload: {
          checkedIngredients: true,
          secondSourceChecked: false,
          unionChecked: true,
          confirmedAllergenFree: true,
        },
      });
      expect(contradictoryVerifyRes.statusCode).toBe(422);

      // Verify allergens -> 200 verified.
      const verifyRes = await app.inject({
        method: 'POST',
        url: `/v1/curation/proposals/${proposalId}/verify`,
        headers: authHeaders(randomUUID()),
        payload: {
          checkedIngredients: true,
          secondSourceChecked: true,
          secondSourceDescription: 'Conferido contra a tabela da fonte pública',
          unionChecked: true,
        },
      });
      expect(verifyRes.statusCode).toBe(200);
      expect(verifyRes.json().data.allergenState).toBe('verified');
      expect(verifyRes.json().verifiedBy).toBeTruthy();

      // 14. Approve -> 200 approved and published to catalog with dishId === proposalId.
      const approveRes = await app.inject({
        method: 'POST',
        url: `/v1/curation/proposals/${proposalId}/approve`,
        headers: authHeaders(randomUUID()),
      });
      expect(approveRes.statusCode).toBe(200);
      expect(approveRes.json().publicationState).toBe('approved');
      expect(approveRes.json().approvedBy).toBeTruthy();

      // 15. Published dish is readable via GET /v1/recipes/{dishId} and photo via GET /v1/photos/{hash}.
      const publishedRecipeRes = await app.inject({
        method: 'GET',
        url: `/v1/recipes/${proposalId}`,
        headers: { authorization: `Bearer ${userToken}` },
      });
      expect(publishedRecipeRes.statusCode).toBe(200);
      const publishedRecipe = publishedRecipeRes.json() as {
        dishId: string;
        allergenState: string;
        photo: { hash: string };
        substitutions: Array<{ ingredientId: string; substituteId: string }>;
      };
      expect(publishedRecipe.dishId).toBe(proposalId);
      expect(publishedRecipe.allergenState).toBe('verified');
      expect(publishedRecipe.photo.hash).toBe(photoHash);
      expect(publishedRecipe.substitutions.some((s) => s.substituteId === lfMilkId)).toBe(true);

      const photoGetRes = await app.inject({
        method: 'GET',
        url: `/v1/photos/${photoHash}`,
        headers: { authorization: `Bearer ${userToken}` },
      });
      expect(photoGetRes.statusCode).toBe(200);
      expect(photoGetRes.headers['content-type']).toBe('image/webp');
      expect(photoGetRes.headers['cache-control']).toBe('public, max-age=31536000, immutable');
      expect(isWebpBuffer(photoGetRes.rawPayload)).toBe(true);

      // 16. Discarded proposal never appears in CatalogRead and cannot be approved.
      const toDiscardRes = await app.inject({
        method: 'POST',
        url: '/v1/curation/recipes',
        headers: authHeaders(randomUUID()),
        payload: {
          name: `Proposta descartada ${suffix}`,
          cuisineId,
          baseDishId: null,
          prepTimeMinutes: 15,
          difficulty: 'easy',
          ingredients: [{ ingredientId: wheatId, quantity: '1', unit: 'xícara' }],
          utensilIds: [],
          steps: ['Misturar.'],
          allergens: ['trigo_centeio_cevada_aveia'],
          allergenState: 'unverified',
          sourceName: 'Rascunho',
          sourceUrl: 'https://example.org/rascunho',
        },
      });
      expect(toDiscardRes.statusCode).toBe(201);
      const discardedId = (toDiscardRes.json() as { id: string }).id;

      const discardRes = await app.inject({
        method: 'POST',
        url: `/v1/curation/proposals/${discardedId}/discard`,
        headers: authHeaders(randomUUID()),
      });
      expect(discardRes.statusCode).toBe(204);

      expect(await catalogRead.getApprovedRecipe(discardedId)).toBeNull();
      expect((await catalogRead.listApprovedDishes()).some((d) => d.dishId === discardedId)).toBe(
        false,
      );

      const approveDiscardedRes = await app.inject({
        method: 'POST',
        url: `/v1/curation/proposals/${discardedId}/approve`,
        headers: authHeaders(randomUUID()),
      });
      expect(approveDiscardedRes.statusCode).toBe(422);
    } finally {
      await app.close();
    }
  });

  it('MVP-04G: runSeed publishes every dish photo through the injected savePhoto port (Supabase Storage in Cloud 4C) instead of local disk', async () => {
    const storage = new InMemoryPhotoStorage();
    const saved: string[] = [];

    await runSeed(databaseUrl, {
      savePhoto: async (hash, bytes) => {
        saved.push(hash);
        await storage.save(hash, bytes);
      },
    });

    const photosRes = await dbClient.pool.query<{ file_hash: string }>(
      `SELECT file_hash FROM catalog_dish_photos WHERE dish_id = ANY($1::uuid[])`,
      [Object.values(DISH_IDS)],
    );
    expect(saved).toHaveLength(20);
    expect(new Set(saved)).toEqual(new Set(photosRes.rows.map((row) => row.file_hash)));
    for (const hash of saved) {
      const photo = await storage.get(hash);
      expect(photo && isWebpBuffer(photo.bytes)).toBe(true);
    }
  });

  it('MVP-04B seed idempotency: running runSeed twice produces zero duplicates, covers 5 continents, 20 dishes in every AllergenState (18/1/1), 3-level evolution chain, safe/unsafe substitutions, 11 badges (RN03 a-h), and valid WebP photos', async () => {
    // Run seed a second time on the already-seeded test database to confirm idempotency.
    await runSeed(databaseUrl, { photoStorageDir: seedPhotoDir });

    const [cuisinesRes, dishesRes, substitutionsRes, badgesRes] = await Promise.all([
      dbClient.pool.query<{ id: string; continents: string[] }>(
        `SELECT id, continents FROM catalog_cuisines WHERE id::text LIKE '10000000-%'`,
      ),
      dbClient.pool.query<{
        id: string;
        base_dish_id: string | null;
        allergens: AllergenCode[];
        allergen_state: AllergenState;
        confirmed_allergen_free: boolean;
        file_hash: string;
      }>(
        `SELECT d.id, d.base_dish_id, r.allergens, r.allergen_state, r.confirmed_allergen_free, p.file_hash
         FROM catalog_dishes d
         JOIN catalog_recipes r ON r.dish_id = d.id
         JOIN catalog_dish_photos p ON p.dish_id = d.id
         WHERE d.id::text LIKE '50000000-%'`,
      ),
      dbClient.pool.query<{ id: string; allergen_state: string; confirmed_allergen_free: boolean }>(
        `SELECT id, allergen_state, confirmed_allergen_free
         FROM catalog_ingredient_substitutions
         WHERE id::text LIKE '40000000-%'`,
      ),
      dbClient.pool.query<{ id: string; milestone: { type: string } }>(
        `SELECT id, milestone FROM progress_badge_definitions WHERE id::text LIKE '60000000-%'`,
      ),
    ]);

    expect(cuisinesRes.rows).toHaveLength(10);
    const continents = new Set(cuisinesRes.rows.flatMap((row) => row.continents));
    expect(continents).toEqual(new Set(['america', 'africa', 'europe', 'asia', 'oceania']));

    expect(dishesRes.rows).toHaveLength(20);
    // MVP-04C1: Seed keeps one dish per non-verified state so every AllergenState reaches the UI.
    const stateCounts = dishesRes.rows.reduce<Record<string, number>>((acc, d) => {
      acc[d.allergen_state] = (acc[d.allergen_state] ?? 0) + 1;
      return acc;
    }, {});
    expect(stateCounts).toEqual({ verified: 18, source_declared: 1, unverified: 1 });
    expect(dishesRes.rows.some((d) => d.allergens.length === 0 && d.confirmed_allergen_free)).toBe(
      true,
    );

    // Verify 3-level evolution chain: aglioEOlio (L1) -> carbonara (L2) -> raguBolognese (L3).
    const dishById = new Map(dishesRes.rows.map((d) => [d.id, d]));
    expect(dishById.get(DISH_IDS.aglioEOlio)?.base_dish_id).toBeNull();
    expect(dishById.get(DISH_IDS.carbonara)?.base_dish_id).toBe(DISH_IDS.aglioEOlio);
    expect(dishById.get(DISH_IDS.raguBolognese)?.base_dish_id).toBe(DISH_IDS.carbonara);

    // Verify every seeded dish satisfies checkInvariants (ADR-014).
    const catalogRead = new DrizzleCatalogRepository(dbClient.db);
    for (const dish of dishesRes.rows) {
      const recipe = await catalogRead.getApprovedRecipe(dish.id);
      expect(recipe).not.toBeNull();
      const ingMap = await catalogRead.getIngredientsByIds(
        recipe!.ingredients.map((i) => i.ingredientId),
      );
      const violations = checkInvariants(
        {
          id: dish.id,
          allergens: dish.allergens,
          allergenState: dish.allergen_state,
          confirmedAllergenFree: dish.confirmed_allergen_free,
        },
        recipe!.ingredients.map((i) => ({
          id: i.ingredientId,
          allergens: ingMap.get(i.ingredientId)?.allergens ?? [],
          lactoseFree: ingMap.get(i.ingredientId)?.lactoseFree ?? false,
        })),
      );
      expect(violations).toEqual([]);
    }

    // Verify safe and unsafe/unverified substitutions exist (US10, RN22).
    expect(substitutionsRes.rows).toHaveLength(7);
    expect(substitutionsRes.rows.some((s) => s.allergen_state === 'unverified')).toBe(true);
    expect(
      substitutionsRes.rows.some(
        (s) => s.allergen_state === 'verified' && s.confirmed_allergen_free,
      ),
    ).toBe(true);

    // Verify 11 badges covering all 8 RN03 (a-h) milestone variants.
    expect(badgesRes.rows).toHaveLength(11);
    const milestoneTypes = new Set(badgesRes.rows.map((b) => b.milestone.type));
    expect(milestoneTypes).toEqual(
      new Set([
        'dish',
        'cuisine',
        'n_cuisines',
        'all_continents',
        'set',
        'total_dishes',
        'evolution_level',
        'adaptation_count',
      ]),
    );

    // Verify seeded WebP photo exists on disk and passes WebP magic bytes via LocalDiskPhotoStorage.
    const localStorage = new LocalDiskPhotoStorage(seedPhotoDir);
    const sampleHash = dishesRes.rows[0]!.file_hash;
    const loadedPhoto = await localStorage.get(sampleHash);
    expect(loadedPhoto).not.toBeNull();
    expect(isWebpBuffer(loadedPhoto!.bytes)).toBe(true);
  });
});
