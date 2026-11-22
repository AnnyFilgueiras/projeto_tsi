import type { Tx } from '../../../shared/tx.js';

/**
 * Public lifecycle facade for the profile module (P06, T01).
 * Called by `cross-cutting/identity` inside the same database transaction as Account creation/deletion.
 */
export interface ProfileLifecyclePort {
  createProfile(accountId: string, tx: Tx): Promise<void>;
  deleteData(accountId: string, tx: Tx): Promise<void>;
}
