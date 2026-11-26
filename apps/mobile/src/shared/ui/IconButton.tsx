import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, touchTarget } from '../theme';
import { Icon } from './icons/Icon';
import type { IconName } from './icons/registry';

export interface IconButtonProps {
  readonly icon: IconName;
  /** Required: an icon alone says nothing to a screen reader (§1.6). */
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly color?: string;
  readonly disabled?: boolean;
  readonly testID?: string;
}

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  color = colors.textPrimary,
  disabled = false,
  testID,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      testID={testID}
    >
      <Icon name={icon} color={disabled ? colors.textMuted : color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
});
