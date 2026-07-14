import { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useAppTheme } from "@/hooks/useAppTheme";
import { ROUTES } from "@/constants/routes";
import { getRouteParam } from "@/lib/route-params";
import {
  clearActivePath,
  getActivePath,
  getNextIncompleteDay,
  getReadingPathById,
  isPathComplete,
  setActivePath,
  type ActiveReadingPath,
} from "@/lib/reading-paths";
import { useToast } from "@/components/ui/Toast";

export default function PathDetailScreen() {
  const { pathId } = useLocalSearchParams<{ pathId: string }>();
  const id = getRouteParam(pathId);
  const path = getReadingPathById(id);
  const { colors } = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const [active, setActive] = useState<ActiveReadingPath | null>(null);

  const refresh = useCallback(async () => {
    const current = await getActivePath();
    if (current?.pathId === id) {
      setActive(current);
    } else {
      setActive(null);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const isThisActive = active?.pathId === id;
  const nextDay = useMemo(() => {
    if (!path) return null;
    if (!active || !isThisActive) return path.days[0] ?? null;
    return getNextIncompleteDay(path, active);
  }, [path, active, isThisActive]);

  if (!path) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: "Path" }} />
        <Text style={{ color: colors.text, padding: 24 }}>Path not found.</Text>
      </SafeAreaView>
    );
  }

  const startPath = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = await setActivePath(path.id);
    setActive(next);
    showToast("Path started", "success", "map");
  };

  const abandonPath = () => {
    Alert.alert("Leave this path?", "You can start again anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          await clearActivePath();
          setActive(null);
          router.back();
        },
      },
    ]);
  };

  const openDayVerse = (verseId: string) => {
    router.push(ROUTES.verse(verseId));
  };

  const completed = isThisActive && active ? isPathComplete(path, active) : false;
  const doneCount = isThisActive && active ? active.completedDayIds.length : 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: path.title,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            color: colors.text,
            fontFamily: "PlayfairDisplay_700Bold",
          },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.desc, { color: colors.textMuted }]}>{path.description}</Text>

        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {path.days.length} days
          {isThisActive ? ` · ${doneCount} complete` : ""}
        </Text>

        {completed && (
          <Text style={[styles.completeBanner, { color: colors.success }]}>
            Path complete — beautiful work.
          </Text>
        )}

        {!isThisActive && (
          <Pressable
            onPress={startPath}
            style={[styles.primaryCta, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryCtaText, { color: colors.onPrimary }]}>
              Start this path
            </Text>
          </Pressable>
        )}

        {isThisActive && nextDay && !completed && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openDayVerse(nextDay.verseIds[0]);
            }}
            style={[styles.primaryCta, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.nextEyebrow, { color: colors.onPrimary + "CC" }]}>
              Up next
            </Text>
            <Text style={[styles.primaryCtaText, { color: colors.onPrimary }]}>
              Day {nextDay.day}: {nextDay.title}
            </Text>
            <Text style={[styles.continueHint, { color: colors.onPrimary + "CC" }]}>
              Continue reading →
            </Text>
          </Pressable>
        )}

        <Text style={[styles.daysHeading, { color: colors.text }]}>Days</Text>

        {path.days.map((day, index) => {
          const done = isThisActive && !!active?.completedDayIds.includes(day.id);
          const isNext = isThisActive && nextDay?.id === day.id && !completed;
          const isLast = index === path.days.length - 1;

          return (
            <View key={day.id} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: done
                        ? colors.primary
                        : isNext
                          ? colors.primary
                          : colors.outline + "66",
                      borderColor: done || isNext ? colors.primary : colors.outline + "66",
                    },
                  ]}
                >
                  {done && (
                    <Ionicons name="checkmark" size={10} color={colors.onPrimary} />
                  )}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor: done
                          ? colors.primary + "55"
                          : colors.outline + "33",
                      },
                    ]}
                  />
                )}
              </View>

              <View
                style={[
                  styles.dayBody,
                  { borderBottomColor: colors.outline + "22" },
                  isLast && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.dayHeader}>
                  <Text
                    style={[
                      styles.dayNum,
                      { color: isNext || done ? colors.primary : colors.textMuted },
                    ]}
                  >
                    Day {day.day}
                  </Text>
                  {done && (
                    <Text style={[styles.doneLabel, { color: colors.success }]}>Done</Text>
                  )}
                  {isNext && (
                    <Text style={[styles.doneLabel, { color: colors.primary }]}>Now</Text>
                  )}
                </View>
                <Text style={[styles.dayTitle, { color: colors.text }]}>{day.title}</Text>
                {day.verseIds.map((vid) => (
                  <Pressable
                    key={vid}
                    onPress={() => openDayVerse(vid)}
                    style={styles.verseLink}
                    hitSlop={4}
                  >
                    <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                      Verse {vid}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}

        {isThisActive && (
          <Pressable onPress={abandonPath} style={styles.leaveBtn}>
            <Text style={{ color: colors.danger, fontWeight: "600" }}>Leave path</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  desc: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 20,
  },
  completeBanner: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 20,
  },
  primaryCta: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 28,
  },
  nextEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  continueHint: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  daysHeading: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 72,
  },
  timelineRail: {
    width: 24,
    alignItems: "center",
    marginRight: 12,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  timelineLine: {
    flex: 1,
    width: StyleSheet.hairlineWidth * 2,
    marginTop: 4,
    marginBottom: 0,
    minHeight: 12,
  },
  dayBody: {
    flex: 1,
    paddingBottom: 18,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayNum: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  doneLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 6,
  },
  verseLink: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  leaveBtn: {
    alignItems: "center",
    paddingVertical: 20,
    marginTop: 12,
  },
});
