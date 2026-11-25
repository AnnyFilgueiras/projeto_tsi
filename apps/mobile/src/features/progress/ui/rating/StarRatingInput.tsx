import { useMemo, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { formatStars } from '../../../../shared/format';
import { spacing } from '../../../../shared/theme';
import { Star, Stepper, type StarFill } from '../../../../shared/ui';

export interface StarRatingInputProps {
  /** Null until the user picks a score; 0 is a real score (RN05). */
  readonly value: number | null;
  readonly onChange: (stars: number) => void;
  readonly disabled?: boolean;
}

const STAR_COUNT = 5;
const STAR_SIZE = 52;
const STEP = 0.5;

/**
 * Stars + stepper (UX-01E §8). Each star has a left half (i − 0.5) and a right half (i), by tap
 * or drag. The halves are only 26 dp wide, so they stay out of the accessibility tree and the
 * stepper (48 dp targets) is the guaranteed accessible path — and the only way to give 0.
 */
export function StarRatingInput({ value, onChange, disabled = false }: StarRatingInputProps) {
  const row = useRef<View>(null);
  const frame = useRef({ x: 0, width: 0 });
  // PanResponder is created once; refs keep the handlers on the latest props.
  const latest = useRef({ onChange, disabled });
  latest.current = { onChange, disabled };

  const drag = useMemo(() => {
    const pick = (pageX: number) => {
      const stars = starValueAt(pageX - frame.current.x, frame.current.width);
      if (stars !== null) latest.current.onChange(stars);
    };
    return PanResponder.create({
      // Taps go to the halves; only a horizontal move is taken over, so vertical scrolling
      // that starts on the stars still scrolls the form.
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        !latest.current.disabled && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => pick(gesture.moveX),
      onPanResponderRelease: (_, gesture) => pick(gesture.moveX),
      onPanResponderTerminationRequest: () => false,
    });
  }, []);

  // Window coordinates, because the drag reports page coordinates.
  const measure = () =>
    row.current?.measureInWindow((x, _y, width) => {
      frame.current = { x, width };
    });

  // While empty the stepper shows "–": − gives 0 and + gives 0.5. Placing the hidden value one
  // step below 0 (with `min` a step lower) keeps both buttons enabled with the stock Stepper.
  const empty = value === null;
  return (
    <View style={styles.container}>
      <View
        ref={row}
        onLayout={measure}
        style={styles.stars}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        {...drag.panHandlers}
      >
        {Array.from({ length: STAR_COUNT }, (_, index) => {
          const whole = index + 1;
          return (
            <View key={whole} style={styles.star}>
              <Star fill={fillOf(value, whole)} size={STAR_SIZE} />
              <Pressable
                testID={`star-${whole}-left`}
                disabled={disabled}
                onPress={() => onChange(whole - STEP)}
                style={[styles.half, styles.left]}
              />
              <Pressable
                testID={`star-${whole}-right`}
                disabled={disabled}
                onPress={() => onChange(whole)}
                style={[styles.half, styles.right]}
              />
            </View>
          );
        })}
      </View>
      <Stepper
        value={empty ? -STEP : value}
        min={empty ? -2 * STEP : 0}
        max={STAR_COUNT}
        formatValue={(stars) => (empty ? '–' : formatStars(stars))}
        decreaseLabel="Diminuir nota"
        increaseLabel="Aumentar nota"
        onDecrease={() => {
          if (!disabled) onChange(empty ? 0 : Math.max(0, value - STEP));
        }}
        onIncrease={() => {
          if (!disabled) onChange(empty ? STEP : Math.min(STAR_COUNT, value + STEP));
        }}
      />
    </View>
  );
}

/**
 * Score under a drag position `x` along a measured row of `width`. Each star owns one fifth of
 * the row (gaps included); its left half is i − 0.5. Dragging never lands on 0, which stays a
 * deliberate stepper choice. Null while the row is not measured yet.
 */
export function starValueAt(x: number, width: number): number | null {
  if (width <= 0) return null;
  const slot = width / STAR_COUNT;
  const clamped = Math.min(Math.max(x, 0), width);
  const index = Math.min(Math.floor(clamped / slot), STAR_COUNT - 1);
  const isLeftHalf = clamped - index * slot < slot / 2;
  return index + (isLeftHalf ? STEP : 1);
}

function fillOf(value: number | null, whole: number): StarFill {
  if (value === null || value <= whole - 1) return 'empty';
  return value >= whole ? 'full' : 'half';
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs + spacing.xxs,
  },
  star: { width: STAR_SIZE, height: STAR_SIZE },
  half: { position: 'absolute', top: 0, bottom: 0, width: STAR_SIZE / 2 },
  left: { left: 0 },
  right: { right: 0 },
});
