import { StyleSheet, Text, View } from 'react-native';
import { colors, elevation, radius, spacing, typography } from '../theme';
import { TextLink } from './TextLink';

export interface ToastProps {
  readonly message: string;
  /** Optional follow-up action, e.g. "Ver". */
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

/** Temporary confirmation. Timing and visibility belong to the caller. */
export function Toast({ message, actionLabel, onAction }: ToastProps) {
  return (
    <View style={styles.toast} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <TextLink label={actionLabel} onPress={onAction} tone="onDark" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: spacing.xxl,
    borderRadius: radius.md,
    backgroundColor: colors.textPrimary,
    ...elevation.sheet,
  },
  message: { ...typography.caption, flex: 1, color: colors.onPrimary },
});
