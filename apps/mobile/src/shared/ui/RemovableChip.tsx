import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, touchTarget, typography } from '../theme';
import { IconButton } from './IconButton';

export interface RemovableChipProps {
  readonly label: string;
  readonly onRemove: () => void;
  readonly disabled?: boolean;
  readonly testID?: string;
}

/**
 * A chosen value with its own ✕ (e.g. an active restriction). Unlike `Chip` it does not toggle:
 * the label is static and only the 48 dp ✕ acts, announced as "Remover {label}".
 */
export function RemovableChip({ label, onRemove, disabled = false, testID }: RemovableChipProps) {
  return (
    <View style={styles.chip} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <IconButton
        icon="close"
        accessibilityLabel={`Remover ${label}`}
        onPress={onRemove}
        color={colors.primary}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: touchTarget.min,
    paddingLeft: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  label: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: typography.button.fontWeight,
  },
});
