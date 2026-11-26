import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Icon } from './icons/Icon';
import type { IconName } from './icons/registry';

export interface BadgeIconProps {
  readonly state: 'earned' | 'locked';
  /** e.g. "Primeiro prato, conquistado". */
  readonly accessibilityLabel: string;
  readonly icon?: IconName;
  readonly image?: ImageSourcePropType;
}

const BADGE_SIZE = 52;
const ART_SIZE = 28;

/** Badge medal (ADR-016). Locked = not earned yet, marked with a lock, never "lost" (RN04). */
export function BadgeIcon({ state, accessibilityLabel, icon = 'badge', image }: BadgeIconProps) {
  const earned = state === 'earned';
  const tint = earned ? colors.successUnlock : colors.textSecondary;
  return (
    <View
      style={[styles.badge, earned ? styles.earned : styles.locked]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      testID={`badge-${state}`}
    >
      {image ? (
        <Image source={image} style={[styles.art, !earned && styles.lockedArt]} />
      ) : (
        <Icon name={icon} size={ART_SIZE} color={tint} />
      )}
      {earned ? null : (
        <View style={styles.lock}>
          <Icon name="lock" size={14} color={colors.textSecondary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  earned: { backgroundColor: colors.successUnlockSoft, borderColor: colors.successUnlock },
  locked: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
  art: { width: ART_SIZE, height: ART_SIZE },
  lockedArt: { opacity: 0.5 },
  lock: {
    position: 'absolute',
    right: -spacing.xxs,
    bottom: -spacing.xxs,
    padding: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
});
