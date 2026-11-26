// Pure: no React Native, no core/ (same discipline as UnlockCalculator, A6).

export interface HintCatalog {
  readonly dishes: readonly {
    readonly id: string;
    readonly name: string;
    readonly cuisineId: string;
    readonly baseDishId?: string | null;
  }[];
  readonly cuisines: readonly { readonly id: string; readonly name: string }[];
}

export interface HintContext {
  readonly catalog: HintCatalog;
  /** Dishes with at least one saved Rating (completed dishes, RN03). */
  readonly ratedDishIds: readonly string[];
  readonly unlockedEvolutionIds: readonly string[];
}

export type CuriosityHint =
  // No name: an evolution stays a mystery until its base dish is completed (#86, format C).
  { readonly kind: 'evolution' } | { readonly kind: 'first-cuisine'; readonly cuisineName: string };

/**
 * Picks the single curiosity hint for a suggestion card (UX-01B N04/N05). One hint at most so the
 * card stays a nudge, not a list: a locked evolution (CD6/CD2) beats a new cuisine (CD7/CD4).
 */
export function pickCuriosityHint(
  dish: { readonly dishId: string; readonly cuisineId: string },
  context: HintContext,
): CuriosityHint | null {
  const { catalog } = context;

  const unlocked = new Set(context.unlockedEvolutionIds);
  const opensLockedEvolution = catalog.dishes.some(
    (candidate) => candidate.baseDishId === dish.dishId && !unlocked.has(candidate.id),
  );
  if (opensLockedEvolution) return { kind: 'evolution' };

  // Without the cuisine in the synced index there is no name to show, so no hint at all.
  const cuisine = catalog.cuisines.find((candidate) => candidate.id === dish.cuisineId);
  if (!cuisine) return null;

  const rated = new Set(context.ratedDishIds);
  const cuisineAlreadyRated = catalog.dishes.some(
    (candidate) => candidate.cuisineId === cuisine.id && rated.has(candidate.id),
  );
  return cuisineAlreadyRated ? null : { kind: 'first-cuisine', cuisineName: cuisine.name };
}
