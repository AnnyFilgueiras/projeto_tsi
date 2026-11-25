import { completedDishIdsOf, cuisineProgressFor, type ProgressSnapshot } from './progress-model';

/**
 * Celebration read model (§9, #84): what the rating just changed, rebuilt from the local
 * snapshot plus the ids the Rating screen passes on navigation (#83 contract). Data only; the
 * screen owns the wording.
 */

export interface CelebrationParams {
  readonly dishId: string;
  readonly ratingId: string;
  readonly evolutionIds: readonly string[];
  readonly badgeIds: readonly string[];
  readonly isRepeat: boolean;
}

export interface CuisineStep {
  readonly completed: number;
  readonly total: number;
  /** Integer 0–100. */
  readonly percent: number;
  readonly missing: number;
}

export interface CelebrationView {
  /** Null when the dish is not in the local catalog (the screen falls back to a generic title). */
  readonly dishName: string | null;
  /** 0–5 in half steps; null when the rating is not in the local copy. */
  readonly stars: number | null;
  readonly isRepeat: boolean;
  /** Only on a first preparation of a catalog dish: a repeat changes no progress (RN01/RN07). */
  readonly cuisine: {
    readonly name: string;
    readonly before: CuisineStep;
    readonly after: CuisineStep;
  } | null;
  readonly evolutions: readonly { readonly dishId: string; readonly name: string }[];
  readonly badges: readonly {
    readonly badgeId: string;
    readonly name: string;
    readonly description: string;
  }[];
  /** Preparations of this dish in the history, the one just saved included (RN06). */
  readonly repeatCount: number;
  /** Which Collection view "Ver na Coleção" opens (#85). */
  readonly collectionView: 'badges' | 'cuisines';
}

type RawParam = string | readonly string[] | undefined;

/** Route params as expo-router hands them over: `evolutions`/`badges` are comma-separated ids. */
export function parseCelebrationParams(raw: Readonly<Record<string, RawParam>>): CelebrationParams {
  return {
    dishId: first(raw.dishId),
    ratingId: first(raw.ratingId),
    evolutionIds: idList(raw.evolutions),
    badgeIds: idList(raw.badges),
    isRepeat: first(raw.repeat) === '1',
  };
}

export function buildCelebration(
  snapshot: ProgressSnapshot,
  params: CelebrationParams,
): CelebrationView {
  const { catalog } = snapshot;
  const dish = catalog.dishes.find((candidate) => candidate.id === params.dishId);
  const rating = snapshot.ratings.find((candidate) => candidate.id === params.ratingId);
  const dishById = new Map(catalog.dishes.map((candidate) => [candidate.id, candidate]));
  const badgeById = new Map(catalog.badgeDefinitions.map((badge) => [badge.id, badge]));

  // Unknown ids (catalog changed between the rating and this read) are skipped, never shown blank.
  const evolutions = params.evolutionIds.flatMap((id) => {
    const evolution = dishById.get(id);
    return evolution ? [{ dishId: evolution.id, name: evolution.name }] : [];
  });
  const badges = params.badgeIds.flatMap((id) => {
    const badge = badgeById.get(id);
    return badge ? [{ badgeId: badge.id, name: badge.name, description: badge.description }] : [];
  });

  return {
    dishName: dish?.name ?? null,
    stars: rating ? rating.score / 2 : null,
    isRepeat: params.isRepeat,
    cuisine: params.isRepeat || !dish ? null : cuisineStepsOf(snapshot, dish),
    evolutions,
    badges,
    repeatCount: snapshot.ratings.filter((candidate) => candidate.dishId === params.dishId).length,
    collectionView: badges.length > 0 ? 'badges' : 'cuisines',
  };
}

/**
 * The rating is already in the snapshot, so "after" is the current state and "before" is the
 * same count without this dish; the bar animates between the two.
 */
function cuisineStepsOf(
  snapshot: ProgressSnapshot,
  dish: { readonly id: string; readonly cuisineId: string },
): CelebrationView['cuisine'] {
  // RN01: only dishes still in the catalog count towards a cuisine.
  const known = new Set(snapshot.catalog.dishes.map((candidate) => candidate.id));
  const completed = new Set([...completedDishIdsOf(snapshot)].filter((id) => known.has(id)));
  completed.add(dish.id);
  const after = cuisineProgressFor(snapshot.catalog, dish.cuisineId, completed);
  completed.delete(dish.id);
  const before = cuisineProgressFor(snapshot.catalog, dish.cuisineId, completed);
  if (!before || !after) return null;
  const step = (progress: NonNullable<typeof after>): CuisineStep => ({
    completed: progress.completedDishes,
    total: progress.totalDishes,
    percent: progress.percent,
    missing: progress.missingDishes,
  });
  return { name: after.name, before: step(before), after: step(after) };
}

function first(value: RawParam): string {
  return (typeof value === 'string' ? value : value?.[0]) ?? '';
}

function idList(value: RawParam): string[] {
  return first(value)
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}
