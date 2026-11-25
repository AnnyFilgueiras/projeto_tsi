import type { LocalDatabase } from '../../../core/local-db/local-database';
import type { HintCatalog } from '../domain/pick-curiosity-hint';
import type { SuggestionsLocalStore } from '../domain/suggestion-round';

const EMPTY_CATALOG: HintCatalog = { dishes: [], cuisines: [] };

/** `candidates_local` belongs to this feature; the other tables are read-only here (A3). */
export function createSuggestionsLocalStore(db: LocalDatabase): SuggestionsLocalStore {
  return {
    async saveCandidate(item) {
      // Same row shape the download-set sync writes, so the next sync simply replaces it.
      await db.execute(
        `INSERT INTO candidates_local (suggestion_id, dish_id, data) VALUES (?, ?, ?)
         ON CONFLICT (suggestion_id) DO UPDATE SET dish_id = excluded.dish_id, data = excluded.data`,
        [item.id, item.dish.dishId, JSON.stringify(item)],
      );
    },

    async readHintContext() {
      const [index] = await db.query<{ data: string }>(
        'SELECT data FROM catalog_index_local WHERE id = 1',
      );
      const rated = await db.query<{ dish_id: string }>(
        'SELECT DISTINCT dish_id FROM ratings_local',
      );
      const evolutions = await db.query<{ target_id: string }>(
        "SELECT target_id FROM unlocks_local WHERE kind = 'evolution'",
      );
      return {
        catalog: index ? (JSON.parse(index.data) as HintCatalog) : EMPTY_CATALOG,
        ratedDishIds: rated.map((row) => row.dish_id),
        unlockedEvolutionIds: evolutions.map((row) => row.target_id),
      };
    },

    async hasRestrictions() {
      const rows = await db.query('SELECT 1 FROM restrictions_local LIMIT 1');
      return rows.length > 0;
    },
  };
}
