import type { Tx } from '../../../shared/tx.js';

/**
 * Restricted catalog write facade (S4, RN21, T01).
 *
 * Only `modules/importer` (and composition wiring) may import this file.
 * Every write requires a mandatory `tx: Tx` so publication stays atomic.
 */
export interface CatalogWritePort {
  publishApprovedDish(dishId: string, tx: Tx): Promise<void>;
}
