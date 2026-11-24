import type {
  AllergenCode,
  AllergenState,
  ClassificationReason,
} from '@panelada/allergen-rules/rules';
import { allergenLabel } from './labels';

// Food-safety copy is fixed here (A06) so it cannot drift between screens. Source: ux-onda1a §1.4.

export const SCOPE_BANNER_TEXT =
  'Verificamos apenas os 19 alérgenos do vocabulário controlado (ANVISA + lactose). Confira sempre o rótulo dos ingredientes.';

export const FAIL_CLOSED_TITLE = 'Compatibilidade não confirmada';

export const ALLERGEN_TAG_TEXT = 'Contém alérgeno do seu perfil';

export const SEAL_LABELS: Readonly<Record<AllergenState, string>> = {
  verified: 'Verificado',
  source_declared: 'Declarado pela fonte',
  unverified: 'Não verificado',
};

/** What screen readers announce for the seal (§1.6: "Alérgenos: verificado"). */
export function sealAccessibilityLabel(state: AllergenState): string {
  return `Alérgenos: ${SEAL_LABELS[state].toLowerCase()}`;
}

const MATCH_WITHOUT_NAMES_REASON = 'Esta receita contém alérgenos que estão nas suas restrições.';
const UNVERIFIED_REASON = 'Os alérgenos desta receita ainda não foram verificados.';
const SOURCE_DECLARED_REASON =
  'A lista de alérgenos vem da fonte original e não foi confirmada pela curadoria.';

function joinLabels(codes: readonly AllergenCode[]): string {
  const labels = codes.map(allergenLabel);
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} e ${labels[labels.length - 1]}`;
}

/**
 * Plain-language reason for the fail-closed alert. A profile match outranks the "not confirmed"
 * reasons because it is the most actionable; any unknown or missing reason falls back to the
 * unverified sentence so the alert never renders without an explanation.
 */
export function failClosedReasonText(
  reasons: readonly ClassificationReason[],
  matchedAllergens: readonly AllergenCode[] = [],
): string {
  if (reasons.includes('allergen_match')) {
    if (matchedAllergens.length === 0) return MATCH_WITHOUT_NAMES_REASON;
    const plural = matchedAllergens.length > 1;
    return `Esta receita contém ${joinLabels(matchedAllergens)}, ${plural ? 'que estão' : 'que está'} nas suas restrições.`;
  }
  if (reasons.includes('source_declared_unconfirmed')) return SOURCE_DECLARED_REASON;
  return UNVERIFIED_REASON;
}
