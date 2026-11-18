import {
  View,
  FlatList,
  Pressable,
  Dimensions,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { haptics } from "@/lib/haptics";
import { SelectableChip } from "@/components/ui/SelectableChip";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { getLanguageLabel, tracking } from "@/lib/i18n";
import { useContentLanguage } from "@/context/language-context";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { CATEGORIES, getCategoryName } from "@/data/explore-categories";
import { getVerseById } from "@/data/verses/verse-catalog";
import { homeScreenStyles } from "@/theme/screen-styles";
import { ROUTES } from "@/constants/routes";
import { GoldCard } from "@/components/ui/GoldCard";
import { ScreenCornerArt, CORNER_ART } from "@/components/ui/ScreenCornerArt";
import { Radius } from "@/theme/design-tokens";
import {
  TOPIC_ICONS,
  TOPIC_BACKGROUNDS,
  TOPIC_BG_FALLBACK,
} from "@/constants/topic-icons";
import { getVerseMeaning, getVerseSloka } from "@/lib/verse-content";
import {
  MIN_QUERY_LENGTH,
  getSearchTerms,
  highlightSegments,
  primeVerseSearchIndex,
  searchVerses,
  type VerseSearchHit,
} from "@/lib/verse-search";

const EMBLEM_MOOD = require("../../../assets/images/emblem-mood-featured.png");

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 12;
const TILE_HEIGHT = Math.floor(((SCREEN_WIDTH - 32 - GAP) / 2) * 0.55);
const TILE_RADIUS = Radius.sm;

export default function ExploreScreen() {
  const { colors, isDark } = useAppTheme();
  const { language } = useContentLanguage();
  const { t } = useTranslation();
  const router = useRouter();
  const { isVerseRead } = useReadingProgress();
  const [selectedMoodId, setSelectedMoodId] = useState<string>("anger");
  const [query, setQuery] = useState("");

  // Searching scans the whole corpus; deferring the query keeps typing smooth.
  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = deferredQuery.trim();
  const hasQuery = query.trim().length > 0;
  const isStale = query !== deferredQuery;

  const results = useMemo(
    () =>
      trimmedQuery.length >= MIN_QUERY_LENGTH
        ? searchVerses(trimmedQuery, language)
        : [],
    [trimmedQuery, language]
  );
  const highlightTerms = useMemo(
    () => getSearchTerms(deferredQuery),
    [deferredQuery]
  );

  // Building the index costs a moment; do it after the screen has settled so
  // the first keystroke never pays for it.
  useEffect(() => {
    const timer = setTimeout(primeVerseSearchIndex, 600);
    return () => clearTimeout(timer);
  }, []);

  const selectedMood = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedMoodId) ?? CATEGORIES[0] ?? null,
    [selectedMoodId]
  );

  const featuredVerse = useMemo(() => {
    if (!selectedMood) return null;
    for (const id of selectedMood.verses) {
      const v = getVerseById(id);
      if (!v) continue;
      if (!isVerseRead(v.chapter, v.verse_number)) return v;
    }
    return getVerseById(selectedMood.verses[0] ?? "") ?? null;
  }, [selectedMood, isVerseRead]);

  const categoryPairs = useMemo(() => {
    const pairs: (typeof CATEGORIES)[0][][] = [];
    for (let i = 0; i < CATEGORIES.length; i += 2) {
      pairs.push(CATEGORIES.slice(i, i + 2));
    }
    return pairs;
  }, []);

  const renderCategoryTile = (item: (typeof CATEGORIES)[0]) => {
    const topicImage = TOPIC_BACKGROUNDS[item.id] ?? TOPIC_BG_FALLBACK;
    const topicIcon = TOPIC_ICONS[item.id];
    return (
      <View key={item.id} style={styles.tileContainer}>
        <Link href={ROUTES.exploreCategory(item.id)} asChild>
          <Pressable
            onPressIn={haptics.light}
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          >
            <View style={[styles.tileFrame, { borderRadius: TILE_RADIUS }]}>
              <Image source={topicImage} style={styles.tileImage} resizeMode="cover" />
              <LinearGradient
                colors={[`${item.gradient[0]}66`, `${item.gradient[1]}99`]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.tileContent}>
                {topicIcon ? (
                  <Image
                    source={topicIcon}
                    style={styles.tileIconImg}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons name={item.icon as any} size={28} color="#FFFFFF" />
                )}
                <Text style={styles.tileName} numberOfLines={2}>
                  {getCategoryName(item, language)}
                </Text>
              </View>
            </View>
          </Pressable>
        </Link>
      </View>
    );
  };

  const renderSearchHit = (hit: VerseSearchHit) => {
    const topic = hit.topicId
      ? CATEGORIES.find((category) => category.id === hit.topicId)
      : null;
    const showLanguage = hit.snippetLanguage !== language;

    return (
      <Pressable
        key={hit.verse.id}
        onPressIn={haptics.light}
        onPress={() => {
          haptics.selection();
          router.push(ROUTES.verse(hit.verse.id));
        }}
        style={({ pressed }) => [
          styles.hit,
          {
            backgroundColor: colors.surface,
            borderColor: colors.outline + "33",
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("explore.openVerseA11y", {
          chapter: hit.verse.chapter,
          verse: hit.verse.verse_number,
        })}
      >
        <View style={styles.hitBody}>
          <View style={styles.hitMeta}>
            <Text style={[styles.hitRef, { color: colors.brandText }]}>
              {t("common.chapterVerseN", {
                chapter: hit.verse.chapter,
                verse: hit.verse.verse_number,
              })}
            </Text>
            {topic && (
              <Text
                style={[
                  styles.hitTag,
                  {
                    color: colors.brandText,
                    backgroundColor: colors.primary + "16",
                  },
                ]}
                numberOfLines={1}
              >
                {getCategoryName(topic, language)}
              </Text>
            )}
            {showLanguage && (
              <Text
                style={[
                  styles.hitTag,
                  styles.hitLangTag,
                  { color: colors.textMuted, borderColor: colors.outline + "44" },
                ]}
                numberOfLines={1}
              >
                {getLanguageLabel(hit.snippetLanguage, language)}
              </Text>
            )}
          </View>
          <Text style={[styles.hitSnippet, { color: colors.text }]} numberOfLines={3}>
            {highlightSegments(hit.snippet, highlightTerms).map((part, index) =>
              part.match ? (
                <Text
                  key={index}
                  style={{ color: colors.brandText, fontWeight: "700" }}
                >
                  {part.text}
                </Text>
              ) : (
                part.text
              )
            )}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    );
  };

  const searchEmpty = isStale ? null : query.trim().length < MIN_QUERY_LENGTH ? (
    <Text style={[styles.searchHint, { color: colors.textMuted }]}>
      {t("explore.searchHint")}
    </Text>
  ) : (
    <View style={styles.searchEmpty}>
      <Ionicons name="search-outline" size={30} color={colors.outline} />
      <Text style={[styles.searchEmptyTitle, { color: colors.text }]}>
        {t("explore.searchEmptyTitle", { query: query.trim() })}
      </Text>
      <Text style={[styles.searchEmptyBody, { color: colors.textMuted }]}>
        {t("explore.searchEmptyBody")}
      </Text>
      <Pressable
        onPressIn={haptics.light}
        onPress={() => {
          haptics.selection();
          setQuery("");
        }}
        style={[styles.searchBrowseBtn, { borderColor: colors.outline + "66" }]}
      >
        <Text style={{ color: colors.brandText, fontWeight: "700" }}>
          {t("explore.searchBrowse")}
        </Text>
      </Pressable>
    </View>
  );

  const ListHeader = (
    <View>
      <Text style={[styles.moodHeading, { color: colors.brandText }]}>
        {t("explore.moodHeading")}
      </Text>
      <Text style={[styles.moodSub, { color: colors.textMuted }]}>
        {t("explore.moodSub")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moodRow}
      >
        {CATEGORIES.map((cat) => (
          <SelectableChip
            key={cat.id}
            label={getCategoryName(cat, language)}
            selected={selectedMoodId === cat.id}
            onPressIn={haptics.light}
            onPress={() => {
              haptics.selection();
              setSelectedMoodId(cat.id);
            }}
            containerStyle={styles.moodChip}
            labelStyle={styles.moodChipText}
            palette={{
              idleBackground: colors.surface,
              activeBackground: colors.primary + "22",
              idleBorder: colors.outline + "44",
              activeBorder: colors.primary,
              idleText: colors.text,
              activeText: colors.brandText,
            }}
          />
        ))}
      </ScrollView>

      {selectedMood && featuredVerse && (
        <GoldCard style={styles.featuredCard}>
          <View style={styles.featuredTop}>
            <Image
              source={EMBLEM_MOOD}
              style={[styles.moodEmblem, { tintColor: colors.primary }]}
              resizeMode="contain"
            />
            <View style={styles.featuredBody}>
              <Text
                style={[
                  styles.featuredLabel,
                  { color: colors.brandText, letterSpacing: tracking(language, 0.2) },
                ]}
              >
                {t("explore.forMood", { mood: getCategoryName(selectedMood, language) })}
              </Text>
              <Text style={[styles.featuredRef, { color: colors.text }]}>
                {t("common.chapterVerseN", {
                  chapter: featuredVerse.chapter,
                  verse: featuredVerse.verse_number,
                })}
              </Text>
              {/* Meaning only: someone picking a feeling wants the words they can
                  use now; the sloka is one tap away on the verse screen. */}
              <Text
                style={[styles.featuredPreview, { color: colors.textMuted }]}
                numberOfLines={3}
              >
                {getVerseMeaning(featuredVerse, language) ||
                  getVerseSloka(featuredVerse, language)}
              </Text>
            </View>
          </View>
          <View style={styles.featuredActions}>
            <Pressable
              onPress={() => router.push(ROUTES.verse(featuredVerse.id))}
              style={[styles.featuredBtn, { backgroundColor: colors.brandText }]}
            >
              <Ionicons name="book-outline" size={16} color={colors.onPrimary} />
              <Text style={{ color: colors.onPrimary, fontWeight: "700", fontSize: 15 }}>
                {t("explore.read")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(ROUTES.exploreCategory(selectedMood.id))}
              style={styles.featuredLink}
            >
              <Text style={[styles.featuredLinkText, { color: colors.brandText }]}>
                {t("explore.allVerses", { count: selectedMood.verses.length })}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.brandText} />
            </Pressable>
          </View>
        </GoldCard>
      )}

      <Text style={[styles.topicsHeading, { color: colors.text }]}>
        {t("explore.browseAll")}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[homeScreenStyles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <ScreenCornerArt
          source={CORNER_ART.krishna}
          style={styles.headerArt}
          opacity={isDark ? 0.6 : 0.82}
          tint={false}
        />
        <Text style={[styles.title, { color: colors.brandText }]}>{t("explore.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {t("explore.subtitle")}
        </Text>

        <View
          style={[
            styles.searchField,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outline + "33",
            },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("explore.searchPlaceholder")}
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel={t("explore.searchA11y")}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => {
                haptics.selection();
                setQuery("");
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t("explore.searchClear")}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>
      {hasQuery ? (
        <FlatList
          data={results}
          renderItem={({ item }) => renderSearchHit(item)}
          keyExtractor={(hit) => hit.verse.id}
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
                {t("explore.searchResults", { count: results.length })}
              </Text>
            ) : null
          }
          ListEmptyComponent={searchEmpty}
          contentContainerStyle={[homeScreenStyles.scrollContainer, styles.searchList]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={categoryPairs}
          renderItem={({ item }) => (
            <View style={[homeScreenStyles.shelfRow, styles.shelfRow]}>
              {item.map((category) => renderCategoryTile(category))}
              {item.length === 1 && <View style={styles.emptySlot} />}
            </View>
          )}
          keyExtractor={(_, index) => index.toString()}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={[homeScreenStyles.scrollContainer, { paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    overflow: "hidden",
    minHeight: 108,
  },
  headerArt: {
    width: 148,
    height: 168,
    top: -2,
    right: -2,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 40,
    lineHeight: 48,
    zIndex: 1,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 2,
    zIndex: 1,
  },
  shelfRow: {
    gap: GAP,
  },
  tileContainer: {
    flex: 1,
  },
  emptySlot: {
    flex: 1,
  },
  tileFrame: {
    height: TILE_HEIGHT,
    overflow: "hidden",
  },
  tileImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  tileContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 10,
    zIndex: 1,
  },
  tileIconImg: {
    width: 40,
    height: 40,
  },
  tileName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 18,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.22)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 46,
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  searchList: {
    paddingTop: 6,
    paddingBottom: 24,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
    marginLeft: 2,
  },
  hit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  hitBody: {
    flex: 1,
    minWidth: 0,
  },
  hitMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  hitRef: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 14,
    fontWeight: "700",
  },
  hitTag: {
    fontSize: 10,
    fontWeight: "700",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: "hidden",
  },
  hitLangTag: {
    borderWidth: StyleSheet.hairlineWidth,
    fontWeight: "600",
  },
  hitSnippet: {
    fontSize: 14,
    lineHeight: 21,
  },
  searchHint: {
    fontSize: 14,
    marginTop: 8,
    marginLeft: 2,
  },
  searchEmpty: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 36,
    gap: 8,
  },
  searchEmptyTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    textAlign: "center",
    marginTop: 4,
  },
  searchEmptyBody: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  searchBrowseBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  moodHeading: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    marginBottom: 4,
  },
  moodSub: {
    fontSize: 13,
    marginBottom: 12,
  },
  moodRow: {
    gap: 8,
    paddingBottom: 4,
  },
  moodChipText: {
    fontWeight: "600",
    fontSize: 13,
  },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  featuredCard: {
    marginTop: 18,
    marginBottom: 4,
  },
  featuredTop: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  moodEmblem: {
    width: 84,
    height: 108,
    flexShrink: 0,
  },
  featuredBody: {
    flex: 1,
    minWidth: 0,
  },
  featuredLabel: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  featuredRef: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  featuredPreview: {
    fontSize: 14,
    lineHeight: 21,
  },
  featuredActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  featuredBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  featuredLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  featuredLinkText: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 14,
    fontWeight: "700",
  },
  topicsHeading: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    marginTop: 28,
    marginBottom: 14,
  },
});
