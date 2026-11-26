import { StyleSheet, View } from 'react-native';
import { spacing } from '../../../../shared/theme';
import { Star, type StarFill } from '../../../../shared/ui';
import { COLLECTION_COPY } from './copy';

const STAR_SIZE = 16;
const STAR_COUNT = 5;

/** Read-only stars with half-point support (RN05); read as one "Nota 4,5 de 5". */
export function StarsRow({ stars, size = STAR_SIZE }: { stars: number; size?: number }) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="image"
      accessibilityLabel={COLLECTION_COPY.starsA11y(stars)}
    >
      {Array.from({ length: STAR_COUNT }, (_, index) => (
        <Star key={index} size={size} fill={fillAt(stars, index)} />
      ))}
    </View>
  );
}

function fillAt(stars: number, index: number): StarFill {
  if (stars >= index + 1) return 'full';
  if (stars >= index + 0.5) return 'half';
  return 'empty';
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xxs },
});
