import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Icon } from './icons/Icon';

export interface OfflineBarProps {
  readonly message?: string;
}

/** Top-of-screen "no network" strip (§1.5). Local data stays usable, so the tone is neutral. */
export function OfflineBar({
  message = 'O que está salvo no aparelho continua disponível.',
}: OfflineBarProps) {
  return (
    <View style={styles.bar} accessible accessibilityLiveRegion="polite" accessibilityRole="text">
      <Icon name="offline" color={colors.onOfflineBanner} />
      <View style={styles.texts}>
        <Text style={styles.title}>Sem conexão</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.offlineBanner,
  },
  texts: { flex: 1 },
  title: {
    ...typography.caption,
    color: colors.onOfflineBanner,
    fontWeight: typography.button.fontWeight,
  },
  message: { ...typography.overline, color: colors.onOfflineBanner, fontWeight: '400' },
});
