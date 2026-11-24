import * as SQLite from 'expo-sqlite';
import type { LocalDatabase } from './local-database';
import { createSerializedDatabase } from './serialized-database';

export interface SqlCipherDatabaseOptions {
  readonly databaseName: string;
  /** 64 lowercase hex chars (256 bits) from DatabaseKeyStore. */
  readonly keyHex: string;
}

/** The file exists but the stored key does not open it (e.g. secure storage was wiped). */
export class LocalDatabaseUnreadableError extends Error {
  override readonly name = 'LocalDatabaseUnreadableError';
}

/** The build has no SQLCipher; deleting the file would not help, so callers must not reset. */
export class SqlCipherUnavailableError extends Error {
  override readonly name = 'SqlCipherUnavailableError';
}

const HEX_KEY = /^[0-9a-f]{64}$/;

/**
 * SqlCipherDatabase — the only module that imports the native SQLite driver (A2, ADR-005).
 *
 * Requires the `expo-sqlite` config plugin with `useSQLCipher: true` in the development build.
 */
export async function openSqlCipherDatabase(
  options: SqlCipherDatabaseOptions,
): Promise<LocalDatabase> {
  // The key is interpolated into a PRAGMA (no bind parameters there), so accept hex only.
  if (!HEX_KEY.test(options.keyHex)) {
    throw new Error('SQLCipher key must be 64 lowercase hex characters.');
  }

  const db = await SQLite.openDatabaseAsync(options.databaseName);
  try {
    // `PRAGMA key` must be the first statement on the connection, before anything reads pages.
    await db.execAsync(`PRAGMA key = "x'${options.keyHex}'"`);

    // Without SQLCipher linked in, `PRAGMA key` is silently ignored and data would be written
    // in clear text. Fail closed instead (A05): an empty cipher_version means no encryption.
    const [cipher] = await db.getAllAsync<{ cipher_version?: string }>('PRAGMA cipher_version');
    if (!cipher?.cipher_version) {
      throw new SqlCipherUnavailableError(
        'SQLCipher is not available in this build; refusing to store data unencrypted.',
      );
    }

    // A wrong key only surfaces on the first page read.
    await db.getAllAsync('SELECT count(*) AS n FROM sqlite_master');
    await db.execAsync('PRAGMA foreign_keys = ON');
  } catch (error) {
    await db.closeAsync().catch(() => undefined);
    if (error instanceof SqlCipherUnavailableError) throw error;
    throw new LocalDatabaseUnreadableError(
      `Local database "${options.databaseName}" could not be opened with the stored key.`,
      { cause: error },
    );
  }

  return createSerializedDatabase({
    async run(sql, params) {
      await db.runAsync(sql, params as SQLite.SQLiteBindValue[]);
    },
    all: <TRow>(sql: string, params: readonly unknown[]) =>
      db.getAllAsync<TRow>(sql, params as SQLite.SQLiteBindValue[]),
  });
}

/**
 * Deletes the encrypted file. Used when the key is gone (e.g. secure storage cleared): in Stage 1
 * the server is the source of truth, so the copy is rebuilt from the download set; only the
 * device-only "em preparo" state is lost.
 */
export async function deleteSqlCipherDatabase(databaseName: string): Promise<void> {
  await SQLite.deleteDatabaseAsync(databaseName);
}
