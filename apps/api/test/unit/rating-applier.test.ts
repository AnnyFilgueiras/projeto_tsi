import { describe, expect, it } from 'vitest';
import type {
  CatalogDishSummaryDto,
  CatalogReadPort,
  CuisineDto,
} from '../../src/modules/catalog/public/catalog-read.js';
import { createRatingApplier } from '../../src/modules/progress/internal/rating-applier.js';
import type {
  BadgeAwardRecord,
  BadgeDefinitionRecord,
  ProgressStore,
  RatingRecord,
} from '../../src/modules/progress/internal/repository.js';
import type { UnlockState } from '../../src/modules/progress/internal/unlock-rules.js';
import type { Tx } from '../../src/shared/tx.js';

const FAKE_TX = {} as Tx;
const ACCOUNT_ID = '11111111-1111-4111-8111-111111111111';
const CUISINE_IT = '22222222-2222-4222-8222-222222222201';
const DISH_BASE = '33333333-3333-4333-8333-333333333301';
const DISH_EVOLUTION = '33333333-3333-4333-8333-333333333302';
const BADGE_FIRST = '44444444-4444-4444-8444-444444444401';
const BADGE_ADAPT = '44444444-4444-4444-8444-444444444402';

class InMemoryProgressStore implements ProgressStore {
  readonly ratings: RatingRecord[] = [];
  readonly evolutionUnlocks = new Map<string, Set<string>>();
  readonly badgeAwards = new Map<string, BadgeAwardRecord[]>();
  readonly badgeDefinitions: BadgeDefinitionRecord[] = [
    {
      id: BADGE_FIRST,
      name: 'Primeiro Fogo',
      description: 'Primeiro prato concluído.',
      milestone: { type: 'total_dishes', quantity: 1 },
    },
    {
      id: BADGE_ADAPT,
      name: 'Toque Pessoal',
      description: 'Primeira adaptação registrada.',
      milestone: { type: 'adaptation_count', quantity: 1 },
    },
  ];

  async acquireUserLock(_accountId: string, _tx: Tx): Promise<void> {}

  async insertRating(record: RatingRecord, _tx: Tx): Promise<boolean> {
    if (this.ratings.some((item) => item.userId === record.userId && item.id === record.id)) {
      return false;
    }
    this.ratings.push(record);
    return true;
  }

  async getUnlockState(accountId: string, _tx?: Tx): Promise<UnlockState> {
    const userRatings = this.ratings.filter((item) => item.userId === accountId);
    const completedDishIds = [...new Set(userRatings.map((item) => item.dishId))];
    const adaptationRatingIds = userRatings
      .filter((item) => item.changes !== null && item.changes.trim().length > 0)
      .map((item) => item.id);
    const unlockedEvolutionDishIds = [...(this.evolutionUnlocks.get(accountId) ?? [])];
    const awardedBadgeIds = (this.badgeAwards.get(accountId) ?? []).map(
      (award) => award.definitionId,
    );

    return {
      completedDishIds,
      adaptationRatingIds,
      unlockedEvolutionDishIds,
      awardedBadgeIds,
    };
  }

  async listBadgeDefinitions(_tx?: Tx): Promise<readonly BadgeDefinitionRecord[]> {
    return this.badgeDefinitions;
  }

  async insertEvolutionUnlocks(
    accountId: string,
    dishIds: readonly string[],
    _unlockedAt: Date,
    _tx: Tx,
  ): Promise<void> {
    const existing = this.evolutionUnlocks.get(accountId) ?? new Set<string>();
    for (const dishId of dishIds) {
      existing.add(dishId);
    }
    this.evolutionUnlocks.set(accountId, existing);
  }

  async insertBadgeAwards(
    accountId: string,
    definitionIds: readonly string[],
    unlockedAt: Date,
    _tx: Tx,
  ): Promise<void> {
    const existing = this.badgeAwards.get(accountId) ?? [];
    for (const definitionId of definitionIds) {
      if (!existing.some((item) => item.definitionId === definitionId)) {
        existing.push({ definitionId, unlockedAt: unlockedAt.toISOString() });
      }
    }
    this.badgeAwards.set(accountId, existing);
  }
}

function createFakeCatalogRead(): CatalogReadPort {
  const dishes: CatalogDishSummaryDto[] = [
    {
      dishId: DISH_BASE,
      name: 'Massa ao Pomodoro',
      cuisineId: CUISINE_IT,
      baseDishId: null,
      prepTimeMinutes: 25,
      difficulty: 'easy',
      allergens: ['trigo_centeio_cevada_aveia'],
      allergenState: 'verified',
      confirmedAllergenFree: false,
      photoHash: null,
      updatedAt: '2026-11-22T00:00:00.000Z',
    },
    {
      dishId: DISH_EVOLUTION,
      name: 'Nhoque Artesanal',
      cuisineId: CUISINE_IT,
      baseDishId: DISH_BASE,
      prepTimeMinutes: 45,
      difficulty: 'medium',
      allergens: ['trigo_centeio_cevada_aveia'],
      allergenState: 'verified',
      confirmedAllergenFree: false,
      photoHash: null,
      updatedAt: '2026-11-22T00:00:00.000Z',
    },
  ];
  const cuisines: CuisineDto[] = [{ id: CUISINE_IT, name: 'Italiana', continents: ['europe'] }];

  return {
    getApprovedRecipe: async () => null,
    listApprovedDishes: async () => dishes,
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
    getCatalogIndex: async () => ({ dishes, cuisines }),
  };
}

describe('RatingApplier (UC10, RN01-RN06, P01, T01)', () => {
  it('RN01 / RN02 / RN03 / RN05: persists rating with id = opId, unlocks level-2 evolution and eligible badges, and preserves history on repeat', async () => {
    const store = new InMemoryProgressStore();
    const applier = createRatingApplier({
      store,
      catalogRead: createFakeCatalogRead(),
      clock: () => new Date('2026-11-23T12:00:00.000Z'),
    });

    const firstOpId = '55555555-5555-4555-8555-555555555501';
    const firstResult = await applier.apply(
      {
        opId: firstOpId,
        type: 'rating.register',
        createdAt: '2026-11-23T11:55:00.000Z',
        payload: {
          dishId: DISH_BASE,
          score: 8,
          comment: 'Ficou ótimo!',
          changes: 'Troquei manjericão fresco por sálvia',
        },
      },
      { accountId: ACCOUNT_ID, tx: FAKE_TX },
    );

    expect(firstResult).toEqual({
      status: 'confirmed',
      unlocks: {
        evolutions: [DISH_EVOLUTION],
        badgeAwards: [BADGE_FIRST, BADGE_ADAPT],
      },
    });
    expect(store.ratings).toHaveLength(1);
    expect(store.ratings[0]?.id).toBe(firstOpId);

    // RN06 / RN02 / RN04: Repeat rating with new opId preserves both ratings and does not re-unlock.
    const secondOpId = '55555555-5555-4555-8555-555555555502';
    const secondResult = await applier.apply(
      {
        opId: secondOpId,
        type: 'rating.register',
        createdAt: '2026-11-23T13:00:00.000Z',
        payload: {
          dishId: DISH_BASE,
          score: 10,
        },
      },
      { accountId: ACCOUNT_ID, tx: FAKE_TX },
    );

    expect(secondResult).toEqual({
      status: 'confirmed',
      unlocks: {
        evolutions: [],
        badgeAwards: [],
      },
    });
    expect(store.ratings).toHaveLength(2);
    expect(store.ratings.map((item) => item.id)).toEqual([firstOpId, secondOpId]);
  });

  it('RN05: permanently rejects out-of-range or non-integer scores without persisting', async () => {
    const store = new InMemoryProgressStore();
    const applier = createRatingApplier({
      store,
      catalogRead: createFakeCatalogRead(),
    });

    const outOfRange = await applier.apply(
      {
        opId: '55555555-5555-4555-8555-555555555503',
        type: 'rating.register',
        createdAt: '2026-11-23T12:00:00.000Z',
        payload: { dishId: DISH_BASE, score: 11 },
      },
      { accountId: ACCOUNT_ID, tx: FAKE_TX },
    );

    expect(outOfRange.status).toBe('rejected');
    expect(outOfRange.error?.status).toBe(422);
    expect(store.ratings).toHaveLength(0);

    const fractional = await applier.apply(
      {
        opId: '55555555-5555-4555-8555-555555555504',
        type: 'rating.register',
        createdAt: '2026-11-23T12:00:00.000Z',
        payload: { dishId: DISH_BASE, score: 4.5 },
      },
      { accountId: ACCOUNT_ID, tx: FAKE_TX },
    );

    expect(fractional.status).toBe('rejected');
    expect(fractional.error?.status).toBe(422);
    expect(store.ratings).toHaveLength(0);
  });

  it('UC10: permanently rejects unknown dishId with 404 problem without aborting batch', async () => {
    const store = new InMemoryProgressStore();
    const applier = createRatingApplier({
      store,
      catalogRead: createFakeCatalogRead(),
    });

    const result = await applier.apply(
      {
        opId: '55555555-5555-4555-8555-555555555505',
        type: 'rating.register',
        createdAt: '2026-11-23T12:00:00.000Z',
        payload: {
          dishId: '99999999-9999-4999-8999-999999999999',
          score: 8,
        },
      },
      { accountId: ACCOUNT_ID, tx: FAKE_TX },
    );

    expect(result).toMatchObject({
      status: 'rejected',
      error: { type: 'not-found', status: 404 },
    });
    expect(store.ratings).toHaveLength(0);
  });
});
