import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../../shared/theme';
import { ProgressBar } from '../../../../shared/ui';
import type { CelebrationView } from '../../domain/celebration';
import { CELEBRATION_COPY } from './copy';

export interface CuisineProgressBlockProps {
  readonly cuisine: NonNullable<CelebrationView['cuisine']>;
}

/** Block B (RN07): one line and a bar that fills from the old to the new percentage. */
export function CuisineProgressBlock({ cuisine }: CuisineProgressBlockProps) {
  const { name, before, after } = cuisine;
  // ProgressBar starts at the value of its first render, so it mounts on "before" and the
  // switch to "after" is what animates (it already honors reduced motion).
  const [shown, setShown] = useState(before);
  useEffect(() => setShown(after), [after]);

  return (
    <View style={styles.block}>
      <Text style={styles.line}>
        {after.missing === 0
          ? CELEBRATION_COPY.cuisineComplete(name)
          : CELEBRATION_COPY.cuisineMissing(after.missing, name)}
      </Text>
      <ProgressBar
        value={shown.percent / 100}
        accessibilityLabel={CELEBRATION_COPY.cuisineA11y(name, after.completed, after.total)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  line: { ...typography.body, color: colors.textPrimary },
});
