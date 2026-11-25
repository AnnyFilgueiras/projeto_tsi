export interface CuisineOption {
  readonly id: string;
  readonly name: string;
}

export type SavePreferencesResult = 'saved' | 'unavailable';

/** Implemented by `data/preferences-repository` and injected at the composition root (A8). */
export interface CulinaryPreferencesStore {
  /** Cuisines of the local catalog index; empty before the first download set. */
  listCuisines(): Promise<readonly CuisineOption[]>;
  /** `unavailable` = nothing changed anywhere (offline, 5xx or 429). */
  save(cuisineIds: readonly string[]): Promise<SavePreferencesResult>;
}

export type SaveCulinaryPreferences = (
  cuisineIds: readonly string[],
) => Promise<SavePreferencesResult>;

/**
 * Culinary preferences are optional (RN10): an empty choice is the same as skipping, so it sends
 * nothing instead of overwriting the profile with an empty list.
 */
export function createSaveCulinaryPreferences(
  store: CulinaryPreferencesStore,
): SaveCulinaryPreferences {
  return async (cuisineIds) => (cuisineIds.length === 0 ? 'saved' : store.save(cuisineIds));
}
