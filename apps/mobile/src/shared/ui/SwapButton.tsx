import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, touchTarget, typography } from '../theme';
import { Icon } from './icons/Icon';

export interface SwapButtonProps {
  readonly onPress: () => void;
  /** e.g. "Ver trocas seguras para Berinjela". */
  readonly accessibilityLabel: string;
  readonly label?: string;
}

/** Opens the safe-substitutions sheet of one ingredient. */
export function SwapButton({ onPress, accessibilityLabel, label = 'Trocas' }: SwapButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="swap" size={16} color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: touchTarget.min,
    minWidth: touchTarget.min,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  label: { ...typography.caption, color: colors.primary, fontWeight: typography.button.fontWeight },
});
