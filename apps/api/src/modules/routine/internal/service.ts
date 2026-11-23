import { randomUUID } from 'node:crypto';
import type { DatabaseClient } from '../../../db/client.js';
import { executeIdempotentHttpMutation } from '../../../shared/http-idempotency.js';
import { businessRuleProblem, notFoundProblem, ProblemError } from '../../../shared/problem.js';
import type { Tx } from '../../../shared/tx.js';
import type {
  RoutinePublicPort,
  SuggestionExclusions,
  SuggestionRecord,
} from '../public/routine-public.js';
import type { InsertSuggestionInput, RoutineSuggestionStore } from './repository.js';

export interface RoutineSuggestionServiceDeps {
  readonly dbClient: DatabaseClient;
  readonly store: RoutineSuggestionStore;
  readonly clock?: () => Date;
}

/**
 * Owns the suggestion lifecycle (`presented` -> `candidate` | `discarded`) and its
 * idempotent online transitions (UC02, RN11, P05).
 */
export class RoutineSuggestionService implements RoutinePublicPort {
  private readonly dbClient: DatabaseClient;
  private readonly store: RoutineSuggestionStore;
  private readonly clock: () => Date;

  constructor(deps: RoutineSuggestionServiceDeps) {
    this.dbClient = deps.dbClient;
    this.store = deps.store;
    this.clock = deps.clock ?? (() => new Date());
  }

  async getSuggestionExclusions(
    accountId: string,
    sessionKey: string,
  ): Promise<SuggestionExclusions> {
    const [candidates, discardedDishIdsInSession] = await Promise.all([
      this.store.listCandidateSuggestions(accountId),
      this.store.listDiscardedDishIdsInSession(accountId, sessionKey),
    ]);

    return {
      candidateDishIds: [...new Set(candidates.map((item) => item.dishId))],
      discardedDishIdsInSession,
    };
  }

  async registerPresentedSuggestions(
    accountId: string,
    dishIds: readonly string[],
    sessionKey: string,
  ): Promise<readonly SuggestionRecord[]> {
    if (dishIds.length === 0) {
      return [];
    }

    const existingRows = await this.store.findPresentedInSessionByDishIds(
      accountId,
      sessionKey,
      dishIds,
    );
    const existingByDishId = new Map<string, SuggestionRecord>();
    for (const row of existingRows) {
      if (!existingByDishId.has(row.dishId)) {
        existingByDishId.set(row.dishId, row);
      }
    }

    const now = this.clock();
    const toInsert: InsertSuggestionInput[] = [];
    const ordered: SuggestionRecord[] = [];

    for (const dishId of dishIds) {
      const reused = existingByDishId.get(dishId);
      if (reused) {
        ordered.push(reused);
        continue;
      }

      const id = randomUUID();
      toInsert.push({
        id,
        userId: accountId,
        dishId,
        status: 'presented',
        sessionKey,
        presentedAt: now,
      });
      ordered.push({
        id,
        userId: accountId,
        dishId,
        status: 'presented',
        sessionKey,
        presentedAt: now.toISOString(),
        decidedAt: null,
      });
    }

    if (toInsert.length > 0) {
      await this.store.insertSuggestions(toInsert);
    }

    return ordered;
  }

  async approveSuggestion(
    accountId: string,
    suggestionId: string,
    idempotencyKey: string,
  ): Promise<SuggestionRecord> {
    const now = this.clock();

    const outcome = await this.dbClient.withTransaction((tx) =>
      executeIdempotentHttpMutation<SuggestionRecord>({
        store: this.store,
        tx,
        accountId,
        idempotencyKey,
        endpoint: `POST /v1/suggestions/${suggestionId}/approve`,
        payload: { suggestionId, action: 'approve' },
        now,
        execute: async () => {
          const existing = await this.store.findSuggestionByIdForUser(accountId, suggestionId, tx);
          if (!existing) {
            throw new ProblemError(notFoundProblem('Sugestão não encontrada.'));
          }

          if (existing.status === 'discarded') {
            throw new ProblemError(
              businessRuleProblem('Não é possível aprovar uma sugestão já descartada.'),
            );
          }

          if (existing.status === 'candidate') {
            return { statusCode: 200, body: existing };
          }

          // Prevent duplicate candidate rows for the same dish approved from two different sessions.
          const existingCandidate = await this.store.findCandidateByDishForUser(
            accountId,
            existing.dishId,
            tx,
          );
          if (existingCandidate) {
            throw new ProblemError(
              businessRuleProblem('Este prato já está aprovado como candidato.'),
            );
          }

          const updated = await this.store.updateSuggestionStatus(
            accountId,
            suggestionId,
            'candidate',
            undefined,
            now,
            tx,
          );
          if (!updated) {
            throw new ProblemError(notFoundProblem('Sugestão não encontrada.'));
          }

          return { statusCode: 200, body: updated };
        },
      }),
    );

    return outcome.body;
  }

  async discardSuggestion(
    accountId: string,
    suggestionId: string,
    sessionKey: string,
    idempotencyKey: string,
  ): Promise<void> {
    const now = this.clock();

    await this.dbClient.withTransaction((tx) =>
      executeIdempotentHttpMutation<null>({
        store: this.store,
        tx,
        accountId,
        idempotencyKey,
        endpoint: `POST /v1/suggestions/${suggestionId}/discard`,
        payload: { suggestionId, action: 'discard' },
        now,
        execute: async () => {
          const existing = await this.store.findSuggestionByIdForUser(accountId, suggestionId, tx);
          if (!existing) {
            throw new ProblemError(notFoundProblem('Sugestão não encontrada.'));
          }

          if (existing.status === 'candidate') {
            throw new ProblemError(
              businessRuleProblem('Não é possível descartar uma sugestão já aprovada.'),
            );
          }

          if (existing.status === 'discarded') {
            return { statusCode: 204, body: null };
          }

          await this.store.updateSuggestionStatus(
            accountId,
            suggestionId,
            'discarded',
            sessionKey,
            now,
            tx,
          );

          return { statusCode: 204, body: null };
        },
      }),
    );
  }

  async listCandidateSuggestions(accountId: string): Promise<readonly SuggestionRecord[]> {
    return this.store.listCandidateSuggestions(accountId);
  }

  async deleteData(accountId: string, tx: Tx): Promise<void> {
    await this.store.deleteData(accountId, tx);
  }
}
