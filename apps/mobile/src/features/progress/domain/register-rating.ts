import type {
  OperationEnqueuer,
  OperationProblem,
  Unlocks,
} from '../../../core/sync/operation-enqueuer';
import {
  catalogForUnlock,
  completedDishIdsOf,
  cuisineProgressFor,
  type CuisineProgress,
  type ProgressSnapshot,
  type ProgressSnapshotSource,
  unlockStateOf,
} from './progress-model';
import { calculateUnlocks } from './unlock-calculator';

export interface DishCompletionListener {
  onDishCompleted(dishId: string): Promise<void>;
}

export interface RegisterRatingInput {
  readonly dishId: string;
  readonly stars: number;
  readonly comment?: string;
  readonly changes?: string;
  /**
   * The `opId` of an `offline` result, to resend the same rating: a 5xx or timeout may have
   * saved it on the server, and a new id would count as a second preparation (RN06). Leave it
   * empty once the draft changes — that is a different rating.
   */
  readonly opId?: string;
}

/** Contract limit for `comment` and `changes` (openapi RatingPayload). */
export const MAX_RATING_TEXT_LENGTH = 2000;

export type RegisterRatingResult =
  | {
      readonly status: 'saved';
      readonly ratingId: string;
      readonly dishId: string;
      readonly isRepeat: boolean;
      readonly unlocks: Unlocks;
      readonly cuisineProgressBefore: CuisineProgress | null;
      readonly cuisineProgressAfter: CuisineProgress | null;
    }
  /** `offline` and `rejected` leave the local copy exactly as it was (Stage 1, P04). */
  | { readonly status: 'offline'; readonly opId: string }
  | { readonly status: 'rejected'; readonly problem: OperationProblem | undefined }
  /** Nothing was sent nor stored; the screen points at the offending field. */
  | { readonly status: 'invalid'; readonly field: 'stars' | 'comment' | 'changes' };

export interface RegisterRatingDeps {
  readonly enqueuer: OperationEnqueuer;
  readonly progress: ProgressSnapshotSource;
  readonly completionListener: DishCompletionListener;
}

export interface RegisterRating {
  execute(input: RegisterRatingInput): Promise<RegisterRatingResult>;
}

export function createRegisterRating(deps: RegisterRatingDeps): RegisterRating {
  return {
    async execute(input) {
      const parsed = parseInput(input);
      if ('field' in parsed) return { status: 'invalid', field: parsed.field };

      const before = await deps.progress.load();
      const completedBefore = completedDishIdsOf(before);
      const cuisineId = before.catalog.dishes.find((dish) => dish.id === input.dishId)?.cuisineId;

      const result = await deps.enqueuer.enqueue({
        type: 'rating.register',
        ...(input.opId !== undefined && { opId: input.opId }),
        // itemId stays null in Onda 1A: there is no routine plan to complete yet (UC10 FA2).
        payload: { dishId: input.dishId, score: parsed.score, ...parsed.texts, itemId: null },
      });
      if (result.status === 'unavailable') return { status: 'offline', opId: result.opId };
      if (result.status === 'rejected') return { status: 'rejected', problem: result.problem };

      // Stage 1 trusts the server's unlocks; a Stage 2 queued rating has no server answer yet, so
      // the same rules run locally and the Celebration looks identical either way (ADR-016).
      const unlocks =
        result.status === 'confirmed'
          ? result.unlocks
          : localUnlocks(before, result.opId, input.dishId, parsed);

      await notifyCompletion(deps.completionListener, input.dishId);

      const completedAfter = new Set([...completedBefore, input.dishId]);
      return {
        status: 'saved',
        ratingId: result.opId,
        dishId: input.dishId,
        isRepeat: completedBefore.has(input.dishId),
        unlocks,
        cuisineProgressBefore: cuisineId
          ? cuisineProgressFor(before.catalog, cuisineId, completedBefore)
          : null,
        cuisineProgressAfter: cuisineId
          ? cuisineProgressFor(before.catalog, cuisineId, completedAfter)
          : null,
      };
    },
  };
}

function localUnlocks(
  before: ProgressSnapshot,
  ratingId: string,
  dishId: string,
  parsed: ValidInput,
): Unlocks {
  const { newEvolutionUnlocks, newBadgeAwards } = calculateUnlocks(
    { id: ratingId, dishId, score: parsed.score, changes: parsed.texts.changes ?? null },
    catalogForUnlock(before.catalog),
    unlockStateOf(before),
  );
  return { evolutions: [...newEvolutionUnlocks], badgeAwards: [...newBadgeAwards] };
}

async function notifyCompletion(listener: DishCompletionListener, dishId: string): Promise<void> {
  try {
    await listener.onDishCompleted(dishId);
  } catch {
    // The rating is already saved on the server; a stale "em preparo" mark is cosmetic and
    // must never turn a saved rating into an error on screen.
  }
}

interface ValidInput {
  readonly score: number;
  readonly texts: { readonly comment?: string; readonly changes?: string };
}

type ParsedInput = ValidInput | { readonly field: 'stars' | 'comment' | 'changes' };

/** RN05: stars in half steps from 0 to 5 travel as an integer score 0–10. */
function parseInput(input: RegisterRatingInput): ParsedInput {
  const score = input.stars * 2;
  if (!Number.isInteger(score) || score < 0 || score > 10) return { field: 'stars' };

  const texts: { comment?: string; changes?: string } = {};
  for (const field of ['comment', 'changes'] as const) {
    // RNF10: optional text is trimmed and a blank one is omitted, never sent as "".
    const value = input[field]?.trim();
    if (!value) continue;
    if (value.length > MAX_RATING_TEXT_LENGTH) return { field };
    texts[field] = value;
  }
  return { score, texts };
}
