import { useEffect } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useAppTheme } from "@/hooks/useAppTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Props = {
  onFinish: () => void;
};

/**
 * Branded cold-start intro shown once after native splash hides.
 * Motions: ring breathe → mark scale-in → title rise → soft exit.
 */
export function LaunchIntro({ onFinish }: Props) {
  const { colors, isDark } = useAppTheme();

  const overlayOpacity = useSharedValue(1);
  const ringScale = useSharedValue(0.55);
  const ringOpacity = useSharedValue(0);
  const markScale = useSharedValue(0.4);
  const markOpacity = useSharedValue(0);
  const titleY = useSharedValue(18);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const lineWidth = useSharedValue(0);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    ringOpacity.value = withTiming(1, { duration: 420 });
    ringScale.value = withSequence(
      withTiming(1.08, { duration: 900, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 500, easing: Easing.inOut(Easing.quad) })
    );

    markOpacity.value = withDelay(180, withTiming(1, { duration: 380 }));
    markScale.value = withDelay(
      180,
      withSpring(1, { damping: 12, stiffness: 120 })
    );

    titleOpacity.value = withDelay(420, withTiming(1, { duration: 450 }));
    titleY.value = withDelay(
      420,
      withSpring(0, { damping: 16, stiffness: 110 })
    );

    lineWidth.value = withDelay(
      560,
      withTiming(SCREEN_WIDTH * 0.28, {
        duration: 520,
        easing: Easing.out(Easing.cubic),
      })
    );

    subtitleOpacity.value = withDelay(620, withTiming(1, { duration: 420 }));

    const finish = () => onFinish();

    overlayOpacity.value = withDelay(
      1680,
      withTiming(0, { duration: 520, easing: Easing.inOut(Easing.quad) }, (finished) => {
        if (finished) runOnJS(finish)();
      })
    );
    // Shared values are stable references; the intro runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFinish]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const lineStyle = useAnimatedStyle(() => ({
    width: lineWidth.value,
    opacity: titleOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="auto"
      style={[
        StyleSheet.absoluteFill,
        styles.root,
        { backgroundColor: colors.background },
        overlayStyle,
      ]}
    >
      {/* Soft ambient wash — barely above theme background */}
      <View
        style={[
          styles.orb,
          styles.orbTop,
          { backgroundColor: colors.primary + (isDark ? "0A" : "0C") },
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.orbBottom,
          { backgroundColor: colors.primary + (isDark ? "08" : "0A") },
        ]}
      />

      <View style={styles.center}>
        <View style={styles.markStage}>
          <Animated.View
            style={[
              styles.ring,
              ringStyle,
              { borderColor: colors.primary + (isDark ? "44" : "55") },
            ]}
          />
          <Animated.View
            style={[
              styles.markWrap,
              markStyle,
              { backgroundColor: colors.primary + (isDark ? "18" : "1a") },
            ]}
          >
            <Ionicons name="book" size={42} color={colors.primary} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.titleBlock, titleStyle]}>
          <Text style={[styles.telugu, { color: colors.primary }]}>భగవద్గీత</Text>
          <Animated.View
            style={[styles.rule, lineStyle, { backgroundColor: colors.primary }]}
          />
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <Text style={[styles.english, { color: colors.textMuted }]}>
            Wisdom for the path
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 1000,
    elevation: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  markStage: {
    width: 148,
    height: 148,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  ring: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: StyleSheet.hairlineWidth,
  },
  markWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: 12,
  },
  telugu: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 36,
    letterSpacing: 1,
  },
  rule: {
    height: 1,
    marginTop: 14,
    borderRadius: 1,
  },
  english: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  orb: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: SCREEN_WIDTH,
  },
  orbTop: {
    top: -SCREEN_WIDTH * 0.28,
    alignSelf: "center",
  },
  orbBottom: {
    bottom: -SCREEN_WIDTH * 0.32,
    right: -SCREEN_WIDTH * 0.2,
  },
});
