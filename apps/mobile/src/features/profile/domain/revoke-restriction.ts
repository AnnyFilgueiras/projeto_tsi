import type { ClientOperation, OperationEnqueuer } from '../../../core/sync/operation-enqueuer';

export interface RevokeRestrictionInput {
  readonly code: string;
  /** Hand back the `retry` of an `unavailable` result to resend the same operation. */
  readonly retry?: RevokeRetry;
}

/** Opaque to the UI: it only keeps it and passes it back on "Tentar novamente". */
export interface RevokeRetry {
  readonly operation: ClientOperation;
}

export type RevokeRestrictionResult =
  | { readonly status: 'removed' }
  | { readonly status: 'unavailable'; readonly retry: RevokeRetry }
  | { readonly status: 'rejected' };

export interface RevokeRestrictionDeps {
  readonly enqueuer: OperationEnqueuer;
}

export type RevokeRestriction = (input: RevokeRestrictionInput) => Promise<RevokeRestrictionResult>;

/**
 * Removes one restriction from the profile (US09, RN09) as a `restriction.revoke` through the
 * OperationEnqueuer (A4). The local row disappears only when the server confirms (ADR-008
 * Stage 1), so an offline attempt leaves the profile exactly as it was.
 *
 * Removing the last restriction is also how the user withdraws the LGPD consent: `consent_at`
 * lives on each row, so no rows means no consent on record.
 */
export function createRevokeRestriction(deps: RevokeRestrictionDeps): RevokeRestriction {
  return async ({ code, retry }) => {
    // A retry reuses the same opId (idempotency key) so the server never applies it twice.
    const result = await deps.enqueuer.enqueue(
      retry?.operation ?? { type: 'restriction.revoke', payload: { restrictionType: code } },
    );
    if (result.status === 'unavailable') {
      return { status: 'unavailable', retry: { operation: result.operation } };
    }
    if (result.status === 'rejected') return { status: 'rejected' };
    // `queued` (Stage 2 outbox) is as good as removed for the user.
    return { status: 'removed' };
  };
}
