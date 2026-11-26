import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { LocalDatabase, SqlValue } from '../../src/core/local-db/local-database';
import { createSerializedDatabase } from '../../src/core/local-db/serialized-database';

export interface FakeLocalDatabase extends LocalDatabase {
  /** Synchronous peek for assertions, bypassing the serialized queue. */
  rows<TRow = Record<string, unknown>>(sql: string, params?: readonly SqlValue[]): TRow[];
  close(): void;
}

/**
 * In-memory LocalDatabase backed by Node's built-in SQLite, so migrations and repository SQL run
 * for real in Jest. It shares `createSerializedDatabase` with SqlCipherDatabase; only the driver
 * (and the encryption) differ.
 */
export function createFakeLocalDatabase(): FakeLocalDatabase {
  const db = new DatabaseSync(':memory:');
  const toParams = (params: readonly SqlValue[]) => params as SQLInputValue[];

  const local = createSerializedDatabase({
    async run(sql, params) {
      db.prepare(sql).run(...toParams(params));
    },
    async all<TRow>(sql: string, params: readonly SqlValue[]) {
      return db.prepare(sql).all(...toParams(params)) as TRow[];
    },
  });

  return {
    ...local,
    rows: <TRow>(sql: string, params: readonly SqlValue[] = []) =>
      db.prepare(sql).all(...toParams(params)) as TRow[],
    close: () => db.close(),
  };
}
