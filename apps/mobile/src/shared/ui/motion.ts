import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Longest animation allowed by §1.6. */
export const MOTION_DURATION_MS = 300;

/** Mirrors the system "reduce motion" setting so animated components can stay static. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => active && setReduced(value))
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
