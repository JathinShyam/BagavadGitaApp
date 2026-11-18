import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { haptics } from "@/lib/haptics";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { Duration, Ease, Spring } from "@/theme/motion";
import { getStreakWeek } from "@/lib/streak";
import type { ReadingActivity } from "@/types";

/**
 * The streak rail (motion spec §2.1): flame + count on the left, the current
 * week as seven dots on the right. Tapping opens the reading calendar.
 *
 * The dots are the cheapest progress signal in the app: seven marks that fill
 * as the week goes, with a gold ring that reads as a small sun opening.
 */

const LOTUS_ICON = require("../../assets/images/lotus-simple.png");

const DOT = 6;
const DOT_GAP = 4;
const COUNT_HEIGHT = 20;

type FlameState = "idle" | "atRisk" | "broken";

type Props = {
  activity: ReadingActivity;
  streakDays: number;
  longestStreak: number;
  atRisk: boolean;
  /** Lotus freezes in hand. */
  freezeBalance: number;
  /** A freeze covered a missed day in the last 24h — the flame gets a cool halo. */
  protectedRecently: boolean;
  /** False while another screen is on top — the at-risk breath stops. */
  active?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
};

/** One gold ring that opens outward — the dot's arrival. */
function StreakDot({
  filled,
  today,
  pulse,
  reducedMotion,
}: {
  filled: boolean;
  today: boolean;
  /** Changes only when this dot has just been earned. */
  pulse: number;
  reducedMotion: boolean;
}) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (!pulse || reducedMotion) return;
    haptics.light();
    scale.value = 0.4;
    scale.value = withSpring(1, Spring.snappy);
    ringScale.value = 0.8;
    ringOpacity.value = 0.5;
    ringScale.value = withTiming(2.4, {
      duration: 420,
      easing: Ease.decelerate,
    });
    ringOpacity.value = withTiming(0, {
      duration: 420,
      easing: Ease.decelerate,
    });
  }, [pulse, reducedMotion, scale, ringScale, ringOpacity]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={styles.dotCell}>
      <Animated.View
        pointerEvents="none"
        style={[styles.pulseRing, { borderColor: colors.brandText }, ringStyle]}
      />
      {today && (
        <View style={[styles.todayRing, { borderColor: colors.brandText + "66" }]} />
      )}
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: filled ? colors.brandText : colors.outline + "38",
          },
          dotStyle,
        ]}
      />
    </View>
  );
}

/**
 * The count rolls in from below while the old one leaves upward — two
 * absolutely positioned texts in a fixed-height box, so nothing reflows.
 * Falls back to a straight swap when Reduce Motion is on.
 */
function StreakCount({
  value,
  color,
  reducedMotion,
}: {
  value: number;
  color: string;
  reducedMotion: boolean;
}) {
  const [shown, setShown] = useState(value);
  const [incoming, setIncoming] = useState<number | null>(null);
  const outY = useSharedValue(0);
  const outOpacity = useSharedValue(1);
  const inY = useSharedValue(14);
  const inOpacity = useSharedValue(0);

  const settle = useCallback((next: number) => {
    setShown(next);
    setIncoming(null);
  }, []);

  useEffect(() => {
    if (value === shown) return;
    if (reducedMotion) {
      setShown(value);
      return;
    }

    setIncoming(value);
    outY.value = 0;
    outOpacity.value = 1;
    inY.value = 14;
    inOpacity.value = 0;

    outY.value = withTiming(-14, { duration: 160, easing: Ease.accelerate });
    outOpacity.value = withTiming(0, {
      duration: 160,
      easing: Ease.accelerate,
    });
    inY.value = withDelay(40, withTiming(0, { duration: 200, easing: Ease.standard }));
    inOpacity.value = withDelay(
      40,
      withTiming(1, { duration: 200, easing: Ease.standard }, (finished) => {
        if (finished) runOnJS(settle)(value);
      })
    );
  }, [value, shown, reducedMotion, outY, outOpacity, inY, inOpacity, settle]);

  const outStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: outY.value }],
    opacity: outOpacity.value,
  }));
  const inStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: inY.value }],
    opacity: inOpacity.value,
  }));

  return (
    <View style={styles.countBox}>
      <Animated.Text
        style={[styles.count, { color }, incoming !== null && outStyle]}
        numberOfLines={1}
      >
        {shown}
      </Animated.Text>
      {incoming !== null && (
        <Animated.Text
          style={[styles.count, styles.countLayered, { color }, inStyle]}
          numberOfLines={1}
        >
          {incoming}
        </Animated.Text>
      )}
    </View>
  );
}

/**
 * The flame answers in four ways: still (idle), a bounce when the streak
 * grows, a slow warm breath when tonight will break it, and a muted drop
 * when a streak has just ended.
 */
function StreakFlame({
  state,
  color,
  increment,
  active,
  protectedRecently,
  reducedMotion,
}: {
  state: FlameState;
  color: string;
  /** Bumps by one each time the count grows. */
  increment: number;
  active: boolean;
  protectedRecently: boolean;
  reducedMotion: boolean;
}) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);
  const offset = useSharedValue(0);
  const opacity = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const previousState = useRef<FlameState>(state);

  // A freeze was spent: the flame cools toward blue over 600ms and holds the
  // halo for the day it protected.
  const haloOpacity = useSharedValue(protectedRecently ? 0.4 : 0);
  useEffect(() => {
    haloOpacity.value = withTiming(protectedRecently ? 0.4 : 0, {
      duration: Duration.ritual,
      easing: Ease.decelerate,
    });
  }, [protectedRecently, haloOpacity]);

  // Streak ended while the screen was open: the flame drops and dims. Leaving
  // the broken state fades it back. Only `state` touches opacity, so the drop
  // cannot be overridden by another effect.
  useEffect(() => {
    const previous = previousState.current;
    previousState.current = state;
    if (previous === state) return;

    if (state === "broken") {
      opacity.value = withTiming(0.6, { duration: Duration.slow });
      if (reducedMotion) return;
      offset.value = withSequence(
        withTiming(4, { duration: 200, easing: Ease.decelerate }),
        withTiming(0, { duration: 200, easing: Ease.decelerate })
      );
      return;
    }

    opacity.value = withTiming(1, { duration: Duration.base });
  }, [state, reducedMotion, offset, opacity]);

  // At risk: a slow warm breath. Stops on blur, on Reduce Motion, and when
  // the day is saved. Runs before the increment effect below so that saving
  // the day wins the shared scale value.
  const breathingRef = useRef(false);
  const breathing = state === "atRisk" && active && !reducedMotion;

  useEffect(() => {
    if (breathing) {
      breathingRef.current = true;
      scale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      );
      return () => {
        cancelAnimation(scale);
      };
    }

    if (!breathingRef.current) return;
    breathingRef.current = false;
    cancelAnimation(scale);
    scale.value = withTiming(1, { duration: Duration.base });
  }, [breathing, scale]);

  // The streak grew: one bounce, one ring, one success tap.
  useEffect(() => {
    if (!increment) return;
    haptics.success();
    if (reducedMotion) return;

    cancelAnimation(scale);
    scale.value = 1;
    scale.value = withSequence(
      withSpring(1.18, Spring.bouncy),
      withSpring(1, Spring.bouncy)
    );
    ringScale.value = 0.8;
    ringOpacity.value = 0.5;
    ringScale.value = withTiming(2.6, {
      duration: 520,
      easing: Ease.decelerate,
    });
    ringOpacity.value = withTiming(0, { duration: 520, easing: Ease.decelerate });
  }, [increment, reducedMotion, scale, ringScale, ringOpacity]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: haloOpacity.value }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={styles.flameStage}>
      <Animated.View
        pointerEvents="none"
        style={[styles.halo, { backgroundColor: colors.streakFrozen }, haloStyle]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.flameRing, { borderColor: color }, ringStyle]}
      />
      <Animated.View style={flameStyle}>
        <Ionicons name="flame" size={16} color={color} />
      </Animated.View>
    </View>
  );
}

export function StreakRail({
  activity,
  streakDays,
  longestStreak,
  atRisk,
  freezeBalance,
  protectedRecently,
  active = true,
  onPress,
  onLongPress,
}: Props) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const week = useMemo(() => getStreakWeek(activity), [activity]);
  const weekRead = week.filter((day) => day.filled).length;

  // A dot animates when it is earned *and* Home is visible. Reading happens on
  // the verse screen, so the fill usually lands while Home is behind it — the
  // focus pass below catches that on the way back.
  const previousWeekRef = useRef<Record<string, boolean> | null>(null);
  const [pulse, setPulse] = useState<{ key: string; seq: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      const snapshot: Record<string, boolean> = {};
      for (const day of week) snapshot[day.key] = day.filled;

      const previous = previousWeekRef.current;
      previousWeekRef.current = snapshot;
      if (!previous) return;

      const earned = week.find((day) => day.filled && previous[day.key] === false);
      if (!earned) return;
      setPulse((current) => ({
        key: earned.key,
        seq: (current?.seq ?? 0) + 1,
      }));
    }, [week])
  );

  // The count rolls whenever the flame count changes.
  const [increment, setIncrement] = useState(0);
  const previousStreakRef = useRef(streakDays);
  useEffect(() => {
    const grew = streakDays > previousStreakRef.current;
    previousStreakRef.current = streakDays;
    if (grew) setIncrement((n) => n + 1);
  }, [streakDays]);

  // A flame with no streak behind it is grey, not orange: no borrowed heat.
  const tone =
    streakDays === 0
      ? colors.streakBroken
      : atRisk
        ? colors.streakAtRisk
        : colors.streakFlame;
  const state: FlameState =
    streakDays === 0 && longestStreak > 0
      ? "broken"
      : atRisk
        ? "atRisk"
        : "idle";

  return (
    <Pressable
      onPressIn={haptics.light}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      onLongPress={onLongPress}
      style={styles.rail}
      accessibilityRole="button"
      accessibilityLabel={t("home.streakA11y", {
        count: streakDays,
        days: weekRead,
        freezes: freezeBalance,
      })}
      accessibilityHint={t("home.streakHint")}
    >
      <View style={styles.countGroup}>
        <StreakFlame
          state={state}
          color={tone}
          increment={increment}
          active={active}
          protectedRecently={protectedRecently}
          reducedMotion={reducedMotion}
        />
        <StreakCount
          value={streakDays}
          color={tone}
          reducedMotion={reducedMotion}
        />
        {freezeBalance > 0 && (
          <View style={styles.freezeBadge}>
            <Animated.Image
              source={LOTUS_ICON}
              style={[styles.freezeLotus, { tintColor: colors.streakFrozen }]}
              resizeMode="contain"
            />
            <Animated.Text style={[styles.freezeCount, { color: colors.streakFrozen }]}>
              {freezeBalance}
            </Animated.Text>
          </View>
        )}
      </View>

      <View
        style={styles.dots}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {week.map((day) => (
          <StreakDot
            key={day.key}
            filled={day.filled}
            today={day.today}
            pulse={pulse?.key === day.key ? pulse.seq : 0}
            reducedMotion={reducedMotion}
          />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rail: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 28,
  },
  countGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flameStage: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  freezeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 2,
  },
  freezeLotus: {
    width: 14,
    height: 14,
  },
  freezeCount: {
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  flameRing: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  countBox: {
    height: COUNT_HEIGHT,
    justifyContent: "center",
  },
  count: {
    // Ritual figure, not body copy: Playfair carries the streak.
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 15,
    lineHeight: COUNT_HEIGHT,
    letterSpacing: 0,
    fontVariant: ["tabular-nums"],
  },
  countLayered: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  dotCell: {
    width: DOT,
    height: DOT,
    marginHorizontal: DOT_GAP / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  pulseRing: {
    position: "absolute",
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 1.5,
  },
  todayRing: {
    position: "absolute",
    width: 13,
    height: 13,
    left: -3.5,
    top: -3.5,
    borderRadius: 6.5,
    borderWidth: 1.5,
  },
});

export default StreakRail;
