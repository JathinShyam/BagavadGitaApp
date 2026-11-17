import { useEffect, useRef, useState } from "react";

/**
 * Keeps a loading placeholder off the screen for fast work, and keeps it up
 * long enough to read once shown (motion-and-typography spec §4.3).
 *
 * AsyncStorage reads resolve in a few milliseconds; flashing a shimmer for
 * one frame reads as a glitch and starts a dozen infinite loops for nothing.
 */
export function useMinimumLoading(
  loading: boolean,
  { delay = 150, minimum = 400 }: { delay?: number; minimum?: number } = {}
): boolean {
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        shownAtRef.current = Date.now();
        setVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    const shownAt = shownAtRef.current;
    if (shownAt === null) {
      setVisible(false);
      return;
    }

    const remaining = Math.max(0, minimum - (Date.now() - shownAt));
    const timer = setTimeout(() => {
      shownAtRef.current = null;
      setVisible(false);
    }, remaining);
    return () => clearTimeout(timer);
  }, [loading, delay, minimum]);

  return visible;
}

export default useMinimumLoading;
