import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  isSubstituteAllowed,
  PACKAGE_VERSION,
  type AllergenCode,
  type AllergenState,
} from '@panelada/allergen-rules/rules';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';
import { createDatabaseClient, type DatabaseClient } from '../../src/db/client.js';
import { runSeed } from '../../src/db/seed.js';
import { CUISINE_IDS, DISH_IDS, SEED_BADGES } from '../../src/db/seed-catalog-data.js';
import { InMemoryPhotoStorage } from '../../src/modules/catalog/public/photo-storage.js';
import { InMemoryKeyProvider } from '../../src/support/field-encryption/index.js';

interface SuggestionResponseBody {
  suggestions: Array<{
    id: string;
    status: 'presented' | 'candidate' | 'discarded';
    dish: {
      dishId: string;
      name: string;
      cuisineId: string;
      prepTimeMinutes: number;
      difficulty: 'easy' | 'medium' | 'hard';
      photoHash?: string;
    };
    missingIngredients: string[];
    missingUtensils: string[];
  }>;
  noResult: boolean;
  minPackageVersion: string;
}

interface RecipeResponseBody {
  dishId: string;
  name: string;
  allergens: AllergenCode[];
  allergenState: AllergenState;
  confirmedAllergenFree: boolean;
  sourceName: string;
  sourceUrl: string;
  substitutions: Array<{
    id: string;
    ingredientId: string;
    substituteId: string;
    substituteName: string;
    substituteAllergens: AllergenCode[];
    allergenState: AllergenState;
    confirmedAllergenFree: boolean;
    origin: 'manual' | 'ai';
  }>;
}

interface DownloadSetResponseBody {
  version: string;
  generatedAt: string;
  minPackageVersion: string;
  profile: {
    culinaryPreferences: string[];
  };
  restrictions: Array<{ restrictionType: string; consentAt: string }>;
  candidates: Array<{
    id: string;
    status: string;
    dish: { dishId: string; name: string };
  }>;
  ratings: Array<{
    id: string;
    dishId: string;
    score: number;
    comment?: string;
    changes?: string;
    date: string;
  }>;
  badgeAwards: Array<{ definitionId: string; unlockedAt: string }>;
  evolutionUnlocks: string[];
  catalogIndex: {
    dishes: Array<{ id: string; name: string; cuisineId: string; baseDishId: string | null }>;
    cuisines: Array<{ id: string; name: string; continents: string[]; totalDishes: number }>;
    badgeDefinitions: Array<{
      id: string;
      name: string;
      description: string;
      milestone: { type: string };
    }>;
  };
  restrictionTypes: Array<{ code: string; name: string; associatedAllergens: string[] }>;
  recipesToDownload: Array<{ dishId: string; updatedAt: string; photoHash?: string }>;
}

describe('MVP-04C integration: suggestions, recipes, rating.register gamification, and download-set (panelada_test)', () => {
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
    seedPhotoDir = await mkdtemp(path.join(os.tmpdir(), 'panelada-mvp04c-photos-'));
    await runSeed(databaseUrl, { photoStorageDir: seedPhotoDir });
  });

  afterAll(async () => {
    await dbClient.close();
    await rm(seedPhotoDir, { recursive: true, force: true });
  });

  it('UC01 / UC02 / UC04 / UC10 / RN01-RN11 / RN15 / RN22 / A06 / P05: filters suggestions safely, manages candidate/discard lifecycle, serves recipe substitutions, awards unlocks on rating.register idempotently, and serves 200/304 download-set', async () => {
    let nowMs = Date.parse('2026-11-23T15:00:00.000Z');
    const app = buildApp({
      checkDatabaseHealth: dbClient.checkHealth,
      dbClient,
      keyProvider: new InMemoryKeyProvider({ currentVersion: 1, keys: { 1: randomBytes(32) } }),
      photoStorage: new InMemoryPhotoStorage(),
      clock: () => new Date(nowMs),
    });

    // Insert a temporary approved dish with `allergen_state = 'unverified'` to assert RN08 fail-closed filtering.
    const unverifiedDishId = randomUUID();
    await dbClient.pool.query(
      `INSERT INTO catalog_dishes (id, name, cuisine_id, base_dish_id, publication_state)
       VALUES ($1, $2, $3, NULL, 'approved')`,
      [unverifiedDishId, 'Prato Não Verificado de Teste', CUISINE_IDS.french],
    );
    await dbClient.pool.query(
      `INSERT INTO catalog_recipes (
         dish_id, prep_time_minutes, difficulty, steps, allergens, allergen_state,
         confirmed_allergen_free, allergens_updated_at, source_name, source_url, origin
       )
       VALUES ($1, 20, 'easy', '["Passo 1"]'::jsonb, '[]'::jsonb, 'unverified', false, NOW(),
               'Teste Integração', 'https://panelada.app/sources/unverified-test', 'manual')`,
      [unverifiedDishId],
    );

    try {
      // 1. Create anonymous account and register peanut restriction + French preference.
      const anonRes = await app.inject({ method: 'POST', url: '/v1/accounts/anonymous' });
      expect(anonRes.statusCode).toBe(201);
      const { accountId, tokens } = anonRes.json() as {
        accountId: string;
        tokens: { accessToken: string; refreshToken: string };
      };
      const authHeader = { authorization: `Bearer ${tokens.accessToken}` };

      const restrictionSyncRes = await app.inject({
        method: 'POST',
        url: '/v1/sync/operations',
        headers: authHeader,
        payload: {
          operations: [
            {
              opId: randomUUID(),
              type: 'restriction.register',
              createdAt: '2026-11-23T15:00:00.000Z',
              payload: {
                restrictionType: 'amendoim',
                consentAt: '2026-11-23T15:00:00.000Z',
              },
            },
          ],
        },
      });
      expect(restrictionSyncRes.statusCode).toBe(200);
      expect(restrictionSyncRes.json().results[0].status).toBe('confirmed');

      const prefRes = await app.inject({
        method: 'PUT',
        url: '/v1/profile/preferences',
        headers: authHeader,
        payload: { cuisineIds: [CUISINE_IDS.french] },
      });
      expect(prefRes.statusCode).toBe(204);

      // 2. GET /v1/suggestions: never returns peanut dish (`shrimpPadThai`) nor `unverified` dish;
      // prioritizes preferred cuisine (French) and returns minPackageVersion without blocking on header.
      const suggestionsRes = await app.inject({
        method: 'GET',
        url: '/v1/suggestions?limit=20',
        headers: {
          ...authHeader,
          'x-allergen-package-version': '0.9.0',
        },
      });
      expect(suggestionsRes.statusCode).toBe(200);
      const suggestionsBody = suggestionsRes.json() as SuggestionResponseBody;
      expect(suggestionsBody.noResult).toBe(false);
      expect(suggestionsBody.minPackageVersion).toBe(PACKAGE_VERSION);

      const suggestedDishIds = suggestionsBody.suggestions.map((item) => item.dish.dishId);
      expect(suggestedDishIds).not.toContain(DISH_IDS.shrimpPadThai);
      expect(suggestedDishIds).not.toContain(unverifiedDishId);
      expect(suggestionsBody.suggestions[0]?.dish.cuisineId).toBe(CUISINE_IDS.french);

      // 3. Approve one suggestion (with Idempotency-Key) and discard another.
      const toApprove = suggestionsBody.suggestions[0]!;
      const toDiscard = suggestionsBody.suggestions[1]!;

      const approveKey = randomUUID();
      const approveRes = await app.inject({
        method: 'POST',
        url: `/v1/suggestions/${toApprove.id}/approve`,
        headers: { ...authHeader, 'idempotency-key': approveKey },
      });
      expect(approveRes.statusCode).toBe(200);
      expect(approveRes.json()).toMatchObject({
        id: toApprove.id,
        status: 'candidate',
        dish: { dishId: toApprove.dish.dishId },
      });

      // Replay with same key returns same 200 payload; reusing key on another suggestion returns 422 key-reused.
      const approveReplayRes = await app.inject({
        method: 'POST',
        url: `/v1/suggestions/${toApprove.id}/approve`,
        headers: { ...authHeader, 'idempotency-key': approveKey },
      });
      expect(approveReplayRes.statusCode).toBe(200);

      const keyReusedRes = await app.inject({
        method: 'POST',
        url: `/v1/suggestions/${toDiscard.id}/approve`,
        headers: { ...authHeader, 'idempotency-key': approveKey },
      });
      expect(keyReusedRes.statusCode).toBe(422);
      expect(keyReusedRes.json().type).toBe('key-reused');

      const discardRes = await app.inject({
        method: 'POST',
        url: `/v1/suggestions/${toDiscard.id}/discard`,
        headers: { ...authHeader, 'idempotency-key': randomUUID() },
      });
      expect(discardRes.statusCode).toBe(204);

      // Neither approved nor discarded dish returns in the same session.
      const afterDecisionRes = await app.inject({
        method: 'GET',
        url: '/v1/suggestions?limit=20',
        headers: authHeader,
      });
      expect(afterDecisionRes.statusCode).toBe(200);
      const afterDecisionDishIds = (
        afterDecisionRes.json() as SuggestionResponseBody
      ).suggestions.map((item) => item.dish.dishId);
      expect(afterDecisionDishIds).not.toContain(toApprove.dish.dishId);
      expect(afterDecisionDishIds).not.toContain(toDiscard.dish.dishId);

      // RN11: After rotating to a new session token, the discarded dish may reappear while candidate stays excluded.
      nowMs += 5_000;
      const refreshRes = await app.inject({
        method: 'POST',
        url: '/v1/sessions/refresh',
        payload: { refreshToken: tokens.refreshToken },
      });
      expect(refreshRes.statusCode).toBe(200);
      const refreshedAccessToken = (refreshRes.json() as { accessToken: string }).accessToken;
      const nextSessionAuth = { authorization: `Bearer ${refreshedAccessToken}` };

      const nextSessionSuggestionsRes = await app.inject({
        method: 'GET',
        url: '/v1/suggestions?limit=20',
        headers: nextSessionAuth,
      });
      expect(nextSessionSuggestionsRes.statusCode).toBe(200);
      const nextSessionDishIds = (
        nextSessionSuggestionsRes.json() as SuggestionResponseBody
      ).suggestions.map((item) => item.dish.dishId);
      expect(nextSessionDishIds).toContain(toDiscard.dish.dishId);
      expect(nextSessionDishIds).not.toContain(toApprove.dish.dishId);

      // 4. GET /v1/recipes/:dishId delivers global substitutions compatible with `isSubstituteAllowed` (RN15, RN22).
      const recipeRes = await app.inject({
        method: 'GET',
        url: `/v1/recipes/${DISH_IDS.raguBolognese}`,
        headers: nextSessionAuth,
      });
      expect(recipeRes.statusCode).toBe(200);
      const recipeBody = recipeRes.json() as RecipeResponseBody;
      expect(recipeBody.allergenState).toBe('verified');
      expect(recipeBody.substitutions.length).toBeGreaterThanOrEqual(3);

      const safeForMilkRestriction = recipeBody.substitutions.filter((sub) =>
        isSubstituteAllowed(
          {
            allergens: sub.substituteAllergens,
            allergenState: sub.allergenState,
            confirmedAllergenFree: sub.confirmedAllergenFree,
          },
          ['leite'],
        ),
      );
      expect(safeForMilkRestriction.map((sub) => sub.substituteName)).toContain('Leite de coco');
      expect(safeForMilkRestriction.map((sub) => sub.substituteName)).not.toContain(
        'Leite sem lactose',
      );

      // 5. POST /v1/sync/operations with `rating.register`: unlocks level-2 evolution (Carbonara)
      // and eligible badges (Primeiro Fogo + Toque Pessoal); replay returns repeated=true;
      // second rating with new opId preserves both historical ratings (RN06).
      const firstRatingOpId = randomUUID();
      const firstRatingPayload = {
        dishId: DISH_IDS.aglioEOlio,
        score: 8,
        comment: 'Alho bem dourado e azeite perfumado.',
        changes: 'Finalize com raspas de limão siciliano.',
      };

      const ratingRes = await app.inject({
        method: 'POST',
        url: '/v1/sync/operations',
        headers: nextSessionAuth,
        payload: {
          operations: [
            {
              opId: firstRatingOpId,
              type: 'rating.register',
              createdAt: '2026-11-23T15:05:00.000Z',
              payload: firstRatingPayload,
            },
          ],
        },
      });
      expect(ratingRes.statusCode).toBe(200);
      const ratingBody = ratingRes.json() as {
        minPackageVersion: string;
        results: Array<{
          opId: string;
          status: string;
          repeated: boolean;
          unlocks?: { evolutions: string[]; badgeAwards: string[] };
        }>;
      };
      expect(ratingBody.minPackageVersion).toBe(PACKAGE_VERSION);
      expect(ratingBody.results[0]).toMatchObject({
        opId: firstRatingOpId,
        status: 'confirmed',
        repeated: false,
      });
      expect(ratingBody.results[0]?.unlocks?.evolutions).toEqual([DISH_IDS.carbonara]);
      expect(ratingBody.results[0]?.unlocks?.badgeAwards).toEqual(
        expect.arrayContaining([
          SEED_BADGES[0]!.id, // Primeiro Fogo (total_dishes: 1)
          SEED_BADGES[2]!.id, // Toque Pessoal (adaptation_count: 1)
        ]),
      );

      // Completed dish (`aglioEOlio`) must not return in suggestions (RN01/RN10).
      const afterRatingSuggestionsRes = await app.inject({
        method: 'GET',
        url: '/v1/suggestions?limit=20',
        headers: nextSessionAuth,
      });
      expect(
        (afterRatingSuggestionsRes.json() as SuggestionResponseBody).suggestions.map(
          (item) => item.dish.dishId,
        ),
      ).not.toContain(DISH_IDS.aglioEOlio);

      // Re-sending the exact same opId returns repeated=true without duplicating DB rows.
      const replayRatingRes = await app.inject({
        method: 'POST',
        url: '/v1/sync/operations',
        headers: nextSessionAuth,
        payload: {
          operations: [
            {
              opId: firstRatingOpId,
              type: 'rating.register',
              createdAt: '2026-11-23T15:05:00.000Z',
              payload: firstRatingPayload,
            },
          ],
        },
      });
      expect(replayRatingRes.statusCode).toBe(200);
      expect(replayRatingRes.json().results[0]).toMatchObject({
        opId: firstRatingOpId,
        status: 'confirmed',
        repeated: true,
        unlocks: ratingBody.results[0]?.unlocks,
      });

      // Second rating for the same dish with a new opId preserves both rows in history (RN06).
      const secondRatingOpId = randomUUID();
      const secondRatingRes = await app.inject({
        method: 'POST',
        url: '/v1/sync/operations',
        headers: nextSessionAuth,
        payload: {
          operations: [
            {
              opId: secondRatingOpId,
              type: 'rating.register',
              createdAt: '2026-11-23T15:10:00.000Z',
              payload: {
                dishId: DISH_IDS.aglioEOlio,
                score: 10,
              },
            },
          ],
        },
      });
      expect(secondRatingRes.statusCode).toBe(200);
      expect(secondRatingRes.json().results[0]).toEqual({
        opId: secondRatingOpId,
        status: 'confirmed',
        repeated: false,
        unlocks: { evolutions: [], badgeAwards: [] },
      });

      const ratingCountRow = await dbClient.pool.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM progress_ratings WHERE user_id = $1`,
        [accountId],
      );
      expect(ratingCountRow.rows[0]?.count).toBe(2);

      // 6. GET /v1/sync/download-set returns collection index, unlocked evolutions, badges
      // (awarded + pending definitions), approved candidates, owner restrictions, and minPackageVersion.
      const downloadSetRes = await app.inject({
        method: 'GET',
        url: '/v1/sync/download-set',
        headers: nextSessionAuth,
      });
      expect(downloadSetRes.statusCode).toBe(200);
      const downloadSet = downloadSetRes.json() as DownloadSetResponseBody;

      expect(downloadSet.minPackageVersion).toBe(PACKAGE_VERSION);
      expect(downloadSet.profile.culinaryPreferences).toEqual([CUISINE_IDS.french]);
      expect(downloadSet.restrictions).toHaveLength(1);
      expect(downloadSet.restrictions[0]?.restrictionType).toBe('amendoim');
      expect(downloadSet.candidates.map((item) => item.dish.dishId)).toContain(
        toApprove.dish.dishId,
      );
      expect(downloadSet.recipesToDownload.map((item) => item.dishId)).toContain(
        toApprove.dish.dishId,
      );
      expect(downloadSet.ratings.map((item) => item.id)).toEqual([
        firstRatingOpId,
        secondRatingOpId,
      ]);
      expect(downloadSet.evolutionUnlocks).toContain(DISH_IDS.carbonara);
      expect(downloadSet.badgeAwards.map((item) => item.definitionId)).toEqual(
        expect.arrayContaining([SEED_BADGES[0]!.id, SEED_BADGES[2]!.id]),
      );
      expect(downloadSet.catalogIndex.badgeDefinitions.length).toBeGreaterThanOrEqual(
        SEED_BADGES.length,
      );
      expect(downloadSet.catalogIndex.cuisines.length).toBeGreaterThanOrEqual(10);
      expect(
        downloadSet.catalogIndex.cuisines.find((c) => c.id === CUISINE_IDS.italian)?.totalDishes,
      ).toBeGreaterThanOrEqual(3);
      expect(downloadSet.restrictionTypes).toHaveLength(19);

      // Conditional polling with matching version returns 304 Not Modified.
      const notModifiedRes = await app.inject({
        method: 'GET',
        url: `/v1/sync/download-set?version=${downloadSet.version}`,
        headers: nextSessionAuth,
      });
      expect(notModifiedRes.statusCode).toBe(304);
      expect(notModifiedRes.body).toBe('');

      // C2 / tenant isolation: Another account submitting the same rating opId succeeds cleanly
      // without cross-tenant PK collision or existence oracle.
      const secondAnonRes = await app.inject({ method: 'POST', url: '/v1/accounts/anonymous' });
      expect(secondAnonRes.statusCode).toBe(201);
      const secondUserToken = (secondAnonRes.json() as { tokens: { accessToken: string } }).tokens
        .accessToken;

      const crossTenantRatingRes = await app.inject({
        method: 'POST',
        url: '/v1/sync/operations',
        headers: { authorization: `Bearer ${secondUserToken}` },
        payload: {
          operations: [
            {
              opId: firstRatingOpId,
              type: 'rating.register',
              createdAt: '2026-11-23T15:12:00.000Z',
              payload: {
                dishId: DISH_IDS.aglioEOlio,
                score: 9,
              },
            },
          ],
        },
      });
      expect(crossTenantRatingRes.statusCode).toBe(200);
      expect(crossTenantRatingRes.json().results[0]).toMatchObject({
        opId: firstRatingOpId,
        status: 'confirmed',
        repeated: false,
      });
    } finally {
      await dbClient.pool.query(`DELETE FROM catalog_dishes WHERE id = $1`, [unverifiedDishId]);
      await app.close();
    }
  });
});
