import type { AllergenCode, ClassificationReason } from '@panelada/allergen-rules/rules';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { Icon } from '../icons/Icon';
import { FAIL_CLOSED_TITLE, failClosedReasonText } from './copy';

export interface FailClosedAlertProps {
  /** `Classification.reasons` from `classifyRecipe`. */
  readonly reasons: readonly ClassificationReason[];
  /** `Classification.matchedAllergens`, named in the message on a profile match. */
  readonly matchedAllergens?: readonly AllergenCode[];
  /** Compact repeats the alert above the "Concluir e avaliar prato" button. */
  readonly size?: 'default' | 'compact';
}

/**
 * Blocking food-safety alert (A06, RN08). Intentionally has no close button and no collapsed
 * state: ambiguity here is a health risk.
 */
export function FailClosedAlert({
  reasons,
  matchedAllergens = [],
  size = 'default',
}: FailClosedAlertProps) {
  const compact = size === 'compact';
  return (
    <View
      style={[styles.alert, compact && styles.compact]}
      accessible
      accessibilityRole="alert"
      testID="fail-closed-alert"
    >
      <View style={styles.heading}>
        <Icon name="warning" size={compact ? 16 : 20} color={colors.onAllergenDanger} />
        <Text style={[styles.title, compact && styles.compactTitle]}>{FAIL_CLOSED_TITLE}</Text>
      </View>
      <Text style={styles.body}>{failClosedReasonText(reasons, matchedAllergens)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.allergenDanger,
  },
  compact: { paddingHorizontal: spacing.md - spacing.xs, paddingVertical: spacing.sm },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.body, flex: 1, color: colors.onAllergenDanger, fontWeight: '800' },
  compactTitle: { ...typography.overline, fontWeight: '800' },
  body: { ...typography.caption, color: colors.onAllergenDanger },
});
