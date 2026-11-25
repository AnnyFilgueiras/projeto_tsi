import type { AllergenCode } from '@panelada/allergen-rules/rules';
import type { LocalDatabase, SqlExecutor } from '../../../core/local-db/local-database';
import type { HttpClient } from '../../../core/network/http-client';
import { HttpError, NetworkUnavailableError } from '../../../core/network/http-errors';
import type { Recipe } from '../domain/model';

/**
 * The part of PhotoManager (ADR-012) this feature needs. Declared here because features may not
 * import core/photos; the composition root passes the real manager, which satisfies it.
 */
export interface RecipePhotoStore {
  getLocalUri(hash: string): Promise<string | null>;
  /** Throws when the network is unreachable; missing or corrupt photos are skipped. */
  ensureDownloaded(hashes: readonly string[]): Promise<unknown>;
}

export interface LocalRecipe {
  readonly recipe: Recipe;
  readonly downloadedAt: Date;
}

/** Network outcomes as values: the domain layer may not import the HTTP error classes. */
export type RemoteRecipe =
  | { readonly status: 'found'; readonly recipe: Recipe }
  | { readonly status: 'offline' }
  | { readonly status: 'not-found' };

export interface RecipeContext {
  /** Codes from `restrictions_local`; unknown ones make `classifyRecipe` fail closed. */
  readonly restrictions: readonly AllergenCode[];
  readonly cuisineName: string | null;
  readonly baseDish: { readonly id: string; readonly name: string | null } | null;
  readonly evolutionUnlocked: boolean;
}

export interface RecipeRepository {
  findLocal(dishId: string): Promise<LocalRecipe | null>;
  /** `GET /v1/recipes/{dishId}` without storing anything. */
  fetchRemote(dishId: string): Promise<RemoteRecipe>;
  /** Recipe plus its photo, both on the device before anything is written (A04). */
  downloadForCooking(dishId: string): Promise<RemoteRecipe>;
  photoUri(hash: string): Promise<string | null>;
  readContext(dishId: string, fallbackBaseDishId: string | null): Promise<RecipeContext>;
}

export interface RecipeRepositoryDeps {
  readonly http: HttpClient;
  readonly localDatabase: LocalDatabase;
  readonly photos: RecipePhotoStore;
}

interface CatalogIndex {
  readonly dishes: readonly {
    id: string;
    name: string;
    cuisineId: string;
    baseDishId?: string | null;
  }[];
  readonly cuisines: readonly { id: string; name: string }[];
}

/** Same upsert as DownloadSetSync, so both paths leave identical rows in `recipes_local`. */
export async function upsertRecipe(
  tx: SqlExecutor,
  recipe: Recipe,
  downloadedAt: Date,
): Promise<void> {
  await tx.execute(
    `INSERT INTO recipes_local (dish_id, updated_at, photo_hash, data, downloaded_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (dish_id) DO UPDATE SET updated_at = excluded.updated_at,
       photo_hash = excluded.photo_hash, data = excluded.data, downloaded_at = excluded.downloaded_at`,
    [
      recipe.dishId,
      recipe.updatedAt,
      recipe.photo.hash,
      JSON.stringify(recipe),
      downloadedAt.toISOString(),
    ],
  );
}

export function createRecipeRepository(deps: RecipeRepositoryDeps): RecipeRepository {
  const db = deps.localDatabase;

  async function fetchRemote(dishId: string): Promise<RemoteRecipe> {
    try {
      const { data } = await deps.http.call('getRecipe', { path: { dishId } });
      return data ? { status: 'found', recipe: data } : { status: 'not-found' };
    } catch (error) {
      if (error instanceof NetworkUnavailableError) return { status: 'offline' };
      if (error instanceof HttpError && error.status === 404) return { status: 'not-found' };
      throw error;
    }
  }

  return {
    async findLocal(dishId) {
      const [row] = await db.query<{ data: string; downloaded_at: string }>(
        'SELECT data, downloaded_at FROM recipes_local WHERE dish_id = ?',
        [dishId],
      );
      if (!row) return null;
      return { recipe: JSON.parse(row.data) as Recipe, downloadedAt: new Date(row.downloaded_at) };
    },

    fetchRemote,

    async downloadForCooking(dishId) {
      const remote = await fetchRemote(dishId);
      if (remote.status !== 'found') return remote;
      try {
        await deps.photos.ensureDownloaded([remote.recipe.photo.hash]);
      } catch (error) {
        if (error instanceof NetworkUnavailableError) return { status: 'offline' };
        throw error;
      }
      return remote;
    },

    photoUri: (hash) => deps.photos.getLocalUri(hash),

    async readContext(dishId, fallbackBaseDishId) {
      const restrictions = await db.query<{ restriction_type: string }>(
        'SELECT restriction_type FROM restrictions_local',
      );
      const [catalogRow] = await db.query<{ data: string }>(
        'SELECT data FROM catalog_index_local WHERE id = 1',
      );
      const catalog = catalogRow ? (JSON.parse(catalogRow.data) as CatalogIndex) : null;
      const dish = catalog?.dishes.find((item) => item.id === dishId);
      const baseDishId = dish?.baseDishId ?? fallbackBaseDishId;
      const [unlock] = await db.query<{ target_id: string }>(
        "SELECT target_id FROM unlocks_local WHERE kind = 'evolution' AND target_id = ?",
        [dishId],
      );
      const cuisineId = dish?.cuisineId;

      return {
        // Cast only: classifyRecipe validates every code and fails closed on unknown ones.
        restrictions: restrictions.map((row) => row.restriction_type as AllergenCode),
        cuisineName: catalog?.cuisines.find((item) => item.id === cuisineId)?.name ?? null,
        baseDish: baseDishId
          ? {
              id: baseDishId,
              name: catalog?.dishes.find((item) => item.id === baseDishId)?.name ?? null,
            }
          : null,
        evolutionUnlocked: Boolean(unlock),
      };
    },
  };
}
