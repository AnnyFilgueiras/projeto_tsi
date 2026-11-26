import type { LocalDatabase } from './local-database';

export interface Migration {
  /** 1-based and contiguous; stored in `PRAGMA user_version` once applied. */
  readonly version: number;
  readonly name: string;
  readonly statements: readonly string[];
}

export interface MigrationOutcome {
  readonly from: number;
  readonly to: number;
}

/**
 * Applies pending migrations, each in its own transaction together with the `user_version`
 * bump, so a crash mid-way never leaves a half-applied version behind. Re-running is a no-op.
 *
 * `user_version` lives in the database header (inside the SQLCipher-encrypted file), which avoids
 * a bookkeeping table that could drift from the schema it describes.
 */
export async function runMigrations(
  db: LocalDatabase,
  migrations: readonly Migration[],
): Promise<MigrationOutcome> {
  migrations.forEach((migration, index) => {
    if (migration.version !== index + 1) {
      throw new Error('Local migrations must be contiguous and ordered starting at version 1.');
    }
  });

  const from = await readUserVersion(db);
  const latest = migrations.length;
  if (from > latest) {
    // Opening a newer schema with older code could corrupt it; fail loudly instead.
    throw new Error(
      `Local database schema v${from} is newer than this app (v${latest}). Update the app.`,
    );
  }

  for (const migration of migrations.slice(from)) {
    try {
      await db.transaction(async (tx) => {
        for (const statement of migration.statements) {
          await tx.execute(statement);
        }
        // PRAGMA does not accept bound parameters; the version is an integer we control.
        await tx.execute(`PRAGMA user_version = ${migration.version}`);
      });
    } catch (error) {
      throw new Error(
        `Local migration ${migration.version} (${migration.name}) failed: ${describe(error)}`,
        { cause: error },
      );
    }
  }

  return { from, to: latest };
}

async function readUserVersion(db: LocalDatabase): Promise<number> {
  const [row] = await db.query<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
