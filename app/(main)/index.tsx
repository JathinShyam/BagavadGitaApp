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
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Text } from "react-native-paper";
import { Link, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";

import { haptics } from "@/lib/haptics";
import { homeScreenStyles } from "@/theme/screen-styles";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { tracking } from "@/lib/i18n";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import SurpriseVerseModal from "@/components/modals/SurpriseVerseModal";
import { SelectableChip } from "@/components/ui/SelectableChip";
import { PathPickerModal } from "@/components/practice/PathPickerModal";
import { PracticeCalendarModal } from "@/components/practice/PracticeCalendarModal";
import { StreakRail } from "@/components/home/StreakRail";
import { WidgetNudgeModal } from "@/components/practice/WidgetNudgeModal";
import { ROUTES } from "@/constants/routes";
import { Duration, Ease } from "@/theme/motion";
import { CHAPTER_SUMMARIES, getChapterName, type ChapterSummary } from "@/constants/chapter-summaries";
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
import { dismissWidgetNudge, shouldShowWidgetNudge } from "@/lib/widget-nudge";
import {
  captureShareCardRef,
  shareImage,
  StreakShareCardView,
} from "@/services/verse-share";
import type { ReadingPath } from "@/data/reading-paths";

const LOTUS_ICON = require("../../assets/images/lotus-simple.png");

/** Chapter progress rail — scaleX so no layout pass runs per frame. */
function ChapterProgressBar({
  progress,
  trackColor,
  fillColor,
  labelColor,
}: {
  progress: number;
  trackColor: string;
  fillColor: string;
  labelColor: string;
}) {
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming(Math.max(0, Math.min(100, progress)) / 100, {
      duration: Duration.slow,
      easing: Ease.standard,
    });
  }, [progress, fill]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fill.value }],
  }));

  return (
    <View style={styles.chapterTileProgressRow}>
      <View style={[styles.chapterTileTrack, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[styles.chapterTileFill, { backgroundColor: fillColor }, fillStyle]}
        />
      </View>
      <Text style={[styles.chapterTilePct, { color: labelColor }]}>{progress}%</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const { language } = useContentLanguage();
  const { t } = useTranslation();
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
    haptics.medium();
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

  // The rail stops its at-risk breath while another screen is on top.
  const [screenFocused, setScreenFocused] = useState(true);

  const todaysVerse = useMemo(() => getVerseForDate(new Date(), language), [language]);
  const todayPreview = todaysVerse
    ? getDailyVerseNotificationContent(todaysVerse).body
    : "";
  const goalDone = isDailyGoalComplete();
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
      setScreenFocused(true);
      refreshPracticeState();
      return () => setScreenFocused(false);
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
          t("home.switchPathTitle"),
          t("home.switchPathBody"),
          [
            { text: t("common.cancel"), style: "cancel" },
            { text: t("home.switchPathConfirm"), style: "destructive", onPress: () => { startPath(); } },
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
    [router, activePath, t]
  );

  const handleShareStreak = useCallback(async () => {
    if (sharingStreak) return;
    setSharingStreak(true);
    try {
      haptics.light();
      const uri = await captureShareCardRef(streakShareRef);
      await shareImage(uri, language);
    } catch (e) {
      console.error("Streak share failed", e);
    } finally {
      setSharingStreak(false);
    }
  }, [sharingStreak, language]);

  const dismissNudge = useCallback(async () => {
    await dismissWidgetNudge();
    setWidgetNudgeVisible(false);
  }, []);

  // Continue/Completed filters mean nothing before any reading — hide them.
  const hasAnyProgress = useMemo(
    () => CHAPTER_SUMMARIES.some((c) => getChapterProgress(c.id) > 0),
    [getChapterProgress]
  );

  const filteredChapters = useMemo(() => {
    if (activeFilter === "all" || !hasAnyProgress) return CHAPTER_SUMMARIES;
    return CHAPTER_SUMMARIES.filter((c) => {
      const progress = getChapterProgress(c.id);
      if (activeFilter === "continue") return progress > 0 && progress < 100;
      return progress === 100;
    });
  }, [activeFilter, getChapterProgress, hasAnyProgress]);


  const renderChapterTile = useCallback(
    ({ item: chapter, index }: { item: ChapterSummary; index: number }) => {
      const progress = getChapterProgress(chapter.id);
      const chapterName = getChapterName(chapter, language);

      return (
        <Link href={ROUTES.chapter(chapter.id)} asChild>
          <Pressable
            onPressIn={() => haptics.light()}
            accessibilityRole="button"
            accessibilityLabel={t("home.chapterA11y", { chapter: chapter.id, name: chapterName })}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <View
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
                  {/* An empty 0% bar on every chapter is day-one noise — show the
                      verse count until the reader starts the chapter. */}
                  {progress > 0 ? (
                    <ChapterProgressBar
                      progress={progress}
                      trackColor={colors.outline + "28"}
                      fillColor={colors.primary}
                      labelColor={colors.textMuted}
                    />
                  ) : (
                    <Text style={[styles.chapterTilePct, { color: colors.textMuted, textAlign: "left" }]}>
                      {t("common.versesN", { count: chapter.verses })}
                    </Text>
                  )}
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.brandText} />
              </View>
            </View>
          </Pressable>
        </Link>
      );
    },
    [colors, getChapterProgress, language, t]
  );

  const ListHeader = useCallback(
    () => (
      <View style={styles.header}>
        {streakAtRisk && (
          <Text style={[styles.atRisk, { color: colors.textMuted }]}>
            {t("home.atRisk")}
          </Text>
        )}

        {/* Today hero — one primary job */}
        {todaysVerse && (
          <Animated.View
            entering={FadeInUp.delay(80).duration(500)}
            style={[styles.hero, { backgroundColor: colors.surface }]}
          >
            <Text
              style={[
                styles.heroEyebrow,
                { color: colors.brandText, letterSpacing: tracking(language, 1.2) },
              ]}
            >
              {t("home.today")}
            </Text>
            <Text style={[styles.heroRef, { color: colors.text }]}>
              {t("common.chapterVerseN", {
                chapter: todaysVerse.chapter,
                verse: todaysVerse.verse_number,
              })}
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
                {goalDone ? t("home.readToday") : t("home.notReadToday")}
              </Text>
            </View>

            <Pressable
              onPressIn={haptics.light}
              onPress={() => {
                haptics.medium();
                router.push(ROUTES.verse(todaysVerse.id));
              }}
              style={[styles.heroCta, { backgroundColor: colors.brandText }]}
            >
              <Text style={[styles.heroCtaText, { color: colors.onPrimary }]}>
                {t("home.readTodaysVerse")}
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
          {/* Nothing to continue on day one — give Surprise the whole row. */}
          {lastReadVerseId ? (
            <>
              <Pressable
                onPress={() => router.push(ROUTES.verse(lastReadVerseId))}
                style={styles.actionHalf}
                accessibilityRole="button"
                accessibilityLabel={t("home.continueReading")}
              >
                <Ionicons name="book-outline" size={18} color={colors.brandText} />
                <Text style={[styles.actionLinkText, { color: colors.text }]}>
                  {t("home.continueReading")}
                </Text>
              </Pressable>
              <View style={[styles.actionDivider, { backgroundColor: colors.outline + "55" }]} />
            </>
          ) : null}
          <Pressable
            onPressIn={haptics.light}
            onPress={openSurpriseVerseModal}
            style={styles.actionHalf}
            accessibilityRole="button"
            accessibilityLabel={t("home.surpriseA11y")}
          >
            <Ionicons name="gift-outline" size={18} color={colors.brandText} />
            <Text style={[styles.actionLinkText, { color: colors.text }]}>
              {t("home.surprise")}
            </Text>
          </Pressable>
        </View>

        {/* Active path only */}
        {pathMeta && (
          <Pressable
            onPress={() => router.push(ROUTES.path(pathMeta.path.id))}
            style={styles.pathRow}
          >
            <Text style={[styles.pathText, { color: colors.textMuted }]} numberOfLines={1}>
              {t("home.pathProgress", {
                day: Math.min(pathMeta.done + (pathMeta.next ? 1 : 0), pathMeta.total),
                total: pathMeta.total,
              })}
              {pathMeta.nextTitle
                ? ` · ${pathMeta.nextTitle}`
                : ` · ${t("home.pathComplete")}`}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        )}

        {/* Chapters section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("home.chapters")}</Text>
          <Pressable
            onPress={() => setPathPickerOpen(true)}
            hitSlop={8}
            style={styles.pathsLinkRow}
          >
            <Text style={[styles.sectionMeta, { color: colors.brandText }]}>
              {totalProgress}%
            </Text>
            <Text style={[styles.pathsLink, { color: colors.brandText }]}>
              {t("home.guidedPaths")} ›
            </Text>
          </Pressable>
        </View>

        {hasAnyProgress && (
        <View style={styles.filterRow}>
          {[
            { id: "all", label: t("home.filterAll") },
            { id: "continue", label: t("home.filterContinue") },
            { id: "completed", label: t("home.filterCompleted") },
          ].map((f) => (
            <SelectableChip
              key={f.id}
              label={f.label}
              selected={activeFilter === f.id}
              onPressIn={haptics.light}
              onPress={() => {
                haptics.selection();
                setActiveFilter(f.id as typeof activeFilter);
              }}
              containerStyle={styles.filterChip}
              labelStyle={styles.filterChipText}
              palette={{
                idleBackground: colors.background,
                activeBackground: colors.brandText,
                idleBorder: colors.primary + "66",
                activeBorder: colors.primary,
                idleText: colors.brandText,
                activeText: colors.onPrimary,
              }}
            />
          ))}
        </View>
        )}

        {widgetNudgeVisible && (
          <View style={styles.widgetTip}>
            <Pressable style={{ flex: 1 }} onPress={() => setWidgetHelpOpen(true)}>
              <Text style={[styles.widgetTipText, { color: colors.textMuted }]}>
                {t("home.widgetTip")}
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
      language,
      goalDone,
      lastReadVerseId,
      pathMeta,
      totalProgress,
      activeFilter,
      hasAnyProgress,
      widgetNudgeVisible,
      router,
      openSurpriseVerseModal,
      dismissNudge,
      t,
    ]
  );

  return (
    <SafeAreaView
      style={[homeScreenStyles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <Animated.View
        entering={FadeIn.duration(400)}
        // Keyed on the palette: an `entering`-animated view kept its first-render
        // background after the saved theme loaded (BUG-011). Remount instead.
        key={`brand-${colors.background}`}
        style={[styles.fixedBrandBar, { backgroundColor: colors.background }]}
      >
        <Text
          style={[
            styles.brand,
            {
              color: colors.brandText,
              // Tracking is a Latin-only tool; it breaks Indic conjuncts.
              letterSpacing: language === "en" ? 0.5 : 0,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {getAppTitle(language)}
        </Text>
        <StreakRail
          activity={activity}
          streakDays={streak.currentStreak}
          longestStreak={streak.longestStreak}
          atRisk={streakAtRisk}
          active={screenFocused}
          onPress={() => setCalendarOpen(true)}
          onLongPress={handleShareStreak}
        />
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
                ? t("home.emptyInProgress")
                : t("home.emptyCompleted")}
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
        streakDays={streak.currentStreak}
        longestStreak={streak.longestStreak}
        activity={activity}
        onClose={() => setCalendarOpen(false)}
      />
      <WidgetNudgeModal
        visible={widgetHelpOpen}
        onClose={() => setWidgetHelpOpen(false)}
      />
      <StreakShareCardView
        ref={streakShareRef}
        streakDays={streak.currentStreak}
        longestStreak={streak.longestStreak}
        insight={todayPreview}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    paddingBottom: 8,
  },
  fixedBrandBar: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  brand: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 32,
    marginBottom: 2,
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
    width: "100%",
    height: "100%",
    borderRadius: 999,
    transformOrigin: "left",
  },
  chapterTilePct: {
    fontSize: 11,
    fontWeight: "600",
    minWidth: 28,
    textAlign: "right",
  },
});
