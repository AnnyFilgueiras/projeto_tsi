import { PACKAGE_VERSION, type AllergenCode } from '@panelada/allergen-rules/rules';
import { describe, expect, it } from 'vitest';
import { SuggestionService } from '../../src/cross-cutting/suggestion-search/internal/service.js';
import type {
  CatalogDishSummaryDto,
  CatalogReadPort,
} from '../../src/modules/catalog/public/catalog-read.js';
import type { ProfileQueryPort } from '../../src/modules/profile/public/profile-query.js';
import type { RestrictionsForFilterPort } from '../../src/modules/profile/public/restrictions-for-filter.js';
import type { ProgressPublicPort } from '../../src/modules/progress/public/progress-public.js';
import type {
  RoutinePublicPort,
  SuggestionRecord,
} from '../../src/modules/routine/public/routine-public.js';

const ACCOUNT_ID = '11111111-1111-4111-8111-111111111111';
const CUISINE_THAI = '22222222-2222-4222-8222-222222222201';
const CUISINE_JP = '22222222-2222-4222-8222-222222222202';
const CUISINE_FR = '22222222-2222-4222-8222-222222222203';

const DISH_PEANUT = '33333333-3333-4333-8333-333333333301';
const DISH_UNVERIFIED = '33333333-3333-4333-8333-333333333302';
const DISH_SAFE_JP = '33333333-3333-4333-8333-333333333303';
const DISH_SAFE_FR = '33333333-3333-4333-8333-333333333304';
const DISH_COMPLETED = '33333333-3333-4333-8333-333333333305';
const DISH_DISCARDED = '33333333-3333-4333-8333-333333333306';
const DISH_CANDIDATE = '33333333-3333-4333-8333-333333333307';

const SAMPLE_DISHES: readonly CatalogDishSummaryDto[] = [
  {
    dishId: DISH_PEANUT,
    name: 'Pad Thai com Amendoim',
    cuisineId: CUISINE_THAI,
    baseDishId: null,
    prepTimeMinutes: 30,
    difficulty: 'medium',
    allergens: ['amendoim'],
    allergenState: 'verified',
    confirmedAllergenFree: false,
    photoHash: 'a'.repeat(64),
    updatedAt: '2026-11-22T00:00:00.000Z',
  },
  {
    dishId: DISH_UNVERIFIED,
    name: 'Curry Sem Verificação',
    cuisineId: CUISINE_THAI,
    baseDishId: null,
    prepTimeMinutes: 35,
    difficulty: 'medium',
    allergens: [],
    allergenState: 'unverified',
    confirmedAllergenFree: false,
    photoHash: 'b'.repeat(64),
    updatedAt: '2026-11-22T00:00:00.000Z',
  },
  {
    dishId: DISH_SAFE_FR,
    name: 'Ratatouille',
    cuisineId: CUISINE_FR,
    baseDishId: null,
    prepTimeMinutes: 40,
    difficulty: 'easy',
    allergens: [],
    allergenState: 'verified',
    confirmedAllergenFree: true,
    photoHash: 'c'.repeat(64),
    updatedAt: '2026-11-22T00:00:00.000Z',
  },
  {
    dishId: DISH_SAFE_JP,
    name: 'Arroz Japonês com Gergelim',
    cuisineId: CUISINE_JP,
    baseDishId: null,
    prepTimeMinutes: 20,
    difficulty: 'easy',
    allergens: [],
    allergenState: 'verified',
    confirmedAllergenFree: true,
    photoHash: 'd'.repeat(64),
    updatedAt: '2026-11-22T00:00:00.000Z',
  },
  {
    dishId: DISH_COMPLETED,
    name: 'Prato Já Concluído',
    cuisineId: CUISINE_JP,
    baseDishId: null,
    prepTimeMinutes: 15,
    difficulty: 'easy',
    allergens: [],
    allergenState: 'verified',
    confirmedAllergenFree: true,
    photoHash: null,
    updatedAt: '2026-11-22T00:00:00.000Z',
  },
  {
    dishId: DISH_DISCARDED,
    name: 'Prato Descartado na Sessão',
    cuisineId: CUISINE_JP,
    baseDishId: null,
    prepTimeMinutes: 15,
    difficulty: 'easy',
    allergens: [],
    allergenState: 'verified',
    confirmedAllergenFree: true,
    photoHash: null,
    updatedAt: '2026-11-22T00:00:00.000Z',
  },
  {
    dishId: DISH_CANDIDATE,
    name: 'Prato Já Candidato',
    cuisineId: CUISINE_JP,
    baseDishId: null,
    prepTimeMinutes: 15,
    difficulty: 'easy',
    allergens: [],
    allergenState: 'verified',
    confirmedAllergenFree: true,
    photoHash: null,
    updatedAt: '2026-11-22T00:00:00.000Z',
  },
];

// Evolution of Ratatouille (RN02): stays a mystery until Ratatouille is completed (#86).
const DISH_EVOLUTION_FR = '33333333-3333-4333-8333-333333333308';
const EVOLUTION_FR: CatalogDishSummaryDto = {
  dishId: DISH_EVOLUTION_FR,
  name: 'Tian Provençal',
  cuisineId: CUISINE_FR,
  baseDishId: DISH_SAFE_FR,
  prepTimeMinutes: 50,
  difficulty: 'medium',
  allergens: [],
  allergenState: 'verified',
  confirmedAllergenFree: true,
  photoHash: 'f'.repeat(64),
  updatedAt: '2026-11-22T00:00:00.000Z',
};

function createDeps(overrides?: {
  dishes?: readonly CatalogDishSummaryDto[];
  restrictions?: readonly AllergenCode[];
  preferences?: readonly string[];
  completedDishIds?: readonly string[];
  candidateDishIds?: readonly string[];
  discardedDishIdsInSession?: readonly string[];
}) {
  const loggedEvents: Array<{ readonly bindings: Record<string, unknown>; readonly msg: string }> =
    [];

  const catalogRead: CatalogReadPort = {
    getApprovedRecipe: async () => null,
    listApprovedDishes: async () => overrides?.dishes ?? SAMPLE_DISHES,
    getCuisineById: async () => null,
    getIngredientsByIds: async () => new Map(),
    getUtensilsByIds: async () => new Map(),
    getSubstitutionsForIngredients: async () => [],
    getBaseDishChain: async () => ({
      exists: false,
      depthFromRoot: 0,
      hasCycle: false,
      descendantDepth: 0,
    }),
    getCatalogIndex: async () => ({ dishes: SAMPLE_DISHES, cuisines: [] }),
  };

  const restrictionsForFilter: RestrictionsForFilterPort = {
    getActiveRestrictionCodes: async () => overrides?.restrictions ?? ['amendoim'],
  };

  const profileQuery: ProfileQueryPort = {
    getPreferences: async () => overrides?.preferences ?? [CUISINE_FR],
    getPantryAndUtensils: async () => ({ pantryIngredientIds: [], utensilIds: [] }),
    getProfileSummary: async () => ({
      culinaryPreferences: overrides?.preferences ?? [CUISINE_FR],
    }),
    listRestrictionTypes: async () => [],
  };

  const progressPublic: ProgressPublicPort = {
    getCompletedDishIds: async () => overrides?.completedDishIds ?? [DISH_COMPLETED],
    getProgressSnapshot: async () => ({
      ratings: [],
      badgeAwards: [],
      evolutionUnlocks: [],
      badgeDefinitions: [],
    }),
    deleteData: async () => {},
  };

  const routinePublic: RoutinePublicPort = {
    getSuggestionExclusions: async () => ({
      candidateDishIds: overrides?.candidateDishIds ?? [DISH_CANDIDATE],
      discardedDishIdsInSession: overrides?.discardedDishIdsInSession ?? [DISH_DISCARDED],
    }),
    registerPresentedSuggestions: async (accountId, dishIds, sessionKey) =>
      dishIds.map((dishId, idx): SuggestionRecord => ({
        id: `66666666-6666-4666-8666-66666666660${idx + 1}`,
        userId: accountId,
        dishId,
        status: 'presented',
        sessionKey,
        presentedAt: '2026-11-23T12:00:00.000Z',
        decidedAt: null,
      })),
    approveSuggestion: async () => {
      throw new Error('not used in this unit test');
    },
    discardSuggestion: async () => {
      throw new Error('not used in this unit test');
    },
    listCandidateSuggestions: async () => [],
    deleteData: async () => {},
  };

  const logger = {
    info(bindings: Record<string, unknown>, msg: string) {
      loggedEvents.push({ bindings, msg });
    },
  };

  return {
    loggedEvents,
    service: new SuggestionService({
      catalogRead,
      restrictionsForFilter,
      profileQuery,
      progressPublic,
      routinePublic,
      logger,
    }),
  };
}

describe('SuggestionService (UC01, RN08, RN10, RN11, A06, A13)', () => {
  it('RN08 / RN10 / RN11: excludes incompatible, unverified, completed, candidate, and discarded-in-session dishes, and prioritizes preferred cuisines', async () => {
    const { service, loggedEvents } = createDeps();

    const response = await service.getSuggestions({
      accountId: ACCOUNT_ID,
      sessionKey: 'session-1',
      limit: 10,
      usePantry: false,
      clientAllergenPackageVersion: '0.9.0',
    });

    expect(response.minPackageVersion).toBe(PACKAGE_VERSION);
    expect(response.noResult).toBe(false);
    // CUISINE_FR (Ratatouille) is preferred over CUISINE_JP even though Arroz comes first alphabetically.
    expect(response.suggestions.map((item) => item.dish.dishId)).toEqual([
      DISH_SAFE_FR,
      DISH_SAFE_JP,
    ]);

    // ADR-014 §8-9 / A13 × A05: Aggregate classification counts logged without accountId or restrictions.
    expect(loggedEvents).toHaveLength(1);
    const serializedLog = JSON.stringify(loggedEvents[0]);
    expect(serializedLog).not.toContain(ACCOUNT_ID);
    expect(serializedLog).not.toContain('amendoim');
    expect(loggedEvents[0]?.bindings).toMatchObject({
      allergenPackageVersion: PACKAGE_VERSION,
      compatible: 5,
      incompatible: 1,
      unconfirmed: 1,
    });
  });

  it('RN02 / #86: holds back an evolution until its base dish is completed', async () => {
    const dishes = [...SAMPLE_DISHES, EVOLUTION_FR];
    const input = { accountId: ACCOUNT_ID, sessionKey: 'session-1', limit: 10, usePantry: false };

    const before = await createDeps({ dishes }).service.getSuggestions(input);
    const after = await createDeps({
      dishes,
      completedDishIds: [DISH_COMPLETED, DISH_SAFE_FR],
    }).service.getSuggestions(input);

    expect(before.suggestions.map((item) => item.dish.dishId)).not.toContain(DISH_EVOLUTION_FR);
    expect(after.suggestions.map((item) => item.dish.dishId)).toEqual([
      DISH_EVOLUTION_FR,
      DISH_SAFE_JP,
    ]);
  });

  it('RN08 / UC01: returns noResult=true when all compatible dishes are already exhausted', async () => {
    const { service } = createDeps({
      completedDishIds: [DISH_COMPLETED, DISH_SAFE_FR, DISH_SAFE_JP],
    });

    const response = await service.getSuggestions({
      accountId: ACCOUNT_ID,
      sessionKey: 'session-1',
      limit: 10,
      usePantry: false,
    });

    expect(response.suggestions).toEqual([]);
    expect(response.noResult).toBe(true);
    expect(response.minPackageVersion).toBe(PACKAGE_VERSION);
  });

  it('MVP-04C1: DishSummary copies the catalog allergenState of each dish, including non-verified ones when there are no restrictions', async () => {
    const { service } = createDeps({ restrictions: [] });

    const response = await service.getSuggestions({
      accountId: ACCOUNT_ID,
      sessionKey: 'session-1',
      limit: 20,
      usePantry: false,
    });

    const stateByDishId = new Map(
      response.suggestions.map((item) => [item.dish.dishId, item.dish.allergenState]),
    );
    expect(stateByDishId.get(DISH_UNVERIFIED)).toBe('unverified');
    expect(stateByDishId.get(DISH_SAFE_FR)).toBe('verified');
  });
});
