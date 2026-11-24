import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { Icon } from '../icons/Icon';
import { SCOPE_BANNER_TEXT } from './copy';

export interface AllergenScopeBannerProps {
  readonly size?: 'default' | 'compact';
}

/** RN16 coverage notice. Show only when the user has at least one restriction; never dismissible. */
export function AllergenScopeBanner({ size = 'default' }: AllergenScopeBannerProps) {
  const compact = size === 'compact';
  return (
    <View style={[styles.banner, compact && styles.compact]} accessible accessibilityRole="text">
      <Icon name="alert-circle" size={compact ? 16 : 24} color={colors.allergenWarning} />
      <Text style={[styles.text, compact && styles.compactText]}>{SCOPE_BANNER_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.allergenWarningSoft,
  },
  compact: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  text: { ...typography.caption, flex: 1, color: colors.allergenWarning, fontWeight: '500' },
  compactText: { ...typography.overline, fontWeight: '500' },
});
