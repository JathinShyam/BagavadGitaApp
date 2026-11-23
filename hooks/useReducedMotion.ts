import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * One query per process, shared by every hook instance.
 *
 * The OS setting cannot be read synchronously, so a per-hook `useState(false)`
 * made the first frame of every screen animate with full motion even when the
 * reader had Reduce Motion on — and each mounted hook issued its own query.
 * Priming once at module scope means later screens initialise with the known
 * value, and a single OS listener fans out to all subscribers.
 */
let cached: boolean | null = null;
let query: Promise<void> | null = null;
let subscription: { remove: () => void } | null = null;
const listeners = new Set<(reduced: boolean) => void>();

function apply(value: boolean) {
  cached = value;
  listeners.forEach((listener) => listener(value));
}

function start() {
  if (query) return;
  query = AccessibilityInfo.isReduceMotionEnabled()
    .then(apply)
    .catch(() => {
      // Query unavailable (web/older RN): keep full motion.
    });

  subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", apply);
}

/**
 * Tracks the OS Reduce Motion setting.
 *
 * Reanimated already maps `withTiming`/`withSpring` to their end value and
 * respects `ReduceMotion.System` on entering builders. Use this hook for the
 * things Reanimated cannot infer: infinite ambient loops, long delays,
 * confetti, and haptics (motion-and-typography spec §1.3).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    start();
    return cached ?? false;
  });

  useEffect(() => {
    start();
    if (cached !== null) setReduced(cached);
    listeners.add(setReduced);
    return () => {
      listeners.delete(setReduced);
      if (listeners.size === 0 && subscription) {
        subscription.remove();
        subscription = null;
        query = null;
        // Keep `cached`: the OS setting survives remounts, and re-querying
        // would make the next screen's first frame guess again.
      }
    };
  }, []);

  return reduced;
}

export default useReducedMotion;
