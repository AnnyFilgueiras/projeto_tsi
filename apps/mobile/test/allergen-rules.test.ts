import {
  ALLERGEN_CODES,
  PACKAGE_VERSION,
  classifyRecipe,
  filterCandidates,
  isSubstituteAllowed,
  type AllergenCode,
  type Classification,
  type RecipeForRules,
  type SubstituteForRules,
} from '@panelada/allergen-rules/rules';
import allergenVectors from '../../../packages/allergen-rules/vectors/allergen-vectors.json';

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

describe('@panelada/allergen-rules/rules mobile Jest runtime (ADR-014, A06, A7)', () => {
  it('resolves the rules entrypoint with version 1.0.0 and 19 allergen codes', () => {
    expect(PACKAGE_VERSION).toBe('1.0.0');
    expect(ALLERGEN_CODES).toHaveLength(19);
  });

  const classifyCases = allergenVectors.classifyRecipe as readonly ClassifyVector[];
  it.each(classifyCases)('classifyRecipe $id ($trace): $description', (vector) => {
    expect(classifyRecipe(vector.input.recipe, vector.input.restrictions)).toEqual(vector.expected);
  });

  const filterCases = allergenVectors.filterCandidates as readonly FilterVector[];
  it.each(filterCases)('filterCandidates $id ($trace): $description', (vector) => {
    const filtered = filterCandidates(vector.input.recipes, vector.input.restrictions);
    expect(filtered.map((recipe) => recipe.id)).toEqual(vector.expectedIds);
  });

  const substituteCases = allergenVectors.isSubstituteAllowed as readonly SubstituteVector[];
  it.each(substituteCases)('isSubstituteAllowed $id ($trace): $description', (vector) => {
    expect(isSubstituteAllowed(vector.input.substitute, vector.input.restrictions)).toBe(
      vector.expected,
    );
  });
});
