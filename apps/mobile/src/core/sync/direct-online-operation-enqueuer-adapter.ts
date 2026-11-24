import type { LocalDatabase, SqlExecutor } from '../local-db/local-database';
import type { HttpClient } from '../network/http-client';
import { HttpError, NetworkUnavailableError, SessionExpiredError } from '../network/http-errors';
import type { LocalOperationProjectors } from './local-operation-projector';
import type {
  ClientOperation,
  EnqueueResult,
  OperationEnqueuer,
  OperationRequest,
  Unlocks,
} from './operation-enqueuer';

export interface DirectOnlineOperationEnqueuerDeps {
  readonly http: HttpClient;
  readonly localDatabase: LocalDatabase;
  readonly projectors: LocalOperationProjectors;
  readonly newOperationId: () => string;
  readonly now: () => Date;
}

/**
 * Stage 1 OperationEnqueuer (ADR-008 Option 3C, P04): mutations happen online.
 *
 * The local copy is written only after the server confirms, so an offline attempt, a 5xx or a
 * rejection leaves local data exactly as it was — there is no outbox to reconcile in Stage 1.
 */
export function createDirectOnlineOperationEnqueuer(
  deps: DirectOnlineOperationEnqueuerDeps,
): OperationEnqueuer {
  return {
    async enqueue(request: OperationRequest): Promise<EnqueueResult> {
      const operation = {
        ...request,
        opId: request.opId ?? deps.newOperationId(),
        createdAt: request.createdAt ?? deps.now().toISOString(),
      } as ClientOperation;
      const { opId } = operation;

      let results;
      try {
        const response = await deps.http.call('sendOperations', {
          body: { operations: [operation] },
        });
        results = response.data?.results ?? [];
      } catch (error) {
        const reason = retryableReason(error);
        if (reason) {
          return { status: 'unavailable', opId, reason, operation };
        }
        throw error;
      }

      const result = results.find((candidate) => candidate.opId === opId);
      if (!result) {
        throw new Error(`Sync response did not include a result for operation ${opId}.`);
      }
      if (result.status === 'rejected') {
        return { status: 'rejected', opId, problem: result.error };
      }

      const unlocks = result.unlocks ?? {};
      let localCopy: 'updated' | 'stale' = 'updated';
      try {
        await deps.localDatabase.transaction(async (tx) => {
          await deps.projectors[operation.type]?.(tx, operation);
          await recordUnlocks(tx, unlocks, deps.now().toISOString());
        });
      } catch {
        // The server already applied the operation; failing here would invite a pointless retry.
        localCopy = 'stale';
      }

      return { status: 'confirmed', opId, repeated: result.repeated, unlocks, localCopy };
    },
  };
}

function retryableReason(error: unknown): 'offline' | 'server-error' | 'rate-limited' | null {
  if (error instanceof NetworkUnavailableError) return 'offline';
  if (error instanceof SessionExpiredError) return null;
  if (error instanceof HttpError) {
    // The contract says network errors and 5xx produce no result: resend the same opId.
    if (error.status >= 500) return 'server-error';
    if (error.status === 429) return 'rate-limited';
  }
  return null;
}

async function recordUnlocks(tx: SqlExecutor, unlocks: Unlocks, at: string): Promise<void> {
  const rows: (readonly ['evolution' | 'badge', string])[] = [
    ...(unlocks.evolutions ?? []).map((id) => ['evolution', id] as const),
    ...(unlocks.badgeAwards ?? []).map((id) => ['badge', id] as const),
  ];
  for (const [kind, id] of rows) {
    // OR IGNORE: unlocks only accumulate (RN04) and a repeated opId may report them again.
    await tx.execute(
      'INSERT OR IGNORE INTO unlocks_local (kind, target_id, unlocked_at) VALUES (?, ?, ?)',
      [kind, id, at],
    );
  }
}
