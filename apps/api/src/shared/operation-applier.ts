import type { ProblemDetails } from './problem.js';
import type { Tx } from './tx.js';

/**
 * Canonical offline queue operation types defined in docs/fase2/04-contratos/openapi.yaml (P01).
 */
export const OPERATION_TYPES = [
  'rating.register',
  'item.reschedule',
  'item.remove',
  'list.set_purchase_date',
  'list.mark_item',
  'restriction.register',
  'restriction.revoke',
  'reminders.set',
] as const;

export type OperationType = (typeof OPERATION_TYPES)[number];

export interface OperationEnvelope<
  TType extends OperationType = OperationType,
  TPayload = unknown,
> {
  readonly opId: string;
  readonly type: TType;
  readonly createdAt: string;
  readonly payload: TPayload;
}

export interface OperationApplyContext {
  readonly accountId: string;
  readonly tx: Tx;
}

export interface OperationApplyUnlocks {
  readonly evolutions: readonly string[];
  readonly badgeAwards: readonly string[];
}

export interface OperationApplyResult {
  readonly status: 'confirmed' | 'rejected';
  readonly unlocks?: OperationApplyUnlocks;
  readonly error?: ProblemDetails;
}

/**
 * Contract implemented by each domain module to apply a single queued operation (P01).
 */
export interface OperationApplier<TType extends OperationType = OperationType, TPayload = unknown> {
  readonly operationType: TType;
  apply(
    operation: OperationEnvelope<TType, TPayload>,
    context: OperationApplyContext,
  ): Promise<OperationApplyResult>;
}
