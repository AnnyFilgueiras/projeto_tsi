import type { ProgressSnapshotSource } from './progress-model';

export interface RatingContext {
  /** Null before the first download set; the screen then uses a generic title. */
  readonly dishName: string | null;
  /** Earlier ratings of this dish; above 0 the screen explains the new entry (RN06). */
  readonly previousCount: number;
}

/** What the Rating screen needs from the offline copy, so it works without network. */
export async function loadRatingContext(
  source: ProgressSnapshotSource,
  dishId: string,
): Promise<RatingContext> {
  const snapshot = await source.load();
  return {
    dishName: snapshot.catalog.dishes.find((dish) => dish.id === dishId)?.name ?? null,
    previousCount: snapshot.ratings.filter((rating) => rating.dishId === dishId).length,
  };
}
