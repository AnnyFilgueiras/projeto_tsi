import type { SqlExecutor } from '../local-db/local-database';
import type { ClientOperation, OperationType } from './operation-enqueuer';

/**
 * Writes the local effect of a confirmed operation inside the enqueuer's transaction.
 *
 * Projectors belong to the owning feature's `data/` layer (the only layer allowed to touch
 * LocalDatabase, A3) and are wired by type at the composition root (A8). Features implement this
 * shape structurally, so they never import `core/sync` internals (A4).
 */
export type LocalOperationProjector = (
  tx: SqlExecutor,
  operation: ClientOperation,
) => Promise<void>;

/**
 * A missing entry means the operation has no local copy to update yet; the next download-set
 * sync brings the server state down anyway (Stage 1: the server is the source of truth).
 */
export type LocalOperationProjectors = Partial<Record<OperationType, LocalOperationProjector>>;
