import type { AllergenState } from '@panelada/allergen-rules/rules';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, touchTarget, typography } from '../../theme';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/registry';
import { SEAL_LABELS, sealAccessibilityLabel } from './copy';

const SEAL_HEIGHT = 28;
const ICON_SIZE = 14;

const APPEARANCE: Readonly<
  Record<AllergenState, { icon: IconName; color: string; background: string }>
> = {
  verified: { icon: 'check', color: colors.allergenSafe, background: colors.allergenSafeSoft },
  source_declared: {
    icon: 'half-circle',
    color: colors.allergenWarning,
    background: colors.allergenWarningSoft,
  },
  unverified: {
    icon: 'question',
    color: colors.allergenDanger,
    background: colors.allergenDangerSoft,
  },
};

export interface AllergenSealProps {
  readonly state: AllergenState;
  /** Icon only (dense lists); the full label is still read by screen readers. */
  readonly compact?: boolean;
  /** Opens the sheet explaining the state; the screen that shows the seal owns that sheet. */
  readonly onPress?: () => void;
}

export function AllergenSeal({ state, compact = false, onPress }: AllergenSealProps) {
  const look = APPEARANCE[state];
  const body = (
    <View
      style={[styles.seal, compact && styles.compact, { backgroundColor: look.background }]}
      testID={`allergen-seal-${state}`}
    >
      <Icon name={look.icon} size={ICON_SIZE} color={look.color} />
      {compact ? null : (
        <Text style={[styles.label, { color: look.color }]}>{SEAL_LABELS[state]}</Text>
      )}
    </View>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityRole="text" accessibilityLabel={sealAccessibilityLabel(state)}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={sealAccessibilityLabel(state)}
      accessibilityHint="Explica o que significa este selo"
      hitSlop={(touchTarget.min - SEAL_HEIGHT) / 2}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  seal: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    minHeight: SEAL_HEIGHT,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  compact: { minWidth: SEAL_HEIGHT, paddingHorizontal: spacing.xs, justifyContent: 'center' },
  label: { ...typography.caption, fontWeight: typography.overline.fontWeight },
});
