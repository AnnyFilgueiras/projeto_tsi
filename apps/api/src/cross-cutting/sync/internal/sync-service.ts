import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import type {
  OperationApplyResult,
  OperationApplyUnlocks,
  OperationEnvelope,
} from '../../../shared/operation-applier.js';
import { keyReusedProblem, type ProblemDetails } from '../../../shared/problem.js';
import type { OperationApplierRegistry } from './applier-registry.js';
import { hashOperationPayload } from './canonical-hash.js';
import type { OperationStore } from './repository.js';

export const IDEMPOTENCY_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export interface OperationBatchItemResult {
  readonly opId: string;
  readonly status: 'confirmed' | 'rejected';
  readonly repeated: boolean;
  readonly unlocks?: OperationApplyUnlocks;
  readonly error?: ProblemDetails;
}

export interface ProcessBatchResponse {
  readonly results: readonly OperationBatchItemResult[];
  readonly minPackageVersion: string;
}

export interface SyncServiceDeps {
  readonly registry: OperationApplierRegistry;
  readonly store: OperationStore;
  readonly clock?: () => Date;
}

function toBatchItemResult(
  opId: string,
  applyResult: OperationApplyResult,
  repeated: boolean,
): OperationBatchItemResult {
  return {
    opId,
    status: applyResult.status,
    repeated,
    ...(applyResult.unlocks ? { unlocks: applyResult.unlocks } : {}),
    ...(applyResult.error ? { error: applyResult.error } : {}),
  };
}

function isUniqueViolationError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const directCode = (error as { code?: unknown }).code;
  if (directCode === '23505') {
    return true;
  }
  const cause = (error as { cause?: unknown }).cause;
  return (
    typeof cause === 'object' && cause !== null && (cause as { code?: unknown }).code === '23505'
  );
}

function resolveExistingRecord(
  opId: string,
  payloadHash: string,
  existing: { readonly payloadHash: string; readonly response: OperationApplyResult },
): OperationBatchItemResult {
  if (existing.payloadHash === payloadHash) {
    return toBatchItemResult(opId, existing.response, true);
  }
  // ADR-008 / P05: Reusing an opId with a different payload is rejected per item with 422 `key-reused`.
  return {
    opId,
    status: 'rejected',
    repeated: false,
    error: keyReusedProblem(),
  };
}

/**
 * Idempotent Receiver orchestrating queued operation batches (ADR-008, P01, P05, T01).
 *
 * Each operation executes inside a transaction that applies the domain effect and writes
 * `sync_processed_operations` atomically. Operations are processed sequentially in order
 * and never abort the rest of the batch on per-item validation/domain rejection.
 */
export class SyncService {
  private readonly registry: OperationApplierRegistry;
  private readonly store: OperationStore;
  private readonly clock: () => Date;

  constructor(deps: SyncServiceDeps) {
    this.registry = deps.registry;
    this.store = deps.store;
    this.clock = deps.clock ?? (() => new Date());
  }

  async processBatch(
    accountId: string,
    operations: readonly OperationEnvelope[],
  ): Promise<ProcessBatchResponse> {
    const results: OperationBatchItemResult[] = [];

    for (const operation of operations) {
      const result = await this.processSingle(accountId, operation);
      results.push(result);
    }

    return {
      results,
      minPackageVersion: PACKAGE_VERSION,
    };
  }

  private async processSingle(
    accountId: string,
    operation: OperationEnvelope,
  ): Promise<OperationBatchItemResult> {
    const payloadHash = hashOperationPayload(operation.type, operation.payload);

    try {
      return await this.store.withTransaction(async (tx) => {
        const existing = await this.store.find(accountId, operation.opId, tx);
        if (existing) {
          return resolveExistingRecord(operation.opId, payloadHash, existing);
        }

        const applier = this.registry.get(operation.type);
        if (!applier) {
          return {
            opId: operation.opId,
            status: 'rejected',
            repeated: false,
            error: {
              type: 'operation-not-supported',
              title: 'Tipo de operação ainda não suportado',
              status: 501,
              detail: `O tipo de operação "${operation.type}" ainda não está registrado nesta versão da API.`,
            },
          };
        }

        const applyResult = await applier.apply(operation, { accountId, tx });
        const now = this.clock();

        // T01 / P05: Record idempotency entry in the exact same transaction as the domain applier.
        await this.store.save(
          {
            accountId,
            opId: operation.opId,
            type: operation.type,
            payloadHash,
            status: applyResult.status,
            response: applyResult,
            createdAt: now,
            expiresAt: new Date(now.getTime() + IDEMPOTENCY_TTL_MS),
          },
          tx,
        );

        return toBatchItemResult(operation.opId, applyResult, false);
      });
    } catch (error: unknown) {
      // Handle concurrent duplicate (accountId, opId) insert races (PG 23505) idempotently
      // outside the aborted transaction rather than failing the batch with HTTP 500.
      if (isUniqueViolationError(error)) {
        const existing = await this.store.withTransaction((tx) =>
          this.store.find(accountId, operation.opId, tx),
        );
        if (existing) {
          return resolveExistingRecord(operation.opId, payloadHash, existing);
        }
      }
      throw error;
    }
  }
}
