import { hashCanonicalPayload } from './canonical-hash.js';
import { keyReusedProblem, ProblemError } from './problem.js';
import type { Tx } from './tx.js';

export const HTTP_IDEMPOTENCY_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export interface HttpIdempotencyRecord {
  readonly accountId: string;
  readonly idempotencyKey: string;
  readonly endpoint: string;
  readonly payloadHash: string;
  readonly statusCode: number;
  readonly responseBody: unknown;
  readonly createdAt: Date;
  readonly expiresAt: Date;
}

export interface SaveHttpIdempotencyInput {
  readonly accountId: string;
  readonly idempotencyKey: string;
  readonly endpoint: string;
  readonly payloadHash: string;
  readonly statusCode: number;
  readonly responseBody: unknown;
  readonly now: Date;
  readonly expiresAt: Date;
}

/**
 * Module-owned persistence seam for `Idempotency-Key` records (S8, P05).
 * Each domain module keeps its own `<module>_idempotency_keys` table while sharing the
 * lock/replay/mismatch protocol implemented in `executeIdempotentHttpMutation`.
 */
export interface HttpIdempotencyStore {
  acquireIdempotencyLock(accountId: string, idempotencyKey: string, tx: Tx): Promise<void>;
  findIdempotencyKey(
    accountId: string,
    idempotencyKey: string,
    tx?: Tx,
  ): Promise<HttpIdempotencyRecord | null>;
  saveIdempotencyKey(input: SaveHttpIdempotencyInput, tx: Tx): Promise<void>;
  deleteIdempotencyKey(accountId: string, idempotencyKey: string, tx: Tx): Promise<void>;
}

export interface IdempotentHttpResult<TBody> {
  readonly statusCode: number;
  readonly body: TBody;
}

export interface ExecuteIdempotentHttpParams<TBody> {
  readonly store: HttpIdempotencyStore;
  readonly tx: Tx;
  readonly accountId: string;
  readonly idempotencyKey: string;
  readonly endpoint: string;
  readonly payload: unknown;
  readonly now: Date;
  readonly execute: () => Promise<IdempotentHttpResult<TBody>>;
}

/**
 * Executes an online HTTP mutation guarded by `Idempotency-Key` inside an active transaction (P05).
 *
 * - Replays stored response when the same non-expired key matches endpoint and payload hash.
 * - Rejects with HTTP 422 `key-reused` when the key is reused with different endpoint/payload.
 * - Replaces expired entries past the 90-day retention window.
 */
export async function executeIdempotentHttpMutation<TBody>(
  params: ExecuteIdempotentHttpParams<TBody>,
): Promise<IdempotentHttpResult<TBody>> {
  const payloadHash = hashCanonicalPayload(params.endpoint, params.payload);

  await params.store.acquireIdempotencyLock(params.accountId, params.idempotencyKey, params.tx);

  const existing = await params.store.findIdempotencyKey(
    params.accountId,
    params.idempotencyKey,
    params.tx,
  );

  if (existing) {
    const expired = existing.expiresAt.getTime() <= params.now.getTime();
    if (!expired) {
      if (existing.endpoint !== params.endpoint || existing.payloadHash !== payloadHash) {
        throw new ProblemError(
          keyReusedProblem(
            'A Idempotency-Key informada já foi utilizada com conteúdo ou rota diferente.',
          ),
        );
      }

      return {
        statusCode: existing.statusCode,
        body: existing.responseBody as TBody,
      };
    }

    await params.store.deleteIdempotencyKey(params.accountId, params.idempotencyKey, params.tx);
  }

  const outcome = await params.execute();

  await params.store.saveIdempotencyKey(
    {
      accountId: params.accountId,
      idempotencyKey: params.idempotencyKey,
      endpoint: params.endpoint,
      payloadHash,
      statusCode: outcome.statusCode,
      responseBody: outcome.body ?? null,
      now: params.now,
      expiresAt: new Date(params.now.getTime() + HTTP_IDEMPOTENCY_TTL_MS),
    },
    params.tx,
  );

  return outcome;
}
