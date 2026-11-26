import type { LocalDatabase, SqlExecutor, SqlValue } from './local-database';

/** Minimal statement runner a concrete driver must offer (expo-sqlite on device, node:sqlite in tests). */
export interface SqlDriver {
  run(sql: string, params: readonly SqlValue[]): Promise<void>;
  all<TRow>(sql: string, params: readonly SqlValue[]): Promise<TRow[]>;
}

/**
 * Wraps a single-connection driver into a `LocalDatabase` with serialized access.
 *
 * SQLite transactions are per connection, so an unrelated statement issued while a transaction
 * is open would silently join it (and vanish on rollback). Every call therefore goes through one
 * FIFO queue; the transaction body gets a direct executor that bypasses the queue.
 *
 * We deliberately do not use expo-sqlite's `withExclusiveTransactionAsync`: it opens a second
 * connection that never receives `PRAGMA key`, which breaks under SQLCipher (ADR-005).
 *
 * Calling the outer database from inside `transaction(work)` deadlocks by design — use `tx`.
 */
export function createSerializedDatabase(driver: SqlDriver): LocalDatabase {
  let tail: Promise<unknown> = Promise.resolve();

  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(task, task);
    tail = result.catch(() => undefined);
    return result;
  }

  return {
    execute: (sql, params = []) => enqueue(() => driver.run(sql, params)),
    query: <TRow>(sql: string, params: readonly SqlValue[] = []) =>
      enqueue(() => driver.all<TRow>(sql, params)),
    transaction: <T>(work: (tx: SqlExecutor) => Promise<T>) =>
      enqueue(async () => {
        let open = true;
        const guard = () => {
          if (!open) {
            throw new Error('Transaction executor used after the transaction finished.');
          }
        };
        const tx: SqlExecutor = {
          execute: async (sql, params = []) => {
            guard();
            await driver.run(sql, params);
          },
          query: async <TRow>(sql: string, params: readonly SqlValue[] = []) => {
            guard();
            return driver.all<TRow>(sql, params);
          },
        };

        await driver.run('BEGIN IMMEDIATE', []);
        try {
          const result = await work(tx);
          open = false;
          await driver.run('COMMIT', []);
          return result;
        } catch (error) {
          open = false;
          try {
            await driver.run('ROLLBACK', []);
          } catch {
            // Keep the original failure: it explains why we rolled back.
          }
          throw error;
        }
      }),
  };
}
