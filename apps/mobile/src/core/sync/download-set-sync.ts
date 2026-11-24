import type { LocalDatabase, SqlExecutor } from '../local-db/local-database';
import type { ApiSuccessBody, HttpClient } from '../network/http-client';

type DownloadSet = ApiSuccessBody<'getDownloadSet'>;

export interface DownloadSetSyncDeps {
  readonly http: HttpClient;
  readonly localDatabase: LocalDatabase;
  /** Fetches recipe photos by hash (PhotoManager, ADR-012); injected to keep core areas apart. */
  readonly ensurePhotos: (hashes: readonly string[]) => Promise<void>;
  readonly now: () => Date;
}

export type DownloadSetOutcome =
  | { readonly status: 'unchanged' }
  | {
      readonly status: 'updated';
      readonly version: string;
      readonly recipesDownloaded: number;
      /** The app warns, but does not block, when its allergen package is older (ADR-014). */
      readonly minPackageVersion: string;
    };

export interface DownloadSetSync {
  /** @throws NetworkUnavailableError / HttpError; local data stays consistent either way. */
  pull(): Promise<DownloadSetOutcome>;
}

const VERSION_KEY = 'downloadSetVersion';
const LAST_SYNC_KEY = 'lastSyncAt';

/**
 * Pulls the download set (`GET /v1/sync/download-set`) into the encrypted local copy (ADR-008).
 *
 * The set version is stored only after recipes and photos are on disk: storing it first would
 * make the next pull answer 304 and silently drop recipes that failed to download.
 */
export function createDownloadSetSync(deps: DownloadSetSyncDeps): DownloadSetSync {
  async function setMeta(tx: SqlExecutor, key: string, value: string) {
    await tx.execute(
      'INSERT INTO meta_sync (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
      [key, value],
    );
  }

  return {
    async pull() {
      const [stored] = await deps.localDatabase.query<{ value: string }>(
        'SELECT value FROM meta_sync WHERE key = ?',
        [VERSION_KEY],
      );
      const response = await deps.http.call('getDownloadSet', {
        query: stored ? { version: stored.value } : {},
      });
      const syncedAt = deps.now().toISOString();

      const set = response.data;
      if (!set) {
        await deps.localDatabase.transaction((tx) => setMeta(tx, LAST_SYNC_KEY, syncedAt));
        return { status: 'unchanged' };
      }

      await deps.localDatabase.transaction((tx) => writeLayerOne(tx, set));
      const recipesDownloaded = await downloadRecipes(set, syncedAt);

      await deps.localDatabase.transaction(async (tx) => {
        await setMeta(tx, VERSION_KEY, set.version);
        await setMeta(tx, LAST_SYNC_KEY, syncedAt);
      });

      return {
        status: 'updated',
        version: set.version,
        recipesDownloaded,
        minPackageVersion: set.minPackageVersion,
      };
    },
  };

  async function downloadRecipes(set: DownloadSet, downloadedAt: string): Promise<number> {
    const current = new Map(
      (
        await deps.localDatabase.query<{ dish_id: string; updated_at: string }>(
          'SELECT dish_id, updated_at FROM recipes_local',
        )
      ).map((row) => [row.dish_id, row.updated_at]),
    );
    const pending = set.recipesToDownload.filter(
      (item) => current.get(item.dishId) !== item.updatedAt,
    );

    for (const item of pending) {
      const { data } = await deps.http.call('getRecipe', { path: { dishId: item.dishId } });
      await deps.localDatabase.execute(
        `INSERT INTO recipes_local (dish_id, updated_at, photo_hash, data, downloaded_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (dish_id) DO UPDATE SET updated_at = excluded.updated_at,
           photo_hash = excluded.photo_hash, data = excluded.data, downloaded_at = excluded.downloaded_at`,
        [item.dishId, item.updatedAt, item.photoHash ?? null, JSON.stringify(data), downloadedAt],
      );
    }

    const hashes = pending.flatMap((item) => (item.photoHash ? [item.photoHash] : []));
    if (hashes.length > 0) {
      await deps.ensurePhotos(hashes);
    }
    return pending.length;
  }
}

async function writeLayerOne(tx: SqlExecutor, set: DownloadSet): Promise<void> {
  // onboarded_at is device-only state, so the upsert must not overwrite it.
  await tx.execute(
    `INSERT INTO profile_local (id, name, culinary_preferences, reminders, updated_at)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET name = excluded.name,
       culinary_preferences = excluded.culinary_preferences,
       reminders = excluded.reminders, updated_at = excluded.updated_at`,
    [
      set.profile.name ?? null,
      JSON.stringify(set.profile.culinaryPreferences),
      set.profile.reminders ? JSON.stringify(set.profile.reminders) : null,
      set.generatedAt,
    ],
  );

  // Full replacement: a restriction revoked on the server must disappear here too (RN09).
  await tx.execute('DELETE FROM restrictions_local');
  for (const restriction of set.restrictions) {
    await tx.execute(
      'INSERT INTO restrictions_local (restriction_type, consent_at) VALUES (?, ?)',
      [restriction.restrictionType, restriction.consentAt],
    );
  }

  await tx.execute('DELETE FROM candidates_local');
  for (const candidate of set.candidates) {
    await tx.execute(
      'INSERT INTO candidates_local (suggestion_id, dish_id, data) VALUES (?, ?, ?)',
      [candidate.id, candidate.dish.dishId, JSON.stringify(candidate)],
    );
  }

  await tx.execute('DELETE FROM ratings_local');
  for (const rating of set.ratings) {
    await tx.execute(
      'INSERT INTO ratings_local (id, dish_id, data, rated_on) VALUES (?, ?, ?, ?)',
      [rating.id, rating.dishId, JSON.stringify(rating), rating.date],
    );
  }

  // Unlocks only accumulate (RN04): never delete, ignore ones we already have.
  for (const evolution of set.evolutionUnlocks) {
    await tx.execute(
      "INSERT OR IGNORE INTO unlocks_local (kind, target_id, unlocked_at) VALUES ('evolution', ?, NULL)",
      [evolution],
    );
  }
  for (const award of set.badgeAwards) {
    await tx.execute(
      "INSERT OR IGNORE INTO unlocks_local (kind, target_id, unlocked_at) VALUES ('badge', ?, ?)",
      [award.definitionId, award.unlockedAt],
    );
  }
}
