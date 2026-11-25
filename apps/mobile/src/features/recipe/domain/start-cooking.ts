import type { CookingStateRepository } from '../data/cooking-state-repository';
import type { RecipeRepository } from '../data/recipe-repository';

export type StartCookingResult =
  { readonly status: 'started' | 'already-cooking' } | { readonly status: 'offline' | 'not-found' };

export interface StartCookingDeps {
  readonly recipes: RecipeRepository;
  readonly cooking: CookingStateRepository;
  readonly now: () => Date;
}

/**
 * Puts a dish "em preparo" (shared with the Kitchen tab, #81). Downloads happen before the local
 * transaction — a transaction must never wait on the network — and only when there is no
 * offline copy yet, so a dish from the download set starts in airplane mode (A04).
 */
export function createStartCooking({ recipes, cooking, now }: StartCookingDeps) {
  return async function startCooking(dishId: string): Promise<StartCookingResult> {
    if (await cooking.get(dishId)) return { status: 'already-cooking' };

    if (await recipes.findLocal(dishId)) {
      await cooking.start(dishId, now());
      return { status: 'started' };
    }

    const download = await recipes.downloadForCooking(dishId);
    if (download.status !== 'found') return { status: download.status };
    await cooking.start(dishId, now(), download.recipe);
    return { status: 'started' };
  };
}
