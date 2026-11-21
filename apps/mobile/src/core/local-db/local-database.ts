/**
 * Local encrypted database port (ADR-005, A2, A3).
 *
 * Only `features/<feature>/data/**` and `src/app/composition/**` may import this port.
 * The concrete SQLCipher adapter is introduced in MVP-04D inside `sqlcipher-database.ts`.
 */
export interface LocalDatabase {
  execute(sql: string, params?: readonly unknown[]): Promise<void>;
  query<TRow = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<readonly TRow[]>;
}
