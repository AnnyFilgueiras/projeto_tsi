import { useEffect, useRef } from 'react';
import { Animated, type DimensionValue, StyleSheet } from 'react-native';
import { colors, radius as radii } from '../../theme';
import { MOTION_DURATION_MS, useReducedMotion } from '../motion';

export interface SkeletonProps {
  readonly height: number;
  readonly width?: DimensionValue;
  readonly radius?: keyof typeof radii;
}

/** Loading block shaped like the final content (§1.5). Pulses unless "reduce motion" is on. */
export function Skeleton({ height, width = '100%', radius = 'sm' }: SkeletonProps) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduced) {
      opacity.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: MOTION_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: MOTION_DURATION_MS,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [reduced, opacity]);

  return (
    <Animated.View
      style={[styles.block, { height, width, borderRadius: radii[radius], opacity }]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      testID="skeleton"
    />
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.surfaceAlt },
});
