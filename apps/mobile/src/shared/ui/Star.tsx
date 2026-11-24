import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { Icon } from './icons/Icon';

export type StarFill = 'empty' | 'half' | 'full';

export interface StarProps {
  readonly fill: StarFill;
  readonly size?: number;
  /** Tappable stars need a label such as "3 estrelas". */
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
}

const DEFAULT_SIZE = 52;

/** One rating star; `half` overlays the filled star clipped to the left half. */
export function Star({ fill, size = DEFAULT_SIZE, onPress, accessibilityLabel }: StarProps) {
  const glyph = (
    <View style={{ width: size, height: size }} testID={`star-${fill}`}>
      <Icon name="star" size={size} color={colors.border} />
      {fill === 'empty' ? null : (
        <View style={[styles.fill, { width: fill === 'half' ? size / 2 : size, height: size }]}>
          <Icon name="star" size={size} color={colors.primary} />
        </View>
      )}
    </View>
  );
  if (!onPress) return glyph;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      {glyph}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
});
