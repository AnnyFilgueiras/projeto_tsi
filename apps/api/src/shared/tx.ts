import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { PgTransaction } from 'drizzle-orm/pg-core';

declare const txBrand: unique symbol;

/**
 * Opaque transaction handle required by cross-module write methods (T01, S8).
 *
 * Cross-module writers must accept `tx: Tx` as a mandatory parameter without
 * falling back to the global connection pool so multi-module mutations stay atomic.
 */
export type Tx = PgTransaction<
  NodePgQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
> & {
  readonly [txBrand]: 'Tx';
};
