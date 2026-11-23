import React, { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions, Pressable, Modal } from "react-native";
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

import { haptics } from "@/lib/haptics";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Type } from "@/theme/design-tokens";
import { Duration, Spring } from "@/theme/motion";
import type { StreakMilestone } from "@/constants/milestones";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MILESTONE_COPY: Record<
  StreakMilestone,
  { title: TranslationKey; body: TranslationKey }
> = {
  7: { title: "milestone.7.title", body: "milestone.7.body" },
  21: { title: "milestone.21.title", body: "milestone.21.body" },
  108: { title: "milestone.108.title", body: "milestone.108.body" },
};

type Props = {
  visible: boolean;
  days: StreakMilestone | null;
  onClose: () => void;
  onShare?: () => void;
};

export default function MilestoneModal({ visible, days, onClose, onShare }: Props) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [rendered, setRendered] = useState(visible);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && days) {
      setRendered(true);
      haptics.success();
      opacity.value = withTiming(1, { duration: Duration.base });
      scale.value = reducedMotion
        ? 1
        : withSequence(
            withSpring(1.05, Spring.bouncy),
            withSpring(1, Spring.bouncy)
          );
    } else {
      opacity.value = withTiming(0, { duration: Duration.fast });
      scale.value = withTiming(reducedMotion ? 1 : 0.9, {
        duration: Duration.fast,
        easing: Easing.out(Easing.quad),
      });

      const timer = setTimeout(() => setRendered(false), Duration.fast);
      return () => clearTimeout(timer);
    }
  }, [visible, days, reducedMotion, opacity, scale]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!days || (!visible && !rendered)) return null;

  const copy = MILESTONE_COPY[days];

  return (
    <Modal
      transparent
      visible={rendered}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="box-none"
        accessibilityViewIsModal
        onAccessibilityEscape={onClose}
      >
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
            <Ionicons name="flame" size={36} color={colors.brandText} />
          </View>
          <Text style={[styles.days, { color: colors.brandText }]}>{days}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{t(copy.title)}</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>{t(copy.body)}</Text>
          <View style={styles.actions}>
            {onShare && (
              <Pressable
                onPress={onShare}
                style={[styles.secondary, { borderColor: colors.outline }]}
              >
                <Text style={{ color: colors.text, fontWeight: "700" }}>
                  {t("milestone.share")}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              style={[styles.primary, { backgroundColor: colors.brandText }]}
            >
              <Text style={{ color: colors.onPrimary, fontWeight: "700" }}>
                {t("milestone.continue")}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
      </View>
    </Modal>
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
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 56,
    lineHeight: 60,
    marginBottom: 4,
  },
  title: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 22,
    lineHeight: 28,
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    ...Type.bodySm,
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
