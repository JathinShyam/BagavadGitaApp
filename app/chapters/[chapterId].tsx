import { View, FlatList, StyleSheet, Pressable, ImageBackground, Image, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Link, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

import { getChapterById } from "@/data/chapters/chapter-details";
import { CHAPTER_IMAGES } from "@/constants/chapter-images";
import type { Verse } from "@/types";

// Styles
import { useAppTheme } from "@/hooks/useAppTheme";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { ROUTES } from "@/constants/routes";
import { chapterScreenStyles } from "@/theme/screen-styles";
import { getRouteParam } from "@/lib/route-params";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ChapterDetailScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const { colors } = useAppTheme();
  const chapter = getChapterById(getRouteParam(chapterId));
  const { isVerseRead, getChapterProgress, isChapterComplete } = useReadingProgress();
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const listRef = useRef<FlatList<Verse> | null>(null);

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

  const renderVerse = ({ item }: { item: Verse }) => {
    if (!chapter) return null;
    const read = isVerseRead(chapter.id, item.verse_number);
    return (
      <View
        style={[
          chapterScreenStyles.verseCard,
          {
            backgroundColor: read ? colors.surfaceElevated : colors.surface,
            borderColor: read ? colors.primary + "45" : colors.outline,
          },
        ]}
      >
        <Link href={ROUTES.verseFromChapter(chapter.id, item.verse_number)} asChild>
          <Pressable
            style={({ pressed }) => [
              { flex: 1 },
              pressed && { transform: [{ scale: 0.985 }], opacity: 0.96 },
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
                  <View
                    style={[
                      chapterScreenStyles.readBadge,
                      {
                        borderColor: colors.primary + "45",
                        backgroundColor: colors.primary + "14",
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
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
              {/* <Text style={chapterScreenStyles.sanskritText}>{item.sanskrit}</Text> */}
              <Text style={[chapterScreenStyles.teluguSloka, { color: colors.text }]}>
                {item.teluguSloka}
              </Text>
              {/* <Text style={chapterScreenStyles.translation}>{item.translation}</Text> */}
              <View
                style={[
                  chapterScreenStyles.openVerseHintRow,
                  { borderTopColor: colors.outline + "66" },
                ]}
              >
                <Text
                  style={[
                    chapterScreenStyles.openVerseHintText,
                    { color: colors.textMuted },
                  ]}
                >
                  Open
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
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
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
            fontSize: 18,
            fontWeight: "600",
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
                    style={[chapterPageStyles.heroChapterNumber, { color: "#FFFFFFE0" }]}
                  >
                    {chapter.chapter_number}
                  </Text>
                  <Text
                    style={[chapterPageStyles.heroTitle, { color: "#FFFFFF" }]}
                  >
                    {chapter.yogam_name}
                  </Text>
                </View>
              </View>
            </View>
            <View
              style={[
                chapterScreenStyles.descriptionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                },
              ]}
            >
              <Text
                style={[chapterScreenStyles.descriptionText, { color: colors.text }]}
                numberOfLines={isContextExpanded ? undefined : 5}
              >
                {chapter.description}
              </Text>
              <View style={chapterPageStyles.contextActions}>
                <Pressable
                  onPress={() => setIsContextExpanded((v) => !v)}
                  style={[
                    chapterPageStyles.contextActionBtn,
                    { borderColor: colors.primary + "55", backgroundColor: colors.primary + "12" },
                  ]}
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
                    style={[
                      chapterPageStyles.contextActionBtn,
                      { borderColor: colors.outline, backgroundColor: colors.surfaceElevated },
                    ]}
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
                chapterPageStyles.progressCard,
                {
                  borderColor: chapterDone ? colors.primary + "44" : colors.outline,
                  backgroundColor: chapterDone ? colors.primary + "10" : colors.surfaceElevated,
                },
              ]}
            >
              <View style={chapterPageStyles.progressTopRow}>
                <Text style={[chapterPageStyles.progressLabel, { color: colors.textMuted }]}>
                  Chapter progress
                </Text>
                <View
                  style={[
                    chapterPageStyles.progressChip,
                    {
                      borderColor: chapterDone ? colors.primary + "55" : colors.outline,
                      backgroundColor: chapterDone ? colors.primary + "14" : colors.surface,
                    },
                  ]}
                >
                  {chapterDone && (
                    <Ionicons
                      name="checkmark-circle"
                      size={12}
                      color={colors.primary}
                    />
                  )}
                  <Text
                    style={[
                      chapterPageStyles.progressChipText,
                      { color: chapterDone ? colors.primary : colors.text },
                    ]}
                  >
                    {chapterDone ? "Completed" : `${chapterProgress}%`}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  chapterPageStyles.progressTrack,
                  { backgroundColor: colors.outline + "44" },
                ]}
              >
                <View
                  style={[
                    chapterPageStyles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.max(0, Math.min(100, chapterProgress))}%`,
                    },
                  ]}
                />
              </View>
            </View>
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
    height: 52,
  },
  heroContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  heroChapterNumber: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 1,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 19,
  },
  contextActions: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  contextActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  contextActionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressCard: {
    marginHorizontal: 0,
    marginTop: -4,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  progressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
});
