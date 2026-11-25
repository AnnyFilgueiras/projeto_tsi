import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ProgressBar,
  StepItem,
  colors,
  spacing,
  typography,
  type StepState,
} from '../../../shared';

export interface StepsViewProps {
  readonly steps: readonly string[];
  /** null while the dish is not "em preparo": steps are readable but none is highlighted. */
  readonly currentStep: number | null;
  readonly onSelectStep: (index: number) => void;
  /** y of each step inside this view, so the screen can scroll the current one into view. */
  readonly onStepLayout?: (index: number, y: number) => void;
}

function stateOf(index: number, current: number | null): StepState {
  if (current === null) return 'default';
  if (index < current) return 'done';
  if (index === current) return 'current';
  return 'next';
}

export function StepsView({ steps, currentStep, onSelectStep, onStepLayout }: StepsViewProps) {
  return (
    <View style={styles.container}>
      {currentStep !== null ? (
        <View style={styles.progress}>
          <Text style={styles.counter}>{`Passo ${currentStep + 1} de ${steps.length}`}</Text>
          <ProgressBar
            value={(currentStep + 1) / steps.length}
            accessibilityLabel={`Passo ${currentStep + 1} de ${steps.length}`}
          />
        </View>
      ) : null}
      {steps.map((text, index) => (
        <Pressable
          key={index}
          onPress={currentStep === null ? undefined : () => onSelectStep(index)}
          disabled={currentStep === null}
          accessibilityHint={currentStep === null ? undefined : 'Ir para este passo'}
          onLayout={(event) => onStepLayout?.(index, event.nativeEvent.layout.y)}
        >
          <StepItem number={index + 1} text={text} state={stateOf(index, currentStep)} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs, paddingHorizontal: spacing.md },
  progress: { gap: spacing.xs, paddingBottom: spacing.sm },
  counter: { ...typography.overline, color: colors.textSecondary, textTransform: 'uppercase' },
});
