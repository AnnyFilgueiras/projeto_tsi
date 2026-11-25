import type { SqlExecutor } from '../../../core/local-db/local-database';
import type { ClientOperation } from '../../../core/sync/operation-enqueuer';

type Projector = (tx: SqlExecutor, operation: ClientOperation) => Promise<void>;

/**
 * Local effect of confirmed restriction operations (RN09) on `restrictions_local`, the table this
 * feature owns. The enqueuer runs them inside its transaction only after the server confirms
 * (ADR-008 Stage 1), so an offline or rejected attempt never leaves a restriction on the device.
 *
 * Shaped like core/sync's LocalOperationProjectors without importing it (A4); the composition
 * root registers them by operation type (A8).
 */
export const restrictionProjectors: {
  readonly 'restriction.register': Projector;
  readonly 'restriction.revoke': Projector;
} = {
  'restriction.register': async (tx, operation) => {
    if (operation.type !== 'restriction.register') return;
    await tx.execute(
      `INSERT INTO restrictions_local (restriction_type, consent_at) VALUES (?, ?)
       ON CONFLICT (restriction_type) DO UPDATE SET consent_at = excluded.consent_at`,
      [operation.payload.restrictionType, operation.payload.consentAt],
    );
  },
  'restriction.revoke': async (tx, operation) => {
    if (operation.type !== 'restriction.revoke') return;
    await tx.execute('DELETE FROM restrictions_local WHERE restriction_type = ?', [
      operation.payload.restrictionType,
    ]);
  },
};
