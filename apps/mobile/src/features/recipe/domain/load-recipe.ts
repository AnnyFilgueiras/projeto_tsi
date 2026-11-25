import type { CookingStateRepository } from '../data/cooking-state-repository';
import type { RecipeContext, RecipeRepository } from '../data/recipe-repository';
import { evaluateRecipeSafety, type RecipeSafety } from './evaluate-recipe-safety';
import type { Recipe } from './model';

export interface RecipeEvolution {
  /** RN02: an evolution opens only after its base dish was completed. */
  readonly locked: boolean;
  readonly baseDish: { readonly id: string; readonly name: string | null } | null;
}

interface RecipeDetails {
  readonly recipe: Recipe;
  readonly safety: RecipeSafety;
  readonly evolution: RecipeEvolution;
  readonly cuisineName: string | null;
  /** Restrictions are needed again by the swaps sheet (`listSafeSubstitutes`). */
  readonly restrictions: RecipeContext['restrictions'];
}

export type RecipeView =
  | (RecipeDetails & {
      readonly status: 'downloaded';
      readonly photoUri: string | null;
      readonly downloadedAt: Date;
      /** null while the dish is not "em preparo". */
      readonly currentStep: number | null;
    })
  | (RecipeDetails & { readonly status: 'remote' })
  | { readonly status: 'offline' }
  | { readonly status: 'not-found' };

export interface LoadRecipeDeps {
  readonly recipes: RecipeRepository;
  readonly cooking: CookingStateRepository;
}

/**
 * Local copy first (A04): a downloaded recipe never touches the network. Without one, the API
 * summary is shown but not stored — only "Cozinhar agora" downloads (§7, ADR-008).
 */
export function createLoadRecipe({ recipes, cooking }: LoadRecipeDeps) {
  async function details(recipe: Recipe): Promise<RecipeDetails> {
    const context = await recipes.readContext(recipe.dishId, recipe.baseDishId ?? null);
    return {
      recipe,
      safety: evaluateRecipeSafety(recipe, context.restrictions),
      evolution: {
        locked: context.baseDish !== null && !context.evolutionUnlocked,
        baseDish: context.baseDish,
      },
      cuisineName: context.cuisineName,
      restrictions: context.restrictions,
    };
  }

  return async function loadRecipe(dishId: string): Promise<RecipeView> {
    const local = await recipes.findLocal(dishId);
    if (local) {
      const [base, photoUri, state] = await Promise.all([
        details(local.recipe),
        recipes.photoUri(local.recipe.photo.hash),
        cooking.get(dishId),
      ]);
      return {
        status: 'downloaded',
        ...base,
        photoUri,
        downloadedAt: local.downloadedAt,
        currentStep: state?.currentStep ?? null,
      };
    }

    const remote = await recipes.fetchRemote(dishId);
    if (remote.status !== 'found') return { status: remote.status };
    return { status: 'remote', ...(await details(remote.recipe)) };
  };
}
