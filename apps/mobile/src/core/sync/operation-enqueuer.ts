/**
 * Operation enqueue port used by feature use cases (ADR-008, P04, A4).
 *
 * Stage 1 injects `DirectOnlineOperationEnqueuer`; Stage 2 swaps in
 * `OutboxOperationEnqueuer` at the composition root without changing features.
 */
export interface QueuedClientOperation {
  readonly opId: string;
  readonly type: string;
  readonly occurredAt: string;
  readonly payload: unknown;
}

export interface OperationEnqueuer {
  enqueue(operation: QueuedClientOperation): Promise<void>;
}
