import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { PracticeCalendarModal } from "@/components/practice/PracticeCalendarModal";
import { useAppTheme } from "@/hooks/useAppTheme";
import { getLocalDateKey, addDaysToDateKey } from "@/lib/date-keys";
import type { ReadingActivity } from "@/types";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = {
  activity: ReadingActivity;
};

/** Optional week strip (not used on calm Home — prefer PracticeCalendarModal). */
export function ReadingHeatmap({ activity }: Props) {
  const { colors } = useAppTheme();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const week = useMemo(() => {
    const today = getLocalDateKey();
    return Array.from({ length: 7 }, (_, i) => {
      const key = addDaysToDateKey(today, i - 6);
      const [y, m, d] = key.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return {
        key,
        label: WEEKDAYS[date.getDay()],
        count: activity[key] ?? 0,
        isToday: key === today,
      };
    });
  }, [activity]);

  const intensity = (count: number) => {
    if (count <= 0) return colors.outline + "22";
    if (count === 1) return colors.primary + "55";
    if (count === 2) return colors.primary + "88";
    return colors.primary;
  };

  return (
    <>
      <Pressable
        onPress={() => setCalendarOpen(true)}
        style={[
          styles.strip,
          { backgroundColor: colors.surface, borderColor: colors.outline },
        ]}
      >
        <Text style={[styles.stripTitle, { color: colors.textMuted }]}>
          This week · tap for month
        </Text>
        <View style={styles.weekRow}>
          {week.map((day) => (
            <View key={day.key} style={styles.dayCol}>
              <Text style={[styles.dow, { color: colors.textMuted }]}>{day.label}</Text>
              <View
                style={[
                  styles.cell,
                  {
                    backgroundColor: intensity(day.count),
                    borderColor: day.isToday ? colors.primary : "transparent",
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </Pressable>

      <PracticeCalendarModal
        visible={calendarOpen}
        activity={activity}
        onClose={() => setCalendarOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  strip: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  stripTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCol: {
    alignItems: "center",
    gap: 6,
  },
  dow: {
    fontSize: 11,
    fontWeight: "600",
  },
  cell: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
  },
});
