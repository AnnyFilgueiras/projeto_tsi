import {
  checkInvariants,
  type AllergenCode,
  type AllergenState,
  type IngredientForInvariants,
  type SubstituteForInvariants,
} from '@panelada/allergen-rules/invariants';
import type { PublicationGateViolation } from '../../../shared/problem.js';

// RN18 / ADR-016: Evolution chains cap depth at 10 levels (root = 1) to prevent pathological graphs.
export const MAX_EVOLUTION_CHAIN_DEPTH = 10;

const ALLOWED_PHOTO_LICENSES = new Set(['public_domain', 'cc0', 'cc_by', 'cc_by_sa', 'own_work']);

const ALLOWED_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/;

export interface PublicationGateIngredient {
  readonly ingredientId: string;
  readonly exists: boolean;
  readonly allergens: readonly AllergenCode[];
  readonly lactoseFree: boolean;
}

export interface PublicationGatePhoto {
  readonly hash: string;
  readonly author: string;
  readonly title?: string;
  readonly sourceUrl: string;
  readonly license: string;
  readonly licenseUrl?: string;
  readonly modified: boolean;
}

export interface PublicationGateBaseDishChain {
  readonly exists: boolean;
  readonly depthFromRoot: number;
  readonly hasCycle: boolean;
  readonly descendantDepth?: number;
}

export interface PublicationGateInput {
  readonly proposalId: string;
  readonly name: string;
  readonly cuisineId: string;
  readonly cuisineExists: boolean;
  readonly baseDishId: string | null;
  readonly baseDishChain: PublicationGateBaseDishChain;
  readonly prepTimeMinutes: number;
  readonly difficulty: string;
  readonly steps: readonly string[];
  readonly allergens: readonly AllergenCode[];
  readonly allergenState: AllergenState | null | undefined;
  readonly confirmedAllergenFree: boolean;
  readonly sourceName: string;
  readonly sourceUrl: string;
  readonly photo: PublicationGatePhoto | null;
  readonly ingredients: readonly PublicationGateIngredient[];
  readonly substitutes: readonly SubstituteForInvariants[];
}

function isValidHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function checkRequiredFields(
  input: PublicationGateInput,
  violations: PublicationGateViolation[],
): void {
  if (input.name.trim().length < 2) {
    violations.push({
      code: 'missing_field',
      field: 'name',
      message: 'O prato exige um nome com pelo menos 2 caracteres.',
    });
  }

  if (!input.cuisineId || !input.cuisineExists) {
    violations.push({
      code: 'missing_field',
      field: 'cuisineId',
      message: 'A culinária informada deve existir no catálogo.',
    });
  }

  if (!Number.isInteger(input.prepTimeMinutes) || input.prepTimeMinutes < 1) {
    violations.push({
      code: 'missing_field',
      field: 'prepTimeMinutes',
      message: 'O tempo de preparo deve ser um inteiro maior ou igual a 1 minuto.',
    });
  }

  if (!ALLOWED_DIFFICULTIES.has(input.difficulty)) {
    violations.push({
      code: 'missing_field',
      field: 'difficulty',
      message: 'A dificuldade da receita deve ser easy, medium ou hard.',
    });
  }

  if (input.ingredients.length === 0) {
    violations.push({
      code: 'missing_field',
      field: 'ingredients',
      message: 'A receita exige pelo menos um ingrediente canônico.',
    });
  } else {
    input.ingredients.forEach((item, index) => {
      if (!item.exists) {
        violations.push({
          code: 'missing_field',
          field: `ingredients[${index}].ingredientId`,
          message: 'Todos os ingredientes da receita devem existir no catálogo canônico.',
        });
      }
    });
  }

  if (input.steps.length === 0 || input.steps.some((step) => step.trim().length === 0)) {
    violations.push({
      code: 'missing_field',
      field: 'steps',
      message: 'A receita exige ao menos um passo de preparo não vazio.',
    });
  }
}

function checkEvolutionChain(
  input: PublicationGateInput,
  violations: PublicationGateViolation[],
): void {
  if (input.baseDishId === null) {
    return;
  }

  if (input.baseDishId === input.proposalId || input.baseDishChain.hasCycle) {
    violations.push({
      code: 'missing_field',
      field: 'baseDishId',
      message: 'A cadeia de evolução não pode conter ciclos nem apontar para o próprio prato.',
    });
    return;
  }

  if (!input.baseDishChain.exists) {
    violations.push({
      code: 'missing_field',
      field: 'baseDishId',
      message: 'O prato base informado deve existir e estar aprovado no catálogo.',
    });
    return;
  }

  // New dish adds +1 level on top of ancestors plus any approved descendants below it (RN18).
  const totalDepth =
    input.baseDishChain.depthFromRoot + 1 + (input.baseDishChain.descendantDepth ?? 0);
  if (totalDepth > MAX_EVOLUTION_CHAIN_DEPTH) {
    violations.push({
      code: 'missing_field',
      field: 'baseDishId',
      message: `A cadeia de evolução não pode ultrapassar ${MAX_EVOLUTION_CHAIN_DEPTH} níveis.`,
    });
  }
}

function checkSource(input: PublicationGateInput, violations: PublicationGateViolation[]): void {
  if (input.sourceName.trim().length < 2) {
    violations.push({
      code: 'source_missing',
      field: 'sourceName',
      message: 'A fonte pública da receita é obrigatória (RN17).',
    });
  }

  if (!isValidHttpUrl(input.sourceUrl)) {
    violations.push({
      code: 'source_missing',
      field: 'sourceUrl',
      message: 'O link HTTP(S) da fonte pública da receita é obrigatório (RN17).',
    });
  }
}

function checkPhotoAttribution(
  input: PublicationGateInput,
  violations: PublicationGateViolation[],
): void {
  const { photo } = input;
  if (!photo) {
    violations.push({
      code: 'photo_without_attribution',
      field: 'photo',
      message: 'A publicação exige uma foto WebP com metadados TASL completos (A09, ADR-012).',
    });
    return;
  }

  const hasValidHash = SHA256_HEX_REGEX.test(photo.hash);
  const hasAuthor = photo.author.trim().length > 0;
  const hasSourceUrl = isValidHttpUrl(photo.sourceUrl);
  const hasAllowedLicense = ALLOWED_PHOTO_LICENSES.has(photo.license);
  const hasLicenseUrlValid =
    photo.licenseUrl === undefined || photo.licenseUrl === '' || isValidHttpUrl(photo.licenseUrl);
  const hasModifiedFlag = typeof photo.modified === 'boolean';

  if (
    !hasValidHash ||
    !hasAuthor ||
    !hasSourceUrl ||
    !hasAllowedLicense ||
    !hasLicenseUrlValid ||
    !hasModifiedFlag
  ) {
    violations.push({
      code: 'photo_without_attribution',
      field: 'photo',
      message:
        'A foto exige hash válido, autor, URL da fonte, licença aberta aceita e flag modified (ADR-012).',
    });
  }
}

function checkAllergenInvariants(
  input: PublicationGateInput,
  violations: PublicationGateViolation[],
): void {
  const ingredientsForInvariants: IngredientForInvariants[] = input.ingredients.map((item) => ({
    id: item.ingredientId,
    allergens: item.allergens,
    lactoseFree: item.lactoseFree,
  }));

  const invariantViolations = checkInvariants(
    {
      id: input.proposalId,
      allergens: input.allergens,
      allergenState: input.allergenState,
      confirmedAllergenFree: input.confirmedAllergenFree,
      substitutes: input.substitutes,
    },
    ingredientsForInvariants,
  );

  for (const item of invariantViolations) {
    violations.push({
      code: item.code,
      field: item.field,
      message: item.message,
    });
  }
}

/**
 * Pure publication gate (R02, A09, RN17, RN18, RN21, ADR-012, ADR-014).
 *
 * Evaluates all publication rules without short-circuiting so curators receive
 * every blocking violation in a single 422 response. Approving does not require
 * `allergenState === 'verified'`.
 */
export function evaluatePublicationGate(
  input: PublicationGateInput,
): readonly PublicationGateViolation[] {
  const violations: PublicationGateViolation[] = [];

  checkRequiredFields(input, violations);
  checkEvolutionChain(input, violations);
  checkSource(input, violations);
  checkPhotoAttribution(input, violations);
  checkAllergenInvariants(input, violations);

  return violations;
}
