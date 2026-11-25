import type { HttpClient } from '../../../core/network/http-client';
import { NetworkUnavailableError } from '../../../core/network/http-errors';
import type { SessionGate } from '../../../core/network/session';
import type { RemoteResult, SuggestionItem, SuggestionsGateway } from '../domain/suggestion-round';

export interface SuggestionsGatewayDeps {
  readonly http: HttpClient;
  readonly sessions: SessionGate;
}

/**
 * Suggestion endpoints over the typed HttpClient. Approve/discard are plain online calls (#79):
 * the sync `Operation` contract has no suggestion types, so they do not go through the enqueuer.
 */
export function createSuggestionsGateway({
  http,
  sessions,
}: SuggestionsGatewayDeps): SuggestionsGateway {
  return {
    fetchRound: (limit) =>
      attempt(async () => {
        // The background sync may not have created the anonymous account yet on first launch.
        await sessions.ensureSession();
        const response = await http.call('getSuggestions', { query: { limit } });
        return response.data?.suggestions ?? [];
      }),

    approve: (suggestionId, idempotencyKey) =>
      attempt(async () => {
        const response = await http.call('approveSuggestion', {
          path: { suggestionId },
          header: { 'Idempotency-Key': idempotencyKey },
        });
        if (!response.data) throw new Error('approveSuggestion answered without a body.');
        return response.data as SuggestionItem;
      }),

    discard: (suggestionId, idempotencyKey) =>
      attempt(async () => {
        await http.call('discardSuggestion', {
          path: { suggestionId },
          header: { 'Idempotency-Key': idempotencyKey },
        });
      }),
  };
}

async function attempt<T>(work: () => Promise<T>): Promise<RemoteResult<T>> {
  try {
    return { status: 'ok', value: await work() };
  } catch (error) {
    // Only an unreachable API is "offline"; any answered error keeps the card with a generic toast.
    return error instanceof NetworkUnavailableError ? { status: 'offline' } : { status: 'failed' };
  }
}
