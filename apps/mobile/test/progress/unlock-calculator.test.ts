import {
  calculateUnlocks,
  type BadgeMilestone,
  type CatalogIndexForUnlock,
  type RatingForUnlock,
  type UnlockCalculationResult,
  type UnlockState,
} from '../../src/features/progress/domain/unlock-calculator';
// ADR-016: read the same vectors as the API's UnlockRules (no copy), so new vectors run here too.
import unlockVectors from '../../../../tests/vectors/unlock-vectors.json';

interface UnlockVector {
  readonly id: string;
  readonly description: string;
  readonly input: {
    readonly rating: RatingForUnlock;
    readonly index: CatalogIndexForUnlock;
    readonly state: UnlockState;
  };
  readonly expectedOutput: UnlockCalculationResult;
}

const vectors = unlockVectors as readonly UnlockVector[];

const ALL_MILESTONE_TYPES: readonly BadgeMilestone['type'][] = [
  'dish',
  'cuisine',
  'n_cuisines',
  'all_continents',
  'set',
  'total_dishes',
  'evolution_level',
  'adaptation_count',
];

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
    Object.freeze(value);
  }
  return value;
}

describe('calculateUnlocks — shared vector parity (ADR-016)', () => {
  it('loads the shared vectors', () => {
    expect(vectors.length).toBeGreaterThan(0);
  });

  it('shared vectors exercise all 8 milestone types (R03)', () => {
    const covered = new Set(
      vectors.flatMap((vector) =>
        vector.input.index.badgeDefinitions.map((badge) => badge.milestone.type),
      ),
    );
    expect([...covered].sort()).toEqual([...ALL_MILESTONE_TYPES].sort());
  });

  it.each(vectors.map((vector) => [vector.id, vector] as const))('%s', (_id, vector) => {
    const { rating, index, state } = vector.input;
    expect(calculateUnlocks(rating, index, state)).toEqual(vector.expectedOutput);
  });
});

describe('calculateUnlocks — own rules', () => {
  const BASE = 'dish-base';
  const CHILD = 'dish-child';
  const CUISINE = 'cuisine-1';

  const index: CatalogIndexForUnlock = {
    dishes: [
      { id: BASE, cuisineId: CUISINE, baseDishId: null },
      { id: CHILD, cuisineId: CUISINE, baseDishId: BASE },
    ],
    cuisines: [{ id: CUISINE, continents: ['europe'] }],
    badgeDefinitions: [
      { id: 'badge-dish', milestone: { type: 'dish', dishId: BASE } },
      { id: 'badge-total-1', milestone: { type: 'total_dishes', quantity: 1 } },
    ],
  };

  const emptyState: UnlockState = {
    completedDishIds: [],
    adaptationRatingIds: [],
    unlockedEvolutionDishIds: [],
    awardedBadgeIds: [],
  };

  it('RN02: repeating a dish whose evolutions are already unlocked unlocks nothing new', () => {
    const state: UnlockState = {
      ...emptyState,
      completedDishIds: [BASE],
      unlockedEvolutionDishIds: [CHILD],
    };

    const result = calculateUnlocks({ id: 'rating-2', dishId: BASE, score: 7 }, index, state);

    expect(result.newEvolutionUnlocks).toEqual([]);
  });

  it('RN04: badges already awarded are never re-emitted', () => {
    const state: UnlockState = {
      ...emptyState,
      completedDishIds: [BASE],
      unlockedEvolutionDishIds: [CHILD],
      awardedBadgeIds: ['badge-dish', 'badge-total-1'],
    };

    const result = calculateUnlocks({ id: 'rating-2', dishId: BASE, score: 7 }, index, state);

    expect(result).toEqual({ newEvolutionUnlocks: [], newBadgeAwards: [] });
  });

  it('RN04: an awarded badge whose milestone no longer holds is not revoked or touched', () => {
    // The state claims a badge for a dish the user never completed; the calculator only adds.
    const state: UnlockState = { ...emptyState, awardedBadgeIds: ['badge-dish'] };

    const result = calculateUnlocks({ id: 'rating-1', dishId: CHILD, score: 6 }, index, state);

    expect(result.newBadgeAwards).toEqual(['badge-total-1']);
    expect(state.awardedBadgeIds).toEqual(['badge-dish']);
  });

  it('never mutates its inputs', () => {
    const rating = deepFreeze<RatingForUnlock>({
      id: 'rating-1',
      dishId: BASE,
      score: 9,
      changes: 'menos sal',
    });
    const frozenIndex = deepFreeze(structuredClone(index));
    const frozenState = deepFreeze(structuredClone(emptyState));

    expect(() => calculateUnlocks(rating, frozenIndex, frozenState)).not.toThrow();
    expect(frozenState).toEqual(emptyState);
  });
});
