import { View, FlatList, StyleSheet, Pressable, ImageBackground, Image, Dimensions, Text as RNText } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Stack, useRouter, Link } from "expo-router";
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
import { GoldCard } from "@/components/ui/GoldCard";
import { OrnamentalDivider, ORNAMENTS } from "@/components/ui/OrnamentalDivider";
import { Radius, Spacing } from "@/theme/design-tokens";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PATH_MARKER_WIDTH = 52;
const PATH_MARKER_HEIGHT = 36;
const JOURNEY_CHARIOT = require("../../assets/images/journey-chariot.png");

export default function ChapterDetailScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const { colors } = useAppTheme();
  const router = useRouter();
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
  }, [chapter]);

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
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(ROUTES.verseFromChapter(chapter.id, item.verse_number));
        }}
        style={({ pressed }) => [
          chapterPageStyles.verseCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.primary + "70",
            opacity: pressed ? 0.82 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Open verse ${item.verse_number}`}
      >
        <View
          style={[
            chapterPageStyles.verseNumBadge,
            {
              backgroundColor: colors.primary + "18",
              borderColor: colors.primary + "55",
            },
          ]}
        >
          <RNText style={[chapterPageStyles.verseNumText, { color: colors.primary }]}>
            {item.verse_number}
          </RNText>
        </View>

        <View style={chapterPageStyles.verseBody}>
          <RNText style={[chapterPageStyles.verseTitle, { color: colors.primary }]}>
            Verse {item.verse_number}
          </RNText>
          <RNText
            style={[chapterPageStyles.verseSloka, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.teluguSloka}
          </RNText>
        </View>

        <View
          style={[
            chapterPageStyles.readBtn,
            read && chapterPageStyles.readBtnCompleted,
            {
              backgroundColor: "transparent",
              borderColor: colors.primary + "99",
            },
          ]}
        >
          {read && <Ionicons name="checkmark" size={15} color={colors.success} />}
          <RNText
            style={[chapterPageStyles.readBtnText, { color: colors.primary }]}
          >
            {read ? "Read" : "Open"}
          </RNText>
        </View>
      </Pressable>
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
              </View>
            </View>

            <GoldCard style={chapterPageStyles.descCard}>
              <OrnamentalDivider
                source={ORNAMENTS.chapterEmbroidery}
                height={44}
                style={chapterPageStyles.descOrnament}
              />
              <View style={chapterPageStyles.descTitleRow}>
                <View style={chapterPageStyles.descTitleSide}>
                  <View style={[chapterPageStyles.descTitleRule, { backgroundColor: colors.primary + "88" }]} />
                  <View style={[chapterPageStyles.descDiamond, { borderColor: colors.primary }]} />
                </View>
                <Text style={[chapterPageStyles.descTitle, { color: colors.text }]}>
                  {chapter.yogam_name}
                </Text>
                <View style={chapterPageStyles.descTitleSide}>
                  <View style={[chapterPageStyles.descDiamond, { borderColor: colors.primary }]} />
                  <View style={[chapterPageStyles.descTitleRule, { backgroundColor: colors.primary + "88" }]} />
                </View>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setIsContextExpanded((v) => !v);
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  isContextExpanded ? "Collapse chapter description" : "Expand chapter description"
                }
              >
                <Text
                  style={[chapterPageStyles.descText, { color: colors.text }]}
                  numberOfLines={isContextExpanded ? undefined : 4}
                >
                  {chapter.description}
                </Text>
                <View style={chapterPageStyles.contextActions}>
                  <Text style={[chapterPageStyles.contextActionText, { color: colors.primary }]}>
                    {isContextExpanded ? "Show less" : "Read full context"}
                  </Text>
                  <Ionicons
                    name={isContextExpanded ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={colors.primary}
                  />
                </View>
              </Pressable>
              {isContextExpanded && (
                <Pressable
                  onPress={jumpToVerses}
                  hitSlop={8}
                  style={[chapterPageStyles.contextActions, { marginTop: 8 }]}
                >
                  <Text style={[chapterPageStyles.contextActionText, { color: colors.textMuted }]}>
                    Jump to verses
                  </Text>
                  <Ionicons name="arrow-down" size={14} color={colors.textMuted} />
                </Pressable>
              )}
            </GoldCard>

            <GoldCard compact style={chapterPageStyles.progressCard}>
              <View style={chapterPageStyles.progressTopRow}>
                <View style={chapterPageStyles.progressMeta}>
                  <Ionicons name="book-outline" size={16} color={colors.primary} />
                  <Text
                    style={[
                      chapterPageStyles.progressValue,
                      { color: chapterDone ? colors.primary : colors.text },
                    ]}
                  >
                    {chapterDone
                      ? "Chapter complete"
                      : `${coveredVerses} of ${totalVerses} verses read`}
                  </Text>
                </View>
                {chapterDone && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                )}
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
            </GoldCard>

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
  descCard: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    alignItems: "stretch",
    borderWidth: 1,
  },
  descOrnament: {
    marginTop: 0,
    marginBottom: 8,
  },
  descTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  descTitleSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  descTitleRule: {
    flex: 1,
    height: 1,
  },
  descDiamond: {
    width: 7,
    height: 7,
    borderWidth: 1.5,
    transform: [{ rotate: "45deg" }],
  },
  descTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    textAlign: "center",
    maxWidth: "58%",
  },
  descText: {
    fontSize: 15,
    lineHeight: 24,
  },
  contextActions: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contextActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  progressCard: {
    marginBottom: Spacing.md,
  },
  progressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressValue: {
    fontSize: 14,
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
    marginTop: 12,
    marginBottom: 10,
  },
  verseCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    gap: 12,
  },
  verseNumBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  verseNumText: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 14,
  },
  verseBody: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  verseTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 15,
    marginBottom: 4,
  },
  verseSloka: {
    fontSize: 13,
    lineHeight: 19,
  },
  readBtn: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    alignSelf: "center",
  },
  readBtnCompleted: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
  },
  readBtnText: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 13,
  },
});
