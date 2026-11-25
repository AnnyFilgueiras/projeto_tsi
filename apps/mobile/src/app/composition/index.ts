import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { getRandomBytes } from 'expo-crypto';
import type { LocalDatabase } from '../../core/local-db/local-database';
import { LOCAL_MIGRATIONS } from '../../core/local-db/migrations';
import { runMigrations } from '../../core/local-db/migrator';
import { createSecureStoreDatabaseKeyStore } from '../../core/local-db/secure-store-database-key-adapter';
import {
  deleteSqlCipherDatabase,
  LocalDatabaseUnreadableError,
  openSqlCipherDatabase,
} from '../../core/local-db/sqlcipher-database';
import { createFetchHttpClient } from '../../core/network/fetch-http-client-adapter';
import type { HttpClient } from '../../core/network/http-client';
import { createSecureStoreTokenStore } from '../../core/network/secure-store-token-adapter';
import { HttpError, NetworkUnavailableError } from '../../core/network/http-errors';
import { createSessionGate, type SessionGate } from '../../core/network/session';
import { createFileSystemPhotoManager } from '../../core/photos/file-system-photo-manager-adapter';
import type { PhotoManager } from '../../core/photos/photo-manager';
import { createDirectOnlineOperationEnqueuer } from '../../core/sync/direct-online-operation-enqueuer-adapter';
import { createDownloadSetSync, type DownloadSetSync } from '../../core/sync/download-set-sync';
import { createUuidV7Generator } from '../../core/sync/id-generator';
import type { OperationEnqueuer } from '../../core/sync/operation-enqueuer';
import { createSuggestionsGateway } from '../../features/suggestions/data/suggestions-gateway';
import { createSuggestionsLocalStore } from '../../features/suggestions/data/suggestions-local-store';
import {
  createSuggestionRound,
  type SuggestionRound,
} from '../../features/suggestions/domain/suggestion-round';
import {
  createOnboardingRepository,
  type OnboardingRepository,
} from '../../features/profile/data/onboarding-repository';
import { createPreferencesRepository } from '../../features/profile/data/preferences-repository';
import { createProfileRepository } from '../../features/profile/data/profile-repository';
import { restrictionProjectors } from '../../features/profile/data/restriction-repository';
import {
  createRegisterRestrictions,
  type RegisterRestrictions,
} from '../../features/profile/domain/register-restrictions';
import type { ProfileSnapshot } from '../../features/profile/domain/profile-snapshot';
import {
  createRevokeRestriction,
  type RevokeRestriction,
} from '../../features/profile/domain/revoke-restriction';
import {
  createSaveCulinaryPreferences,
  type CuisineOption,
  type SaveCulinaryPreferences,
  type SavePreferencesResult,
} from '../../features/profile/domain/save-culinary-preferences';
import { createProgressRepository } from '../../features/progress/data/progress-repository';
import { projectRatingRegistered } from '../../features/progress/data/rating-repository';
import type {
  ProgressModelSource,
  ProgressSnapshotSource,
} from '../../features/progress/domain/progress-model';
import {
  loadRatingContext,
  type RatingContext,
} from '../../features/progress/domain/rating-context';
import {
  createRegisterRating,
  type RegisterRating,
} from '../../features/progress/domain/register-rating';
import { createCandidatesReader } from '../../features/recipe/data/candidates-reader';
import { createCookingStateRepository } from '../../features/recipe/data/cooking-state-repository';
import { createRecipeRepository } from '../../features/recipe/data/recipe-repository';
import { createRecipeFeature, type RecipeFeature } from '../../features/recipe/domain';
import { readMobileConfig, type MobileConfig } from './config';
import { createKitchenNews, type KitchenNews } from './kitchen-news';

/**
 * Single composition root for the mobile app (A8): the only place that instantiates concrete
 * adapters. Features receive ports through props or the dependencies context, never `new`.
 *
 * Stage 1 → Stage 2 (ADR-008): replace `createDirectOnlineOperationEnqueuer` below with the
 * Outbox enqueuer + Synchronizer. Nothing in `features/` changes.
 */
export interface MobileDependencies {
  readonly http: HttpClient;
  readonly sessions: SessionGate;
  readonly localDatabase: LocalDatabase;
  readonly operationEnqueuer: OperationEnqueuer;
  readonly downloadSet: DownloadSetSync;
  readonly photos: PhotoManager;
  readonly onboarding: OnboardingRepository;
  readonly profile: ProfileDependencies;
  /** Discover round, kept for the whole app session so discarded dishes stay gone (RN11). */
  readonly suggestions: SuggestionRound;
  /** LoadRecipe / StartCooking / saveStep (#80) and LoadKitchen for the Kitchen tab (#81). */
  readonly recipe: RecipeFeature;
  /** Rating (#83), Celebration (#84) and Collection (#85): all offline-first reads of the local copy. */
  readonly progress: ProgressDependencies;
  /** "News" dot on the Kitchen tab after an approval (§1.1 rule 4); memory only. */
  readonly kitchenNews: KitchenNews;
  /** Best-effort background refresh of the offline copy; never throws (offline is normal). */
  readonly syncInBackground: () => Promise<void>;
}

export interface ProgressDependencies {
  readonly registerRating: RegisterRating;
  readonly loadRatingContext: (dishId: string) => Promise<RatingContext>;
  /** Local progress snapshot read by the Celebration (#84); never touches the network. */
  readonly snapshots: ProgressSnapshotSource;
  /** Collection tab (#85): the whole read model from the offline copy, no network. */
  readonly collection: ProgressModelSource;
}

export interface ProfileDependencies {
  /**
   * Creates the anonymous account and pulls the first download set (catalog index for the
   * cuisines step). `offline` only when the account could not be created; a failed pull is not
   * fatal because the cuisines step works without a catalog.
   */
  readonly prepareAccount: () => Promise<'ready' | 'offline'>;
  readonly registerRestrictions: RegisterRestrictions;
  readonly listCuisines: () => Promise<readonly CuisineOption[]>;
  readonly saveCulinaryPreferences: SaveCulinaryPreferences;
  /** Profile tab (#78): local snapshot, removal and preference changes. */
  readonly readProfile: () => Promise<ProfileSnapshot>;
  readonly revokeRestriction: RevokeRestriction;
  /** Unlike `saveCulinaryPreferences`, sends an empty list too (unchecking the last cuisine). */
  readonly savePreferences: (cuisineIds: readonly string[]) => Promise<SavePreferencesResult>;
}

export async function createMobileDependencies(
  config: MobileConfig = readMobileConfig(),
): Promise<MobileDependencies> {
  const now = () => new Date();
  const localDatabase = await openLocalDatabase(config.databaseName);
  await runMigrations(localDatabase, LOCAL_MIGRATIONS);

  const tokenStore = createSecureStoreTokenStore();
  const http = createFetchHttpClient({
    baseUrl: config.apiBaseUrl,
    fetch: (input, init) => fetch(input, init),
    tokenStore,
    packageVersion: PACKAGE_VERSION,
    now,
  });
  const sessions = createSessionGate(http, tokenStore);

  // Demo/local: photos are served by the API (ADR-012 item 5). The cloud target swaps this
  // resolver for the Storage static URL without touching PhotoManager.
  const photos = createFileSystemPhotoManager(
    (hash) => `${config.apiBaseUrl.replace(/\/$/, '')}/v1/photos/${hash}`,
    // The demo route requires the bearer token. Photos are fetched right after an API call that
    // already renewed it, so the stored access token is current; a 401 only skips that photo.
    async (): Promise<Record<string, string>> => {
      const tokens = await tokenStore.read();
      return tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    },
  );

  const downloadSet = createDownloadSetSync({
    http,
    localDatabase,
    ensurePhotos: async (hashes) => {
      await photos.ensureDownloaded(hashes);
    },
    now,
  });

  const newUuidV7 = createUuidV7Generator({ randomBytes: getRandomBytes, now: Date.now });

  const operationEnqueuer = createDirectOnlineOperationEnqueuer({
    http,
    localDatabase,
    // Feature projectors are registered here as features land (MVP-04E/F).
    projectors: { 'rating.register': projectRatingRegistered, ...restrictionProjectors },
    newOperationId: newUuidV7,
    now,
  });

  const kitchenNews = createKitchenNews();
  const suggestionRound = createSuggestionRound({
    gateway: createSuggestionsGateway({ http, sessions }),
    store: createSuggestionsLocalStore(localDatabase),
    photos: {
      // Cached file first; otherwise one download attempt. Offline or missing → placeholder.
      localUri: async (hash) => {
        try {
          const cached = await photos.getLocalUri(hash);
          if (cached) return cached;
          await photos.ensureDownloaded([hash]);
          return await photos.getLocalUri(hash);
        } catch {
          return null;
        }
      },
    },
    newIdempotencyKey: newUuidV7,
  });
  // Feature-to-feature ports live here (A1): suggestions never imports recipe or profile.
  const suggestions: SuggestionRound = {
    ...suggestionRound,
    approveSuggestion: async (suggestionId) => {
      const outcome = await suggestionRound.approveSuggestion(suggestionId);
      if (outcome === 'done') kitchenNews.mark();
      return outcome;
    },
  };
  // A restriction or preference change makes the round stale (RN08, RN10): the Discover tab
  // fetches again the next time it gains focus. Invalidating after any attempt is harmless.
  const afterProfileChange = async <T>(change: Promise<T>): Promise<T> => {
    try {
      return await change;
    } finally {
      suggestionRound.invalidate();
    }
  };

  const preferences = createPreferencesRepository({ http, localDatabase });
  const registerRestrictions = createRegisterRestrictions({ enqueuer: operationEnqueuer, now });
  const revokeRestriction = createRevokeRestriction({ enqueuer: operationEnqueuer });
  // Device-only "em preparo" state, shared by the recipe feature and the rating's completion port.
  const cookingState = createCookingStateRepository(localDatabase);
  const profileRepository = createProfileRepository(localDatabase);
  const progressRepository = createProgressRepository(localDatabase);

  return {
    http,
    sessions,
    localDatabase,
    operationEnqueuer,
    downloadSet,
    photos,
    onboarding: createOnboardingRepository(localDatabase),
    profile: {
      prepareAccount: async () => {
        try {
          await sessions.ensureSession();
        } catch (error) {
          if (isUnreachable(error)) return 'offline';
          throw error;
        }
        try {
          await downloadSet.pull();
        } catch (error) {
          if (__DEV__) console.warn('First download set skipped:', (error as Error).name);
        }
        return 'ready';
      },
      registerRestrictions: (input) => afterProfileChange(registerRestrictions(input)),
      listCuisines: () => preferences.listCuisines(),
      saveCulinaryPreferences: createSaveCulinaryPreferences(preferences),
      readProfile: () => profileRepository.read(),
      revokeRestriction: (input) => afterProfileChange(revokeRestriction(input)),
      savePreferences: (cuisineIds) => afterProfileChange(preferences.save(cuisineIds)),
    },
    suggestions,
    recipe: createRecipeFeature({
      recipes: createRecipeRepository({ http, localDatabase, photos }),
      cooking: cookingState,
      candidates: createCandidatesReader(localDatabase),
      now,
    }),
    progress: {
      registerRating: createRegisterRating({
        enqueuer: operationEnqueuer,
        progress: progressRepository,
        // A saved rating ends "em preparo" (#86); progress never imports recipe (A1).
        completionListener: { onDishCompleted: (dishId) => cookingState.finish(dishId) },
      }),
      loadRatingContext: (dishId) => loadRatingContext(progressRepository, dishId),
      snapshots: progressRepository,
      collection: progressRepository,
    },
    kitchenNews,
    syncInBackground: async () => {
      try {
        await sessions.ensureSession();
        await downloadSet.pull();
      } catch (error) {
        // Error names only: messages could echo payloads, and restrictions never go to logs (A13).
        if (__DEV__) console.warn('Background sync skipped:', (error as Error).name);
      }
    },
  };
}

// Same retryable set as the enqueuer: no network, 5xx or rate limit (ADR-008 Stage 1).
function isUnreachable(error: unknown): boolean {
  if (error instanceof NetworkUnavailableError) return true;
  return error instanceof HttpError && (error.status >= 500 || error.status === 429);
}

async function openLocalDatabase(databaseName: string): Promise<LocalDatabase> {
  const keyHex = await createSecureStoreDatabaseKeyStore().getOrCreateKey();
  try {
    return await openSqlCipherDatabase({ databaseName, keyHex });
  } catch (error) {
    // Only a key mismatch resets the copy; a build without SQLCipher (SqlCipherUnavailableError)
    // must stop here (A05) — deleting the file would destroy data without fixing anything.
    if (!(error instanceof LocalDatabaseUnreadableError)) throw error;
    // The key no longer matches the file (e.g. secure storage was wiped). Stage 1 keeps the
    // server as source of truth, so start an empty copy and let the download set refill it;
    // only the device-only "em preparo" state is lost.
    await deleteSqlCipherDatabase(databaseName);
    return openSqlCipherDatabase({ databaseName, keyHex });
  }
}
