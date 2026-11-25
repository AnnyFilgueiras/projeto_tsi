import { StyleSheet, View } from 'react-native';
import { colors, elevation, radius, spacing, touchTarget } from '../../../../shared/theme';
import { Skeleton } from '../../../../shared/ui';
import { KITCHEN_COPY } from './copy';

const THUMB_SIZE = 72;

/** Loading state shaped like the list: segment track and two cards (§1.5). */
export function KitchenSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel={KITCHEN_COPY.loading}
      accessibilityState={{ busy: true }}
      style={styles.container}
      testID="kitchen-skeleton"
    >
      <Skeleton height={touchTarget.min} radius="md" />
      {[0, 1].map((key) => (
        <View key={key} style={styles.card}>
          <View style={styles.row}>
            <Skeleton height={THUMB_SIZE} width={THUMB_SIZE} />
            <View style={styles.lines}>
              <Skeleton height={spacing.lg} width="70%" />
              <Skeleton height={spacing.md} width="40%" />
            </View>
          </View>
          <Skeleton height={touchTarget.min} radius="md" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  lines: { flex: 1, gap: spacing.sm },
});
