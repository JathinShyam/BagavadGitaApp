import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/hooks/useAppTheme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CelebrationModalProps {
  visible: boolean;
  chapterNumber: number;
  onClose: () => void;
}

// Confetti particle component
const ConfettiParticle: React.FC<{
  index: number;
  color: string;
  startDelay: number;
}> = ({ index, color, startDelay }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const startX = Math.random() * SCREEN_WIDTH - SCREEN_WIDTH / 2;
  const endX = startX + (Math.random() - 0.5) * 200;

  useEffect(() => {
    translateY.value = withDelay(
      startDelay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration: 3000 + Math.random() * 2000,
        easing: Easing.out(Easing.quad),
      })
    );
    translateX.value = withDelay(
      startDelay,
      withSequence(
        withTiming(startX, { duration: 0 }),
        withTiming(endX, {
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.sin),
        })
      )
    );
    rotate.value = withDelay(
      startDelay,
      withRepeat(
        withTiming(360, { duration: 1000 + Math.random() * 1000 }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      startDelay + 2000,
      withTiming(0, { duration: 1000 })
    );
    scale.value = withDelay(
      startDelay,
      withSpring(1.2, { damping: 10 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const shapes = ["square", "circle", "triangle"];
  const shape = shapes[index % shapes.length];
  const size = 8 + Math.random() * 8;

  return (
    <Animated.View
      style={[
        styles.confetti,
        animatedStyle,
        {
          backgroundColor: shape !== "triangle" ? color : "transparent",
          width: size,
          height: size,
          borderRadius: shape === "circle" ? size / 2 : 2,
          borderLeftWidth: shape === "triangle" ? size / 2 : 0,
          borderRightWidth: shape === "triangle" ? size / 2 : 0,
          borderBottomWidth: shape === "triangle" ? size : 0,
          borderLeftColor: shape === "triangle" ? "transparent" : undefined,
          borderRightColor: shape === "triangle" ? "transparent" : undefined,
          borderBottomColor: shape === "triangle" ? color : undefined,
        },
      ]}
    />
  );
};

const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  chapterNumber,
  onClose,
}) => {
  const { colors } = useAppTheme();
  const backdropOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.5);
  const contentOpacity = useSharedValue(0);
  const starScale = useSharedValue(0);

  const confettiColors = [
    colors.primary,
    colors.success,
    colors.warning,
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
  ];

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      backdropOpacity.value = withTiming(1, { duration: 300 });
      contentScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      contentOpacity.value = withTiming(1, { duration: 300 });
      starScale.value = withDelay(
        300,
        withSpring(1, { damping: 8, stiffness: 150 })
      );
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      contentScale.value = withTiming(0.5, { duration: 200 });
      contentOpacity.value = withTiming(0, { duration: 200 });
      starScale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
    opacity: contentOpacity.value,
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Confetti */}
      {[...Array(50)].map((_, i) => (
        <ConfettiParticle
          key={i}
          index={i}
          color={confettiColors[i % confettiColors.length]}
          startDelay={Math.random() * 500}
        />
      ))}

      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { backgroundColor: "rgba(0, 0, 0, 0.7)" },
          backdropStyle,
        ]}
      />

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          { backgroundColor: colors.surface, borderColor: colors.outline },
          contentStyle,
        ]}
      >
        <Animated.View style={[styles.starContainer, starStyle]}>
          <View
            style={[styles.starBg, { backgroundColor: colors.primary + "20" }]}
          >
            <Ionicons name="trophy" size={64} color={colors.primary} />
          </View>
        </Animated.View>

        <Text style={[styles.title, { color: colors.primary }]}>
          Congratulations!
        </Text>

        <Text style={[styles.subtitle, { color: colors.text }]}>
          You&apos;ve completed
        </Text>

        <Text style={[styles.chapterText, { color: colors.text }]}>
          Chapter {chapterNumber}
        </Text>

        <Text style={[styles.message, { color: colors.textMuted }]}>
          Your dedication to spiritual wisdom is inspiring. Keep exploring the
          timeless teachings of the Bhagavad Gita.
        </Text>

        <Pressable
          onPress={onClose}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            Continue Learning
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    width: SCREEN_WIDTH - 48,
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    zIndex: 1,
  },
  starContainer: {
    marginBottom: 24,
  },
  starBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  chapterText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confetti: {
    position: "absolute",
    top: -50,
    left: SCREEN_WIDTH / 2,
  },
});

export default CelebrationModal;
