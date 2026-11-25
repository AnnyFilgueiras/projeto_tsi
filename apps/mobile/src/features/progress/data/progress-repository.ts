import type { LocalDatabase, SqlExecutor } from '../../../core/local-db/local-database';
import {
  buildProgressModel,
  type CatalogIndex,
  type ProgressModel,
  type ProgressSnapshot,
  type ProgressSnapshotSource,
  type StoredRating,
  type StoredUnlock,
} from '../domain/progress-model';

export interface ProgressRepository extends ProgressSnapshotSource {
  /** Collection, evolutions, badges, history and summary, all from the offline copy. */
  loadProgress(): Promise<ProgressModel>;
}

const EMPTY_CATALOG: CatalogIndex = { dishes: [], cuisines: [], badgeDefinitions: [] };

/**
 * Reads the progress inputs from the offline copy (`catalog_index_local`, `ratings_local`,
 * `unlocks_local`, `meta_sync`). Before the first download set there is no catalog yet, so it
 * yields an empty one instead of failing.
 */
export function createProgressRepository(db: LocalDatabase): ProgressRepository {
  async function load(): Promise<ProgressSnapshot> {
    // One transaction so a download set landing mid-read never mixes a new catalog with old
    // ratings (the Celebration compares this snapshot with the one after the rating).
    return db.transaction((tx) => readSnapshot(tx));
  }

  return {
    load,
    async loadProgress() {
      return buildProgressModel(await load());
    },
  };
}

async function readSnapshot(db: SqlExecutor): Promise<ProgressSnapshot> {
  const [catalogRow] = await db.query<{ data: string }>(
    'SELECT data FROM catalog_index_local WHERE id = 1',
  );
  const ratingRows = await db.query<{ data: string }>(
    'SELECT data FROM ratings_local ORDER BY rated_on DESC, id DESC',
  );
  const unlockRows = await db.query<{
    kind: StoredUnlock['kind'];
    target_id: string;
    unlocked_at: string | null;
  }>('SELECT kind, target_id, unlocked_at FROM unlocks_local');
  const [lastSync] = await db.query<{ value: string }>(
    "SELECT value FROM meta_sync WHERE key = 'lastSyncAt'",
  );

  return {
    catalog: catalogRow ? (JSON.parse(catalogRow.data) as CatalogIndex) : EMPTY_CATALOG,
    ratings: ratingRows.map((row) => JSON.parse(row.data) as StoredRating),
    unlocks: unlockRows.map((row) => ({
      kind: row.kind,
      targetId: row.target_id,
      unlockedAt: row.unlocked_at,
    })),
    lastSyncAt: lastSync?.value ?? null,
  };
}
