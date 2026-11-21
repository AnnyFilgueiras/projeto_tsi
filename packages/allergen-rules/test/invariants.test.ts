import { describe, expect, it } from 'vitest';
import {
  INVARIANTS_PACKAGE_VERSION,
  checkInvariants,
  type IngredientForInvariants,
  type InvariantViolationCode,
  type RecipeForInvariants,
} from '../src/invariants';
import { PACKAGE_VERSION } from '../src/rules';
import invariantVectors from '../vectors/invariant-vectors.json';

interface InvariantVector {
  readonly id: string;
  readonly trace: string;
  readonly description: string;
  readonly input: {
    readonly recipe: RecipeForInvariants;
    readonly ingredients: readonly IngredientForInvariants[];
  };
  readonly expectedCodes: readonly InvariantViolationCode[];
}

describe('catalog invariants package metadata (ADR-014, S6, A7)', () => {
  it('keeps INVARIANTS_PACKAGE_VERSION synchronized with PACKAGE_VERSION', () => {
    expect(INVARIANTS_PACKAGE_VERSION).toBe(PACKAGE_VERSION);
  });
});

describe('checkInvariants shared JSON vectors (ADR-014, A06, A09, PublicationGateProblem)', () => {
  const vectors = invariantVectors.checkInvariants as readonly InvariantVector[];

  it.each(vectors)('$id ($trace): $description', (vector) => {
    const violations = checkInvariants(vector.input.recipe, vector.input.ingredients);
    expect(violations.map((v) => v.code)).toEqual(vector.expectedCodes);
    for (const violation of violations) {
      expect(violation.field.length).toBeGreaterThan(0);
      expect(violation.message.length).toBeGreaterThan(0);
    }
  });

  it('ADR-014 item 7: records recipe or substitute identifiers on violations without user data', () => {
    const violations = checkInvariants(
      {
        id: 'recipe-audit-1',
        allergens: [],
        allergenState: 'verified',
      },
      [
        {
          id: 'ing-audit-milk',
          allergens: ['leite'],
          substitutes: [
            {
              id: 'sub-audit-1',
              allergens: [],
              allergenState: 'verified',
            },
          ],
        },
      ],
    );

    const byCode = new Map(violations.map((v) => [v.code, v]));
    expect(byCode.get('invariant_verified_without_allergens')?.targetId).toBe('recipe-audit-1');
    expect(byCode.get('invariant_allergen_union')?.targetId).toBe('recipe-audit-1');
    expect(byCode.get('invariant_verified_substitute_without_allergens')?.targetId).toBe(
      'sub-audit-1',
    );
    expect(byCode.get('invariant_milk_without_lactose')?.targetId).toBe('ing-audit-milk');
  });
});
