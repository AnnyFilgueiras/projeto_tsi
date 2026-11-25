import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, touchTarget, typography } from '../theme';
import { Icon } from './icons/Icon';

export interface ChipProps {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly testID?: string;
  /**
   * Grows to share its row with the neighbours in a wrapping container, so rows end flush with
   * the edges. Width no longer depends on `selected`, so picking a chip never reflows the rows.
   */
  readonly fill?: boolean;
}

const CHECK_SIZE = 16;

/** Multi-select option (allergens, cuisines, preferences). Selection = check icon + color. */
export function Chip({
  label,
  selected,
  onPress,
  disabled = false,
  testID,
  fill = false,
}: ChipProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      style={[
        styles.chip,
        selected ? styles.selected : styles.idle,
        fill && styles.fill,
        // Unselected chips keep the check icon's room as padding: same width in both states.
        fill && !selected && styles.fillReserve,
      ]}
      testID={testID}
    >
      {selected ? <Icon name="check" size={CHECK_SIZE} color={colors.primary} /> : null}
      <Text
        style={[
          styles.label,
          selected ? styles.selectedLabel : styles.idleLabel,
          // A bolder selected label would widen the chip; fill mode keeps one weight.
          fill && styles.fillLabel,
        ]}
      >
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
  fill: { flexGrow: 1 },
  fillReserve: { paddingHorizontal: spacing.md + (CHECK_SIZE + spacing.xs) / 2 },
  fillLabel: { fontWeight: typography.button.fontWeight },
});
