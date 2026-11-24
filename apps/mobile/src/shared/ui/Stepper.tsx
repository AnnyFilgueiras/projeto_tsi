import { StyleSheet, Text, View } from 'react-native';
import { formatStars } from '../format';
import { colors, radius, spacing, typography } from '../theme';
import { IconButton } from './IconButton';

export interface StepperProps {
  readonly value: number;
  readonly onDecrease: () => void;
  readonly onIncrease: () => void;
  readonly min?: number;
  readonly max?: number;
  readonly decreaseLabel?: string;
  readonly increaseLabel?: string;
  readonly formatValue?: (value: number) => string;
}

/** −/+ fine adjustment (half stars by default) with 48 dp targets. */
export function Stepper({
  value,
  onDecrease,
  onIncrease,
  min = 0,
  max = 5,
  decreaseLabel = 'Diminuir',
  increaseLabel = 'Aumentar',
  formatValue = formatStars,
}: StepperProps) {
  return (
    <View style={styles.row}>
      <View style={styles.circle}>
        <IconButton
          icon="minus"
          accessibilityLabel={decreaseLabel}
          onPress={onDecrease}
          color={colors.primary}
          disabled={value <= min}
        />
      </View>
      <Text style={styles.value} accessibilityLiveRegion="polite">
        {formatValue(value)}
      </Text>
      <View style={styles.circle}>
        <IconButton
          icon="plus"
          accessibilityLabel={increaseLabel}
          onPress={onIncrease}
          color={colors.primary}
          disabled={value >= max}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  circle: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  value: {
    ...typography.title,
    minWidth: spacing.xxl + spacing.sm,
    textAlign: 'center',
    color: colors.textPrimary,
  },
});
