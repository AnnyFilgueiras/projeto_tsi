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
import {
  createOnboardingRepository,
  type OnboardingRepository,
} from '../../features/profile/data/onboarding-repository';
import { createPreferencesRepository } from '../../features/profile/data/preferences-repository';
import { restrictionProjectors } from '../../features/profile/data/restriction-repository';
import {
  createRegisterRestrictions,
  type RegisterRestrictions,
} from '../../features/profile/domain/register-restrictions';
import {
  createSaveCulinaryPreferences,
  type CuisineOption,
  type SaveCulinaryPreferences,
} from '../../features/profile/domain/save-culinary-preferences';
import { readMobileConfig, type MobileConfig } from './config';

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
  /** Health probe used by the Profile shell. */
  readonly checkApi: () => Promise<boolean>;
  /** Best-effort background refresh of the offline copy; never throws (offline is normal). */
  readonly syncInBackground: () => Promise<void>;
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
  );

  const downloadSet = createDownloadSetSync({
    http,
    localDatabase,
    ensurePhotos: async (hashes) => {
      await photos.ensureDownloaded(hashes);
    },
    now,
  });

  const operationEnqueuer = createDirectOnlineOperationEnqueuer({
    http,
    localDatabase,
    // Feature projectors are registered here as features land (MVP-04E/F).
    projectors: { ...restrictionProjectors },
    newOperationId: createUuidV7Generator({ randomBytes: getRandomBytes, now: Date.now }),
    now,
  });

  const preferences = createPreferencesRepository({ http, localDatabase });

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
      registerRestrictions: createRegisterRestrictions({ enqueuer: operationEnqueuer, now }),
      listCuisines: () => preferences.listCuisines(),
      saveCulinaryPreferences: createSaveCulinaryPreferences(preferences),
    },
    checkApi: async () => {
      try {
        await http.call('checkHealth', {});
        return true;
      } catch {
        return false;
      }
    },
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
