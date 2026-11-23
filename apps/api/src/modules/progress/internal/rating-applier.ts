import { z } from 'zod';
import type {
  OperationApplier,
  OperationApplyContext,
  OperationApplyResult,
  OperationEnvelope,
} from '../../../shared/operation-applier.js';
import { businessRuleProblem, notFoundProblem } from '../../../shared/problem.js';
import type { CatalogReadPort } from '../../catalog/public/catalog-read.js';
import type { ProgressStore } from './repository.js';
import { calculateUnlocks } from './unlock-rules.js';

const MIN_RATING_SCORE = 0;
const MAX_RATING_SCORE = 10;
const MAX_RATING_TEXT_LENGTH = 2000;

const ratingPayloadSchema = z
  .object({
    dishId: z.string().uuid(),
    score: z.number().int().min(MIN_RATING_SCORE).max(MAX_RATING_SCORE),
    comment: z.string().max(MAX_RATING_TEXT_LENGTH).optional(),
    changes: z.string().max(MAX_RATING_TEXT_LENGTH).optional(),
    itemId: z.string().uuid().nullable().optional(),
  })
  .strict();

export interface RatingApplierDeps {
  readonly store: ProgressStore;
  readonly catalogRead: CatalogReadPort;
  readonly clock?: () => Date;
}

/**
 * `OperationApplier` for `rating.register` (UC10, RN01-RN06, P01, T01).
 *
 * Persists the rating with `id = opId`, recalculates additive unlocks via pure
 * `calculateUnlocks`, and commits everything inside the caller's transaction (`tx`).
 */
export function createRatingApplier(deps: RatingApplierDeps): OperationApplier<'rating.register'> {
  const clock = deps.clock ?? (() => new Date());

  return {
    operationType: 'rating.register',
    async apply(
      operation: OperationEnvelope<'rating.register'>,
      context: OperationApplyContext,
    ): Promise<OperationApplyResult> {
      const parsed = ratingPayloadSchema.safeParse(operation.payload);
      if (!parsed.success) {
        return {
          status: 'rejected',
          error: businessRuleProblem(
            'Avaliação inválida: informe um dishId válido e nota inteira entre 0 e 10 (meios-pontos).',
          ),
        };
      }

      const payload = parsed.data;
      const ratedAt = new Date(operation.createdAt);
      const now = clock();
      const effectiveRatedAt = Number.isNaN(ratedAt.getTime()) ? now : ratedAt;

      await deps.store.acquireUserLock(context.accountId, context.tx);

      // Query catalog inside `tx` to avoid connection pool starvation under concurrency.
      const [catalogIndex, priorState, badgeDefinitions] = await Promise.all([
        deps.catalogRead.getCatalogIndex(context.tx),
        deps.store.getUnlockState(context.accountId, context.tx),
        deps.store.listBadgeDefinitions(context.tx),
      ]);

      const dishExists = catalogIndex.dishes.some((dish) => dish.dishId === payload.dishId);
      if (!dishExists) {
        return {
          status: 'rejected',
          error: notFoundProblem('Prato não encontrado no catálogo aprovado.'),
        };
      }

      // RN06: Each rating creates a new historical preparation row (`id = opId`) without overwriting.
      // Composite PK (userId, id) + onConflictDoNothing also keeps post-TTL replays safe.
      const inserted = await deps.store.insertRating(
        {
          id: operation.opId,
          userId: context.accountId,
          dishId: payload.dishId,
          score: payload.score,
          comment: payload.comment ?? null,
          changes: payload.changes ?? null,
          itemId: payload.itemId ?? null,
          ratedAt: effectiveRatedAt,
          createdAt: now,
        },
        context.tx,
      );

      if (!inserted) {
        return {
          status: 'confirmed',
          unlocks: {
            evolutions: [],
            badgeAwards: [],
          },
        };
      }

      const unlocks = calculateUnlocks(
        {
          id: operation.opId,
          dishId: payload.dishId,
          score: payload.score,
          changes: payload.changes ?? null,
        },
        {
          dishes: catalogIndex.dishes.map((dish) => ({
            id: dish.dishId,
            cuisineId: dish.cuisineId,
            baseDishId: dish.baseDishId,
          })),
          cuisines: catalogIndex.cuisines.map((cuisine) => ({
            id: cuisine.id,
            continents: cuisine.continents,
          })),
          badgeDefinitions: badgeDefinitions.map((badge) => ({
            id: badge.id,
            milestone: badge.milestone,
          })),
        },
        priorState,
      );

      await Promise.all([
        deps.store.insertEvolutionUnlocks(
          context.accountId,
          unlocks.newEvolutionUnlocks,
          now,
          context.tx,
        ),
        deps.store.insertBadgeAwards(context.accountId, unlocks.newBadgeAwards, now, context.tx),
      ]);

      return {
        status: 'confirmed',
        unlocks: {
          evolutions: unlocks.newEvolutionUnlocks,
          badgeAwards: unlocks.newBadgeAwards,
        },
      };
    },
  };
}
