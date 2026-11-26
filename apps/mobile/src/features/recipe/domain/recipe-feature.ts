import type { CandidatesReader } from '../data/candidates-reader';
import type { CookingStateRepository } from '../data/cooking-state-repository';
import type { RecipeRepository } from '../data/recipe-repository';
import { createLoadKitchen, type KitchenView } from './load-kitchen';
import { createLoadRecipe, type RecipeView } from './load-recipe';
import { createStartCooking, type StartCookingResult } from './start-cooking';

/** What the composition root hands to the recipe route and to the Kitchen tab (#81). */
export interface RecipeFeature {
  loadRecipe(dishId: string): Promise<RecipeView>;
  startCooking(dishId: string): Promise<StartCookingResult>;
  /** Persists the current step on every move, so reopening resumes there (§7). */
  saveStep(dishId: string, step: number): Promise<void>;
  /** "Em preparo" and "Candidatas", read only from the device. */
  loadKitchen(): Promise<KitchenView>;
}

export interface RecipeFeatureDeps {
  readonly recipes: RecipeRepository;
  readonly cooking: CookingStateRepository;
  readonly candidates: CandidatesReader;
  readonly now: () => Date;
}

export function createRecipeFeature({
  recipes,
  cooking,
  candidates,
  now,
}: RecipeFeatureDeps): RecipeFeature {
  return {
    loadRecipe: createLoadRecipe({ recipes, cooking }),
    startCooking: createStartCooking({ recipes, cooking, now }),
    saveStep: (dishId, step) => cooking.saveStep(dishId, step),
    loadKitchen: createLoadKitchen({ recipes, cooking, candidates }),
  };
}
