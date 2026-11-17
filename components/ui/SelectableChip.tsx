import { useEffect } from "react";
import {
  Pressable,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Duration, Spring } from "@/theme/motion";

/**
 * Chip that eases between its idle and selected colours and gives a small
 * confirm pop on selection (motion-and-typography spec §7.4). Used by the
 * Home filters, Explore moods and the two onboarding chip groups.
 */
export type ChipPalette = {
  idleBackground: string;
  activeBackground: string;
  idleBorder: string;
  activeBorder: string;
  idleText: string;
  activeText: string;
};

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  onPressIn?: () => void;
  palette: ChipPalette;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  accessibilityRole?: "button" | "radio";
  accessibilityLabel?: string;
};

export function SelectableChip({
  label,
  selected,
  onPress,
  onPressIn,
  palette,
  containerStyle,
  labelStyle,
  accessibilityRole = "button",
  accessibilityLabel,
}: Props) {
  const progress = useSharedValue(selected ? 1 : 0);
  const pop = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: Duration.base,
    });

    if (selected) {
      pop.value = withSequence(
        withTiming(0.97, { duration: 0 }),
        withSpring(1, Spring.snappy)
      );
    }
  }, [selected, progress, pop]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [palette.idleBackground, palette.activeBackground]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [palette.idleBorder, palette.activeBorder]
    ),
    transform: [{ scale: pop.value }],
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [palette.idleText, palette.activeText]
    ),
  }));

  return (
    <Pressable
      onPressIn={onPressIn}
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Animated.View style={[containerStyle, containerAnimatedStyle]}>
        <Animated.Text style={[labelStyle, labelAnimatedStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export default SelectableChip;
