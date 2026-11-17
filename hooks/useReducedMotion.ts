import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Tracks the OS Reduce Motion setting.
 *
 * Reanimated already maps `withTiming`/`withSpring` to their end value and
 * respects `ReduceMotion.System` on entering builders. Use this hook for the
 * things Reanimated cannot infer: infinite ambient loops, long delays,
 * confetti, and haptics (motion-and-typography spec §1.3).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduced(enabled);
      })
      .catch(() => {
        // Query unavailable (web/older RN): keep full motion.
      });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

export default useReducedMotion;
