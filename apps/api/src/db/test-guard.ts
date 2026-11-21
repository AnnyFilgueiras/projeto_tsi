/**
 * Database URL safety guards preventing accidental test or reset runs against
 * non-isolated databases (Playbook 03, Section 4).
 */
export function extractDatabaseName(databaseUrl: string | undefined): string {
  if (!databaseUrl || databaseUrl.trim() === '') {
    throw new Error('DATABASE_URL is required and cannot be empty.');
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL.');
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error(
      `Unsupported database protocol "${parsed.protocol}": expected "postgres:" or "postgresql:".`,
    );
  }

  const dbName = parsed.pathname.replace(/^\/+/, '').trim();
  if (!dbName) {
    throw new Error('DATABASE_URL must specify a database name.');
  }

  return dbName;
}

/**
 * Integration tests refuse to start unless DATABASE_URL points to a `*_test` database,
 * protecting `panelada_dev` from being truncated or mutated by automated tests.
 */
export function assertTestDatabaseUrl(databaseUrl: string | undefined): string {
  const dbName = extractDatabaseName(databaseUrl);
  if (!dbName.endsWith('_test')) {
    throw new Error(
      `Refusing to run integration tests against database "${dbName}": DATABASE_URL must target a database ending with "_test".`,
    );
  }
  return databaseUrl as string;
}

/**
 * `db:reset` drops and recreates schemas, so it is restricted to `*_dev` and `*_test` databases.
 */
export function assertResettableDatabaseUrl(databaseUrl: string | undefined): string {
  const dbName = extractDatabaseName(databaseUrl);
  if (!dbName.endsWith('_dev') && !dbName.endsWith('_test')) {
    throw new Error(
      `Refusing to reset database "${dbName}": db:reset is only allowed on databases ending with "_dev" or "_test".`,
    );
  }
  return databaseUrl as string;
}
