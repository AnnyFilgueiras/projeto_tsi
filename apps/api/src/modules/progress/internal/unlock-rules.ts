import type { Continent } from '../../catalog/public/catalog-read.js';
import type { BadgeMilestone } from './schema.js';

export const MAX_EVOLUTION_DEPTH = 10;

const ALL_CATALOG_CONTINENTS: readonly Continent[] = [
  'america',
  'africa',
  'europe',
  'asia',
  'oceania',
] as const;

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

interface MilestoneEvaluationContext {
  readonly completedDishIds: ReadonlySet<string>;
  readonly completedCuisineIds: ReadonlySet<string>;
  readonly completedContinents: ReadonlySet<Continent>;
  readonly maxCompletedEvolutionDepth: number;
  readonly adaptationCount: number;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled badge milestone variant: ${JSON.stringify(value)}`);
}

function hasNonEmptyAdaptation(changes: string | null | undefined): boolean {
  return typeof changes === 'string' && changes.trim().length > 0;
}

/**
 * Computes depth of a dish in its `baseDishId` evolution chain (root = 1, direct child = 2, ...).
 * Stops safely on cyclic pointers, dangling ancestors, or MAX_EVOLUTION_DEPTH (RN18, ADR-016).
 */
function computeDishDepth(dishId: string, dishById: ReadonlyMap<string, DishForUnlock>): number {
  const visited = new Set<string>();
  let currentId: string | null = dishId;
  let depth = 0;

  while (currentId !== null && depth < MAX_EVOLUTION_DEPTH) {
    if (visited.has(currentId)) {
      // A cyclic chain has no valid root dish, so it must never inflate evolution depth.
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

function isMilestoneSatisfied(
  milestone: BadgeMilestone,
  context: MilestoneEvaluationContext,
): boolean {
  // R03 / ADR-016: Exhaustive switch over the 8 declarative RN03 (a-h) milestone variants.
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
 * Pure, deterministic additive unlock calculator for evolutions and badges
 * (RN01-RN07, RN18, R03, ADR-016, A12).
 *
 * Parity with mobile `UnlockCalculator` is enforced via `tests/vectors/unlock-vectors.json`.
 */
export function calculateUnlocks(
  rating: RatingForUnlock,
  index: CatalogIndexForUnlock,
  state: UnlockState,
): UnlockCalculationResult {
  const dishById = new Map<string, DishForUnlock>();
  for (const dish of index.dishes) {
    dishById.set(dish.id, dish);
  }

  const cuisineById = new Map<string, CuisineForUnlock>();
  for (const cuisine of index.cuisines) {
    cuisineById.set(cuisine.id, cuisine);
  }

  const completedDishIds = new Set<string>();
  for (const dishId of state.completedDishIds) {
    if (dishById.has(dishId)) {
      completedDishIds.add(dishId);
    }
  }

  const ratedDishExists = dishById.has(rating.dishId);
  if (ratedDishExists) {
    completedDishIds.add(rating.dishId);
  }

  const adaptationRatingIds = new Set<string>(state.adaptationRatingIds);
  if (ratedDishExists && hasNonEmptyAdaptation(rating.changes)) {
    adaptationRatingIds.add(rating.id);
  }

  const alreadyUnlockedEvolutions = new Set<string>(state.unlockedEvolutionDishIds);
  const newEvolutionUnlocks: string[] = [];

  // RN02: Completing a base dish unlocks all its direct evolutions that are not yet unlocked.
  if (ratedDishExists) {
    for (const dish of index.dishes) {
      if (dish.baseDishId === rating.dishId && !alreadyUnlockedEvolutions.has(dish.id)) {
        alreadyUnlockedEvolutions.add(dish.id);
        newEvolutionUnlocks.push(dish.id);
      }
    }
  }

  const completedCuisineIds = new Set<string>();
  const completedContinents = new Set<Continent>();
  let maxCompletedEvolutionDepth = 0;

  for (const dishId of completedDishIds) {
    const dish = dishById.get(dishId);
    if (!dish) {
      continue;
    }

    completedCuisineIds.add(dish.cuisineId);

    const cuisine = cuisineById.get(dish.cuisineId);
    if (cuisine) {
      for (const continent of cuisine.continents) {
        completedContinents.add(continent);
      }
    }

    const depth = computeDishDepth(dish.id, dishById);
    if (depth > maxCompletedEvolutionDepth) {
      maxCompletedEvolutionDepth = depth;
    }
  }

  const context: MilestoneEvaluationContext = {
    completedDishIds,
    completedCuisineIds,
    completedContinents,
    maxCompletedEvolutionDepth,
    adaptationCount: adaptationRatingIds.size,
  };

  // RN04: Additive only — badges already granted are never re-emitted or revoked.
  const alreadyAwardedBadges = new Set<string>(state.awardedBadgeIds);
  const newBadgeAwards: string[] = [];

  for (const badge of index.badgeDefinitions) {
    if (alreadyAwardedBadges.has(badge.id)) {
      continue;
    }
    if (isMilestoneSatisfied(badge.milestone, context)) {
      alreadyAwardedBadges.add(badge.id);
      newBadgeAwards.push(badge.id);
    }
  }

  return {
    newEvolutionUnlocks,
    newBadgeAwards,
  };
}
