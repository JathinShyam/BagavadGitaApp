import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { WEEKDAY_INITIALS } from "@/lib/i18n";
import { addDaysToDateKey, getLocalDateKey } from "@/lib/date-keys";
import { Duration } from "@/theme/motion";
import type { ReadingActivity } from "@/types";

type Props = {
  activity: ReadingActivity;
  /** Strip heading; pass null to render only the cells. */
  title?: string | null;
  cellSize?: number;
};

/** One day cell: fills toward gold as its verse count grows. */
function HeatCell({
  count,
  isToday,
  size,
}: {
  count: number;
  isToday: boolean;
  size: number;
}) {
  const { colors } = useAppTheme();
  const level = useSharedValue(count);

  useEffect(() => {
    level.value = withTiming(count, { duration: Duration.slow });
  }, [count, level]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      level.value,
      [0, 1, 2, 3],
      [
        colors.outline + "22",
        colors.primary + "55",
        colors.primary + "88",
        colors.primary,
      ]
    ),
    borderColor: isToday ? colors.primary : "transparent",
  }));

  return (
    <Animated.View
      style={[
        styles.cell,
        { width: size, height: size, borderRadius: Math.round(size / 3.5) },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Seven-day reading strip, rendered inside the practice calendar sheet.
 * Cells fill toward gold as the day's verse count grows.
 */
export function WeekHeatmap({ activity, title, cellSize = 28 }: Props) {
  const { colors } = useAppTheme();
  const { t, language } = useTranslation();
  const today = getLocalDateKey();
  const weekdays = WEEKDAY_INITIALS[language];
  const heading = title === undefined ? t("calendar.thisWeek") : title;

  const week = Array.from({ length: 7 }, (_, i) => {
    const key = addDaysToDateKey(today, i - 6);
    const [y, m, d] = key.split("-").map(Number);
    return {
      key,
      label: weekdays[new Date(y, m - 1, d).getDay()],
      count: activity[key] ?? 0,
      isToday: key === today,
    };
  });

  return (
    <View style={styles.wrap}>
      {heading ? (
        <Text style={[styles.title, { color: colors.textMuted }]}>{heading}</Text>
      ) : null}
      <View style={styles.row}>
        {week.map((day) => (
          <View key={day.key} style={styles.col}>
            <Text style={[styles.dow, { color: colors.textMuted }]}>{day.label}</Text>
            <HeatCell count={day.count} isToday={day.isToday} size={cellSize} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Kept for the old import name: the calendar now renders `WeekHeatmap`. */
export default WeekHeatmap;

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginBottom: 14,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  col: {
    alignItems: "center",
    gap: 6,
  },
  dow: {
    fontSize: 11,
    fontWeight: "600",
  },
  cell: {
    borderWidth: 1.5,
  },
});
