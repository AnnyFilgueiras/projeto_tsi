import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../../shared/theme';
import { BadgeIcon } from '../../../../shared/ui';
import type { CelebrationView } from '../../domain/celebration';
import { CELEBRATION_COPY } from './copy';

export interface BadgesEarnedBlockProps {
  readonly badges: CelebrationView['badges'];
}

/** Block D (RN04): each badge with its reason, and one permanence line for all of them. */
export function BadgesEarnedBlock({ badges }: BadgesEarnedBlockProps) {
  return (
    <View style={styles.block}>
      {badges.map((badge) => (
        <View key={badge.badgeId} style={styles.row}>
          <BadgeIcon state="earned" accessibilityLabel={CELEBRATION_COPY.badgeA11y(badge.name)} />
          <View style={styles.text}>
            <Text style={styles.name}>{badge.name}</Text>
            <Text style={styles.reason}>{badge.description}</Text>
          </View>
        </View>
      ))}
      <Text style={styles.forever}>{CELEBRATION_COPY.badgeForever}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1, gap: spacing.xxs },
  name: { ...typography.subtitle, color: colors.textPrimary },
  reason: { ...typography.caption, color: colors.textSecondary },
  forever: { ...typography.caption, color: colors.textSecondary },
});
