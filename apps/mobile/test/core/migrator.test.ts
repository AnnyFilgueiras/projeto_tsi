import { LOCAL_MIGRATIONS } from '../../src/core/local-db/migrations';
import { runMigrations, type Migration } from '../../src/core/local-db/migrator';
import { createFakeLocalDatabase, type FakeLocalDatabase } from '../support/fake-local-database';

const userVersion = (db: FakeLocalDatabase) =>
  db.rows<{ user_version: number }>('PRAGMA user_version')[0]?.user_version;

const tableNames = (db: FakeLocalDatabase) =>
  db
    .rows<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .map((row) => row.name);

describe('Migrator (ADR-005, ADR-008 local schema)', () => {
  let db: FakeLocalDatabase;

  beforeEach(() => {
    db = createFakeLocalDatabase();
  });

  afterEach(() => db.close());

  it('creates the Stage 1 local tables on a fresh database', async () => {
    const outcome = await runMigrations(db, LOCAL_MIGRATIONS);

    expect(tableNames(db)).toEqual([
      'candidates_local',
      'local_cooking_state',
      'meta_sync',
      'profile_local',
      'ratings_local',
      'recipes_local',
      'restrictions_local',
      'unlocks_local',
    ]);
    expect(outcome).toEqual({ from: 0, to: LOCAL_MIGRATIONS.length });
    expect(userVersion(db)).toBe(LOCAL_MIGRATIONS.length);
  });

  it('is idempotent: a second run applies nothing and keeps existing rows', async () => {
    await runMigrations(db, LOCAL_MIGRATIONS);
    await db.execute("INSERT INTO meta_sync (key, value) VALUES ('lastSyncAt', 'x')");

    const outcome = await runMigrations(db, LOCAL_MIGRATIONS);

    expect(outcome).toEqual({ from: LOCAL_MIGRATIONS.length, to: LOCAL_MIGRATIONS.length });
    expect(db.rows('SELECT key, value FROM meta_sync')).toEqual([
      { key: 'lastSyncAt', value: 'x' },
    ]);
  });

  it('applies only pending migrations, in order', async () => {
    const order: number[] = [];
    // Each migration records its version in a log table, so re-applying v1 would duplicate it.
    const logging = (version: number): Migration => ({
      version,
      name: `m${version}`,
      statements: [
        ...(version === 1 ? ['CREATE TABLE log (version INTEGER)'] : []),
        `INSERT INTO log (version) VALUES (${version})`,
      ],
    });
    await runMigrations(db, [logging(1)]);

    const outcome = await runMigrations(db, [logging(1), logging(2), logging(3)]);
    order.push(...db.rows<{ version: number }>('SELECT version FROM log').map((r) => r.version));

    expect(outcome).toEqual({ from: 1, to: 3 });
    expect(order).toEqual([1, 2, 3]);
  });

  it('rolls back a failing migration and keeps the previous version', async () => {
    const migrations: Migration[] = [
      { version: 1, name: 'ok', statements: ['CREATE TABLE a (id INTEGER)'] },
      {
        version: 2,
        name: 'broken',
        statements: ['CREATE TABLE b (id INTEGER)', 'THIS IS NOT SQL'],
      },
    ];

    await expect(runMigrations(db, migrations)).rejects.toThrow(/migration 2 \(broken\)/i);

    expect(userVersion(db)).toBe(1);
    expect(tableNames(db)).toEqual(['a']);
  });

  it('refuses a database written by a newer app version', async () => {
    await db.execute('PRAGMA user_version = 99');

    await expect(runMigrations(db, LOCAL_MIGRATIONS)).rejects.toThrow(/newer/i);
  });

  it('rejects a migration list with gaps or out of order', async () => {
    const gapped: Migration[] = [
      { version: 1, name: 'a', statements: [] },
      { version: 3, name: 'c', statements: [] },
    ];

    await expect(runMigrations(db, gapped)).rejects.toThrow(/contiguous/i);
  });
});
