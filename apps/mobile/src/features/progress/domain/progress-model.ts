import { milestoneProgress, type MilestoneProgress } from './milestone-progress';
import {
  ALL_CATALOG_CONTINENTS,
  MAX_EVOLUTION_DEPTH,
  type BadgeMilestone,
  type CatalogIndexForUnlock,
  type Continent,
  type UnlockState,
} from './unlock-calculator';

/**
 * Local progress read model (US12, US14–US16, RN02–RN07).
 *
 * Built only from the offline copy (download set + confirmed operations), so the Collection,
 * Celebration and Rating screens work without network. It returns data, never UI copy: the
 * screens own the wording.
 */

export interface CatalogDish {
  readonly id: string;
  readonly name: string;
  readonly cuisineId: string;
  readonly baseDishId?: string | null;
}

export interface CatalogCuisine {
  readonly id: string;
  readonly name: string;
  readonly continents: readonly Continent[];
  readonly totalDishes: number;
}

export interface CatalogBadge {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly milestone: BadgeMilestone;
}

/** Same shape as the download-set `catalogIndex`. */
export interface CatalogIndex {
  readonly dishes: readonly CatalogDish[];
  readonly cuisines: readonly CatalogCuisine[];
  readonly badgeDefinitions: readonly CatalogBadge[];
}

export interface StoredRating {
  readonly id: string;
  readonly dishId: string;
  /** Half-points 0–10 (RN05). */
  readonly score: number;
  readonly comment?: string;
  readonly changes?: string;
  readonly date: string;
}

export interface StoredUnlock {
  readonly kind: 'evolution' | 'badge';
  readonly targetId: string;
  /** Null for evolutions that arrived through the download set, which carries no date for them. */
  readonly unlockedAt: string | null;
}

export interface ProgressSnapshot {
  readonly catalog: CatalogIndex;
  readonly ratings: readonly StoredRating[];
  readonly unlocks: readonly StoredUnlock[];
  readonly lastSyncAt: string | null;
}

export type EvolutionStatus = 'completed' | 'unlocked' | 'locked';

export interface EvolutionNode {
  readonly dishId: string;
  readonly name: string;
  /** Root = 1 (same depth rule as `evolution_level`, RN03g). */
  readonly level: number;
  readonly status: EvolutionStatus;
  /** Only on a locked node: the dish whose completion unlocks it (RN02). */
  readonly baseDish: { readonly dishId: string; readonly name: string } | null;
}

export interface EvolutionChain {
  readonly rootDishId: string;
  readonly nodes: readonly EvolutionNode[];
}

export interface EarnedBadge {
  readonly badgeId: string;
  readonly name: string;
  readonly description: string;
  readonly unlockedAt: string | null;
}

export interface NextMilestone {
  readonly badgeId: string;
  readonly name: string;
  readonly description: string;
  readonly progress: MilestoneProgress;
}

export interface BadgeView {
  readonly earned: readonly EarnedBadge[];
  readonly next: readonly NextMilestone[];
}

export interface HistoryEntry {
  readonly ratingId: string;
  readonly dishId: string;
  /** Null when the dish left the catalog after it was rated. */
  readonly dishName: string | null;
  readonly stars: number;
  readonly date: string;
  readonly commentExcerpt: string | null;
  readonly changesExcerpt: string | null;
  readonly hasChanges: boolean;
}

export interface CollectionSummary {
  readonly completedDishes: number;
  readonly cuisinesStarted: number;
  readonly continentsReached: number;
  readonly totalContinents: number;
  readonly lastSyncAt: string | null;
}

export interface ProgressModel {
  readonly cuisines: readonly CuisineProgress[];
  readonly evolutionChains: readonly EvolutionChain[];
  readonly badges: BadgeView;
  readonly history: readonly HistoryEntry[];
  readonly summary: CollectionSummary;
}

/** Long enough to recognize a note in a list row; the full text lives in the rating itself. */
export const HISTORY_EXCERPT_LENGTH = 120;

/** Port implemented by `data/progress-repository` (A3: domain never touches LocalDatabase). */
export interface ProgressSnapshotSource {
  load(): Promise<ProgressSnapshot>;
}

export interface CuisineProgress {
  readonly cuisineId: string;
  readonly name: string;
  readonly completedDishes: number;
  readonly totalDishes: number;
  /** Integer 0–100. */
  readonly percent: number;
  readonly missingDishes: number;
}

/**
 * RN07: distinct catalog dishes rated in this cuisine over the cuisine's `totalDishes`.
 * Returns null when the cuisine is not in the catalog index.
 */
export function cuisineProgressFor(
  catalog: CatalogIndex,
  cuisineId: string,
  completedDishIds: ReadonlySet<string>,
): CuisineProgress | null {
  const cuisine = catalog.cuisines.find((candidate) => candidate.id === cuisineId);
  if (!cuisine) return null;

  const completedDishes = catalog.dishes.filter(
    (dish) => dish.cuisineId === cuisineId && completedDishIds.has(dish.id),
  ).length;
  const total = Math.max(cuisine.totalDishes, 0);
  return {
    cuisineId,
    name: cuisine.name,
    completedDishes,
    totalDishes: total,
    percent: total === 0 ? 0 : Math.min(100, Math.round((completedDishes / total) * 100)),
    missingDishes: Math.max(total - completedDishes, 0),
  };
}

export function completedDishIdsOf(snapshot: ProgressSnapshot): Set<string> {
  return new Set(snapshot.ratings.map((rating) => rating.dishId));
}

// RN03h: whitespace-only `changes` is not a real adaptation (same rule as the UnlockCalculator).
export function hasAdaptation(rating: Pick<StoredRating, 'changes'>): boolean {
  return typeof rating.changes === 'string' && rating.changes.trim().length > 0;
}

/** Accumulated state the UnlockCalculator and milestoneProgress evaluate against (#76). */
export function unlockStateOf(snapshot: ProgressSnapshot): UnlockState {
  const idsOf = (kind: StoredUnlock['kind']) =>
    snapshot.unlocks.filter((unlock) => unlock.kind === kind).map((unlock) => unlock.targetId);
  return {
    completedDishIds: [...completedDishIdsOf(snapshot)],
    adaptationRatingIds: snapshot.ratings.filter(hasAdaptation).map((rating) => rating.id),
    unlockedEvolutionDishIds: idsOf('evolution'),
    awardedBadgeIds: idsOf('badge'),
  };
}

export function catalogForUnlock(catalog: CatalogIndex): CatalogIndexForUnlock {
  return {
    dishes: catalog.dishes.map((dish) => ({
      id: dish.id,
      cuisineId: dish.cuisineId,
      baseDishId: dish.baseDishId ?? null,
    })),
    cuisines: catalog.cuisines,
    badgeDefinitions: catalog.badgeDefinitions,
  };
}

export function buildProgressModel(snapshot: ProgressSnapshot): ProgressModel {
  const { catalog } = snapshot;
  // RN01: a rating for a dish that left the catalog still shows in the history, but never counts.
  const knownDishIds = new Set(catalog.dishes.map((dish) => dish.id));
  const completed = new Set([...completedDishIdsOf(snapshot)].filter((id) => knownDishIds.has(id)));

  const cuisines = catalog.cuisines
    .map((cuisine) => cuisineProgressFor(catalog, cuisine.id, completed))
    .filter((progress): progress is CuisineProgress => progress !== null)
    .sort(
      (a, b) =>
        Number(b.completedDishes > 0) - Number(a.completedDishes > 0) ||
        a.name.localeCompare(b.name, 'pt-BR'),
    );

  const startedCuisineIds = new Set(
    cuisines.filter((cuisine) => cuisine.completedDishes > 0).map((cuisine) => cuisine.cuisineId),
  );
  const continentsReached = new Set(
    catalog.cuisines
      .filter((cuisine) => startedCuisineIds.has(cuisine.id))
      .flatMap((cuisine) => cuisine.continents),
  );

  return {
    cuisines,
    evolutionChains: buildEvolutionChains(snapshot, completed),
    badges: buildBadgeView(snapshot),
    history: buildHistory(snapshot),
    summary: {
      completedDishes: completed.size,
      cuisinesStarted: startedCuisineIds.size,
      continentsReached: continentsReached.size,
      totalContinents: ALL_CATALOG_CONTINENTS.length,
      lastSyncAt: snapshot.lastSyncAt,
    },
  };
}

/**
 * One chain per root dish that has evolutions, walked breadth-first so nodes come out by level.
 * `visited` and MAX_EVOLUTION_DEPTH keep corrupt catalog data (cycles) from looping (RN18).
 */
function buildEvolutionChains(
  snapshot: ProgressSnapshot,
  completed: ReadonlySet<string>,
): EvolutionChain[] {
  const { dishes } = snapshot.catalog;
  const dishById = new Map(dishes.map((dish) => [dish.id, dish]));
  const childrenOf = new Map<string, CatalogDish[]>();
  for (const dish of dishes) {
    if (!dish.baseDishId) continue;
    childrenOf.set(dish.baseDishId, [...(childrenOf.get(dish.baseDishId) ?? []), dish]);
  }
  const unlocked = new Set(
    snapshot.unlocks
      .filter((unlock) => unlock.kind === 'evolution')
      .map((unlock) => unlock.targetId),
  );

  const statusOf = (dish: CatalogDish): EvolutionStatus => {
    if (completed.has(dish.id)) return 'completed';
    // A root has nothing to unlock it: it is always available to cook.
    if (!dish.baseDishId || unlocked.has(dish.id)) return 'unlocked';
    return 'locked';
  };

  return dishes
    .filter((dish) => !dish.baseDishId && childrenOf.has(dish.id))
    .map((root) => {
      const nodes: EvolutionNode[] = [];
      const visited = new Set<string>();
      let level: CatalogDish[] = [root];
      for (let depth = 1; level.length > 0 && depth <= MAX_EVOLUTION_DEPTH; depth += 1) {
        const nextLevel: CatalogDish[] = [];
        for (const dish of level) {
          if (visited.has(dish.id)) continue;
          visited.add(dish.id);
          const status = statusOf(dish);
          const base = dish.baseDishId ? dishById.get(dish.baseDishId) : undefined;
          nodes.push({
            dishId: dish.id,
            name: dish.name,
            level: depth,
            status,
            baseDish: status === 'locked' && base ? { dishId: base.id, name: base.name } : null,
          });
          nextLevel.push(...(childrenOf.get(dish.id) ?? []));
        }
        level = nextLevel;
      }
      return { rootDishId: root.id, nodes };
    });
}

/** RN04: earned badges come from unlocks_local only; nothing here ever revokes one. */
function buildBadgeView(snapshot: ProgressSnapshot): BadgeView {
  const earnedAt = new Map(
    snapshot.unlocks
      .filter((unlock) => unlock.kind === 'badge')
      .map((unlock) => [unlock.targetId, unlock.unlockedAt]),
  );
  const definitions = snapshot.catalog.badgeDefinitions;

  const earned = definitions
    .filter((badge) => earnedAt.has(badge.id))
    .map((badge) => ({
      badgeId: badge.id,
      name: badge.name,
      description: badge.description,
      unlockedAt: earnedAt.get(badge.id) ?? null,
    }))
    .sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? ''));

  const state = unlockStateOf(snapshot);
  const index = catalogForUnlock(snapshot.catalog);
  const ratio = ({ progress }: NextMilestone) =>
    progress.target === 0 ? 0 : progress.current / progress.target;
  // Goal gradient (US16): the closest milestone first.
  const next = definitions
    .filter((badge) => !earnedAt.has(badge.id))
    .map((badge) => ({
      badgeId: badge.id,
      name: badge.name,
      description: badge.description,
      progress: milestoneProgress(badge, state, index),
    }))
    .sort((a, b) => ratio(b) - ratio(a) || a.name.localeCompare(b.name, 'pt-BR'));

  return { earned, next };
}

/** RN06: every preparation stays in the history, newest first. */
function buildHistory(snapshot: ProgressSnapshot): HistoryEntry[] {
  const nameOf = new Map(snapshot.catalog.dishes.map((dish) => [dish.id, dish.name]));
  return [...snapshot.ratings]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .map((rating) => ({
      ratingId: rating.id,
      dishId: rating.dishId,
      dishName: nameOf.get(rating.dishId) ?? null,
      stars: rating.score / 2,
      date: rating.date,
      commentExcerpt: excerpt(rating.comment),
      changesExcerpt: excerpt(rating.changes),
      hasChanges: hasAdaptation(rating),
    }));
}

function excerpt(text: string | undefined): string | null {
  const value = text?.trim();
  if (!value) return null;
  if (value.length <= HISTORY_EXCERPT_LENGTH) return value;
  return `${value.slice(0, HISTORY_EXCERPT_LENGTH).trimEnd()}…`;
}
