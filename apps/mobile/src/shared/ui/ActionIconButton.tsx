import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, touchTarget } from '../theme';
import { Icon } from './icons/Icon';
import type { IconName } from './icons/registry';

export interface ActionIconButtonProps {
  readonly icon: IconName;
  /** Required: the icon alone says nothing to a screen reader (§1.6). */
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  /** `primary` = filled main decision; `secondary` = outlined alternative. */
  readonly variant?: 'primary' | 'secondary';
  readonly disabled?: boolean;
  readonly testID?: string;
}

const ICON_SIZE = 24;

/**
 * Square 56 dp one-tap decision button (UX-01B "Descartar" / "Quero cozinhar"). Unlike
 * `IconButton` (48 dp, borderless toolbar action), it carries the Button look at the comfortable
 * target size so a decision stays reachable with busy hands.
 */
export function ActionIconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'primary',
  disabled = false,
  testID,
}: ActionIconButtonProps) {
  const primary = variant === 'primary';
  const iconColor = disabled ? colors.textSecondary : primary ? colors.onPrimary : colors.primary;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        disabled && (primary ? styles.primaryDisabled : styles.secondaryDisabled),
        pressed && styles.pressed,
      ]}
      testID={testID}
    >
      <Icon name={icon} size={ICON_SIZE} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: touchTarget.comfortable,
    height: touchTarget.comfortable,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary },
  // Same disabled pairs as Button (textMuted fails AA on surfaceAlt, §1.2).
  primaryDisabled: { backgroundColor: colors.surfaceAlt },
  secondaryDisabled: { borderColor: colors.border },
  pressed: { opacity: 0.85 },
});
