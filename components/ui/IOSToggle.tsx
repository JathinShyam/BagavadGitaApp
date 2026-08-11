import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useEffect } from "react";
import * as Haptics from "expo-haptics";

type Props = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  /** Active track color (gold in this app) */
  activeColor: string;
  inactiveColor?: string;
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
}: Props) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, {
      damping: 18,
      stiffness: 220,
      mass: 0.6,
    });
  }, [value, progress]);

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
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={() => {
        if (disabled) return;
        Haptics.selectionAsync();
        onValueChange(!value);
      }}
      style={[styles.hit, disabled && { opacity: 0.45 }]}
    >
      <View
        style={[
          styles.track,
          { backgroundColor: value ? activeColor : inactiveColor },
        ]}
      >
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </View>
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
