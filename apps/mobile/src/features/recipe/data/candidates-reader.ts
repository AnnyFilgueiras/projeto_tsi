import type { AllergenState } from '@panelada/allergen-rules/rules';
import type { LocalDatabase } from '../../../core/local-db/local-database';
import type { components } from '../../../core/network/openapi.generated';

type SuggestionItem = components['schemas']['SuggestionItem'];

export interface StoredCandidate {
  readonly suggestionId: string;
  readonly dishId: string;
  readonly name: string;
  /** Null until the catalog index has been synced. */
  readonly cuisineName: string | null;
  readonly prepTimeMinutes: number;
  readonly allergenState: AllergenState;
  readonly photoHash: string | null;
}

export interface CandidatesReader {
  /** Newest approval first. */
  list(): Promise<readonly StoredCandidate[]>;
}

interface CatalogCuisines {
  readonly cuisines: readonly { id: string; name: string }[];
}

/**
 * Read-only view of `candidates_local`, which belongs to the suggestions feature (A3): writes
 * stay in its local store and in the download-set sync.
 */
export function createCandidatesReader(db: LocalDatabase): CandidatesReader {
  return {
    async list() {
      // rowid follows insertion: approvals on this device and the sync both append, so DESC puts
      // the latest approval on top.
      const rows = await db.query<{ data: string }>(
        'SELECT data FROM candidates_local ORDER BY rowid DESC',
      );
      const [catalogRow] = await db.query<{ data: string }>(
        'SELECT data FROM catalog_index_local WHERE id = 1',
      );
      const cuisines = catalogRow ? (JSON.parse(catalogRow.data) as CatalogCuisines).cuisines : [];

      return rows.map((row) => {
        const { id, dish } = JSON.parse(row.data) as SuggestionItem;
        return {
          suggestionId: id,
          dishId: dish.dishId,
          name: dish.name,
          cuisineName: cuisines.find((cuisine) => cuisine.id === dish.cuisineId)?.name ?? null,
          prepTimeMinutes: dish.prepTimeMinutes,
          allergenState: dish.allergenState,
          photoHash: dish.photoHash ?? null,
        };
      });
    },
  };
}
