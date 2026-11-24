import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, touchTarget, typography } from '../theme';
import { Icon } from './icons/Icon';

export interface ChipProps {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly testID?: string;
}

/** Multi-select option (allergens, cuisines, preferences). Selection = check icon + color. */
export function Chip({ label, selected, onPress, disabled = false, testID }: ChipProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      style={[styles.chip, selected ? styles.selected : styles.idle]}
      testID={testID}
    >
      {selected ? <Icon name="check" size={16} color={colors.primary} /> : null}
      <Text style={[styles.label, selected ? styles.selectedLabel : styles.idleLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  idle: { backgroundColor: colors.surface, borderColor: colors.border },
  selected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  label: typography.caption,
  idleLabel: { color: colors.textPrimary, fontWeight: '500' },
  selectedLabel: { color: colors.primary, fontWeight: typography.button.fontWeight },
});
