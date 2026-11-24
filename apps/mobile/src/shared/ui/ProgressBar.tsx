import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';
import { MOTION_DURATION_MS, useReducedMotion } from './motion';

export interface ProgressBarProps {
  /** 0–1; values outside are clamped. */
  readonly value: number;
  /** e.g. "Culinária francesa: 33%". */
  readonly accessibilityLabel: string;
}

const TRACK_HEIGHT = 6;

export function ProgressBar({ value, accessibilityLabel }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const reduced = useReducedMotion();
  const fill = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    if (reduced) {
      fill.setValue(clamped);
      return;
    }
    const animation = Animated.timing(fill, {
      toValue: clamped,
      duration: MOTION_DURATION_MS,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [clamped, reduced, fill]);

  const width = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View style={[styles.fill, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.progress },
});
