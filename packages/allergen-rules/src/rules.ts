import {
  ALLERGEN_CODES,
  ALLERGEN_STATES,
  isAllergenCode,
  isAllergenState,
  type AllergenCode,
  type AllergenState,
  type Classification,
  type ClassificationReason,
  type CompatibilityResult,
  type RecipeForRules,
  type SubstituteForRules,
} from './types';

export {
  ALLERGEN_CODES,
  ALLERGEN_STATES,
  isAllergenCode,
  type AllergenCode,
  type AllergenState,
  type Classification,
  type ClassificationReason,
  type CompatibilityResult,
  type RecipeForRules,
  type SubstituteForRules,
};

/**
 * Version of the shared allergen rules contract exposed by both API and mobile (ADR-014).
 */
export const PACKAGE_VERSION = '1.0.0' as const;

function hasUnknownAllergenCode(codes: readonly AllergenCode[]): boolean {
  if (!Array.isArray(codes)) {
    return true;
  }

  for (const code of codes) {
    if (!isAllergenCode(code)) {
      return true;
    }
  }
  return false;
}

function findMatchedAllergens(
  recipeAllergens: readonly AllergenCode[],
  restrictions: readonly AllergenCode[],
): AllergenCode[] {
  const restrictionSet = new Set(restrictions);
  const recipeMatchSet = new Set<AllergenCode>();

  for (const allergen of recipeAllergens) {
    if (restrictionSet.has(allergen)) {
      recipeMatchSet.add(allergen);
    }
  }

  // Return matched codes in canonical ANVISA + lactose order for deterministic results.
  return ALLERGEN_CODES.filter((code) => recipeMatchSet.has(code));
}

/**
 * Classifies whether a recipe is compatible with a user's dietary restrictions (A06, RN08, RN16).
 */
export function classifyRecipe(
  recipe: RecipeForRules,
  restrictions: readonly AllergenCode[],
): Classification {
  // Normalize corrupted runtime states (e.g. deserialized offline cache) to fail-closed unverified.
  const allergenState: AllergenState = isAllergenState(recipe.allergenState)
    ? recipe.allergenState
    : 'unverified';

  if (!Array.isArray(restrictions)) {
    return {
      result: 'unconfirmed',
      allergenState,
      reasons: ['invalid_allergen_code'],
      matchedAllergens: [],
    };
  }

  if (restrictions.length === 0) {
    return {
      result: 'compatible',
      allergenState,
      reasons: ['no_restrictions'],
      matchedAllergens: [],
    };
  }

  // A06 / PRIVACY: Fail closed when runtime input carries codes outside the 19-code vocabulary.
  if (hasUnknownAllergenCode(restrictions) || hasUnknownAllergenCode(recipe.allergens)) {
    return {
      result: 'unconfirmed',
      allergenState,
      reasons: ['invalid_allergen_code'],
      matchedAllergens: [],
    };
  }

  // RN08: A known allergen match is always incompatible regardless of verification state.
  const matchedAllergens = findMatchedAllergens(recipe.allergens, restrictions);
  if (matchedAllergens.length > 0) {
    return {
      result: 'incompatible',
      allergenState,
      reasons: ['allergen_match'],
      matchedAllergens,
    };
  }

  if (allergenState === 'unverified') {
    return {
      result: 'unconfirmed',
      allergenState,
      reasons: ['allergen_state_unverified'],
      matchedAllergens: [],
    };
  }

  // A06 / RN10: Strict fail-closed policy treats source_declared recipes as unconfirmed
  // for users with restrictions until a curator explicitly verifies them.
  if (allergenState === 'source_declared') {
    return {
      result: 'unconfirmed',
      allergenState,
      reasons: ['source_declared_unconfirmed'],
      matchedAllergens: [],
    };
  }

  // RN08: An empty allergen list means unconfirmed unless a curator sets confirmedAllergenFree.
  if (recipe.allergens.length === 0 && recipe.confirmedAllergenFree !== true) {
    return {
      result: 'unconfirmed',
      allergenState,
      reasons: ['empty_allergens_unconfirmed'],
      matchedAllergens: [],
    };
  }

  return {
    result: 'compatible',
    allergenState,
    reasons: ['allergen_verified_safe'],
    matchedAllergens: [],
  };
}

/**
 * Filters candidate recipes for suggestions/search, keeping only those classified as compatible
 * (US01, RN08, RN10, A06).
 */
export function filterCandidates<T extends RecipeForRules>(
  recipes: readonly T[],
  restrictions: readonly AllergenCode[],
): T[] {
  return recipes.filter((recipe) => classifyRecipe(recipe, restrictions).result === 'compatible');
}

/**
 * Decides whether a catalog substitute can be suggested for a user's restrictions
 * (US10, RN22, A06). Fails closed when the substitute is unverified, source_declared,
 * empty without confirmedAllergenFree, or contains a restricted allergen.
 */
export function isSubstituteAllowed(
  substitute: SubstituteForRules,
  restrictions: readonly AllergenCode[],
): boolean {
  return classifyRecipe(substitute, restrictions).result === 'compatible';
}
