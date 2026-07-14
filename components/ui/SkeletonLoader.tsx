import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "@/hooks/useAppTheme";

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
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [shimmerValue]);

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

/** Calm gold opening state for verse detail — no boxed white cards. */
export const SkeletonVerseDetail: React.FC = () => {
  const { colors } = useAppTheme();
  const breath = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    ring.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [breath, ring]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.92 + breath.value * 0.08 }],
    opacity: 0.55 + breath.value * 0.35,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + ring.value * 0.35 }],
    opacity: 0.45 * (1 - ring.value),
  }));

  return (
    <View style={[styles.verseDetailContainer, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.openingHero}>
        <View style={styles.orbWrap}>
          <Animated.View
            style={[
              styles.ring,
              { borderColor: colors.primary },
              ringStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.orb,
              {
                backgroundColor: colors.primary + "18",
                borderColor: colors.primary + "55",
              },
              orbStyle,
            ]}
          >
            <Text style={[styles.om, { color: colors.primary }]}>ॐ</Text>
          </Animated.View>
        </View>

        <Text style={[styles.openingTitle, { color: colors.primary }]}>
          Opening the verse
        </Text>
        <Text style={[styles.openingHint, { color: colors.textMuted }]}>
          A quiet moment…
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(180).duration(500)}
        style={styles.previewBlock}
      >
        <SkeletonLoader
          width={72}
          height={18}
          borderRadius={4}
          tone="gold"
          style={{ alignSelf: "center", marginBottom: 18 }}
        />
        <SkeletonLoader
          width="88%"
          height={18}
          borderRadius={4}
          tone="gold"
          style={{ alignSelf: "center", marginBottom: 10 }}
        />
        <SkeletonLoader
          width="72%"
          height={18}
          borderRadius={4}
          tone="gold"
          style={{ alignSelf: "center", marginBottom: 10 }}
        />
        <SkeletonLoader
          width="54%"
          height={18}
          borderRadius={4}
          tone="gold"
          style={{ alignSelf: "center", marginBottom: 28 }}
        />

        <View style={[styles.rule, { backgroundColor: colors.outline + "33" }]} />

        <SkeletonLoader
          width={140}
          height={20}
          borderRadius={4}
          tone="gold"
          style={{ marginBottom: 16 }}
        />
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            entering={FadeIn.delay(240 + i * 80).duration(400)}
            style={styles.wordRow}
          >
            <SkeletonLoader width="28%" height={14} borderRadius={4} tone="gold" />
            <SkeletonLoader width="48%" height={14} borderRadius={4} tone="gold" />
          </Animated.View>
        ))}

        <View style={[styles.rule, { backgroundColor: colors.outline + "33", marginTop: 8 }]} />

        <SkeletonLoader
          width={100}
          height={20}
          borderRadius={4}
          tone="gold"
          style={{ marginBottom: 16, marginTop: 8 }}
        />
        <SkeletonLoader width="100%" height={14} borderRadius={4} tone="gold" style={{ marginBottom: 8 }} />
        <SkeletonLoader width="96%" height={14} borderRadius={4} tone="gold" style={{ marginBottom: 8 }} />
        <SkeletonLoader width="78%" height={14} borderRadius={4} tone="gold" />
      </Animated.View>
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
  verseDetailContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  openingHero: {
    alignItems: "center",
    marginBottom: 36,
  },
  orbWrap: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  orb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: StyleSheet.hairlineWidth,
  },
  om: {
    fontSize: 28,
    lineHeight: 34,
  },
  openingTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    marginBottom: 6,
  },
  openingHint: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  previewBlock: {
    paddingTop: 4,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
    marginBottom: 20,
  },
  wordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
});

export default SkeletonLoader;
