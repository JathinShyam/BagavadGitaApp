import {
  View,
  FlatList,
  Pressable,
  Dimensions,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useContentLanguage } from "@/context/language-context";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { CATEGORIES } from "@/data/explore-categories";
import { getVerseById } from "@/data/verses/verse-catalog";
import { homeScreenStyles } from "@/theme/screen-styles";
import { ROUTES } from "@/constants/routes";
import { GoldCard } from "@/components/ui/GoldCard";
import { DiamondDivider } from "@/components/ui/DiamondDivider";
import { ScreenCornerArt, CORNER_ART } from "@/components/ui/ScreenCornerArt";
import { Radius } from "@/theme/design-tokens";
import {
  TOPIC_ICONS,
  TOPIC_BACKGROUNDS,
  TOPIC_BG_FALLBACK,
} from "@/constants/topic-icons";
import { getVerseMeaning, getVerseSloka } from "@/lib/verse-content";

const EMBLEM_MOOD = require("../../../assets/images/emblem-mood-featured.png");

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 12;
const TILE_HEIGHT = Math.floor(((SCREEN_WIDTH - 32 - GAP) / 2) * 0.55);
const TILE_RADIUS = Radius.sm;

export default function ExploreScreen() {
  const { colors, isDark } = useAppTheme();
  const { language } = useContentLanguage();
  const router = useRouter();
  const { isVerseRead } = useReadingProgress();
  const [selectedMoodId, setSelectedMoodId] = useState<string>("anger");

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
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
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
                  {item.name}
                </Text>
              </View>
            </View>
          </Pressable>
        </Link>
      </View>
    );
  };

  const ListHeader = (
    <View>
      <Text style={[styles.moodHeading, { color: colors.primary }]}>How do you feel?</Text>
      <Text style={[styles.moodSub, { color: colors.textMuted }]}>
        One verse for this moment
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moodRow}
      >
        {CATEGORIES.map((cat) => {
          const selected = selectedMoodId === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedMoodId(cat.id);
              }}
              style={[
                styles.moodChip,
                {
                  borderColor: selected ? colors.primary : colors.outline + "44",
                  backgroundColor: selected ? colors.primary + "22" : colors.surface,
                },
              ]}
            >
              <Text
                style={{
                  color: selected ? colors.primary : colors.text,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
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
              <Text style={[styles.featuredLabel, { color: colors.primary }]}>
                For {selectedMood.name}
              </Text>
              <Text style={[styles.featuredRef, { color: colors.text }]}>
                Chapter {featuredVerse.chapter} · Verse {featuredVerse.verse_number}
              </Text>
              {getVerseSloka(featuredVerse, language) ? (
                <Text
                  style={[styles.featuredSloka, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {getVerseSloka(featuredVerse, language).replace(/\n/g, " ").trim()}
                </Text>
              ) : null}
              <DiamondDivider style={styles.featuredDivider} />
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
              style={[styles.featuredBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="book-outline" size={16} color={colors.onPrimary} />
              <Text style={{ color: colors.onPrimary, fontWeight: "700", fontSize: 15 }}>
                Read
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(ROUTES.exploreCategory(selectedMood.id))}
              style={styles.featuredLink}
            >
              <Text style={[styles.featuredLinkText, { color: colors.primary }]}>
                See more
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </Pressable>
          </View>
        </GoldCard>
      )}

      <Text style={[styles.topicsHeading, { color: colors.text }]}>Topics</Text>
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
        <Text style={[styles.title, { color: colors.primary }]}>Explore</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Find wisdom for where you are
        </Text>
      </View>
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
  featuredSloka: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 15,
    lineHeight: 22,
  },
  featuredDivider: {
    marginVertical: 8,
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
