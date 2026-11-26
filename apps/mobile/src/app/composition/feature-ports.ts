import type { KitchenNews } from './kitchen-news';
import type { RegisterRestrictions } from '../../features/profile/domain/register-restrictions';
import type { RevokeRestriction } from '../../features/profile/domain/revoke-restriction';
import type { SavePreferencesResult } from '../../features/profile/domain/save-culinary-preferences';
import type { DishCompletionListener } from '../../features/progress/domain/register-rating';
import type { CookingStateRepository } from '../../features/recipe/data/cooking-state-repository';
import type { SuggestionRound } from '../../features/suggestions/domain/suggestion-round';

/*
 * Ports between features (A1: no feature imports another). Only the composition root wires them
 * (A8); they live apart from `index.ts` so the journey test can wire its fakes the same way.
 */

/** "Quero cozinhar" puts a dot on the Kitchen tab (§1.1 rule 4). */
export function approvalMarksKitchenNews(
  round: SuggestionRound,
  news: KitchenNews,
): SuggestionRound {
  return {
    ...round,
    approveSuggestion: async (suggestionId) => {
      const outcome = await round.approveSuggestion(suggestionId);
      if (outcome === 'done') news.mark();
      return outcome;
    },
  };
}

interface ProfileChanges {
  readonly registerRestrictions: RegisterRestrictions;
  readonly revokeRestriction: RevokeRestriction;
  readonly savePreferences: (cuisineIds: readonly string[]) => Promise<SavePreferencesResult>;
}

/**
 * A restriction or preference change makes the Discover round stale (RN08, RN10); the tab
 * fetches again the next time it gains focus. Invalidating after a failed attempt only costs one
 * extra request, so it runs whatever the outcome.
 */
export function profileChangesInvalidate<T extends ProfileChanges>(
  profile: T,
  round: Pick<SuggestionRound, 'invalidate'>,
): T {
  const after = async <R>(change: Promise<R>): Promise<R> => {
    try {
      return await change;
    } finally {
      round.invalidate();
    }
  };
  return {
    ...profile,
    registerRestrictions: (input) => after(profile.registerRestrictions(input)),
    revokeRestriction: (input) => after(profile.revokeRestriction(input)),
    savePreferences: (cuisineIds) => after(profile.savePreferences(cuisineIds)),
  };
}

/** A saved rating ends "em preparo" for that dish (#86). */
export function completionFinishesCooking(
  cooking: Pick<CookingStateRepository, 'finish'>,
): DishCompletionListener {
  return { onDishCompleted: (dishId) => cooking.finish(dishId) };
}
