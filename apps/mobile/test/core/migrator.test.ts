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

const columnNames = (db: FakeLocalDatabase, table: string) =>
  db.rows<{ name: string }>(`PRAGMA table_info(${table})`).map((row) => row.name);

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
      'catalog_index_local',
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

  it('keeps "em preparo" per dish with the current step (v2, Onda 1A has no RoutineItem)', async () => {
    await runMigrations(db, LOCAL_MIGRATIONS);

    expect(columnNames(db, 'local_cooking_state')).toEqual([
      'dish_id',
      'started_at',
      'current_step',
    ]);
    await db.execute(
      "INSERT INTO local_cooking_state (dish_id, started_at) VALUES ('d1', '2026-11-24')",
    );
    expect(db.rows('SELECT current_step FROM local_cooking_state')).toEqual([{ current_step: 0 }]);
  });

  it('upgrades a v1 database with data to v2 without losing rows, then is a no-op', async () => {
    await runMigrations(db, LOCAL_MIGRATIONS.slice(0, 1));
    const seed: [string, string][] = [
      ['profile_local', "INSERT INTO profile_local (id, name) VALUES (1, 'Ana')"],
      [
        'restrictions_local',
        "INSERT INTO restrictions_local (restriction_type, consent_at) VALUES ('leite', 'x')",
      ],
      [
        'candidates_local',
        "INSERT INTO candidates_local (suggestion_id, dish_id, data) VALUES ('s1', 'd1', '{}')",
      ],
      [
        'recipes_local',
        "INSERT INTO recipes_local (dish_id, updated_at, data, downloaded_at) VALUES ('d1', 'x', '{}', 'x')",
      ],
      [
        'ratings_local',
        "INSERT INTO ratings_local (id, dish_id, data, rated_on) VALUES ('r1', 'd1', '{}', 'x')",
      ],
      ['unlocks_local', "INSERT INTO unlocks_local (kind, target_id) VALUES ('badge', 'b1')"],
      ['meta_sync', "INSERT INTO meta_sync (key, value) VALUES ('lastSyncAt', 'x')"],
    ];
    for (const [, insert] of seed) {
      await db.execute(insert);
    }
    const snapshot = () =>
      Object.fromEntries(seed.map(([table]) => [table, db.rows(`SELECT * FROM ${table}`)]));
    const before = snapshot();

    const upgrade = await runMigrations(db, LOCAL_MIGRATIONS);
    const rerun = await runMigrations(db, LOCAL_MIGRATIONS);

    expect(upgrade).toEqual({ from: 1, to: 2 });
    expect(rerun).toEqual({ from: 2, to: 2 });
    expect(userVersion(db)).toBe(2);
    expect(snapshot()).toEqual(before);
    expect(db.rows('SELECT * FROM catalog_index_local')).toEqual([]);
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
