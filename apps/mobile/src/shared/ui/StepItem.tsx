import { StyleSheet, Text, View } from 'react-native';
import { colors, elevation, radius, spacing, typography } from '../theme';
import { Icon } from './icons/Icon';

export type StepState = 'default' | 'done' | 'next' | 'current';

export interface StepItemProps {
  readonly number: number;
  readonly text: string;
  readonly state?: StepState;
}

const BUBBLE_SIZE = 28;

const STATE_SPOKEN: Readonly<Record<StepState, string>> = {
  default: '',
  done: ', concluído',
  next: ', próximo',
  current: ', atual',
};

/** Recipe step. `current` uses `stepBody` (22/32) to be readable from the counter (A04). */
export function StepItem({ number, text, state = 'default' }: StepItemProps) {
  const current = state === 'current';
  const done = state === 'done';
  return (
    <View
      style={[styles.step, current && styles.current]}
      accessible
      accessibilityLabel={`Passo ${number}${STATE_SPOKEN[state]}: ${text}`}
      testID={`step-${number}`}
    >
      <View style={[styles.bubble, current && styles.currentBubble]}>
        {done ? (
          <Icon name="check" size={16} color={colors.textSecondary} />
        ) : (
          <Text style={[styles.number, current && styles.currentNumber]}>{number}</Text>
        )}
      </View>
      <Text
        style={[
          current ? styles.currentText : styles.text,
          done && styles.doneText,
          state === 'next' && styles.nextText,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md - spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - spacing.xs,
    borderRadius: radius.md,
  },
  current: {
    backgroundColor: colors.surface,
    borderLeftWidth: spacing.xs,
    borderLeftColor: colors.primary,
    paddingVertical: spacing.md,
    ...elevation.card,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  currentBubble: { backgroundColor: colors.primary },
  number: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  currentNumber: { color: colors.onPrimary },
  text: { ...typography.body, flex: 1, color: colors.textPrimary },
  doneText: { color: colors.textMuted },
  nextText: { color: colors.textSecondary },
  currentText: { ...typography.stepBody, flex: 1, color: colors.textPrimary },
});
