import { Pressable, StyleSheet } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

import { haptics } from "@/lib/haptics";
import { Duration, Spring } from "@/theme/motion";

type Props = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  /** Active track color (gold in this app) */
  activeColor: string;
  inactiveColor?: string;
  /** Spoken name, e.g. the setting's row title — without it VoiceOver says only "switch". */
  accessibilityLabel?: string;
};

const TRACK_W = 51;
const TRACK_H = 31;
const THUMB = 27;
const PAD = 2;

/** Compact iOS-style switch matching the Settings mockup. */
export function IOSToggle({
  value,
  onValueChange,
  disabled,
  activeColor,
  inactiveColor = "#E5E5EA",
  accessibilityLabel,
}: Props) {
  const progress = useSharedValue(value ? 1 : 0);
  // The thumb springs; the track eases separately so it doesn't teleport.
  const tone = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, Spring.snappy);
    tone.value = withTiming(value ? 1 : 0, { duration: Duration.base });
  }, [value, progress, tone]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      tone.value,
      [0, 1],
      [inactiveColor, activeColor]
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: PAD + progress.value * (TRACK_W - THUMB - PAD * 2),
      },
    ],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      // react-native-web ignores accessibilityState; aria-* works everywhere.
      aria-checked={value}
      aria-disabled={!!disabled}
      disabled={disabled}
      hitSlop={6}
      onPressIn={haptics.light}
      onPress={() => {
        if (disabled) return;
        haptics.selection();
        onValueChange(!value);
      }}
      style={[styles.hit, disabled && { opacity: 0.45 }]}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    justifyContent: "center",
  },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    justifyContent: "center",
  },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});

export default IOSToggle;
