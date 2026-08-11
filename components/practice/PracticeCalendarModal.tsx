import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "@/hooks/useAppTheme";
import type { ReadingActivity } from "@/types";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
/** Classic chariot wheel — 8 spokes. */
const WHEEL_SPOKES = [0, 45, 90, 135, 180, 225, 270, 315];

type Props = {
  visible: boolean;
  activity: ReadingActivity;
  onClose: () => void;
};

/** Clean chariot wheel — thick rim, thin spokes, tick in the hub. */
function ChariotWheelMark({
  primary,
  onPrimary,
}: {
  primary: string;
  onPrimary: string;
}) {
  return (
    <View style={[styles.wheelOuter, { borderColor: primary }]}>
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
    </View>
  );
}

export function PracticeCalendarModal({ visible, activity, onClose }: Props) {
  const { colors } = useAppTheme();

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
    return now.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, []);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Reading calendar</Text>
          <Text style={[styles.monthLabel, { color: colors.textMuted }]}>{monthLabel}</Text>
          <View style={styles.monthDowRow}>
            {WEEKDAYS.map((d, i) => (
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
                    <ChariotWheelMark primary={colors.primary} onPrimary={colors.onPrimary} />
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
            <ChariotWheelMark primary={colors.primary} onPrimary={colors.onPrimary} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>
              Day you read
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: colors.onPrimary, fontWeight: "700" }}>Close</Text>
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
