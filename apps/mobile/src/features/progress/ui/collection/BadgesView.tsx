import { StyleSheet, Text, View } from 'react-native';
import { colors, elevation, radius, spacing, typography } from '../../../../shared/theme';
import { BadgeIcon, ProgressBar } from '../../../../shared/ui';
import type { BadgeView } from '../../domain/progress-model';
import { COLLECTION_COPY } from './copy';

export interface BadgesViewProps {
  readonly badges: BadgeView;
}

/**
 * US16 / RN03–RN04: earned badges with their date, then the next milestones with a goal-gradient
 * bar. The "Conquistados" section disappears while empty; the milestones always show (RN04:
 * criteria stay visible), which is also this sub-view's empty state.
 */
export function BadgesView({ badges }: BadgesViewProps) {
  return (
    <View style={styles.view}>
      {badges.earned.length > 0 ? (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.heading}>
            {COLLECTION_COPY.earned}
          </Text>
          {badges.earned.map((badge) => (
            <View key={badge.badgeId} style={styles.card} testID={`earned-${badge.badgeId}`}>
              <BadgeIcon
                state="earned"
                accessibilityLabel={COLLECTION_COPY.badgeEarnedA11y(badge.name)}
              />
              <View style={styles.text}>
                <Text style={styles.name}>{badge.name}</Text>
                {badge.unlockedAt ? (
                  <Text style={styles.meta}>{COLLECTION_COPY.earnedAt(badge.unlockedAt)}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {badges.next.length > 0 ? (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.heading}>
            {COLLECTION_COPY.next}
          </Text>
          {badges.next.map(({ badgeId, name, description, progress }) => (
            <View key={badgeId} style={styles.card} testID={`next-${badgeId}`}>
              <BadgeIcon
                state="locked"
                accessibilityLabel={COLLECTION_COPY.badgeLockedA11y(name)}
              />
              <View style={styles.text}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.meta}>{description}</Text>
                <View style={styles.progressRow}>
                  <View style={styles.bar}>
                    <ProgressBar
                      value={progress.target === 0 ? 0 : progress.current / progress.target}
                      accessibilityLabel={COLLECTION_COPY.milestoneA11y(
                        name,
                        progress.current,
                        progress.target,
                      )}
                    />
                  </View>
                  <Text style={styles.meta}>
                    {COLLECTION_COPY.milestone(progress.current, progress.target)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  view: { gap: spacing.lg },
  section: { gap: spacing.sm },
  heading: { ...typography.subtitle, color: colors.textPrimary },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  text: { flex: 1, gap: spacing.xxs },
  name: {
    ...typography.body,
    fontWeight: typography.subtitle.fontWeight,
    color: colors.textPrimary,
  },
  meta: { ...typography.caption, color: colors.textSecondary },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bar: { flex: 1 },
});
