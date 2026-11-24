import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Icon } from './icons/Icon';
import type { IconName } from './icons/registry';
import { TextLink } from './TextLink';

export type NoticeType = 'info' | 'offline' | 'error';

export interface NoticeProps {
  readonly type: NoticeType;
  readonly message: string;
  readonly title?: string;
  /** Shows "Tentar novamente" (§1.5); the caller keeps whatever the user typed. */
  readonly onRetry?: () => void;
}

const LOOK: Readonly<
  Record<NoticeType, { icon: IconName; text: string; background: string; border?: string }>
> = {
  // textSecondary on surfaceAlt: textMuted would fail AA (§1.2).
  info: { icon: 'info', text: colors.textSecondary, background: colors.surfaceAlt },
  offline: { icon: 'offline', text: colors.onOfflineBanner, background: colors.offlineBanner },
  // Technical errors use `danger`, never the allergen palette (A06).
  error: {
    icon: 'alert-circle',
    text: colors.danger,
    background: colors.surface,
    border: colors.danger,
  },
};

export function Notice({ type, message, title, onRetry }: NoticeProps) {
  const look = LOOK[type];
  return (
    <View
      style={[
        styles.notice,
        { backgroundColor: look.background },
        look.border ? { borderWidth: 1.5, borderColor: look.border } : null,
      ]}
    >
      <Icon name={look.icon} size={20} color={look.text} />
      <View style={styles.texts}>
        {/* Title + message are one announcement; the retry link stays separately focusable. */}
        <View accessible accessibilityRole={type === 'error' ? 'alert' : 'text'}>
          {title ? <Text style={[styles.title, { color: look.text }]}>{title}</Text> : null}
          <Text
            style={[styles.message, { color: type === 'error' ? colors.textPrimary : look.text }]}
          >
            {message}
          </Text>
        </View>
        {onRetry ? (
          <View style={styles.action}>
            <TextLink label="Tentar novamente" onPress={onRetry} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - spacing.xs,
    borderRadius: radius.md,
  },
  texts: { flex: 1, gap: spacing.xxs },
  title: { ...typography.body, fontWeight: typography.button.fontWeight },
  message: typography.caption,
  action: { alignItems: 'flex-start', marginLeft: -spacing.xs },
});
