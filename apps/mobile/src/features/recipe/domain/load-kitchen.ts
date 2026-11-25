import type { AllergenState } from '@panelada/allergen-rules/rules';
import type { CandidatesReader } from '../data/candidates-reader';
import type { CookingState, CookingStateRepository } from '../data/cooking-state-repository';
import type { RecipeRepository } from '../data/recipe-repository';
import { evaluateRecipeSafety, type RecipeSafety } from './evaluate-recipe-safety';

export interface CookingDish {
  readonly dishId: string;
  readonly name: string;
  readonly photoUri: string | null;
  /** 0-based, as saved by the recipe screen. */
  readonly currentStep: number;
  readonly stepCount: number;
  readonly allergenState: AllergenState;
  /** Compact fail-closed alert, same rule as the recipe screen (§1.4c, A06); null when safe. */
  readonly alert: Pick<RecipeSafety, 'reasons' | 'matchedAllergens'> | null;
}

export interface KitchenCandidate {
  readonly suggestionId: string;
  readonly dishId: string;
  readonly name: string;
  readonly cuisineName: string | null;
  readonly prepTimeMinutes: number;
  readonly allergenState: AllergenState;
  readonly photoUri: string | null;
}

export interface KitchenView {
  readonly cooking: readonly CookingDish[];
  readonly candidates: readonly KitchenCandidate[];
}

export interface LoadKitchenDeps {
  readonly recipes: RecipeRepository;
  readonly cooking: CookingStateRepository;
  readonly candidates: CandidatesReader;
}

/**
 * Everything comes from the device (A04): the tab opens in airplane mode and never spends data —
 * candidate photos not cached yet stay as placeholders instead of being downloaded here.
 */
export function createLoadKitchen({ recipes, cooking, candidates }: LoadKitchenDeps) {
  async function toCookingDish(state: CookingState): Promise<CookingDish | null> {
    const local = await recipes.findLocal(state.dishId);
    // StartCooking stores the recipe in the same transaction, so this only guards a damaged copy.
    if (!local) return null;
    const { recipe } = local;
    const [context, photoUri] = await Promise.all([
      recipes.readContext(recipe.dishId, recipe.baseDishId ?? null),
      recipes.photoUri(recipe.photo.hash),
    ]);
    // Re-evaluated on every load: restrictions may have changed since the dish was started.
    const safety = evaluateRecipeSafety(recipe, context.restrictions);
    return {
      dishId: recipe.dishId,
      name: recipe.name,
      photoUri,
      currentStep: state.currentStep,
      stepCount: recipe.steps.length,
      allergenState: safety.allergenState,
      alert: safety.showAlert
        ? { reasons: safety.reasons, matchedAllergens: safety.matchedAllergens }
        : null,
    };
  }

  return async function loadKitchen(): Promise<KitchenView> {
    const [active, stored] = await Promise.all([cooking.listActive(), candidates.list()]);
    const cookingDishes = (await Promise.all(active.map(toCookingDish))).filter(
      (dish): dish is CookingDish => dish !== null,
    );

    // A dish shows up once: in progress wins, then the latest approval of the same dish.
    const seen = new Set(cookingDishes.map((dish) => dish.dishId));
    const unique = stored.filter((candidate) => {
      if (seen.has(candidate.dishId)) return false;
      seen.add(candidate.dishId);
      return true;
    });
    const kitchenCandidates = await Promise.all(
      unique.map(async ({ photoHash, ...candidate }) => ({
        ...candidate,
        photoUri: photoHash ? await recipes.photoUri(photoHash) : null,
      })),
    );

    return { cooking: cookingDishes, candidates: kitchenCandidates };
  };
}
