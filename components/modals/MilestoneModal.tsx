import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useAppTheme } from "@/hooks/useAppTheme";
import type { StreakMilestone } from "@/constants/milestones";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MILESTONE_COPY: Record<
  StreakMilestone,
  { title: string; body: string }
> = {
  7: {
    title: "7 days of practice",
    body: "A full week of showing up. The Gita is becoming part of your rhythm.",
  },
  21: {
    title: "21-day habit",
    body: "Three weeks of returning to wisdom. This is how character is shaped.",
  },
  108: {
    title: "108 days",
    body: "A sacred count completed. Your dedication honors the path itself.",
  },
};

type Props = {
  visible: boolean;
  days: StreakMilestone | null;
  onClose: () => void;
  onShare?: () => void;
};

export default function MilestoneModal({ visible, days, onClose, onShare }: Props) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && days) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      opacity.value = withTiming(1, { duration: 220 });
      scale.value = withSequence(
        withSpring(1.05, { damping: 12 }),
        withSpring(1, { damping: 14 })
      );
    } else {
      opacity.value = withTiming(0, { duration: 160 });
      scale.value = withTiming(0.9, { duration: 160, easing: Easing.out(Easing.quad) });
    }
  }, [visible, days, opacity, scale]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible || !days) return null;

  const copy = MILESTONE_COPY[days];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[styles.backdrop, backdropStyle, { backgroundColor: "#000000aa" }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            cardStyle,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <View style={[styles.badge, { backgroundColor: colors.primary + "22" }]}>
            <Ionicons name="flame" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.days, { color: colors.primary }]}>{days}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>{copy.body}</Text>
          <View style={styles.actions}>
            {onShare && (
              <Pressable
                onPress={onShare}
                style={[styles.secondary, { borderColor: colors.outline }]}
              >
                <Text style={{ color: colors.text, fontWeight: "700" }}>Share</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              style={[styles.primary, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: colors.onPrimary, fontWeight: "700" }}>Continue</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 48, 340),
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  days: {
    fontSize: 48,
    fontWeight: "800",
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  primary: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondary: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
