import {
  View,
  Image,
  FlatList,
  StyleSheet,
  Pressable,
  Dimensions,
  RefreshControl,
} from "react-native";
import Animated, {
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import { Text } from "react-native-paper";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";

import { homeScreenStyles } from "@/theme/screen-styles";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import SurpriseVerseModal from "@/components/modals/SurpriseVerseModal";
import { ROUTES } from "@/constants/routes";
import { CHAPTER_SUMMARIES } from "@/constants/chapter-summaries";
/*
TODO:
  - Add read chapter button
  x Add chapter description
  x Add chapter image
  - Add chapter audio
  - Add chapter video
  - Add social sharing
  - Add social login and save activity
  - Add chapter progress
*/

function getStreakVisual(days: number): { emoji: string; label: string } {
  if (days <= 0) return { emoji: "🧊", label: "0 days" };
  if (days < 3) return { emoji: "🔥", label: `${days} days` };
  if (days < 7) return { emoji: "🔥🔥", label: `${days} days` };
  if (days < 14) return { emoji: "🔥🔥🔥", label: `${days} days` };
  if (days < 30) return { emoji: "🔥🔥🔥🔥", label: `${days} days` };
  return { emoji: "👑🔥", label: `${days} days` };
}

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showSurpriseVerseModal, setShowSurpriseVerseModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "continue" | "completed">("all");

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

  const handleShuffleComplete = useCallback((chapterId: number, verseId: string) => {
    setShowSurpriseVerseModal(false);
    router.push(ROUTES.verseFromChapter(chapterId, verseId));
  }, [router]);

  const getPairs = (source: typeof CHAPTER_SUMMARIES) => {
    const pairs = [] as any[];
    for (let i = 0; i < source.length; i += 2) {
      if (i + 1 < source.length) {
        pairs.push([source[i], source[i + 1]]);
      } else {
        pairs.push([source[i]]);
      }
    }
    return pairs;
  };

  const {
    getChapterProgress,
    getTotalProgress,
    streak,
    lastReadVerseId,
  } = useReadingProgress();

  const totalProgress = getTotalProgress();
  const filteredChapters = useMemo(() => {
    if (activeFilter === "all") return CHAPTER_SUMMARIES;
    return CHAPTER_SUMMARIES.filter((c) => {
      const progress = getChapterProgress(c.id);
      if (activeFilter === "continue") return progress > 0 && progress < 100;
      return progress === 100;
    });
  }, [activeFilter, getChapterProgress]);

  const chapterPairs = useMemo(() => getPairs(filteredChapters), [filteredChapters]);

  const renderChapterCard = useCallback((
    chapter: { id: number; telugu_name: string; verses: number; image: any },
    idx?: number
  ) => {
    const progress = getChapterProgress(chapter.id);
    const isCompleted = progress === 100;
    const isInProgress = progress > 0 && progress < 100;
    return (
    <Link href={ROUTES.chapter(chapter.id)} asChild key={chapter.id}>
      <Pressable
        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        style={{ flex: 1 }}
      >
        <Animated.View
          entering={FadeInUp.delay((idx ?? 0) * 60).springify()}
          style={[
            homeScreenStyles.chapterCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <View>
            <Image source={chapter.image} style={homeScreenStyles.chapterImage} />
            <View
              style={[
                homeScreenStyles.verseCountBadge,
                { backgroundColor: colors.background + "55" },
              ]}
            >
              <Text
                style={[homeScreenStyles.verseCountBadgeText, { color: colors.text }]}
              >
                {chapter.verses}
              </Text>
            </View>
          </View>
          <View
            style={[
              homeScreenStyles.cardContent,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[homeScreenStyles.chapterNumber, { color: colors.textMuted }]}
            >
              {chapter.id}వ అధ్యాయము
            </Text>
            <Text
              style={[homeScreenStyles.sanskritName, { color: colors.text }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {chapter.telugu_name}
            </Text>
            <View style={homeScreenStyles.chapterProgressContainer}>
              <View style={homeScreenStyles.chapterProgressLabelRow}>
                <Text
                  style={[
                    homeScreenStyles.chapterProgressLabel,
                    { color: colors.textMuted },
                  ]}
                >
                  {isInProgress ? `${progress}% read` : isCompleted ? "" : "Not started"}
                </Text>
                {isCompleted && (
                  <View
                    style={[
                      homeScreenStyles.chapterProgressBadge,
                      { backgroundColor: colors.primary + "22" },
                    ]}
                  >
                    <Text
                      style={[
                        homeScreenStyles.chapterProgressBadgeText,
                        { color: colors.primary },
                      ]}
                    >
                      Completed
                    </Text>
                  </View>
                )}
              </View>
              {(isInProgress || isCompleted) && (
                <View
                  style={[
                    homeScreenStyles.chapterProgressBarBackground,
                    { backgroundColor: colors.outline + "22" },
                  ]}
                >
                  <View
                    style={[
                      homeScreenStyles.chapterProgressBarFill,
                      {
                        width: `${progress}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Link>
    );
  }, [colors, getChapterProgress]);

  const renderPair = useCallback(({ item, index }: { item: any[]; index: number }) => (
    <View style={homeScreenStyles.shelfRow}>
      {item.map(
        (
          chapter: {
            id: number;
            telugu_name: string;
            verses: number;
            image: any;
          },
          i: number
        ) => renderChapterCard(chapter, index * 2 + i)
      )}
      {item.length === 1 && <View style={homeScreenStyles.emptySlot} />}
    </View>
  ), [renderChapterCard]);

  const ListHeader = useCallback(() => (
    <View style={homeScreenStyles.header}>
      <View style={homeHeaderStyles.streakRow}>
        <Text style={[homeScreenStyles.title, { color: colors.primary, textAlign: "left" }]}>
          భగవద్గీత
        </Text>
        <View
          style={[
            homeHeaderStyles.streakChip,
            { backgroundColor: colors.primary + "18", borderColor: colors.primary + "35" },
          ]}
        >
          <Text style={homeHeaderStyles.streakEmoji}>
            {getStreakVisual(streak.currentStreak).emoji}
          </Text>
          <Text style={[homeHeaderStyles.streakText, { color: colors.primary }]}>
            {getStreakVisual(streak.currentStreak).label}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 4, alignItems: "center" }}>
        <Text style={[homeScreenStyles.subtitle, { color: colors.textMuted }]}>
          Total progress: {totalProgress}% read
        </Text>
      </View>

      <View style={homeHeaderStyles.quickActions}>
        {lastReadVerseId && (
          <Pressable
            onPress={() => router.push(ROUTES.verse(lastReadVerseId))}
            style={[
              homeHeaderStyles.quickCard,
              { backgroundColor: colors.surface, borderColor: colors.outline },
            ]}
          >
            <Ionicons name="play-circle" size={18} color={colors.primary} />
            <Text style={[homeHeaderStyles.quickCardText, { color: colors.text }]}>
              Continue reading
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={openSurpriseVerseModal}
          style={[
            homeHeaderStyles.quickCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={[homeHeaderStyles.quickCardText, { color: colors.text }]}>
            Surprise
          </Text>
        </Pressable>
      </View>

      <View style={homeHeaderStyles.filterRow}>
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
                homeHeaderStyles.filterChip,
                selected
                  ? { backgroundColor: colors.primary + "1f", borderColor: colors.primary + "55" }
                  : { backgroundColor: colors.surface, borderColor: colors.outline },
              ]}
            >
              <Text
                style={[
                  homeHeaderStyles.filterChipText,
                  { color: selected ? colors.primary : colors.textMuted },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  ), [colors, totalProgress, streak, lastReadVerseId, activeFilter, router, openSurpriseVerseModal]);

  return (
    <SafeAreaView
      style={[homeScreenStyles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={chapterPairs}
        renderItem={renderPair}
        keyExtractor={(_, index) => index.toString()}
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

      {/* Shuffle Modal */}
      <SurpriseVerseModal
        visible={showSurpriseVerseModal}
        onComplete={handleShuffleComplete}
        onClose={() => setShowSurpriseVerseModal(false)}
      />
    </SafeAreaView>
  );
}

const homeHeaderStyles = StyleSheet.create({
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  streakEmoji: {
    fontSize: 13,
    lineHeight: 16,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "700",
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    width: "100%",
  },
  quickCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  quickCardText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    width: "100%",
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
