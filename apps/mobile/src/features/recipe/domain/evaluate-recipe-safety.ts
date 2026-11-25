import {
  classifyRecipe,
  type AllergenCode,
  type AllergenState,
  type ClassificationReason,
} from '@panelada/allergen-rules/rules';
import type { Recipe } from './model';

export interface RecipeSafety {
  /** Fail-closed alert (§1.4c): user has a restriction and the result is not `compatible`. */
  readonly showAlert: boolean;
  readonly allergenState: AllergenState;
  readonly reasons: readonly ClassificationReason[];
  readonly matchedAllergens: readonly AllergenCode[];
  /** Ingredients that get the "Contém alérgeno do seu perfil" tag. */
  readonly restrictedIngredientIds: readonly string[];
  readonly hasRestrictions: boolean;
}

/**
 * Re-runs the shared allergen rules on the device (A06, A7) instead of trusting the server's
 * verdict: restrictions may have changed after the dish was approved (§1.4c).
 */
export function evaluateRecipeSafety(
  recipe: Recipe,
  restrictions: readonly AllergenCode[],
): RecipeSafety {
  const classification = classifyRecipe(recipe, restrictions);
  const restricted = new Set(restrictions);
  // Per ingredient, not from matchedAllergens: a recipe-level list that drifted from its
  // ingredients must still surface the offending row.
  const restrictedIngredientIds = recipe.ingredients
    .filter((ingredient) => ingredient.allergens.some((code) => restricted.has(code)))
    .map((ingredient) => ingredient.ingredientId);

  return {
    showAlert: restrictions.length > 0 && classification.result !== 'compatible',
    allergenState: classification.allergenState,
    reasons: classification.reasons,
    matchedAllergens: classification.matchedAllergens,
    restrictedIngredientIds,
    hasRestrictions: restrictions.length > 0,
  };
}
