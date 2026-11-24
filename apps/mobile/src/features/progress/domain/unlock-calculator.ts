// A6: pure TypeScript only. Parity with the API's UnlockRules comes from the shared
// tests/vectors/unlock-vectors.json, never from importing API code (ADR-016).

export const MAX_EVOLUTION_DEPTH = 10;

export type Continent = 'america' | 'africa' | 'europe' | 'asia' | 'oceania';

export const ALL_CATALOG_CONTINENTS: readonly Continent[] = [
  'america',
  'africa',
  'europe',
  'asia',
  'oceania',
];

export type BadgeMilestone =
  | { readonly type: 'dish'; readonly dishId: string }
  | { readonly type: 'cuisine'; readonly cuisineId: string }
  | { readonly type: 'n_cuisines'; readonly quantity: number }
  | { readonly type: 'all_continents' }
  | { readonly type: 'set'; readonly cuisineIds: readonly string[] }
  | { readonly type: 'total_dishes'; readonly quantity: number }
  | { readonly type: 'evolution_level'; readonly minLevel: number }
  | { readonly type: 'adaptation_count'; readonly quantity: number };

export interface RatingForUnlock {
  readonly id: string;
  readonly dishId: string;
  readonly score: number;
  readonly changes?: string | null;
}

export interface DishForUnlock {
  readonly id: string;
  readonly cuisineId: string;
  readonly baseDishId: string | null;
}

export interface CuisineForUnlock {
  readonly id: string;
  readonly continents: readonly Continent[];
}

export interface BadgeDefinitionForUnlock {
  readonly id: string;
  readonly milestone: BadgeMilestone;
}

export interface CatalogIndexForUnlock {
  readonly dishes: readonly DishForUnlock[];
  readonly cuisines: readonly CuisineForUnlock[];
  readonly badgeDefinitions: readonly BadgeDefinitionForUnlock[];
}

export interface UnlockState {
  readonly completedDishIds: readonly string[];
  readonly adaptationRatingIds: readonly string[];
  readonly unlockedEvolutionDishIds: readonly string[];
  readonly awardedBadgeIds: readonly string[];
}

export interface UnlockCalculationResult {
  readonly newEvolutionUnlocks: readonly string[];
  readonly newBadgeAwards: readonly string[];
}

/** Aggregated facts every milestone is evaluated against (shared with milestoneProgress). */
export interface MilestoneContext {
  readonly completedDishIds: ReadonlySet<string>;
  readonly completedCuisineIds: ReadonlySet<string>;
  readonly completedContinents: ReadonlySet<Continent>;
  readonly maxCompletedEvolutionDepth: number;
  readonly adaptationCount: number;
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled badge milestone variant: ${JSON.stringify(value)}`);
}

// RN03h: whitespace-only `changes` is not a real adaptation.
function hasNonEmptyAdaptation(changes: string | null | undefined): boolean {
  return typeof changes === 'string' && changes.trim().length > 0;
}

/**
 * Depth of a dish in its `baseDishId` chain (root = 1, direct child = 2, ...).
 * Cycles count as 0 and dangling ancestors stop the walk, so corrupt catalog data can
 * never inflate evolution_level; MAX_EVOLUTION_DEPTH bounds the walk (RN18).
 */
function computeDishDepth(dishId: string, dishById: ReadonlyMap<string, DishForUnlock>): number {
  const visited = new Set<string>();
  let currentId: string | null = dishId;
  let depth = 0;

  while (currentId !== null && depth < MAX_EVOLUTION_DEPTH) {
    if (visited.has(currentId)) {
      return 0;
    }
    const dish = dishById.get(currentId);
    if (!dish) {
      break;
    }
    visited.add(currentId);
    depth += 1;
    currentId = dish.baseDishId;
  }

  return depth;
}

function indexById<T extends { readonly id: string }>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

/**
 * Builds the milestone context from completed dishes and adaptation ratings.
 * Dishes absent from the catalog index are ignored (RN01: unknown dish is a no-op).
 */
export function buildMilestoneContext(
  index: CatalogIndexForUnlock,
  completedDishIds: Iterable<string>,
  adaptationRatingIds: Iterable<string>,
): MilestoneContext {
  const dishById = indexById(index.dishes);
  const cuisineById = indexById(index.cuisines);

  const knownCompletedDishIds = new Set<string>();
  const completedCuisineIds = new Set<string>();
  const completedContinents = new Set<Continent>();
  let maxCompletedEvolutionDepth = 0;

  for (const dishId of completedDishIds) {
    const dish = dishById.get(dishId);
    if (!dish) {
      continue;
    }
    knownCompletedDishIds.add(dish.id);
    completedCuisineIds.add(dish.cuisineId);

    for (const continent of cuisineById.get(dish.cuisineId)?.continents ?? []) {
      completedContinents.add(continent);
    }

    maxCompletedEvolutionDepth = Math.max(
      maxCompletedEvolutionDepth,
      computeDishDepth(dish.id, dishById),
    );
  }

  return {
    completedDishIds: knownCompletedDishIds,
    completedCuisineIds,
    completedContinents,
    maxCompletedEvolutionDepth,
    adaptationCount: new Set(adaptationRatingIds).size,
  };
}

function isMilestoneSatisfied(milestone: BadgeMilestone, context: MilestoneContext): boolean {
  // R03 / ADR-016: exhaustive over the 8 RN03 (a-h) variants; a new variant fails typecheck here.
  switch (milestone.type) {
    case 'dish':
      return context.completedDishIds.has(milestone.dishId);
    case 'cuisine':
      return context.completedCuisineIds.has(milestone.cuisineId);
    case 'n_cuisines':
      return context.completedCuisineIds.size >= milestone.quantity;
    case 'all_continents':
      return ALL_CATALOG_CONTINENTS.every((continent) =>
        context.completedContinents.has(continent),
      );
    case 'set':
      // An empty set is a misconfigured badge, never a free award.
      return (
        milestone.cuisineIds.length > 0 &&
        milestone.cuisineIds.every((cuisineId) => context.completedCuisineIds.has(cuisineId))
      );
    case 'total_dishes':
      return context.completedDishIds.size >= milestone.quantity;
    case 'evolution_level':
      return context.maxCompletedEvolutionDepth >= milestone.minLevel;
    case 'adaptation_count':
      return context.adaptationCount >= milestone.quantity;
    default:
      return assertNever(milestone);
  }
}

/**
 * Pure, deterministic, additive unlock calculator for evolutions and badges
 * (RN01-RN04, RN07, RN18, R03, A6, A12). Inputs are never mutated.
 */
export function calculateUnlocks(
  rating: RatingForUnlock,
  index: CatalogIndexForUnlock,
  state: UnlockState,
): UnlockCalculationResult {
  const ratedDishExists = index.dishes.some((dish) => dish.id === rating.dishId);

  const completedDishIds = [...state.completedDishIds];
  const adaptationRatingIds = [...state.adaptationRatingIds];
  if (ratedDishExists) {
    completedDishIds.push(rating.dishId);
    if (hasNonEmptyAdaptation(rating.changes)) {
      adaptationRatingIds.push(rating.id);
    }
  }

  // RN02: completing a dish unlocks only its direct evolutions, and only once.
  const unlockedEvolutions = new Set(state.unlockedEvolutionDishIds);
  const newEvolutionUnlocks: string[] = [];
  if (ratedDishExists) {
    for (const dish of index.dishes) {
      if (dish.baseDishId === rating.dishId && !unlockedEvolutions.has(dish.id)) {
        unlockedEvolutions.add(dish.id);
        newEvolutionUnlocks.push(dish.id);
      }
    }
  }

  const context = buildMilestoneContext(index, completedDishIds, adaptationRatingIds);

  // RN04: additive only — awarded badges are never re-emitted nor revoked.
  const awardedBadges = new Set(state.awardedBadgeIds);
  const newBadgeAwards: string[] = [];
  for (const badge of index.badgeDefinitions) {
    if (!awardedBadges.has(badge.id) && isMilestoneSatisfied(badge.milestone, context)) {
      awardedBadges.add(badge.id);
      newBadgeAwards.push(badge.id);
    }
  }

  return { newEvolutionUnlocks, newBadgeAwards };
}
