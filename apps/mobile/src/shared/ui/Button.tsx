import { Pressable, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';
import { colors, radius, spacing, touchTarget, typography } from '../theme';
import { Icon } from './icons/Icon';
import type { IconName } from './icons/registry';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'unlock' | 'danger';

export interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  /** `md` = 48 dp (minimum target), `lg` = 56 dp (main CTA, recipe step navigation). */
  readonly size?: 'md' | 'lg';
  readonly icon?: IconName;
  readonly disabled?: boolean;
  /** While set, the button is disabled and shows this progress label (e.g. "Salvando…"). */
  readonly loadingLabel?: string;
  readonly testID?: string;
}

interface Look {
  readonly container: ViewStyle;
  readonly text: TextStyle;
}

const LOOKS: Readonly<Record<ButtonVariant, Look>> = {
  primary: { container: { backgroundColor: colors.primary }, text: { color: colors.onPrimary } },
  secondary: {
    container: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary },
    text: { color: colors.primary },
  },
  ghost: { container: {}, text: { color: colors.primary } },
  unlock: {
    container: { backgroundColor: colors.successUnlock },
    text: { color: colors.onPrimary },
  },
  danger: { container: {}, text: { color: colors.danger } },
};

// Disabled filled buttons sit on surfaceAlt with textSecondary (textMuted fails AA there, §1.2).
const DISABLED_LOOKS: Readonly<Record<ButtonVariant, Look>> = {
  primary: {
    container: { backgroundColor: colors.surfaceAlt },
    text: { color: colors.textSecondary },
  },
  unlock: {
    container: { backgroundColor: colors.surfaceAlt },
    text: { color: colors.textSecondary },
  },
  secondary: {
    container: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border },
    text: { color: colors.textMuted },
  },
  ghost: { container: {}, text: { color: colors.textMuted } },
  danger: { container: {}, text: { color: colors.textMuted } },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loadingLabel,
  testID,
}: ButtonProps) {
  const busy = loadingLabel !== undefined;
  const inactive = disabled || busy;
  const look = inactive ? DISABLED_LOOKS[variant] : LOOKS[variant];
  const textColor = look.text.color as string;

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
      style={({ pressed }) => [
        styles.base,
        { minHeight: size === 'lg' ? touchTarget.comfortable : touchTarget.min },
        look.container,
        pressed && styles.pressed,
      ]}
      testID={testID}
    >
      {icon ? <Icon name={icon} size={20} color={textColor} /> : null}
      <Text style={[styles.label, look.text]}>{busy ? loadingLabel : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  pressed: { opacity: 0.85 },
  label: { ...typography.button, textAlign: 'center' },
});
