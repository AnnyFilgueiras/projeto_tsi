import { StyleSheet, View } from 'react-native';
import { colors, elevation, radius, spacing } from '../../../../shared/theme';
import { Skeleton } from '../../../../shared/ui';
import { COLLECTION_COPY } from './copy';

/** Loading state: three cards shaped like the cuisine list (§10, §1.5). */
export function CollectionSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel={COLLECTION_COPY.loading}
      accessibilityState={{ busy: true }}
      style={styles.container}
      testID="collection-skeleton"
    >
      {[0, 1, 2].map((key) => (
        <View key={key} style={styles.card}>
          <Skeleton height={spacing.lg} width="60%" />
          <Skeleton height={spacing.sm} radius="pill" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...elevation.card,
  },
});
