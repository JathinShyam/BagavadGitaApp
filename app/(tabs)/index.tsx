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

import { indexstyles } from "../styles";
import { useAppTheme } from "../hooks/useAppTheme";
import { useReadingProgress } from "../hooks/useReadingProgress";
import ShuffleModal from "../../components/ShuffleModal";
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

// Chapter data with added image paths
const chapters = [
  {
    id: 1,
    telugu_name: "అర్జున విషాద యోగము",
    verses: 47,
    image: require("../../assets/images/chapter1.png"),
  },
  {
    id: 2,
    telugu_name: "సాంఖ్య యోగము",
    verses: 72,
    image: require("../../assets/images/chapter2.png"),
  },
  {
    id: 3,
    telugu_name: "కర్మ యోగము",
    verses: 43,
    image: require("../../assets/images/chapter3.png"),
  },
  {
    id: 4,
    telugu_name: "జ్ఞాన, కర్మ, సన్న్యాస యోగము",
    verses: 42,
    image: require("../../assets/images/chapter4.png"),
  },
  {
    id: 5,
    telugu_name: "కర్మ సన్యాస యోగము",
    verses: 29,
    image: require("../../assets/images/chapter5.png"),
  },
  {
    id: 6,
    telugu_name: "ధ్యాన యోగము",
    verses: 47,
    image: require("../../assets/images/chapter6.png"),
  },
  {
    id: 7,
    telugu_name: "జ్ఞాన విజ్ఞాన యోగము",
    verses: 30,
    image: require("../../assets/images/chapter7.png"),
  },
  {
    id: 8,
    telugu_name: "అక్షర బ్రహ్మ యోగము",
    verses: 28,
    image: require("../../assets/images/chapter8.png"),
  },
  {
    id: 9,
    telugu_name: "రాజ విద్యా యోగము",
    verses: 34,
    image: require("../../assets/images/chapter9.png"),
  },
  {
    id: 10,
    telugu_name: "విభూతి యోగము",
    verses: 42,
    image: require("../../assets/images/chapter10.png"),
  },
  {
    id: 11,
    telugu_name: "విశ్వ రూప దర్శన యోగము",
    verses: 55,
    image: require("../../assets/images/chapter11.png"),
  },
  {
    id: 12,
    telugu_name: "భక్తి యోగము",
    verses: 20,
    image: require("../../assets/images/chapter12.png"),
  },
  {
    id: 13,
    telugu_name: "క్షేత్ర క్షేత్రజ్ఞ విభాగ యోగము",
    verses: 35,
    image: require("../../assets/images/chapter13.png"),
  },
  {
    id: 14,
    telugu_name: "గుణత్రయ విభాగ యోగము",
    verses: 27,
    image: require("../../assets/images/chapter14.png"),
  },
  {
    id: 15,
    telugu_name: "పురుషోత్తమ యోగము",
    verses: 20,
    image: require("../../assets/images/chapter15.png"),
  },
  {
    id: 16,
    telugu_name: "దైవాసుర సంపద్విభాగ యోగము",
    verses: 24,
    image: require("../../assets/images/chapter16.png"),
  },
  {
    id: 17,
    telugu_name: "శ్రద్ధా త్రయ విభాగ యోగము",
    verses: 28,
    image: require("../../assets/images/chapter17.png"),
  },
  {
    id: 18,
    telugu_name: "మోక్ష సన్యాస యోగము",
    verses: 78,
    image: require("../../assets/images/chapter18.png"),
  },
];

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
  const [showShuffleModal, setShowShuffleModal] = useState(false);
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

  const openShuffleModal = useCallback(() => {
    if (shuffleModalTimerRef.current) clearTimeout(shuffleModalTimerRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    shuffleModalTimerRef.current = setTimeout(() => {
      setShowShuffleModal(true);
      shuffleModalTimerRef.current = null;
    }, 200);
  }, []);

  const handleShuffleComplete = useCallback((chapterId: number, verseId: string) => {
    setShowShuffleModal(false);
    router.push(`/verse/${chapterId}-${verseId}`);
  }, [router]);

  const getPairs = (source: typeof chapters) => {
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
    if (activeFilter === "all") return chapters;
    return chapters.filter((c) => {
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
    <Link href={`/chapter/${chapter.id}`} asChild key={chapter.id}>
      <Pressable
        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        style={{ flex: 1 }}
      >
        <Animated.View
          entering={FadeInUp.delay((idx ?? 0) * 60).springify()}
          style={[
            indexstyles.chapterCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <View>
            <Image source={chapter.image} style={indexstyles.chapterImage} />
            <View
              style={[
                indexstyles.verseCountBadge,
                { backgroundColor: colors.background + "55" },
              ]}
            >
              <Text
                style={[indexstyles.verseCountBadgeText, { color: colors.text }]}
              >
                {chapter.verses}
              </Text>
            </View>
          </View>
          <View
            style={[
              indexstyles.cardContent,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[indexstyles.chapterNumber, { color: colors.textMuted }]}
            >
              {chapter.id}వ అధ్యాయము
            </Text>
            <Text
              style={[indexstyles.sanskritName, { color: colors.text }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {chapter.telugu_name}
            </Text>
            <View style={indexstyles.chapterProgressContainer}>
              <View style={indexstyles.chapterProgressLabelRow}>
                <Text
                  style={[
                    indexstyles.chapterProgressLabel,
                    { color: colors.textMuted },
                  ]}
                >
                  {isInProgress ? `${progress}% read` : isCompleted ? "" : "Not started"}
                </Text>
                {isCompleted && (
                  <View
                    style={[
                      indexstyles.chapterProgressBadge,
                      { backgroundColor: colors.primary + "22" },
                    ]}
                  >
                    <Text
                      style={[
                        indexstyles.chapterProgressBadgeText,
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
                    indexstyles.chapterProgressBarBackground,
                    { backgroundColor: colors.outline + "22" },
                  ]}
                >
                  <View
                    style={[
                      indexstyles.chapterProgressBarFill,
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
    <View style={indexstyles.shelfRow}>
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
      {item.length === 1 && <View style={indexstyles.emptySlot} />}
    </View>
  ), [renderChapterCard]);

  const ListHeader = useCallback(() => (
    <View style={indexstyles.header}>
      <View style={homeHeaderStyles.streakRow}>
        <Text style={[indexstyles.title, { color: colors.primary, textAlign: "left" }]}>
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
        <Text style={[indexstyles.subtitle, { color: colors.textMuted }]}>
          Total progress: {totalProgress}% read
        </Text>
      </View>

      <View style={homeHeaderStyles.quickActions}>
        {lastReadVerseId && (
          <Pressable
            onPress={() => router.push(`/verse/${lastReadVerseId}`)}
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
          onPress={openShuffleModal}
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
  ), [colors, totalProgress, streak, lastReadVerseId, activeFilter, router, openShuffleModal]);

  return (
    <SafeAreaView
      style={[indexstyles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={chapterPairs}
        renderItem={renderPair}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={indexstyles.scrollContainer}
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
      <ShuffleModal
        visible={showShuffleModal}
        onComplete={handleShuffleComplete}
        onClose={() => setShowShuffleModal(false)}
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
