import {
  isSubstituteAllowed,
  type AllergenCode,
  type AllergenState,
} from '@panelada/allergen-rules/rules';
import type { Recipe } from './model';

export interface SafeSubstitute {
  readonly id: string;
  readonly name: string;
  readonly allergenState: AllergenState;
}

export interface SafeSubstitutes {
  readonly allowed: readonly SafeSubstitute[];
  /** Substitutes dropped for safety, announced in the sheet so the list is not silently short. */
  readonly hiddenCount: number;
}

// The contract makes the name optional; never render an empty row.
const UNNAMED_SUBSTITUTE = 'Substituto do catálogo';

/**
 * Catalog substitutes for one ingredient that pass `isSubstituteAllowed` (RN22, A06). Only
 * curated substitutions are listed: the app never invents a swap (RN15).
 */
export function listSafeSubstitutes(
  recipe: Recipe,
  ingredientId: string,
  restrictions: readonly AllergenCode[],
): SafeSubstitutes {
  const candidates = (recipe.substitutions ?? []).filter(
    (item) => item.ingredientId === ingredientId,
  );
  const allowed = candidates
    .filter((item) =>
      isSubstituteAllowed(
        {
          allergens: item.substituteAllergens,
          allergenState: item.allergenState,
          confirmedAllergenFree: item.confirmedAllergenFree,
        },
        restrictions,
      ),
    )
    .map((item) => ({
      id: item.id,
      name: item.substituteName ?? UNNAMED_SUBSTITUTE,
      allergenState: item.allergenState,
    }));

  return { allowed, hiddenCount: candidates.length - allowed.length };
}
