import { INVARIANTS_PACKAGE_VERSION, checkInvariants } from '@panelada/allergen-rules/invariants';
import {
  ALLERGEN_CODES,
  PACKAGE_VERSION,
  classifyRecipe,
  filterCandidates,
  isSubstituteAllowed,
} from '@panelada/allergen-rules/rules';
import { describe, expect, it } from 'vitest';

describe('@panelada/allergen-rules Node/API entrypoints (ADR-014, S6, A06)', () => {
  it('resolves both /rules and /invariants entrypoints in apps/api', () => {
    expect(PACKAGE_VERSION).toBe('1.0.0');
    expect(INVARIANTS_PACKAGE_VERSION).toBe(PACKAGE_VERSION);
    expect(ALLERGEN_CODES).toHaveLength(19);

    const classification = classifyRecipe(
      { id: 'r1', allergens: ['amendoim'], allergenState: 'verified' },
      ['amendoim'],
    );
    expect(classification.result).toBe('incompatible');
    expect(classification.matchedAllergens).toEqual(['amendoim']);

    const candidates = filterCandidates(
      [
        { id: 'r1', allergens: ['amendoim'], allergenState: 'verified' },
        { id: 'r2', allergens: ['ovo'], allergenState: 'verified' },
      ],
      ['amendoim'],
    );
    expect(candidates.map((item) => item.id)).toEqual(['r2']);

    expect(
      isSubstituteAllowed({ id: 's1', allergens: [], allergenState: 'unverified' }, ['amendoim']),
    ).toBe(false);

    const violations = checkInvariants({ id: 'r-bad', allergens: [], allergenState: 'verified' }, [
      { id: 'i1', allergens: ['leite'] },
    ]);
    expect(violations.map((v) => v.code)).toEqual([
      'invariant_verified_without_allergens',
      'invariant_allergen_union',
      'invariant_milk_without_lactose',
    ]);
  });
});
