import type { Tx } from '../../../shared/tx.js';
import type { SuggestionStatus } from '../internal/schema.js';

export type { SuggestionStatus };

export interface SuggestionRecord {
  readonly id: string;
  readonly userId: string;
  readonly dishId: string;
  readonly status: SuggestionStatus;
  readonly sessionKey: string;
  readonly presentedAt: string;
  readonly decidedAt: string | null;
}

export interface SuggestionExclusions {
  readonly candidateDishIds: readonly string[];
  readonly discardedDishIdsInSession: readonly string[];
}

/**
 * Public facade for the routine module (P06, S1, RN11).
 *
 * Wave 1A exposes the suggestion lifecycle (`presented`, `candidate`, `discarded`).
 * Meal plans, routine items, and shopping lists extend this boundary in Wave 1B.
 */
export interface RoutinePublicPort {
  getSuggestionExclusions(accountId: string, sessionKey: string): Promise<SuggestionExclusions>;
  registerPresentedSuggestions(
    accountId: string,
    dishIds: readonly string[],
    sessionKey: string,
  ): Promise<readonly SuggestionRecord[]>;
  approveSuggestion(
    accountId: string,
    suggestionId: string,
    idempotencyKey: string,
  ): Promise<SuggestionRecord>;
  discardSuggestion(
    accountId: string,
    suggestionId: string,
    sessionKey: string,
    idempotencyKey: string,
  ): Promise<void>;
  listCandidateSuggestions(accountId: string): Promise<readonly SuggestionRecord[]>;
  deleteData(accountId: string, tx: Tx): Promise<void>;
}
