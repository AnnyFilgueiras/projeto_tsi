import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { Icon } from '../../../shared/ui';
import type { CuriosityHint } from '../domain/pick-curiosity-hint';
import { DISCOVER_COPY } from './copy';

export interface CuriosityHintPillProps {
  readonly hint: CuriosityHint;
}

/**
 * One-line N04/N05 nudge. Not the shared `Pill`: that one takes plain text and the name here must
 * stand out in bold, and changing the Pill API belongs in its own PR (#74 rule).
 */
export function CuriosityHintPill({ hint }: CuriosityHintPillProps) {
  const evolution = hint.kind === 'evolution';

  return (
    <View style={styles.pill} testID="curiosity-hint">
      <Icon name={evolution ? 'unlock' : 'sparkle'} size={16} color={colors.successUnlock} />
      <Text style={styles.text} numberOfLines={1}>
        {evolution ? (
          DISCOVER_COPY.hintEvolution
        ) : (
          <>
            {DISCOVER_COPY.hintFirstCuisine}
            <Text style={styles.name}>{hint.cuisineName}</Text>
          </>
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.successUnlockSoft,
  },
  text: { ...typography.caption, flexShrink: 1, color: colors.successUnlock },
  name: { fontWeight: typography.overline.fontWeight },
});
