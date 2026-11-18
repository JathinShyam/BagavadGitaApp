import React, { useEffect, useMemo } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { haptics } from "@/lib/haptics";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useContentLanguage } from "@/context/language-context";
import { useTranslation } from "@/hooks/useTranslation";
import { INTL_LOCALES, WEEKDAY_INITIALS } from "@/lib/i18n";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { WeekHeatmap } from "@/components/practice/WeekHeatmap";
import { Duration, Ease } from "@/theme/motion";
import type { ReadingActivity } from "@/types";

/** Classic chariot wheel — 8 spokes. */
const WHEEL_SPOKES = [0, 45, 90, 135, 180, 225, 270, 315];

type Props = {
  visible: boolean;
  activity: ReadingActivity;
  streakDays: number;
  longestStreak: number;
  /** Days a lotus freeze covered, drawn cool instead of gold. */
  protectedDates?: Record<string, true>;
  onClose: () => void;
};

/** Clean chariot wheel — thick rim, thin spokes, tick in the hub. */
function ChariotWheelMark({
  primary,
  onPrimary,
  spin,
}: {
  primary: string;
  onPrimary: string;
  spin: SharedValue<number>;
}) {
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.wheelOuter, { borderColor: primary }, spinStyle]}>
      <View style={[styles.wheelMid, { borderColor: primary + "AA" }]} />
      {WHEEL_SPOKES.map((deg) => (
        <View
          key={deg}
          pointerEvents="none"
          style={[styles.spokeArm, { transform: [{ rotate: `${deg}deg` }] }]}
        >
          <View style={[styles.spokeLine, { backgroundColor: primary }]} />
        </View>
      ))}
      <View style={[styles.hubRing, { borderColor: primary, backgroundColor: primary + "18" }]}>
        <View style={[styles.hubCore, { backgroundColor: primary }]}>
          <Ionicons name="checkmark" size={10} color={onPrimary} />
        </View>
      </View>
    </Animated.View>
  );
}

export function PracticeCalendarModal({
  visible,
  activity,
  streakDays,
  longestStreak,
  protectedDates,
  onClose,
}: Props) {
  const { colors } = useAppTheme();
  const { language } = useContentLanguage();
  const { t } = useTranslation();
  const weekdays = WEEKDAY_INITIALS[language];
  const reducedMotion = useReducedMotion();
  // One shared angle for every wheel: a turned wheel is a day turning.
  const spin = useSharedValue(0);

  useEffect(() => {
    if (!visible || reducedMotion) {
      spin.value = 0;
      return;
    }

    spin.value = 0;
    spin.value = withTiming(360, {
      duration: Duration.turn,
      easing: Ease.decelerate,
    });
  }, [visible, reducedMotion, spin]);

  const monthCells = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const cells: ({ key: string; count: number; day: number } | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ key, day, count: activity[key] ?? 0 });
    }
    return cells;
  }, [activity]);

  const monthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleString(INTL_LOCALES[language], { month: "long", year: "numeric" });
  }, [language]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            {t("calendar.title")}
          </Text>
          <Text style={[styles.monthLabel, { color: colors.textMuted }]}>
            {monthLabel}
            {streakDays > 0 || longestStreak > 0
              ? ` · ${t("calendar.streakLine", {
                  current: streakDays,
                  best: longestStreak,
                })}`
              : ""}
          </Text>
          <WeekHeatmap activity={activity} cellSize={24} />
          <View style={styles.monthDowRow}>
            {weekdays.map((d, i) => (
              <Text key={`${d}-${i}`} style={[styles.monthDow, { color: colors.textMuted }]}>
                {d}
              </Text>
            ))}
          </View>
          <View style={styles.monthGrid}>
            {monthCells.map((cell, idx) =>
              cell ? (
                <View key={cell.key} style={styles.monthCell}>
                  {cell.count > 0 ? (
                    <ChariotWheelMark
                      primary={
                        protectedDates?.[cell.key] ? colors.streakFrozen : colors.primary
                      }
                      onPrimary={colors.onPrimary}
                      spin={spin}
                    />
                  ) : (
                    <Text style={[styles.dayEmpty, { color: colors.textMuted }]}>
                      {cell.day}
                    </Text>
                  )}
                </View>
              ) : (
                <View key={`empty-${idx}`} style={styles.monthCell} />
              )
            )}
          </View>
          <View style={styles.legendRow}>
            <ChariotWheelMark
              primary={colors.primary}
              onPrimary={colors.onPrimary}
              spin={spin}
            />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>
              {t("calendar.dayRead")}
            </Text>
          </View>
          <Pressable
            onPressIn={haptics.light}
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.brandText }]}
          >
            <Text style={{ color: colors.onPrimary, fontWeight: "700" }}>
              {t("calendar.close")}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  sheetTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    marginBottom: 4,
  },
  monthLabel: {
    fontSize: 13,
    marginBottom: 14,
  },
  monthDowRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  monthDow: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  monthCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dayEmpty: {
    fontSize: 12,
    fontWeight: "600",
  },
  wheelOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelMid: {
    ...StyleSheet.absoluteFillObject,
    margin: 5,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  spokeArm: {
    position: "absolute",
    width: 30,
    height: 30,
    alignItems: "center",
  },
  spokeLine: {
    width: 1.5,
    height: 9,
    marginTop: 4,
    borderRadius: 1,
  },
  hubRing: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  hubCore: {
    width: 11,
    height: 11,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  legendText: {
    fontSize: 12,
  },
  closeBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
});
