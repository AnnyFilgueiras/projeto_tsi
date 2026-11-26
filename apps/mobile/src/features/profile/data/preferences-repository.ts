import type { LocalDatabase } from '../../../core/local-db/local-database';
import type { HttpClient } from '../../../core/network/http-client';
import {
  HttpError,
  NetworkUnavailableError,
  SessionExpiredError,
} from '../../../core/network/http-errors';
import type { CuisineOption, CulinaryPreferencesStore } from '../domain/save-culinary-preferences';

export interface PreferencesRepositoryDeps {
  readonly http: HttpClient;
  readonly localDatabase: LocalDatabase;
}

/**
 * Culinary preferences (RN10). They are a profile setting, not a sync operation, so they go
 * straight to `PUT /v1/profile/preferences`; the local copy changes only after the 2xx, keeping
 * the Stage 1 rule that a failed online action leaves the device untouched (ADR-008).
 */
export function createPreferencesRepository(
  deps: PreferencesRepositoryDeps,
): CulinaryPreferencesStore {
  return {
    async listCuisines() {
      const [row] = await deps.localDatabase.query<{ data: string }>(
        'SELECT data FROM catalog_index_local WHERE id = 1',
      );
      if (!row) return [];
      const index = JSON.parse(row.data) as { cuisines?: readonly CuisineOption[] };
      return (index.cuisines ?? [])
        .map(({ id, name }) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    },

    async save(cuisineIds) {
      try {
        await deps.http.call('updateCulinaryPreferences', {
          body: { cuisineIds: [...cuisineIds] },
        });
      } catch (error) {
        if (isRetryable(error)) return 'unavailable';
        throw error;
      }
      await deps.localDatabase.execute(
        `INSERT INTO profile_local (id, culinary_preferences) VALUES (1, ?)
         ON CONFLICT (id) DO UPDATE SET culinary_preferences = excluded.culinary_preferences`,
        [JSON.stringify(cuisineIds)],
      );
      return 'saved';
    },
  };
}

function isRetryable(error: unknown): boolean {
  if (error instanceof NetworkUnavailableError) return true;
  if (error instanceof SessionExpiredError) return false;
  return error instanceof HttpError && (error.status >= 500 || error.status === 429);
}
