import { evaluateRecipeSafety } from '../../src/features/recipe/domain/evaluate-recipe-safety';
import { listSafeSubstitutes } from '../../src/features/recipe/domain/list-safe-substitutes';
import { NOODLE_ID, PEANUT_ID, recipe } from './fixtures';

const SUB = (overrides: Record<string, unknown>) => ({
  id: `sub-${String(overrides.substituteName)}`,
  ingredientId: PEANUT_ID,
  substituteId: `ing-${String(overrides.substituteName)}`,
  substituteAllergens: [],
  allergenState: 'verified' as const,
  confirmedAllergenFree: true,
  ...overrides,
});

describe('evaluateRecipeSafety (A06, RN08, RN16)', () => {
  it('never shows the alert to a user without restrictions', () => {
    const safety = evaluateRecipeSafety(recipe(), []);

    expect(safety.showAlert).toBe(false);
    expect(safety.restrictedIngredientIds).toEqual([]);
    expect(safety.allergenState).toBe('verified');
  });

  it('flags a profile match and marks the ingredient that carries it', () => {
    const safety = evaluateRecipeSafety(recipe(), ['amendoim']);

    expect(safety.showAlert).toBe(true);
    expect(safety.reasons).toEqual(['allergen_match']);
    expect(safety.matchedAllergens).toEqual(['amendoim']);
    expect(safety.restrictedIngredientIds).toEqual([PEANUT_ID]);
  });

  it.each([
    ['unverified', { allergenState: 'unverified' as const }, 'allergen_state_unverified'],
    [
      'source_declared',
      { allergenState: 'source_declared' as const },
      'source_declared_unconfirmed',
    ],
    [
      'empty list without confirmation',
      { allergens: [], ingredients: [], confirmedAllergenFree: false },
      'empty_allergens_unconfirmed',
    ],
  ])('fails closed for %s recipes when the user has a restriction', (_label, overrides, reason) => {
    const safety = evaluateRecipeSafety(recipe(overrides), ['ovo']);

    expect(safety.showAlert).toBe(true);
    expect(safety.reasons).toEqual([reason]);
  });

  it('marks an ingredient even when the recipe-level list omits its allergen', () => {
    const safety = evaluateRecipeSafety(recipe({ allergens: [] }), ['amendoim']);

    expect(safety.showAlert).toBe(true);
    expect(safety.restrictedIngredientIds).toEqual([PEANUT_ID]);
  });
});

describe('listSafeSubstitutes (US10, RN15, RN22)', () => {
  const substitutions = [
    SUB({ substituteName: 'Castanha-de-caju', substituteAllergens: ['castanha_caju'] }),
    SUB({ substituteName: 'Semente de girassol' }),
    SUB({ substituteName: 'Gergelim misterioso', allergenState: 'unverified' }),
    SUB({ substituteName: 'Talharim de trigo', ingredientId: NOODLE_ID }),
  ];

  it('hides substitutes with a profile allergen or without verification and counts them', () => {
    const result = listSafeSubstitutes(recipe({ substitutions }), PEANUT_ID, ['castanha_caju']);

    expect(result.allowed.map((item) => item.name)).toEqual(['Semente de girassol']);
    expect(result.hiddenCount).toBe(2);
  });

  it('lists every substitute of the ingredient for a user without restrictions', () => {
    const result = listSafeSubstitutes(recipe({ substitutions }), PEANUT_ID, []);

    expect(result.allowed.map((item) => [item.name, item.allergenState])).toEqual([
      ['Castanha-de-caju', 'verified'],
      ['Semente de girassol', 'verified'],
      ['Gergelim misterioso', 'unverified'],
    ]);
    expect(result.hiddenCount).toBe(0);
  });

  it('returns nothing when the ingredient has no catalog substitute', () => {
    const result = listSafeSubstitutes(recipe({ substitutions: undefined }), PEANUT_ID, ['ovo']);

    expect(result).toEqual({ allowed: [], hiddenCount: 0 });
  });
});
