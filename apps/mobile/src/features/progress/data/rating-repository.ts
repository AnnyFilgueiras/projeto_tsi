import type { SqlExecutor } from '../../../core/local-db/local-database';
import type { ClientOperation } from '../../../core/sync/operation-enqueuer';
import type { StoredRating } from '../domain/progress-model';

/**
 * Local effect of a confirmed `rating.register` (P04), run inside the enqueuer's transaction and
 * wired by type at the composition root (A8).
 *
 * The row id is the opId, exactly like the API does, so the next download set replaces this row
 * with the server's copy instead of duplicating it. A repeated dish has a new opId, so it gets a
 * new row and never overwrites an earlier preparation (RN06); OR IGNORE only absorbs a replay of
 * the same opId, which would otherwise roll back the whole projection and leave the copy stale.
 * Unlocks are recorded by the enqueuer itself in the same transaction (INSERT OR IGNORE, RN04).
 */
export async function projectRatingRegistered(
  tx: SqlExecutor,
  operation: ClientOperation,
): Promise<void> {
  if (operation.type !== 'rating.register') return;
  const { dishId, score, comment, changes } = operation.payload;

  const rating: StoredRating = {
    id: operation.opId,
    dishId,
    score,
    ...(comment !== undefined && { comment }),
    ...(changes !== undefined && { changes }),
    date: operation.createdAt,
  };
  await tx.execute(
    'INSERT OR IGNORE INTO ratings_local (id, dish_id, data, rated_on) VALUES (?, ?, ?, ?)',
    [rating.id, dishId, JSON.stringify(rating), rating.date],
  );
}
