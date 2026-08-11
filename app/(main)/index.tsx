import {
  View,
  Image,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  Platform,
  Alert,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Text } from "react-native-paper";
import { Link, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";

import { homeScreenStyles } from "@/theme/screen-styles";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import SurpriseVerseModal from "@/components/modals/SurpriseVerseModal";
import { PathPickerModal } from "@/components/practice/PathPickerModal";
import { PracticeCalendarModal } from "@/components/practice/PracticeCalendarModal";
import { WidgetNudgeModal } from "@/components/practice/WidgetNudgeModal";
import { ROUTES } from "@/constants/routes";
import { CHAPTER_SUMMARIES, getChapterName, type ChapterSummary } from "@/constants/chapter-summaries";
import { DAILY_VERSE_GOAL } from "@/constants/milestones";
import {
  getDailyVerseNotificationContent,
  getVerseForDate,
} from "@/lib/daily-verse";
import { getAppTitle } from "@/constants/languages";
import { useContentLanguage } from "@/context/language-context";
import {
  getActivePath,
  getNextIncompleteDay,
  getPathDayTitle,
  getReadingPathById,
  setActivePath,
  type ActiveReadingPath,
} from "@/lib/reading-paths";
import { getLocalDateKey } from "@/lib/date-keys";
import { dismissWidgetNudge, shouldShowWidgetNudge } from "@/lib/widget-nudge";
import {
  captureShareCardRef,
  shareImage,
  StreakShareCardView,
} from "@/services/verse-share";
import type { ReadingPath } from "@/data/reading-paths";

const LOTUS_ICON = require("../../assets/images/lotus-simple.png");

function getStreakLabel(days: number): string {
  return days <= 0 ? "0" : `${days}`;
}

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const { language } = useContentLanguage();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showSurpriseVerseModal, setShowSurpriseVerseModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "continue" | "completed">("all");
  const [activePath, setActivePathState] = useState<ActiveReadingPath | null>(null);
  const [pathPickerOpen, setPathPickerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [widgetNudgeVisible, setWidgetNudgeVisible] = useState(false);
  const [widgetHelpOpen, setWidgetHelpOpen] = useState(false);
  const [sharingStreak, setSharingStreak] = useState(false);
  const streakShareRef = useRef<View>(null);

  const refreshPracticeState = useCallback(async () => {
    const [path, showNudge] = await Promise.all([
      getActivePath(),
      shouldShowWidgetNudge(),
    ]);
    setActivePathState(path);
    setWidgetNudgeVisible(Platform.OS === "android" && showNudge);
  }, []);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  const onRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    refreshPracticeState().catch(() => {});
    refreshTimerRef.current = setTimeout(() => {
      setRefreshing(false);
      refreshTimerRef.current = null;
    }, 800);
  }, [refreshPracticeState]);

  const shuffleModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (shuffleModalTimerRef.current) clearTimeout(shuffleModalTimerRef.current);
  }, []);

  const openSurpriseVerseModal = useCallback(() => {
    if (shuffleModalTimerRef.current) clearTimeout(shuffleModalTimerRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    shuffleModalTimerRef.current = setTimeout(() => {
      setShowSurpriseVerseModal(true);
      shuffleModalTimerRef.current = null;
    }, 200);
  }, []);

  const handleShuffleComplete = useCallback(
    (chapterId: number, verseId: string) => {
      setShowSurpriseVerseModal(false);
      router.push(ROUTES.verseFromChapter(chapterId, verseId));
    },
    [router]
  );

  const {
    getChapterProgress,
    getTotalProgress,
    streak,
    lastReadVerseId,
    activity,
    isDailyGoalComplete,
    isStreakAtRisk,
  } = useReadingProgress();

  const todaysVerse = useMemo(() => getVerseForDate(new Date(), language), [language]);
  const todayPreview = todaysVerse
    ? getDailyVerseNotificationContent(todaysVerse).body.slice(0, 110)
    : "";
  const goalDone = isDailyGoalComplete();
  const todayKey = getLocalDateKey();
  const versesToday = activity[todayKey] ?? 0;
  const streakAtRisk = isStreakAtRisk();
  const totalProgress = getTotalProgress();

  const pathMeta = useMemo(() => {
    if (!activePath) return null;
    const path = getReadingPathById(activePath.pathId);
    if (!path) return null;
    const next = getNextIncompleteDay(path, activePath);
    return {
      path,
      next,
      nextTitle: next ? getPathDayTitle(next, language) : null,
      done: activePath.completedDayIds.length,
      total: path.days.length,
    };
  }, [activePath, language]);

  useFocusEffect(
    useCallback(() => {
      refreshPracticeState();
    }, [refreshPracticeState])
  );

  const handleSelectPath = useCallback(
    async (path: ReadingPath) => {
      const startPath = async () => {
        const active = await setActivePath(path.id);
        setActivePathState(active);
        setPathPickerOpen(false);
        router.push(ROUTES.path(path.id));
      };

      // Switching away from a path with progress wipes it — confirm first.
      const hasProgress =
        activePath !== null &&
        activePath.pathId !== path.id &&
        activePath.completedDayIds.length > 0;
      if (hasProgress) {
        Alert.alert(
          "Switch reading path?",
          "Your progress on the current path will be lost.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Switch", style: "destructive", onPress: () => { startPath(); } },
          ]
        );
        return;
      }
      // Re-selecting the current path keeps its progress.
      if (activePath?.pathId === path.id) {
        setPathPickerOpen(false);
        router.push(ROUTES.path(path.id));
        return;
      }
      await startPath();
    },
    [router, activePath]
  );

  const handleShareStreak = useCallback(async () => {
    if (sharingStreak) return;
    setSharingStreak(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = await captureShareCardRef(streakShareRef);
      await shareImage(uri);
    } catch (e) {
      console.error("Streak share failed", e);
    } finally {
      setSharingStreak(false);
    }
  }, [sharingStreak]);

  const dismissNudge = useCallback(async () => {
    await dismissWidgetNudge();
    setWidgetNudgeVisible(false);
  }, []);

  const filteredChapters = useMemo(() => {
    if (activeFilter === "all") return CHAPTER_SUMMARIES;
    return CHAPTER_SUMMARIES.filter((c) => {
      const progress = getChapterProgress(c.id);
      if (activeFilter === "continue") return progress > 0 && progress < 100;
      return progress === 100;
    });
  }, [activeFilter, getChapterProgress]);

  const renderChapterTile = useCallback(
    ({ item: chapter, index }: { item: ChapterSummary; index: number }) => {
      const progress = getChapterProgress(chapter.id);
      const chapterName = getChapterName(chapter, language);

      return (
        <Link href={ROUTES.chapter(chapter.id)} asChild>
          <Pressable
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            accessibilityRole="button"
            accessibilityLabel={`Chapter ${chapter.id}, ${chapterName}`}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Animated.View
              entering={FadeInUp.delay(Math.min(index, 12) * 35).springify()}
              style={[
                styles.chapterTile,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary + "55",
                },
              ]}
            >
              <View style={styles.chapterTileRow}>
                <View
                  style={[
                    styles.lotusBadge,
                    {
                      borderColor: colors.primary + "88",
                      backgroundColor: colors.primary + "12",
                    },
                  ]}
                >
                  <Image
                    source={LOTUS_ICON}
                    style={[styles.lotusIcon, { tintColor: colors.primary }]}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.chapterTileBody}>
                  <Text
                    style={[styles.chapterTileTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {chapter.id}. {chapterName}
                  </Text>
                  <View style={styles.chapterTileProgressRow}>
                    <View
                      style={[
                        styles.chapterTileTrack,
                        { backgroundColor: colors.outline + "28" },
                      ]}
                    >
                      <View
                        style={[
                          styles.chapterTileFill,
                          {
                            width: `${Math.max(0, Math.min(100, progress))}%`,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chapterTilePct, { color: colors.textMuted }]}>
                      {progress}%
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </View>
            </Animated.View>
          </Pressable>
        </Link>
      );
    },
    [colors, getChapterProgress, language]
  );

  const ListHeader = useCallback(
    () => (
      <View style={styles.header}>
        {streakAtRisk && (
          <Text style={[styles.atRisk, { color: colors.textMuted }]}>
            Streak ends at midnight — one verse keeps it alive
          </Text>
        )}

        {/* Today hero — one primary job */}
        {todaysVerse && (
          <Animated.View
            entering={FadeInUp.delay(80).duration(500)}
            style={[styles.hero, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.heroEyebrow, { color: colors.primary }]}>Today</Text>
            <Text style={[styles.heroRef, { color: colors.text }]}>
              Chapter {todaysVerse.chapter} · Verse {todaysVerse.verse_number}
            </Text>
            <Text style={[styles.heroPreview, { color: colors.textMuted }]} numberOfLines={3}>
              {todayPreview}
            </Text>

            <View style={styles.heroStatus}>
              <Ionicons
                name={goalDone ? "checkmark-circle" : "ellipse-outline"}
                size={16}
                color={goalDone ? colors.success : colors.textMuted}
              />
              <Text style={[styles.heroStatusText, { color: colors.textMuted }]}>
                Practice · {Math.min(versesToday, DAILY_VERSE_GOAL)}/{DAILY_VERSE_GOAL}
                {goalDone ? " complete" : ""}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(ROUTES.verse(todaysVerse.id));
              }}
              style={[styles.heroCta, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.heroCtaText, { color: colors.onPrimary }]}>
                Read Today’s Verse
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Continue / Surprise — soft surface like Today card */}
        <View
          style={[
            styles.actionRow,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              if (lastReadVerseId) router.push(ROUTES.verse(lastReadVerseId));
            }}
            disabled={!lastReadVerseId}
            style={[styles.actionHalf, { opacity: lastReadVerseId ? 1 : 0.4 }]}
            accessibilityRole="button"
            accessibilityLabel="Continue reading"
          >
            <Ionicons name="book-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionLinkText, { color: colors.text }]}>
              Continue reading
            </Text>
          </Pressable>
          <View style={[styles.actionDivider, { backgroundColor: colors.outline + "55" }]} />
          <Pressable
            onPress={openSurpriseVerseModal}
            style={styles.actionHalf}
            accessibilityRole="button"
            accessibilityLabel="Surprise verse"
          >
            <Ionicons name="gift-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionLinkText, { color: colors.text }]}>Surprise</Text>
          </Pressable>
        </View>

        {/* Active path only */}
        {pathMeta && (
          <Pressable
            onPress={() => router.push(ROUTES.path(pathMeta.path.id))}
            style={styles.pathRow}
          >
            <Text style={[styles.pathText, { color: colors.textMuted }]} numberOfLines={1}>
              Path · Day {Math.min(pathMeta.done + (pathMeta.next ? 1 : 0), pathMeta.total)} of{" "}
              {pathMeta.total}
              {pathMeta.nextTitle ? ` · ${pathMeta.nextTitle}` : " · Complete"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        )}

        {/* Chapters section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Chapters</Text>
          <Pressable
            onPress={() => setPathPickerOpen(true)}
            hitSlop={8}
            style={styles.pathsLinkRow}
          >
            <Text style={[styles.sectionMeta, { color: colors.primary }]}>
              {totalProgress}%
            </Text>
            <Text style={[styles.pathsLink, { color: colors.primary }]}>
              Guided paths ›
            </Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {[
            { id: "all", label: "All" },
            { id: "continue", label: "Continue" },
            { id: "completed", label: "Completed" },
          ].map((f) => {
            const selected = activeFilter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setActiveFilter(f.id as typeof activeFilter)}
                style={[
                  styles.filterChip,
                  selected
                    ? {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      }
                    : {
                        backgroundColor: "transparent",
                        borderColor: colors.primary + "66",
                      },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selected ? colors.onPrimary : colors.primary },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {widgetNudgeVisible && (
          <View style={styles.widgetTip}>
            <Pressable style={{ flex: 1 }} onPress={() => setWidgetHelpOpen(true)}>
              <Text style={[styles.widgetTipText, { color: colors.textMuted }]}>
                Tip: add Daily Verse to your home screen
              </Text>
            </Pressable>
            <Pressable onPress={dismissNudge} hitSlop={10}>
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        )}
      </View>
    ),
    [
      colors,
      streakAtRisk,
      todaysVerse,
      todayPreview,
      goalDone,
      versesToday,
      lastReadVerseId,
      pathMeta,
      totalProgress,
      activeFilter,
      widgetNudgeVisible,
      router,
      openSurpriseVerseModal,
      dismissNudge,
    ]
  );

  return (
    <SafeAreaView
      style={[homeScreenStyles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.fixedBrandBar, { backgroundColor: colors.background }]}
      >
        <Text
          style={[styles.brand, { color: colors.primary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {getAppTitle(language)}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setCalendarOpen(true);
          }}
          onLongPress={handleShareStreak}
          style={[
            styles.streakChip,
            {
              backgroundColor: colors.primary + "14",
              borderColor: colors.primary + "28",
            },
          ]}
          accessibilityLabel="Open reading calendar. Long press to share streak."
        >
          <Text style={styles.streakFlame}>🔥</Text>
          <Text style={[styles.streakText, { color: colors.primary }]}>
            {getStreakLabel(streak.currentStreak)}
            {streak.longestStreak > 0 ? ` · Best ${streak.longestStreak}` : ""}
          </Text>
        </Pressable>
      </Animated.View>
      <FlatList
        data={filteredChapters}
        renderItem={renderChapterTile}
        keyExtractor={(item) => String(item.id)}
        extraData={language}
        contentContainerStyle={[homeScreenStyles.scrollContainer, { paddingTop: 16 }]}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyFilter}>
            <Ionicons name="book-outline" size={28} color={colors.textMuted} />
            <Text style={[styles.emptyFilterText, { color: colors.textMuted }]}>
              {activeFilter === "continue"
                ? "No chapters in progress yet — open any chapter to begin"
                : "No completed chapters yet — your journey starts with one verse"}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      <SurpriseVerseModal
        visible={showSurpriseVerseModal}
        onComplete={handleShuffleComplete}
        onClose={() => setShowSurpriseVerseModal(false)}
      />
      <PathPickerModal
        visible={pathPickerOpen}
        onClose={() => setPathPickerOpen(false)}
        onSelect={handleSelectPath}
      />
      <PracticeCalendarModal
        visible={calendarOpen}
        activity={activity}
        onClose={() => setCalendarOpen(false)}
      />
      <WidgetNudgeModal
        visible={widgetHelpOpen}
        onClose={() => setWidgetHelpOpen(false)}
      />
      <View ref={streakShareRef} collapsable={false}>
        <StreakShareCardView
          streakDays={streak.currentStreak}
          longestStreak={streak.longestStreak}
          insight={todayPreview}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    paddingBottom: 8,
  },
  fixedBrandBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 10,
  },
  brand: {
    flexShrink: 1,
    marginRight: 8,
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 32,
    letterSpacing: 0.5,
  },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  streakFlame: {
    fontSize: 13,
    lineHeight: 16,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "700",
  },
  atRisk: {
    fontSize: 12,
    marginBottom: 10,
    width: "100%",
  },
  hero: {
    width: "100%",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    marginTop: 10,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroRef: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    marginBottom: 8,
  },
  heroPreview: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 14,
  },
  heroStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  heroStatusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  heroCta: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  heroCtaText: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 18,
    overflow: "hidden",
  },
  actionHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginVertical: 10,
  },
  actionLinkText: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 14,
  },
  pathRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    paddingVertical: 4,
  },
  pathText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    marginRight: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
  },
  pathsLinkRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  sectionMeta: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 15,
    fontWeight: "700",
  },
  pathsLink: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 15,
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginBottom: 14,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  filterChipText: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 13,
  },
  widgetTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    marginBottom: 10,
    paddingVertical: 4,
  },
  widgetTipText: {
    fontSize: 12,
  },
  emptyFilter: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyFilterText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  chapterTile: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  chapterTileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lotusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  lotusIcon: {
    width: 22,
    height: 22,
  },
  chapterTileBody: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  chapterTileTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
  },
  chapterTileProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chapterTileTrack: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  chapterTileFill: {
    height: "100%",
    borderRadius: 999,
  },
  chapterTilePct: {
    fontSize: 11,
    fontWeight: "600",
    minWidth: 28,
    textAlign: "right",
  },
});
