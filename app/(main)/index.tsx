import {
  View,
  Image,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  Platform,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Text } from "react-native-paper";
import { Link, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { homeScreenStyles } from "@/theme/screen-styles";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import SurpriseVerseModal from "@/components/modals/SurpriseVerseModal";
import { PathPickerModal } from "@/components/practice/PathPickerModal";
import { PracticeCalendarModal } from "@/components/practice/PracticeCalendarModal";
import { WidgetNudgeModal } from "@/components/practice/WidgetNudgeModal";
import { ROUTES } from "@/constants/routes";
import { CHAPTER_SUMMARIES } from "@/constants/chapter-summaries";
import { DAILY_VERSE_GOAL } from "@/constants/milestones";
import {
  getDailyVerseNotificationContent,
  getVerseForDate,
} from "@/lib/daily-verse";
import {
  getActivePath,
  getNextIncompleteDay,
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

function getStreakLabel(days: number): string {
  return days <= 0 ? "0" : `${days}`;
}

export default function HomeScreen() {
  const { colors } = useAppTheme();
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

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  const onRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    refreshTimerRef.current = setTimeout(() => {
      setRefreshing(false);
      refreshTimerRef.current = null;
    }, 800);
  }, []);

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

  const todaysVerse = useMemo(() => getVerseForDate(new Date()), []);
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
      done: activePath.completedDayIds.length,
      total: path.days.length,
    };
  }, [activePath]);

  const refreshPracticeState = useCallback(async () => {
    const [path, showNudge] = await Promise.all([
      getActivePath(),
      shouldShowWidgetNudge(),
    ]);
    setActivePathState(path);
    setWidgetNudgeVisible(Platform.OS === "android" && showNudge);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshPracticeState();
    }, [refreshPracticeState])
  );

  const handleSelectPath = useCallback(
    async (path: ReadingPath) => {
      const active = await setActivePath(path.id);
      setActivePathState(active);
      setPathPickerOpen(false);
      router.push(ROUTES.path(path.id));
    },
    [router]
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

  const chapterPairRows = useMemo(() => {
    const rows: Array<typeof filteredChapters> = [];
    for (let i = 0; i < filteredChapters.length; i += 2) {
      rows.push(filteredChapters.slice(i, i + 2));
    }
    return rows;
  }, [filteredChapters]);

  const renderChapterCard = useCallback(
    (
      chapter: { id: number; telugu_name: string; verses: number; image: any },
      idx: number
    ) => {
      const progress = getChapterProgress(chapter.id);
      const isCompleted = progress === 100;
      const isInProgress = progress > 0 && progress < 100;

      return (
        <Link href={ROUTES.chapter(chapter.id)} asChild key={chapter.id}>
          <Pressable
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={{ flex: 1 }}
            accessibilityRole="button"
            accessibilityLabel={`Chapter ${chapter.id}, ${chapter.telugu_name}`}
          >
            <Animated.View
              entering={FadeInUp.delay(Math.min(idx, 12) * 40).springify()}
              style={[
                homeScreenStyles.richCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isInProgress ? colors.primary + "66" : colors.outline + "40",
                  borderWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View style={homeScreenStyles.richCardMedia}>
                <Image source={chapter.image} style={homeScreenStyles.richCardImage} />
                <LinearGradient
                  colors={["transparent", "rgba(18,14,10,0.55)", "rgba(12,10,8,0.92)"]}
                  locations={[0.35, 0.7, 1]}
                  style={homeScreenStyles.richCardFade}
                />
                <View style={homeScreenStyles.richCardOverlay}>
                  <Text
                    style={[homeScreenStyles.richCardEyebrow, { color: colors.primarySoft }]}
                  >
                    Chapter {chapter.id}
                  </Text>
                  <Text
                    style={homeScreenStyles.richCardTitle}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {chapter.telugu_name}
                  </Text>
                  <View style={homeScreenStyles.richCardStatusRow}>
                    {isCompleted ? (
                      <View style={homeScreenStyles.richCardStatusInline}>
                        <Ionicons name="checkmark-circle" size={13} color={colors.primarySoft} />
                        <Text style={[homeScreenStyles.richCardStatus, { color: colors.primarySoft }]}>
                          Complete
                        </Text>
                      </View>
                    ) : isInProgress ? (
                      <Text style={homeScreenStyles.richCardStatus}>{progress}% read</Text>
                    ) : (
                      <Text style={homeScreenStyles.richCardStatus}>Not started</Text>
                    )}
                  </View>
                  {(isInProgress || isCompleted) && (
                    <View style={homeScreenStyles.richCardTrackOnImage}>
                      <View
                        style={[
                          homeScreenStyles.richCardFill,
                          {
                            width: `${progress}%`,
                            backgroundColor: colors.primarySoft,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
                <View
                  style={[
                    homeScreenStyles.richCardCheck,
                    {
                      backgroundColor: "rgba(12,10,8,0.55)",
                      borderColor: "rgba(255,255,255,0.35)",
                    },
                  ]}
                >
                  <Text style={[homeScreenStyles.richCardVerseCount, { color: "#FFFFFF" }]}>
                    {chapter.verses}
                  </Text>
                </View>
              </View>
            </Animated.View>
          </Pressable>
        </Link>
      );
    },
    [colors, getChapterProgress]
  );

  const renderPair = useCallback(
    ({
      item,
      index,
    }: {
      item: Array<{ id: number; telugu_name: string; verses: number; image: any }>;
      index: number;
    }) => (
      <View style={homeScreenStyles.shelfRow}>
        {item.map((chapter, i) => renderChapterCard(chapter, index * 2 + i))}
        {item.length === 1 && <View style={homeScreenStyles.emptySlot} />}
      </View>
    ),
    [renderChapterCard]
  );

  const ListHeader = useCallback(
    () => (
      <View style={styles.header}>
        {/* Brand + streak */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.brandRow}>
          <Text style={[styles.brand, { color: colors.primary }]}>భగవద్గీత</Text>
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
            <Ionicons name="flame" size={14} color={colors.primary} />
            <Text style={[styles.streakText, { color: colors.primary }]}>
              {getStreakLabel(streak.currentStreak)}
              {streak.longestStreak > 0 ? ` · best ${streak.longestStreak}` : ""}
            </Text>
          </Pressable>
        </Animated.View>

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
                Read today’s verse
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Slim secondary actions — no cards */}
        <View style={styles.actionRow}>
          {lastReadVerseId ? (
            <Pressable
              onPress={() => router.push(ROUTES.verse(lastReadVerseId))}
              hitSlop={8}
              style={styles.actionLink}
            >
              <Ionicons name="play" size={14} color={colors.primary} />
              <Text style={[styles.actionLinkText, { color: colors.text }]}>
                Continue reading
              </Text>
            </Pressable>
          ) : (
            <View style={styles.actionLink} />
          )}
          <Pressable onPress={openSurpriseVerseModal} hitSlop={8} style={styles.actionLink}>
            <Text style={[styles.actionLinkText, { color: colors.textMuted }]}>Surprise</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
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
              {pathMeta.next ? ` · ${pathMeta.next.title}` : " · Complete"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        )}

        {/* Chapters section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Chapters</Text>
            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
              {totalProgress}%
            </Text>
          </View>
          <Pressable onPress={() => setPathPickerOpen(true)} hitSlop={8}>
            <Text style={[styles.pathsLink, { color: colors.primary }]}>Guided paths</Text>
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
                        backgroundColor: colors.primary + "1a",
                        borderColor: colors.primary + "40",
                      }
                    : { backgroundColor: "transparent", borderColor: colors.outline + "55" },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selected ? colors.primary : colors.textMuted },
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
      streak,
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
      handleShareStreak,
      dismissNudge,
    ]
  );

  return (
    <SafeAreaView
      style={[homeScreenStyles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <FlatList
        data={chapterPairRows}
        renderItem={renderPair}
        keyExtractor={(_, index) => `pair-${index}`}
        contentContainerStyle={homeScreenStyles.scrollContainer}
        ListHeaderComponent={ListHeader}
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
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 6,
  },
  brand: {
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
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  actionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionLinkText: {
    fontSize: 14,
    fontWeight: "600",
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
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
  },
  sectionMeta: {
    fontSize: 13,
    fontWeight: "600",
  },
  pathsLink: {
    fontSize: 13,
    fontWeight: "600",
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
    fontSize: 12,
    fontWeight: "600",
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
});
