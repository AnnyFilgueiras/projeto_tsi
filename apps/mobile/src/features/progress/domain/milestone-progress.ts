import {
  ALL_CATALOG_CONTINENTS,
  assertNever,
  buildMilestoneContext,
  type BadgeDefinitionForUnlock,
  type CatalogIndexForUnlock,
  type MilestoneContext,
  type UnlockState,
} from './unlock-calculator';

export interface MilestoneProgress {
  readonly current: number;
  readonly target: number;
}

function rawProgress(
  milestone: BadgeDefinitionForUnlock['milestone'],
  context: MilestoneContext,
): MilestoneProgress {
  // R03: exhaustive over the 8 RN03 variants, mirroring isMilestoneSatisfied in unlock-calculator.
  switch (milestone.type) {
    case 'dish':
      return { current: context.completedDishIds.has(milestone.dishId) ? 1 : 0, target: 1 };
    case 'cuisine':
      return { current: context.completedCuisineIds.has(milestone.cuisineId) ? 1 : 0, target: 1 };
    case 'n_cuisines':
      return { current: context.completedCuisineIds.size, target: milestone.quantity };
    case 'all_continents':
      return {
        current: ALL_CATALOG_CONTINENTS.filter((continent) =>
          context.completedContinents.has(continent),
        ).length,
        target: ALL_CATALOG_CONTINENTS.length,
      };
    case 'set':
      // An empty set is never awarded by calculateUnlocks, so it must never render as complete.
      if (milestone.cuisineIds.length === 0) {
        return { current: 0, target: 1 };
      }
      return {
        current: milestone.cuisineIds.filter((cuisineId) =>
          context.completedCuisineIds.has(cuisineId),
        ).length,
        target: milestone.cuisineIds.length,
      };
    case 'total_dishes':
      return { current: context.completedDishIds.size, target: milestone.quantity };
    case 'evolution_level':
      return { current: context.maxCompletedEvolutionDepth, target: milestone.minLevel };
    case 'adaptation_count':
      return { current: context.adaptationCount, target: milestone.quantity };
    default:
      return assertNever(milestone);
  }
}

/**
 * Progress towards a badge for the "Próximos marcos" bars (US16, goal-gradient N20),
 * from the accumulated state only. `current` is capped at `target` so the UI never shows
 * "7 of 5"; an achieved milestone always yields `current === target`.
 */
export function milestoneProgress(
  definition: BadgeDefinitionForUnlock,
  state: UnlockState,
  index: CatalogIndexForUnlock,
): MilestoneProgress {
  const context = buildMilestoneContext(index, state.completedDishIds, state.adaptationRatingIds);
  const { current, target } = rawProgress(definition.milestone, context);
  return { current: Math.min(current, target), target };
}
