import type { components } from '../network/openapi.generated';

/**
 * Operation enqueue port used by feature use cases (ADR-008, P04, A4).
 *
 * Every feature mutation goes through this port. Stage 1 injects `DirectOnlineOperationEnqueuer`
 * (send now, then update the local copy); Stage 2 swaps in `OutboxOperationEnqueuer` at the
 * composition root (write locally, queue, sync later) without changing features — which is why
 * `queued` is already part of the result type.
 */
export type ClientOperation = components['schemas']['Operation'];
export type OperationType = ClientOperation['type'];
export type Unlocks = components['schemas']['Unlocks'];
export type OperationProblem = components['schemas']['Problem'];

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * What a feature asks to record. Leave `opId`/`createdAt` empty for a new action; pass back the
 * `operation` from an `unavailable` result to retry it with the same idempotency key.
 */
export type OperationRequest = DistributiveOmit<ClientOperation, 'opId' | 'createdAt'> & {
  readonly opId?: string;
  readonly createdAt?: string;
};

export type EnqueueResult =
  | {
      readonly status: 'confirmed';
      readonly opId: string;
      /** The server had already processed this opId; nothing was applied twice. */
      readonly repeated: boolean;
      /** Only additions, never revocations (RN04). */
      readonly unlocks: Unlocks;
      /** `stale` when the server applied it but the local write failed; the next download-set sync heals it. */
      readonly localCopy: 'updated' | 'stale';
    }
  | {
      readonly status: 'rejected';
      readonly opId: string;
      readonly problem: OperationProblem | undefined;
    }
  | {
      /** Nothing changed anywhere; retry later by enqueuing `operation` again. */
      readonly status: 'unavailable';
      readonly opId: string;
      readonly reason: 'offline' | 'server-error' | 'rate-limited';
      readonly operation: ClientOperation;
    }
  | {
      /** Stage 2 only: stored locally and waiting in the outbox. */
      readonly status: 'queued';
      readonly opId: string;
    };

export interface OperationEnqueuer {
  /**
   * @throws SessionExpiredError when the user must start a new session; other API errors
   * (malformed operation, batch too large) are programming errors and are rethrown as HttpError.
   */
  enqueue(request: OperationRequest): Promise<EnqueueResult>;
}
