import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../../shared/theme';
import { Icon, Star, type StarFill } from '../../../../shared/ui';
import { CELEBRATION_COPY } from './copy';

export interface ConfirmationBlockProps {
  readonly dishName: string | null;
  readonly stars: number | null;
  readonly isRepeat: boolean;
}

const STAR_SIZE = 24;

/** Block A: what was saved. The numeric score is only read out, the stars already show it. */
export function ConfirmationBlock({ dishName, stars, isRepeat }: ConfirmationBlockProps) {
  const title = dishName
    ? isRepeat
      ? CELEBRATION_COPY.repeatTitle
      : CELEBRATION_COPY.firstTitle
    : CELEBRATION_COPY.genericTitle;
  return (
    <View style={styles.block}>
      <Icon name={isRepeat ? 'heart' : 'sparkle'} size={48} color={colors.primary} />
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {dishName ? <Text style={styles.dish}>{dishName}</Text> : null}
      {stars !== null ? (
        <View
          style={styles.stars}
          accessible
          accessibilityRole="image"
          accessibilityLabel={CELEBRATION_COPY.starsA11y(stars)}
        >
          {[1, 2, 3, 4, 5].map((position) => (
            <Star key={position} fill={fillAt(position, stars)} size={STAR_SIZE} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function fillAt(position: number, stars: number): StarFill {
  if (stars >= position) return 'full';
  return stars >= position - 0.5 ? 'half' : 'empty';
}

const styles = StyleSheet.create({
  block: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xl },
  title: { ...typography.display, color: colors.textPrimary, textAlign: 'center' },
  dish: { ...typography.subtitle, color: colors.textSecondary, textAlign: 'center' },
  stars: { flexDirection: 'row', gap: spacing.xs },
});
