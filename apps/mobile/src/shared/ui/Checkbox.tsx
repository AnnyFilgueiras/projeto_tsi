import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, touchTarget, typography } from '../theme';
import { Icon } from './icons/Icon';

export interface CheckboxProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly testID?: string;
}

/** Labelled checkbox; the whole row is the touch target (≥ 48 dp, §1.6). */
export function Checkbox({ label, checked, onChange, testID }: CheckboxProps) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.row}
      testID={testID}
    >
      <View style={[styles.box, checked ? styles.boxChecked : styles.boxIdle]}>
        {checked ? <Icon name="check" size={16} color={colors.onPrimary} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const BOX = 24;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - spacing.xs,
    minHeight: touchTarget.min,
  },
  box: {
    width: BOX,
    height: BOX,
    borderRadius: radius.sm / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxIdle: { borderColor: colors.textSecondary, backgroundColor: colors.surface },
  boxChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
  label: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    fontWeight: typography.button.fontWeight,
  },
});
