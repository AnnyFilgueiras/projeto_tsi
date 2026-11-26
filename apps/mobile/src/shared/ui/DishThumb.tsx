import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, radius } from '../theme';
import { Icon } from './icons/Icon';

export interface DishThumbProps {
  /** Downloaded WebP (`{ uri }`) or bundled asset; without it a vector placeholder is drawn. */
  readonly image?: ImageSourcePropType;
  /** `thumb` = 72 dp square (lists); `cover` = full width at 4:3 (recipe header). */
  readonly variant?: 'thumb' | 'cover';
  /** Dish name for screen readers; omit when the name is already next to the image. */
  readonly accessibilityLabel?: string;
}

const THUMB_SIZE = 72;

export function DishThumb({ image, variant = 'thumb', accessibilityLabel }: DishThumbProps) {
  const frame = variant === 'thumb' ? styles.thumb : styles.cover;
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel }
    : { accessible: false };

  if (image) {
    return <Image source={image} style={[styles.base, frame]} resizeMode="cover" {...a11y} />;
  }
  return (
    <View
      style={[styles.base, frame, styles.placeholder]}
      {...a11y}
      testID="dish-thumb-placeholder"
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="dishThumbGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primarySoft} />
            <Stop offset="1" stopColor={colors.primary} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dishThumbGradient)" />
      </Svg>
      <Icon name="dish-placeholder" size={variant === 'thumb' ? 32 : 64} color={colors.onPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden', borderRadius: radius.sm },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE },
  cover: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
