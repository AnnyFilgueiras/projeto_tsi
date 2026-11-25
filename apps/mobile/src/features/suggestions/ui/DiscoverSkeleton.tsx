import { StyleSheet, View } from 'react-native';
import { colors, elevation, radius, spacing, touchTarget } from '../../../shared/theme';
import { Skeleton } from '../../../shared/ui';
import { DISCOVER_COPY } from './copy';

// Approximates the 4:3 cover inside the 328 dp card column of the Figma frame.
const PHOTO_HEIGHT = 246;

/** Loading state shaped like the final card (photo, 2 lines, 2 buttons — §1.5, §5). */
export function DiscoverSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel={DISCOVER_COPY.loading}
      accessibilityState={{ busy: true }}
      style={styles.container}
      testID="discover-skeleton"
    >
      <View style={styles.card}>
        <Skeleton height={PHOTO_HEIGHT} radius="md" />
        <View style={styles.body}>
          <Skeleton height={spacing.lg} width="60%" />
          <Skeleton height={spacing.md} width="40%" />
        </View>
      </View>
      <View style={styles.actions}>
        <Skeleton height={touchTarget.comfortable} width={touchTarget.comfortable} radius="md" />
        <Skeleton height={touchTarget.comfortable} width={touchTarget.comfortable} radius="md" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  card: {
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  body: { gap: spacing.sm, padding: spacing.md },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl },
});
