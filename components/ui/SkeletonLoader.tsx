import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useAppTheme } from "@/hooks/useAppTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { colors, isDark } = useAppTheme();
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerValue.value,
      [0, 1],
      [-SCREEN_WIDTH, SCREEN_WIDTH]
    );
    return {
      transform: [{ translateX }],
    };
  });

  const baseColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
  const shimmerColor = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)";

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: shimmerColor,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

// Pre-built skeleton variants
export const SkeletonCard: React.FC<{ style?: any }> = ({ style }) => {
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

export const SkeletonVerseCard: React.FC<{ style?: any }> = ({ style }) => {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.verseCard,
        { backgroundColor: colors.surface, borderColor: colors.outline },
        style,
      ]}
    >
      <SkeletonLoader width={100} height={16} style={{ marginBottom: 12 }} />
      <SkeletonLoader width="100%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="85%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="70%" height={16} />
    </View>
  );
};

export const SkeletonVerseDetail: React.FC = () => {
  const { colors } = useAppTheme();
  return (
    <View style={styles.verseDetailContainer}>
      {/* Sloka section */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.outline },
        ]}
      >
        <SkeletonLoader width={60} height={20} style={{ marginBottom: 16 }} />
        <SkeletonLoader width="100%" height={20} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="100%" height={20} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="80%" height={20} style={{ marginBottom: 16 }} />
        <SkeletonLoader width="100%" height={40} borderRadius={8} />
      </View>

      {/* Word meanings section */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.outline },
        ]}
      >
        <SkeletonLoader width={120} height={20} style={{ marginBottom: 16 }} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.wordRow}>
            <SkeletonLoader width="30%" height={16} />
            <SkeletonLoader width="50%" height={16} />
          </View>
        ))}
      </View>

      {/* Commentary section */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.outline },
        ]}
      >
        <SkeletonLoader width={100} height={20} style={{ marginBottom: 16 }} />
        <SkeletonLoader width="100%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="100%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="95%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="90%" height={16} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: "hidden",
  },
  shimmer: {
    width: "100%",
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
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 8,
  },
  verseDetailContainer: {
    padding: 16,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  wordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
});

export default SkeletonLoader;
