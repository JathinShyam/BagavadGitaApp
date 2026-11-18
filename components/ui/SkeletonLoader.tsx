import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  cancelAnimation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
  /** Soft gold shimmer for scripture screens */
  tone?: "neutral" | "gold";
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
  tone = "neutral",
}) => {
  const { isDark, colors } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;

    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );

    return () => cancelAnimation(shimmerValue);
  }, [shimmerValue, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerValue.value,
      [0, 1],
      [-SCREEN_WIDTH * 0.6, SCREEN_WIDTH * 0.6]
    );
    return {
      transform: [{ translateX }],
    };
  });

  const baseColor =
    tone === "gold"
      ? colors.primary + (isDark ? "22" : "18")
      : isDark
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(0, 0, 0, 0.06)";

  const shimmerColors =
    tone === "gold"
      ? ([
          "transparent",
          colors.primary + (isDark ? "55" : "40"),
          "transparent",
        ] as const)
      : isDark
        ? (["transparent", "rgba(255,255,255,0.12)", "transparent"] as const)
        : (["transparent", "rgba(255,255,255,0.55)", "transparent"] as const);

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as number | `${number}%`,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={[...shimmerColors]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export const SkeletonCard: React.FC<{ style?: object }> = ({ style }) => {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.outline },
        style,
      ]}
    >
      <SkeletonLoader height={160} borderRadius={0} />
      <View style={styles.cardContent}>
        <SkeletonLoader width={80} height={14} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="90%" height={18} style={{ marginBottom: 8 }} />
        <SkeletonLoader width={60} height={14} />
      </View>
    </View>
  );
};

export const SkeletonVerseCard: React.FC<{ style?: object }> = ({ style }) => {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.verseCard,
        { borderBottomColor: colors.outline + "33" },
        style,
      ]}
    >
      <SkeletonLoader width={100} height={14} tone="gold" style={{ marginBottom: 12 }} />
      <SkeletonLoader width="100%" height={16} tone="gold" style={{ marginBottom: 8 }} />
      <SkeletonLoader width="85%" height={16} tone="gold" style={{ marginBottom: 8 }} />
      <SkeletonLoader width="70%" height={16} tone="gold" />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: "hidden",
  },
  shimmer: {
    width: "55%",
    height: "100%",
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 12,
  },
  cardContent: {
    padding: 12,
  },
  verseCard: {
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default SkeletonLoader;
