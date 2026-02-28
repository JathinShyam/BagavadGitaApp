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
  ZoomIn,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { Text } from "react-native-paper";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useEffect, useRef } from "react";
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

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showShuffleModal, setShowShuffleModal] = useState(false);
  const fabScale = useSharedValue(1);
  const fabRotate = useSharedValue(0);
  const fabGlow = useSharedValue(0.3);

  // Subtle pulsing glow animation for FAB
  useEffect(() => {
    fabGlow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

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
    fabScale.value = withSequence(
      withTiming(0.85, { duration: 100 }),
      withTiming(1.1, { duration: 150 }),
      withTiming(1, { duration: 100 })
    );
    fabRotate.value = withSequence(
      withTiming(180, { duration: 300 }),
      withTiming(360, { duration: 300 })
    );
    shuffleModalTimerRef.current = setTimeout(() => {
      setShowShuffleModal(true);
      fabRotate.value = 0;
      shuffleModalTimerRef.current = null;
    }, 200);
  }, []);

  const handleShuffleComplete = useCallback((chapterId: number, verseId: string) => {
    setShowShuffleModal(false);
    router.push(`/verse/${chapterId}-${verseId}`);
  }, [router]);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { rotate: `${fabRotate.value}deg` },
    ],
    shadowOpacity: fabGlow.value,
  }));

  const getPairs = () => {
    const pairs = [] as any[];
    for (let i = 0; i < chapters.length; i += 2) {
      if (i + 1 < chapters.length) {
        pairs.push([chapters[i], chapters[i + 1]]);
      } else {
        pairs.push([chapters[i]]);
      }
    }
    return pairs;
  };

  const chapterPairs = getPairs();

  const {
    getChapterProgress,
    getTotalProgress,
    streak,
    lastReadVerseId,
  } = useReadingProgress();

  const totalProgress = getTotalProgress();

  const renderChapterCard = useCallback((
    chapter: { id: number; telugu_name: string; verses: number; image: any },
    idx?: number
  ) => (
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
                  {getChapterProgress(chapter.id)}% read
                </Text>
                {getChapterProgress(chapter.id) === 100 && (
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
                      width: `${getChapterProgress(chapter.id)}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Link>
  ), [colors, getChapterProgress]);

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
      <Text style={[indexstyles.title, { color: colors.primary }]}>
        భగవద్గీత
      </Text>
      <Text style={[indexstyles.subtitle, { color: colors.textMuted }]}>
        Bhagavad Gita
      </Text>
      <View style={{ marginTop: 8, alignItems: "center" }}>
        <Text style={[indexstyles.subtitle, { color: colors.textMuted }]}>
          Total progress: {totalProgress}% read
        </Text>
        <Text style={[indexstyles.subtitle, { color: colors.textMuted }]}>
          {streak.currentStreak > 0
            ? `🔥 ${streak.currentStreak}-day streak • Best: ${streak.longestStreak}`
            : "Start your daily reading streak today"}
        </Text>
      </View>
    </View>
  ), [colors, totalProgress, streak]);

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

      {/* FAB stack: right side, stacked vertically above tab bar */}
      <View style={fabStyles.fabStack}>
        {lastReadVerseId && (
          <Pressable
            onPress={() => router.push(`/verse/${lastReadVerseId}`)}
            style={[fabStyles.continueFab, { backgroundColor: colors.primary }]}
            accessibilityLabel="Continue reading"
            accessibilityRole="button"
          >
            <Ionicons name="book" size={18} color={colors.onPrimary} />
            <Text style={[fabStyles.fabLabel, { color: colors.onPrimary }]}>
              Continue
            </Text>
          </Pressable>
        )}
        <Animated.View style={fabAnimatedStyle}>
          <Pressable
            onPress={openShuffleModal}
            style={[fabStyles.fab, { backgroundColor: colors.primary }]}
            accessibilityLabel="Surprise me with a random verse"
            accessibilityRole="button"
          >
            <View style={fabStyles.fabContent}>
              <Ionicons name="sparkles" size={22} color={colors.onPrimary} />
              <Text style={[fabStyles.fabLabel, { color: colors.onPrimary }]}>
                Surprise
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Shuffle Modal */}
      <ShuffleModal
        visible={showShuffleModal}
        onComplete={handleShuffleComplete}
        onClose={() => setShowShuffleModal(false)}
      />
    </SafeAreaView>
  );
}

const fabStyles = StyleSheet.create({
  fabStack: {
    position: "absolute",
    right: 16,
    bottom: 6,
    alignItems: "flex-end",
    gap: 10,
  },
  fab: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  continueFab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  fabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fabLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
