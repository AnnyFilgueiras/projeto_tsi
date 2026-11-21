/**
 * Closed v1 allergen vocabulary: the 18 mandatory-declaration allergens from
 * ANVISA RDC 727/2022 (Annex III) plus `lactose` (ADR-014, ADR-015 exception).
 * Codes remain in Brazilian Portuguese for direct regulatory traceability.
 */
export const ALLERGEN_CODES = [
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

export type AllergenCode = (typeof ALLERGEN_CODES)[number];

const ALLERGEN_CODE_SET: ReadonlySet<string> = new Set(ALLERGEN_CODES);

/**
 * Checks whether a runtime value belongs to the closed 19-code allergen vocabulary.
 */
export function isAllergenCode(value: unknown): value is AllergenCode {
  return typeof value === 'string' && ALLERGEN_CODE_SET.has(value);
}

export const ALLERGEN_STATES = ['verified', 'source_declared', 'unverified'] as const;

export type AllergenState = (typeof ALLERGEN_STATES)[number];

const ALLERGEN_STATE_SET: ReadonlySet<string> = new Set(ALLERGEN_STATES);

export function isAllergenState(value: unknown): value is AllergenState {
  return typeof value === 'string' && ALLERGEN_STATE_SET.has(value);
}

export type CompatibilityResult = 'compatible' | 'incompatible' | 'unconfirmed';

export type ClassificationReason =
  | 'no_restrictions'
  | 'allergen_verified_safe'
  | 'allergen_match'
  | 'allergen_state_unverified'
  | 'source_declared_unconfirmed'
  | 'empty_allergens_unconfirmed'
  | 'invalid_allergen_code';

export interface RecipeForRules {
  readonly id?: string;
  readonly allergens: readonly AllergenCode[];
  readonly allergenState: AllergenState;
  readonly confirmedAllergenFree?: boolean;
}

export interface SubstituteForRules {
  readonly id?: string;
  readonly allergens: readonly AllergenCode[];
  readonly allergenState: AllergenState;
  readonly confirmedAllergenFree?: boolean;
}

export interface Classification {
  readonly result: CompatibilityResult;
  readonly allergenState: AllergenState;
  readonly reasons: readonly ClassificationReason[];
  readonly matchedAllergens: readonly AllergenCode[];
}

/**
 * Catalog publication allergen invariant codes matching `PublicationGateProblem.violations`
 * in `docs/fase2/04-contratos/openapi.yaml` (ADR-014, A09).
 */
export type InvariantViolationCode =
  | 'allergen_state_missing'
  | 'invariant_verified_without_allergens'
  | 'invariant_allergen_union'
  | 'invariant_verified_substitute_without_allergens'
  | 'invariant_milk_without_lactose';

export interface InvariantViolation {
  readonly code: InvariantViolationCode;
  readonly field: string;
  readonly message: string;
  readonly targetId?: string;
}

export interface SubstituteForInvariants {
  readonly id?: string;
  readonly allergens: readonly AllergenCode[];
  readonly allergenState?: AllergenState | null;
  readonly confirmedAllergenFree?: boolean;
}

export interface IngredientForInvariants {
  readonly id?: string;
  readonly allergens: readonly AllergenCode[];
  readonly lactoseFree?: boolean;
  readonly substitutes?: readonly SubstituteForInvariants[];
}

export interface RecipeForInvariants {
  readonly id?: string;
  readonly allergens: readonly AllergenCode[];
  readonly allergenState?: AllergenState | null;
  readonly confirmedAllergenFree?: boolean;
  readonly substitutes?: readonly SubstituteForInvariants[];
}
