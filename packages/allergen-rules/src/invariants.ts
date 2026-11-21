import { PACKAGE_VERSION } from './rules';
import {
  isAllergenState,
  type AllergenCode,
  type AllergenState,
  type IngredientForInvariants,
  type InvariantViolation,
  type InvariantViolationCode,
  type RecipeForInvariants,
  type SubstituteForInvariants,
} from './types';

export {
  type AllergenCode,
  type AllergenState,
  type IngredientForInvariants,
  type InvariantViolation,
  type InvariantViolationCode,
  type RecipeForInvariants,
  type SubstituteForInvariants,
};

/**
 * Server-only catalog publication invariants entrypoint (ADR-014, S6, A7).
 * Never imported by apps/mobile.
 */
export const INVARIANTS_PACKAGE_VERSION = PACKAGE_VERSION;

function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }
  return true;
}

function collectSubstituteViolations(
  substitutes: readonly SubstituteForInvariants[] | undefined,
  fieldPrefix: string,
  fallbackTargetId: string | undefined,
  violations: InvariantViolation[],
): void {
  if (!substitutes) {
    return;
  }

  for (let index = 0; index < substitutes.length; index += 1) {
    const substitute = substitutes[index];
    if (!substitute) {
      continue;
    }

    // RN22 / ADR-014: A verified substitute cannot have an empty allergen list
    // without an explicit confirmedAllergenFree attestation.
    if (
      substitute.allergenState === 'verified' &&
      substitute.allergens.length === 0 &&
      substitute.confirmedAllergenFree !== true
    ) {
      violations.push({
        code: 'invariant_verified_substitute_without_allergens',
        field: `${fieldPrefix}[${index}].allergens`,
        message:
          'Substituto marcado como verificado exige alérgenos declarados ou confirmação explícita de ausência de alérgenos.',
        ...((substitute.id ?? fallbackTargetId)
          ? { targetId: substitute.id ?? fallbackTargetId }
          : {}),
      });
    }
  }
}

/**
 * Checks all catalog allergen invariants for a recipe and its ingredients in a single pass
 * without short-circuiting, returning every violation found (ADR-014, A06, A09).
 */
export function checkInvariants(
  recipe: RecipeForInvariants,
  ingredients: readonly IngredientForInvariants[],
): readonly InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const recipeTarget = recipe.id ? { targetId: recipe.id } : {};

  if (!isAllergenState(recipe.allergenState)) {
    violations.push({
      code: 'allergen_state_missing',
      field: 'allergenState',
      message: 'Receita publicada exige um estado de alérgenos válido.',
      ...recipeTarget,
    });
  }

  // RN08 / ADR-014: Empty allergen list means unverified unless confirmedAllergenFree is true.
  if (
    recipe.allergenState === 'verified' &&
    recipe.allergens.length === 0 &&
    recipe.confirmedAllergenFree !== true
  ) {
    violations.push({
      code: 'invariant_verified_without_allergens',
      field: 'allergens',
      message:
        'Receita marcada como verificada com lista vazia exige confirmação explícita de ausência de alérgenos.',
      ...recipeTarget,
    });
  }

  const recipeAllergenSet = new Set<string>(recipe.allergens);
  const ingredientAllergenUnion = new Set<string>();
  for (const ingredient of ingredients) {
    for (const allergen of ingredient.allergens) {
      ingredientAllergenUnion.add(allergen);
    }
  }

  if (!setsEqual(recipeAllergenSet, ingredientAllergenUnion)) {
    violations.push({
      code: 'invariant_allergen_union',
      field: 'allergens',
      message: 'Os alérgenos da receita devem corresponder à união dos alérgenos dos ingredientes.',
      ...recipeTarget,
    });
  }

  collectSubstituteViolations(recipe.substitutes, 'substitutes', recipe.id, violations);

  for (let index = 0; index < ingredients.length; index += 1) {
    const ingredient = ingredients[index];
    if (!ingredient) {
      continue;
    }

    collectSubstituteViolations(
      ingredient.substitutes,
      `ingredients[${index}].substitutes`,
      recipe.id,
      violations,
    );
  }

  for (let index = 0; index < ingredients.length; index += 1) {
    const ingredient = ingredients[index];
    if (!ingredient) {
      continue;
    }

    // ADR-014: Dairy ingredients carry both leite and lactose unless explicitly marked lactoseFree.
    const hasMilk = ingredient.allergens.includes('leite');
    const hasLactose = ingredient.allergens.includes('lactose');
    if (hasMilk && !hasLactose && ingredient.lactoseFree !== true) {
      const targetId = ingredient.id ?? recipe.id;
      violations.push({
        code: 'invariant_milk_without_lactose',
        field: `ingredients[${index}].allergens`,
        message: 'Ingrediente com leite sem lactose exige lactoseFree = true.',
        ...(targetId ? { targetId } : {}),
      });
    }
  }

  return violations;
}
