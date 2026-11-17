import React, { useEffect, useMemo, useState } from "react";
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
  Easing,
} from "react-native-reanimated";
import { haptics } from "@/lib/haptics";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Type } from "@/theme/design-tokens";
import { Duration, Spring } from "@/theme/motion";

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

  // Seed randoms once so re-renders don't reshuffle the layout.
  const seed = useMemo(
    () => {
      const startX = Math.random() * SCREEN_WIDTH - SCREEN_WIDTH / 2;
      return {
        startX,
        endX: startX + (Math.random() - 0.5) * 200,
        fallDuration: 3000 + Math.random() * 2000,
        spinDuration: 1000 + Math.random() * 1000,
        size: 8 + Math.random() * 8,
      };
    },
    []
  );

  useEffect(() => {
    translateY.value = withDelay(
      startDelay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration: seed.fallDuration,
        easing: Easing.out(Easing.quad),
      })
    );
    translateX.value = withDelay(
      startDelay,
      withSequence(
        withTiming(seed.startX, { duration: 0 }),
        withTiming(seed.endX, {
          duration: seed.fallDuration,
          easing: Easing.inOut(Easing.sin),
        })
      )
    );
    // Finite spins — the particle is invisible after ~3s anyway.
    rotate.value = withDelay(
      startDelay,
      withRepeat(withTiming(360, { duration: seed.spinDuration }), 5, false)
    );
    opacity.value = withDelay(
      startDelay + 2000,
      withTiming(0, { duration: 1000 })
    );
    scale.value = withDelay(
      startDelay,
      withSpring(1.2, Spring.bouncy)
    );
  }, [startDelay, seed, translateY, translateX, rotate, opacity, scale]);

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
  const size = seed.size;

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
  const reducedMotion = useReducedMotion();
  const [rendered, setRendered] = useState(visible);
  const backdropOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.5);
  const contentOpacity = useSharedValue(0);
  const starScale = useSharedValue(0);

  const confettiDelays = useMemo(
    () => Array.from({ length: 24 }, () => Math.random() * 500),
    []
  );

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
      setRendered(true);
      haptics.success();

      backdropOpacity.value = withTiming(1, { duration: Duration.slow });
      contentOpacity.value = withTiming(1, {
        duration: reducedMotion ? Duration.fast : Duration.slow,
      });
      contentScale.value = reducedMotion ? 1 : withSpring(1, Spring.gentle);
      starScale.value = reducedMotion
        ? 1
        : withDelay(300, withSpring(1, Spring.bouncy));
    } else {
      backdropOpacity.value = withTiming(0, { duration: Duration.base });
      contentScale.value = withTiming(reducedMotion ? 1 : 0.5, {
        duration: Duration.base,
      });
      contentOpacity.value = withTiming(0, { duration: Duration.base });
      starScale.value = withTiming(reducedMotion ? 1 : 0, {
        duration: Duration.base,
      });

      // Keep the tree mounted until the exit has actually played (BUG-027).
      const timer = setTimeout(() => setRendered(false), Duration.base);
      return () => clearTimeout(timer);
    }
  }, [visible, reducedMotion, backdropOpacity, contentScale, contentOpacity, starScale]);

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

  if (!visible && !rendered) return null;

  return (
    <View style={styles.overlay}>
      {/* Confetti — decorative motion, skipped under Reduce Motion. */}
      {!reducedMotion &&
        confettiDelays.map((delay, i) => (
        <ConfettiParticle
          key={i}
          index={i}
          color={confettiColors[i % confettiColors.length]}
          startDelay={delay}
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
            <Ionicons name="trophy" size={64} color={colors.brandText} />
          </View>
        </Animated.View>

        <Text style={[styles.title, { color: colors.brandText }]}>
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
          style={[styles.button, { backgroundColor: colors.brandText }]}
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
    ...Type.title,
    marginBottom: 8,
  },
  subtitle: {
    ...Type.body,
    marginBottom: 4,
  },
  chapterText: {
    ...Type.heading,
    fontWeight: "700",
    marginBottom: 16,
  },
  message: {
    ...Type.bodySm,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    ...Type.body,
    fontWeight: "600",
  },
  confetti: {
    position: "absolute",
    top: -50,
    left: SCREEN_WIDTH / 2,
  },
});

export default CelebrationModal;
