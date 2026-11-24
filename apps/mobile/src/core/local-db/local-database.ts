/**
 * Local encrypted database port (ADR-005, A2, A3).
 *
 * Only `features/<feature>/data/**`, `core/sync/**` and `src/app/composition/**` may import
 * this port. The concrete adapter is `SqlCipherDatabase` (`sqlcipher-database.ts`), the only
 * file allowed to touch the native driver (A2).
 */
export type SqlValue = string | number | null | Uint8Array;

export interface SqlExecutor {
  execute(sql: string, params?: readonly SqlValue[]): Promise<void>;
  query<TRow = Record<string, unknown>>(
    sql: string,
    params?: readonly SqlValue[],
  ): Promise<readonly TRow[]>;
}

export interface LocalDatabase extends SqlExecutor {
  /**
   * Runs `work` atomically: every statement issued through `tx` commits together or is rolled
   * back if `work` throws. Statements issued through the outer database while a transaction is
   * open wait for it to finish, so they never leak into someone else's rollback.
   */
  transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T>;
}
