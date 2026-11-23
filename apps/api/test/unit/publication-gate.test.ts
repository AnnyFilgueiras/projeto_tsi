import { describe, expect, it } from 'vitest';
import {
  evaluatePublicationGate,
  MAX_EVOLUTION_CHAIN_DEPTH,
  type PublicationGateInput,
} from '../../src/modules/importer/internal/publication-gate.js';

const VALID_HASH = 'a'.repeat(64);
const CUISINE_ID = '11111111-1111-4111-8111-111111111111';
const DISH_ID = '22222222-2222-4222-8222-222222222222';
const INGREDIENT_MILK_ID = '33333333-3333-4333-8333-333333333333';

function createValidInput(overrides: Partial<PublicationGateInput> = {}): PublicationGateInput {
  return {
    proposalId: DISH_ID,
    name: 'Crepe simples',
    cuisineId: CUISINE_ID,
    cuisineExists: true,
    baseDishId: null,
    baseDishChain: { exists: true, depthFromRoot: 0, hasCycle: false },
    prepTimeMinutes: 30,
    difficulty: 'easy',
    steps: ['Misture tudo.', 'Cozinhe na frigideira.'],
    allergens: ['leite', 'lactose'],
    allergenState: 'verified',
    confirmedAllergenFree: false,
    sourceName: 'Receita da dupla',
    sourceUrl: 'https://example.org/crepe',
    photo: {
      hash: VALID_HASH,
      author: 'Dupla',
      title: 'Crepe',
      sourceUrl: 'https://example.org/photo',
      license: 'own_work',
      modified: false,
    },
    ingredients: [
      {
        ingredientId: INGREDIENT_MILK_ID,
        exists: true,
        allergens: ['leite', 'lactose'],
        lactoseFree: false,
      },
    ],
    substitutes: [],
    ...overrides,
  };
}

describe('PublicationGate (R02, A09, RN17, RN18, RN21, ADR-014)', () => {
  it('A09: allows a complete verified proposal with valid photo attribution and invariants', () => {
    const violations = evaluatePublicationGate(createValidInput());
    expect(violations).toEqual([]);
  });

  it('UC12 / ADR-010: allows publishing source_declared and unverified proposals without requiring verified', () => {
    const sourceDeclared = evaluatePublicationGate(
      createValidInput({ allergenState: 'source_declared' }),
    );
    const unverified = evaluatePublicationGate(createValidInput({ allergenState: 'unverified' }));

    expect(sourceDeclared).toEqual([]);
    expect(unverified).toEqual([]);
  });

  it('R02 / A09 / RN17 / ADR-014: collects missing fields, missing source, missing photo attribution, and checkInvariants violations cumulatively in a single pass', () => {
    const violations = evaluatePublicationGate(
      createValidInput({
        name: ' ',
        cuisineExists: false,
        prepTimeMinutes: 0,
        steps: [],
        sourceName: '',
        sourceUrl: 'not-a-url',
        photo: null,
        allergens: [],
        allergenState: 'verified',
        confirmedAllergenFree: false,
        ingredients: [
          {
            ingredientId: INGREDIENT_MILK_ID,
            exists: true,
            allergens: ['leite'],
            lactoseFree: false,
          },
        ],
        substitutes: [
          {
            id: '44444444-4444-4444-8444-444444444444',
            allergens: [],
            allergenState: 'verified',
            confirmedAllergenFree: false,
          },
        ],
      }),
    );

    const codes = violations.map((item) => item.code);
    expect(codes).toContain('missing_field');
    expect(codes).toContain('source_missing');
    expect(codes).toContain('photo_without_attribution');
    expect(codes).toContain('invariant_verified_without_allergens');
    expect(codes).toContain('invariant_allergen_union');
    expect(codes).toContain('invariant_milk_without_lactose');
    expect(codes).toContain('invariant_verified_substitute_without_allergens');
  });

  it('ADR-012: flags photo_without_attribution when photo metadata is incomplete or license is disallowed', () => {
    const violations = evaluatePublicationGate(
      createValidInput({
        photo: {
          hash: 'short-hash',
          author: ' ',
          sourceUrl: 'ftp://invalid.example/photo',
          license: 'cc_by_nc' as unknown as 'own_work',
          modified: false,
        },
      }),
    );

    expect(violations.some((item) => item.code === 'photo_without_attribution')).toBe(true);
  });

  it('RN18 / ADR-016: rejects self-reference, cyclic chains, missing baseDish, and chains deeper than MAX_EVOLUTION_CHAIN_DEPTH', () => {
    const selfRef = evaluatePublicationGate(
      createValidInput({
        baseDishId: DISH_ID,
        baseDishChain: { exists: true, depthFromRoot: 1, hasCycle: true },
      }),
    );
    expect(
      selfRef.some((item) => item.code === 'missing_field' && item.field === 'baseDishId'),
    ).toBe(true);

    const missingBase = evaluatePublicationGate(
      createValidInput({
        baseDishId: '55555555-5555-4555-8555-555555555555',
        baseDishChain: { exists: false, depthFromRoot: 0, hasCycle: false },
      }),
    );
    expect(
      missingBase.some((item) => item.code === 'missing_field' && item.field === 'baseDishId'),
    ).toBe(true);

    const tooDeep = evaluatePublicationGate(
      createValidInput({
        baseDishId: '55555555-5555-4555-8555-555555555555',
        baseDishChain: {
          exists: true,
          depthFromRoot: MAX_EVOLUTION_CHAIN_DEPTH,
          hasCycle: false,
        },
      }),
    );
    expect(
      tooDeep.some((item) => item.code === 'missing_field' && item.field === 'baseDishId'),
    ).toBe(true);

    const tooDeepWithDescendants = evaluatePublicationGate(
      createValidInput({
        baseDishId: '55555555-5555-4555-8555-555555555555',
        baseDishChain: {
          exists: true,
          depthFromRoot: 6,
          hasCycle: false,
          descendantDepth: 4,
        },
      }),
    );
    expect(
      tooDeepWithDescendants.some(
        (item) => item.code === 'missing_field' && item.field === 'baseDishId',
      ),
    ).toBe(true);
  });

  it('RN08 / ADR-014: allows verified allergen-free recipe when confirmedAllergenFree is true and ingredients have no allergens', () => {
    const violations = evaluatePublicationGate(
      createValidInput({
        allergens: [],
        allergenState: 'verified',
        confirmedAllergenFree: true,
        ingredients: [
          {
            ingredientId: '66666666-6666-4666-8666-666666666666',
            exists: true,
            allergens: [],
            lactoseFree: false,
          },
        ],
      }),
    );

    expect(violations).toEqual([]);
  });
});
