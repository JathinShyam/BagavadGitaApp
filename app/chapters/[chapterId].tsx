import { View, FlatList, StyleSheet, Pressable, ImageBackground, Image, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Link, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { getChapterById } from "@/data/chapters/chapter-details";
import { CHAPTER_IMAGES } from "@/constants/chapter-images";
import type { Verse } from "@/types";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { ROUTES } from "@/constants/routes";
import { chapterScreenStyles } from "@/theme/screen-styles";
import { getRouteParam } from "@/lib/route-params";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PATH_MARKER_WIDTH = 52;
const PATH_MARKER_HEIGHT = 36;
const JOURNEY_CHARIOT = require("../../assets/images/journey-chariot.png");

export default function ChapterDetailScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const { colors } = useAppTheme();
  const chapter = getChapterById(getRouteParam(chapterId));
  const { isVerseRead, getChapterProgress, isChapterComplete, CHAPTER_VERSES } =
    useReadingProgress();
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const listRef = useRef<FlatList<Verse> | null>(null);
  const journeyProgress = useSharedValue(0);
  const pathWidth = useSharedValue(SCREEN_WIDTH - 32);
  const [pathLayoutWidth, setPathLayoutWidth] = useState(SCREEN_WIDTH - 32);

  const heroHeight = useMemo(() => {
    if (!chapter) return 240;
    const source = Image.resolveAssetSource(CHAPTER_IMAGES[chapter.id]);
    if (!source?.width || !source?.height) return 240;
    return Math.round(SCREEN_WIDTH * (source.height / source.width));
  }, [chapter?.id]);

  const jumpToVerses = useCallback(() => {
    listRef.current?.scrollToIndex({ index: 0, animated: true, viewPosition: 0 });
  }, []);

  const chapterProgress = useMemo(() => {
    if (!chapter) return 0;
    return getChapterProgress(chapter.id);
  }, [chapter, getChapterProgress]);

  const chapterDone = useMemo(() => {
    if (!chapter) return false;
    return isChapterComplete(chapter.id);
  }, [chapter, isChapterComplete]);

  const totalVerses = chapter
    ? CHAPTER_VERSES[chapter.id] ?? chapter.verses.length
    : 0;

  const coveredVerses = useMemo(() => {
    if (!chapter || totalVerses <= 0) return 0;
    if (chapterDone) return totalVerses;
    return Math.round((chapterProgress / 100) * totalVerses);
  }, [chapter, chapterDone, chapterProgress, totalVerses]);

  useEffect(() => {
    pathWidth.value = pathLayoutWidth;
  }, [pathLayoutWidth, pathWidth]);

  useEffect(() => {
    const next = Math.max(0, Math.min(100, chapterProgress)) / 100;
    journeyProgress.value = withTiming(next, {
      duration: 550,
      easing: Easing.out(Easing.cubic),
    });
  }, [chapterProgress, journeyProgress]);

  const journeyFillStyle = useAnimatedStyle(() => ({
    width: Math.max(0, pathWidth.value * journeyProgress.value),
  }));

  /** Chariot sits at the leading tip of the fill (50% → middle of the bar). */
  const journeyMarkerStyle = useAnimatedStyle(() => {
    const tipX = pathWidth.value * journeyProgress.value;
    const maxX = Math.max(0, pathWidth.value - PATH_MARKER_WIDTH);
    // Center the silhouette on the tip so 50% lands in the middle
    const x = Math.min(maxX, Math.max(0, tipX - PATH_MARKER_WIDTH / 2));
    return {
      transform: [{ translateX: x }],
    };
  });

  /** First unread verse in this chapter only (not global last-read). */
  const nextUnreadVerse = useMemo(() => {
    if (!chapter || chapterDone) return null;
    return (
      chapter.verses.find((v) => !isVerseRead(chapter.id, v.verse_number)) ??
      chapter.verses[0] ??
      null
    );
  }, [chapter, chapterDone, isVerseRead]);

  const renderVerse = ({ item }: { item: Verse }) => {
    if (!chapter) return null;
    const read = isVerseRead(chapter.id, item.verse_number);
    return (
      <View
        style={[
          chapterScreenStyles.verseCard,
          { borderBottomColor: colors.outline + "33" },
        ]}
      >
        <Link href={ROUTES.verseFromChapter(chapter.id, item.verse_number)} asChild>
          <Pressable
            style={({ pressed }) => [
              { flex: 1 },
              pressed && { opacity: 0.7 },
            ]}
            onPressIn={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            accessibilityRole="button"
            accessibilityLabel={`Open verse ${item.verse_number}`}
          >
            <View style={chapterScreenStyles.verseContent}>
              <View style={chapterScreenStyles.verseHeaderRow}>
                <Text
                  style={[chapterScreenStyles.verseNumber, { color: colors.primary }]}
                >
                  Verse {item.verse_number}
                </Text>
                {read && (
                  <View style={chapterScreenStyles.readBadge}>
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        chapterScreenStyles.readBadgeText,
                        { color: colors.primary },
                      ]}
                    >
                      Read
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  chapterScreenStyles.teluguSloka,
                  { color: read ? colors.textMuted : colors.text },
                ]}
                numberOfLines={2}
              >
                {item.teluguSloka}
              </Text>
            </View>
          </Pressable>
        </Link>
      </View>
    );
  };

  if (!chapter) {
    return (
      <SafeAreaView style={chapterScreenStyles.container}>
        <Text>Chapter not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[chapterScreenStyles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          headerTitle: `Chapter ${chapter.id}`,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            color: colors.primary,
            fontSize: 18,
            fontFamily: "PlayfairDisplay_700Bold",
          },
          headerShadowVisible: false,
        }}
      />

      <FlatList
        ref={listRef}
        data={chapter.verses}
        renderItem={renderVerse}
        keyExtractor={(item) => item.verse_number.toString()}
        contentContainerStyle={chapterScreenStyles.listContainer}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={() => {
          listRef.current?.scrollToOffset({ offset: 0, animated: true });
        }}
        ListHeaderComponent={
          <View>
            <View style={chapterScreenStyles.header}>
              <View style={[chapterPageStyles.heroImage, { height: heroHeight }]}>
                <ImageBackground
                  source={CHAPTER_IMAGES[chapter.id]}
                  style={[chapterPageStyles.heroImage, { height: heroHeight }]}
                  imageStyle={chapterPageStyles.heroImageStyle}
                />
                <LinearGradient
                  colors={[colors.background, "transparent"]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={chapterPageStyles.heroTopFade}
                />
                <LinearGradient
                  colors={["transparent", colors.background]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={chapterPageStyles.heroBottomFade}
                />
                <View style={chapterPageStyles.heroContent}>
                  <Text
                    style={[chapterPageStyles.heroChapterNumber, { color: colors.primary }]}
                  >
                    {chapter.chapter_number}
                  </Text>
                  <Text
                    style={[chapterPageStyles.heroTitle, { color: colors.text }]}
                  >
                    {chapter.yogam_name}
                  </Text>
                </View>
              </View>
            </View>

            <View style={chapterScreenStyles.descriptionCard}>
              <Text
                style={[chapterScreenStyles.descriptionText, { color: colors.text }]}
                numberOfLines={isContextExpanded ? undefined : 5}
              >
                {chapter.description}
              </Text>
              <View style={chapterPageStyles.contextActions}>
                <Pressable
                  onPress={() => setIsContextExpanded((v) => !v)}
                  hitSlop={8}
                  style={chapterPageStyles.contextActionLink}
                >
                  <Text
                    style={[
                      chapterPageStyles.contextActionText,
                      { color: colors.primary },
                    ]}
                  >
                    {isContextExpanded ? "Show less" : "Read full context"}
                  </Text>
                  <Ionicons
                    name={isContextExpanded ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={colors.primary}
                  />
                </Pressable>
                {isContextExpanded && (
                  <Pressable
                    onPress={jumpToVerses}
                    hitSlop={8}
                    style={chapterPageStyles.contextActionLink}
                  >
                    <Text
                      style={[
                        chapterPageStyles.contextActionText,
                        { color: colors.textMuted },
                      ]}
                    >
                      Jump to verses
                    </Text>
                    <Ionicons name="arrow-down" size={14} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>
            </View>

            <View
              style={[
                chapterPageStyles.progressBlock,
                { borderBottomColor: colors.outline + "33" },
              ]}
            >
              <View style={chapterPageStyles.progressTopRow}>
                <Text style={[chapterPageStyles.progressLabel, { color: colors.textMuted }]}>
                  Journey
                </Text>
                <View style={chapterPageStyles.progressMeta}>
                  {chapterDone && (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.primary}
                    />
                  )}
                  <Text
                    style={[
                      chapterPageStyles.progressValue,
                      { color: chapterDone ? colors.primary : colors.text },
                    ]}
                  >
                    {chapterDone
                      ? "Chapter complete"
                      : `${coveredVerses} of ${totalVerses} verses`}
                  </Text>
                </View>
              </View>

              <View style={chapterPageStyles.journeyPath}>
                <View
                  style={chapterPageStyles.journeyMarkerLane}
                  onLayout={(e) => setPathLayoutWidth(e.nativeEvent.layout.width)}
                >
                  <Animated.View
                    style={[chapterPageStyles.journeyMarkerWrap, journeyMarkerStyle]}
                    accessibilityElementsHidden
                  >
                    <Image
                      source={JOURNEY_CHARIOT}
                      style={[
                        chapterPageStyles.chariotImage,
                        { tintColor: colors.primary },
                      ]}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </View>

                <View
                  style={[
                    chapterPageStyles.journeyTrack,
                    {
                      backgroundColor: colors.outline + "28",
                      borderColor: colors.outline + "40",
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      chapterPageStyles.journeyFill,
                      { backgroundColor: colors.primary },
                      journeyFillStyle,
                    ]}
                  />
                </View>
              </View>
            </View>

            {nextUnreadVerse && (
              <Link
                href={ROUTES.verseFromChapter(chapter.id, nextUnreadVerse.verse_number)}
                asChild
              >
                <Pressable
                  style={({ pressed }) => [
                    chapterScreenStyles.continueCta,
                    {
                      backgroundColor: colors.primary + "14",
                      borderColor: colors.primary + "44",
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  onPressIn={() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    chapterProgress === 0
                      ? `Begin this chapter at verse ${nextUnreadVerse.verse_number}`
                      : `Continue reading verse ${nextUnreadVerse.verse_number} in this chapter`
                  }
                >
                  <Ionicons name="book-outline" size={22} color={colors.primary} />
                  <View style={chapterScreenStyles.continueCtaBody}>
                    <Text
                      style={[
                        chapterScreenStyles.continueCtaLabel,
                        { color: colors.primary },
                      ]}
                    >
                      {chapterProgress === 0 ? "Begin this chapter" : "Continue reading"}
                    </Text>
                    <Text
                      style={[
                        chapterScreenStyles.continueCtaSubtitle,
                        { color: colors.textMuted },
                      ]}
                    >
                      Verse {nextUnreadVerse.verse_number}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                </Pressable>
              </Link>
            )}

            <Text style={[chapterPageStyles.versesHeading, { color: colors.text }]}>
              Verses
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const chapterPageStyles = StyleSheet.create({
  heroImage: {
    width: SCREEN_WIDTH,
    marginHorizontal: -16,
    height: 240,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  heroImageStyle: {
    borderRadius: 0,
    resizeMode: "contain",
  },
  heroTopFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 34,
  },
  heroBottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
  },
  heroContent: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  heroChapterNumber: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    lineHeight: 28,
  },
  contextActions: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  contextActionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contextActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  progressBlock: {
    marginTop: 4,
    marginBottom: 8,
    paddingBottom: 16,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  progressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  progressMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  journeyPath: {
    marginTop: 6,
  },
  journeyMarkerLane: {
    height: PATH_MARKER_HEIGHT,
    marginBottom: -2,
    position: "relative",
    zIndex: 2,
  },
  journeyTrack: {
    height: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    zIndex: 1,
  },
  journeyFill: {
    height: "100%",
    borderRadius: 999,
  },
  journeyMarkerWrap: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: PATH_MARKER_WIDTH,
    height: PATH_MARKER_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  chariotImage: {
    width: PATH_MARKER_WIDTH,
    height: PATH_MARKER_HEIGHT,
  },
  versesHeading: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    marginTop: 20,
    marginBottom: 4,
  },
});
