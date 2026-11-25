import type { AllergenCode } from '@panelada/allergen-rules/rules';
import type { OperationEnqueuer, OperationRequest } from '../../../core/sync/operation-enqueuer';

export interface RegisterRestrictionsInput {
  readonly codes: readonly AllergenCode[];
  /** The LGPD checkbox (RN09); without it nothing leaves the device. */
  readonly consented: boolean;
  /** Hand back the `retry` of an `unavailable` result to resume where it stopped. */
  readonly retry?: RestrictionsRetry;
}

/** Opaque to the UI: it only keeps it and passes it back on "Tentar novamente". */
export interface RestrictionsRetry {
  readonly consentAt: string;
  readonly confirmed: readonly string[];
  readonly pending: Readonly<Record<string, OperationRequest>>;
}

export type RegisterRestrictionsResult =
  | { readonly status: 'saved' }
  | { readonly status: 'consent-required' }
  | { readonly status: 'unavailable'; readonly retry: RestrictionsRetry }
  | { readonly status: 'rejected' };

export interface RegisterRestrictionsDeps {
  readonly enqueuer: OperationEnqueuer;
  readonly now: () => Date;
}

export type RegisterRestrictions = (
  input: RegisterRestrictionsInput,
) => Promise<RegisterRestrictionsResult>;

/**
 * Records the restrictions picked in onboarding (US09, RN09) as one `restriction.register` per
 * code through the OperationEnqueuer (A4).
 *
 * All codes share the `consentAt` of the moment the user accepted, even across retries: the
 * consent was given once, and a retry is the same act, not a new one. Codes run one by one so an
 * offline answer stops early; the retry resends the unanswered operation with the same `opId`
 * (idempotency key) and skips codes the server already confirmed.
 */
export function createRegisterRestrictions(deps: RegisterRestrictionsDeps): RegisterRestrictions {
  return async ({ codes, consented, retry }) => {
    if (!consented) return { status: 'consent-required' };

    const consentAt = retry?.consentAt ?? deps.now().toISOString();
    const confirmed = [...(retry?.confirmed ?? [])];

    for (const code of codes) {
      if (confirmed.includes(code)) continue;
      const request: OperationRequest = retry?.pending[code] ?? {
        type: 'restriction.register',
        payload: { restrictionType: code, consentAt },
      };

      const result = await deps.enqueuer.enqueue(request);
      if (result.status === 'unavailable') {
        return {
          status: 'unavailable',
          retry: {
            consentAt,
            confirmed,
            pending: { ...retry?.pending, [code]: result.operation },
          },
        };
      }
      if (result.status === 'rejected') return { status: 'rejected' };
      // `queued` (Stage 2 outbox) is as good as saved for the user.
      confirmed.push(code);
    }

    return { status: 'saved' };
  };
}
