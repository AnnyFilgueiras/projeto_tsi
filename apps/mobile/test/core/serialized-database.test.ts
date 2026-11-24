import { createFakeLocalDatabase, type FakeLocalDatabase } from '../support/fake-local-database';

describe('serialized LocalDatabase transactions (ADR-005)', () => {
  let db: FakeLocalDatabase;

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await db.execute('CREATE TABLE t (v TEXT)');
  });

  afterEach(() => db.close());

  it('keeps a write issued during an open transaction out of that transaction rollback', async () => {
    let releaseTx!: () => void;
    const txStarted = new Promise<void>((resolve) => {
      const failing = db.transaction(async (tx) => {
        await tx.execute("INSERT INTO t VALUES ('inside')");
        resolve();
        await new Promise<void>((release) => (releaseTx = release));
        throw new Error('boom');
      });
      failing.catch(() => undefined);
    });

    await txStarted;
    const outside = db.execute("INSERT INTO t VALUES ('outside')");
    releaseTx();
    await outside;

    expect(db.rows('SELECT v FROM t')).toEqual([{ v: 'outside' }]);
  });

  it('refuses a transaction executor used after commit', async () => {
    let leaked!: Parameters<Parameters<FakeLocalDatabase['transaction']>[0]>[0];
    await db.transaction(async (tx) => {
      leaked = tx;
    });

    await expect(leaked.execute("INSERT INTO t VALUES ('late')")).rejects.toThrow(/after/i);
  });
});
