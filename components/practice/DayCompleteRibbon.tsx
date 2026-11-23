import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { haptics } from "@/lib/haptics";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { Duration, Ease } from "@/theme/motion";

/**
 * "Day complete" ribbon (motion spec §2.4) — inline, never a modal.
 *
 * The reader is mid-verse when the daily goal lands. A full-screen reward
 * would interrupt the one thing they came to do, so the receipt slides in
 * under the header, holds long enough to read, and leaves. Modals stay for
 * chapter completions and streak milestones.
 */

const LOTUS_ICON = require("../../assets/images/lotus-simple.png");

/** 320 in + 1400 hold + 240 out. */
export const DAY_RIBBON_MS = 1960;
const ENTER = 320;
const HOLD = 1400;
const EXIT = 240;
/** Gold needs a dark ink in both themes; #1B1302 clears 5.6:1 on every stop. */
const RIBBON_INK = "#1B1302";

type Props = {
  visible: boolean;
  /** Streak length *after* this read — printed as "Day N complete". */
  streakDays: number;
  onHidden?: () => void;
};

export function DayCompleteRibbon({ visible, streakDays, onHidden }: Props) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [rendered, setRendered] = useState(false);

  const translateY = useSharedValue(-40);
  const opacity = useSharedValue(0);
  const lotus = useSharedValue(0);

  const onHiddenRef = useRef(onHidden);
  onHiddenRef.current = onHidden;
  const finish = useCallback(() => {
    setRendered(false);
    onHiddenRef.current?.();
  }, []);

  useEffect(() => {
    if (!visible) return;
    setRendered(true);

    // Day 3 is the first reward a new reader meets; give it more weight.
    if (streakDays >= 3) haptics.medium();
    else haptics.light();

    if (reducedMotion) {
      opacity.value = 0;
      opacity.value = withSequence(
        withTiming(1, { duration: Duration.base }),
        withDelay(
          HOLD,
          withTiming(0, { duration: Duration.base }, (finished) => {
            if (finished) runOnJS(finish)();
          })
        )
      );
      return;
    }

    translateY.value = -40;
    opacity.value = 0;
    translateY.value = withSequence(
      withTiming(0, { duration: ENTER, easing: Ease.standard }),
      withDelay(
        HOLD,
        withTiming(-40, { duration: EXIT, easing: Ease.accelerate })
      )
    );
    opacity.value = withSequence(
      withTiming(1, { duration: ENTER, easing: Ease.standard }),
      withDelay(
        HOLD,
        withTiming(0, { duration: EXIT, easing: Ease.accelerate }, (finished) => {
          if (finished) runOnJS(finish)();
        })
      )
    );

    // A week is worth one turn of the lotus; every longer run gets it too.
    if (streakDays >= 7) {
      lotus.value = 0;
      lotus.value = withDelay(
        ENTER,
        withTiming(360, { duration: Duration.ritual, easing: Ease.decelerate })
      );
    }
  }, [
    visible,
    streakDays,
    reducedMotion,
    translateY,
    opacity,
    lotus,
    finish,
  ]);

  const ribbonStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));
  const lotusStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${lotus.value}deg` }],
  }));

  if (!rendered) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, ribbonStyle]}
      accessibilityLiveRegion="polite"
    >
      <LinearGradient
        colors={[colors.primary, colors.primarySoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ribbon}
      >
        <Animated.Image
          source={LOTUS_ICON}
          style={[styles.lotus, lotusStyle]}
          resizeMode="contain"
        />
        <View style={styles.copy}>
          <Text style={styles.title}>
            {t("ribbon.dayComplete", { count: streakDays })}
          </Text>
        </View>
        <Ionicons name="flame" size={16} color={RIBBON_INK} />
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 8,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  ribbon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  lotus: {
    width: 22,
    height: 22,
    tintColor: RIBBON_INK,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 16,
    color: RIBBON_INK,
  },
});

export default DayCompleteRibbon;
