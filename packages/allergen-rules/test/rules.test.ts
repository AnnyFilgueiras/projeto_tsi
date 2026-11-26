import { describe, expect, it } from 'vitest';
import {
  ALLERGEN_CODES,
  PACKAGE_VERSION,
  classifyRecipe,
  filterCandidates,
  isAllergenCode,
  isSubstituteAllowed,
  type AllergenCode,
  type Classification,
  type RecipeForRules,
  type SubstituteForRules,
} from '../src/rules';
import allergenVectors from '../vectors/allergen-vectors.json';

interface ClassifyVector {
  readonly id: string;
  readonly trace: string;
  readonly description: string;
  readonly input: {
    readonly recipe: RecipeForRules;
    readonly restrictions: readonly AllergenCode[];
  };
  readonly expected: Classification;
}

interface FilterVector {
  readonly id: string;
  readonly trace: string;
  readonly description: string;
  readonly input: {
    readonly recipes: readonly (RecipeForRules & { readonly id: string })[];
    readonly restrictions: readonly AllergenCode[];
  };
  readonly expectedIds: readonly string[];
}

interface SubstituteVector {
  readonly id: string;
  readonly trace: string;
  readonly description: string;
  readonly input: {
    readonly substitute: SubstituteForRules;
    readonly restrictions: readonly AllergenCode[];
  };
  readonly expected: boolean;
}

const EXPECTED_VOCABULARY = [
  'trigo_centeio_cevada_aveia',
  'crustaceos',
  'ovo',
  'peixe',
  'amendoim',
  'soja',
  'leite',
  'amendoa',
  'avela',
  'castanha_caju',
  'castanha_brasil',
  'macadamia',
  'noz',
  'peca',
  'pistache',
  'pinoli',
  'castanha_castanea',
  'latex',
  'lactose',
] as const;

describe('allergen-rules vocabulary and version (ADR-014, ADR-015, ANVISA RDC 727/2022)', () => {
  it('exposes package version 1.0.0 and the exact closed vocabulary of 19 allergen codes', () => {
    expect(PACKAGE_VERSION).toBe('1.0.0');
    expect(ALLERGEN_CODES).toEqual(EXPECTED_VOCABULARY);
    expect(new Set(ALLERGEN_CODES).size).toBe(19);
    for (const code of EXPECTED_VOCABULARY) {
      expect(isAllergenCode(code)).toBe(true);
    }
    expect(isAllergenCode('gluten')).toBe(false);
    expect(isAllergenCode('milk')).toBe(false);
    expect(isAllergenCode('')).toBe(false);
  });
});

describe('classifyRecipe shared JSON vectors (A06, RN08, RN16)', () => {
  const vectors = allergenVectors.classifyRecipe as readonly ClassifyVector[];

  it.each(vectors)('$id ($trace): $description', (vector) => {
    const actual = classifyRecipe(vector.input.recipe, vector.input.restrictions);
    expect(actual).toEqual(vector.expected);
  });

  it('A06 / PRIVACY: fails closed with unconfirmed when runtime input contains an unknown allergen code', () => {
    const malformedRestrictions = ['unknown_allergen' as AllergenCode];
    const result = classifyRecipe(
      {
        id: 'recipe-verified-safe',
        allergens: ['ovo'],
        allergenState: 'verified',
      },
      malformedRestrictions,
    );

    expect(result).toEqual({
      result: 'unconfirmed',
      allergenState: 'verified',
      reasons: ['invalid_allergen_code'],
      matchedAllergens: [],
    });

    const malformedRecipeResult = classifyRecipe(
      {
        id: 'recipe-unknown-allergen',
        allergens: ['unknown_allergen' as AllergenCode],
        allergenState: 'verified',
      },
      ['amendoim'],
    );

    expect(malformedRecipeResult).toEqual({
      result: 'unconfirmed',
      allergenState: 'verified',
      reasons: ['invalid_allergen_code'],
      matchedAllergens: [],
    });
  });

  it('A06 / RN16: normalizes invalid runtime allergenState to unverified with and without restrictions', () => {
    const malformedRecipe = {
      id: 'recipe-corrupted-state',
      allergens: ['ovo'] as AllergenCode[],
      allergenState: 'corrupted_state' as RecipeForRules['allergenState'],
    };

    expect(classifyRecipe(malformedRecipe, [])).toEqual({
      result: 'compatible',
      allergenState: 'unverified',
      reasons: ['no_restrictions'],
      matchedAllergens: [],
    });

    expect(classifyRecipe(malformedRecipe, ['amendoim'])).toEqual({
      result: 'unconfirmed',
      allergenState: 'unverified',
      reasons: ['allergen_state_unverified'],
      matchedAllergens: [],
    });
  });

  it('A06: fails closed without throwing when runtime restrictions or recipe allergens are non-arrays', () => {
    const validRecipe: RecipeForRules = {
      id: 'recipe-verified',
      allergens: ['ovo'],
      allergenState: 'verified',
    };

    expect(classifyRecipe(validRecipe, null as unknown as readonly AllergenCode[])).toEqual({
      result: 'unconfirmed',
      allergenState: 'verified',
      reasons: ['invalid_allergen_code'],
      matchedAllergens: [],
    });

    expect(
      classifyRecipe(
        {
          id: 'recipe-null-allergens',
          allergens: undefined as unknown as readonly AllergenCode[],
          allergenState: 'verified',
        },
        ['amendoim'],
      ),
    ).toEqual({
      result: 'unconfirmed',
      allergenState: 'verified',
      reasons: ['invalid_allergen_code'],
      matchedAllergens: [],
    });

    expect(isSubstituteAllowed(validRecipe, null as unknown as readonly AllergenCode[])).toBe(
      false,
    );
  });
});

describe('filterCandidates shared JSON vectors (US01, RN08, RN10, A06)', () => {
  const vectors = allergenVectors.filterCandidates as readonly FilterVector[];

  it.each(vectors)('$id ($trace): $description', (vector) => {
    const filtered = filterCandidates(vector.input.recipes, vector.input.restrictions);
    expect(filtered.map((recipe) => recipe.id)).toEqual(vector.expectedIds);
  });

  it('US01: preserves generic candidate metadata fields without mutating input array', () => {
    const input = [
      {
        id: 'dish-1',
        name: 'Ratatouille',
        allergens: [] as AllergenCode[],
        allergenState: 'verified' as const,
        confirmedAllergenFree: true,
      },
      {
        id: 'dish-2',
        name: 'Pad Thai',
        allergens: ['amendoim'] as AllergenCode[],
        allergenState: 'verified' as const,
      },
    ];
    const snapshot = [...input];

    const filtered = filterCandidates(input, ['amendoim']);

    expect(filtered).toEqual([input[0]]);
    expect(filtered[0]?.name).toBe('Ratatouille');
    expect(input).toEqual(snapshot);
  });
});

describe('isSubstituteAllowed shared JSON vectors (US10, RN22, A06)', () => {
  const vectors = allergenVectors.isSubstituteAllowed as readonly SubstituteVector[];

  it.each(vectors)('$id ($trace): $description', (vector) => {
    const allowed = isSubstituteAllowed(vector.input.substitute, vector.input.restrictions);
    expect(allowed).toBe(vector.expected);
  });
});
