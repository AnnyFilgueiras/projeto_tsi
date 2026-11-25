import type { ReactNode, Ref } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../../../shared/theme';
import { IconButton, ProgressBar } from '../../../../shared/ui';

export const STEP_COUNT = 3;

export interface StepFrameProps {
  readonly step: 1 | 2 | 3;
  readonly onBack?: () => void;
  readonly children: ReactNode;
  /** Pinned below the scrolling content, where the thumb rests. */
  readonly footer?: ReactNode;
  /** Lets a step bring an inline message below the fold into view. */
  readonly scrollRef?: Ref<ScrollView>;
}

/**
 * Shared frame of the three onboarding steps: progress on top (visual only; the step count is read
 * by screen readers), scrolling content and a fixed footer for the main action.
 */
export function StepFrame({ step, onBack, children, footer, scrollRef }: StepFrameProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.back}>
          {onBack ? <IconButton icon="back" accessibilityLabel="Voltar" onPress={onBack} /> : null}
        </View>
        <View style={styles.progress}>
          <ProgressBar
            value={step / STEP_COUNT}
            accessibilityLabel={`Passo ${step} de ${STEP_COUNT}`}
          />
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const BACK_SLOT = 48;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  // Fixed slot so the bar does not jump when the back button appears on step 2.
  back: { width: BACK_SLOT, height: BACK_SLOT, justifyContent: 'center' },
  progress: { flex: 1, marginRight: BACK_SLOT },
  content: { flexGrow: 1, padding: spacing.lg, gap: spacing.lg },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
