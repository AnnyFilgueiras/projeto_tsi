import { Image, type ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../Button';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/registry';

export interface EmptyStateProps {
  readonly title: string;
  readonly message: string;
  /** One constructive CTA (§1.5). */
  readonly actionLabel: string;
  readonly onAction: () => void;
  readonly icon?: IconName;
  readonly illustration?: ImageSourcePropType;
}

const ILLUSTRATION_SIZE = 96;

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon = 'dish-placeholder',
  illustration,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {illustration ? (
        <Image source={illustration} style={styles.illustration} accessible={false} />
      ) : (
        <Icon name={icon} size={spacing.xxl} color={colors.primary} />
      )}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      <Button label={actionLabel} onPress={onAction} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  illustration: { width: ILLUSTRATION_SIZE, height: ILLUSTRATION_SIZE },
  title: { ...typography.subtitle, color: colors.textPrimary, textAlign: 'center' },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
