import { View, FlatList, Pressable, Dimensions, StyleSheet, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { CATEGORIES } from "@/data/explore-categories";
import { getVerseById } from "@/data/verses/verse-catalog";
import { homeScreenStyles } from "@/theme/screen-styles";
import { ROUTES } from "@/constants/routes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 12;
const TILE_HEIGHT = Math.floor(((SCREEN_WIDTH - 32 - GAP) / 2) * 0.5);
const TILE_RADIUS = 12;

export default function ExploreScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { isVerseRead } = useReadingProgress();
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);

  const selectedMood = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedMoodId) ?? null,
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

  const renderCategoryTile = (item: (typeof CATEGORIES)[0]) => (
    <View key={item.id} style={styles.tileContainer}>
      <Link href={ROUTES.exploreCategory(item.id)} asChild>
        <Pressable
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
        >
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.tileGradient, { borderRadius: TILE_RADIUS }]}
          >
            <View style={styles.tileWash} />
            <Text style={styles.tileName} numberOfLines={2}>
              {item.name}
            </Text>
            <Ionicons name={item.icon as any} size={22} color="rgba(255,255,255,0.85)" />
          </LinearGradient>
        </Pressable>
      </Link>
    </View>
  );

  const ListHeader = (
    <View>
      <Text style={[styles.moodHeading, { color: colors.text }]}>How do you feel?</Text>
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
                setSelectedMoodId(selected ? null : cat.id);
              }}
              style={[
                styles.moodChip,
                {
                  borderColor: selected ? colors.primary : colors.outline + "44",
                  backgroundColor: selected ? colors.primary + "18" : "transparent",
                },
              ]}
            >
              <Ionicons
                name={cat.icon as any}
                size={15}
                color={selected ? colors.primary : colors.textMuted}
              />
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
        <View style={styles.featuredBlock}>
          <Text style={[styles.featuredLabel, { color: colors.primary }]}>
            For {selectedMood.name}
          </Text>
          <Text style={[styles.featuredRef, { color: colors.text }]}>
            Chapter {featuredVerse.chapter} · Verse {featuredVerse.verse_number}
          </Text>
          <Text
            style={[styles.featuredPreview, { color: colors.textMuted }]}
            numberOfLines={3}
          >
            {featuredVerse.meaning || featuredVerse.teluguSloka}
          </Text>
          <View style={styles.featuredActions}>
            <Pressable
              onPress={() => router.push(ROUTES.verse(featuredVerse.id))}
              style={[styles.featuredBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: colors.onPrimary, fontWeight: "700" }}>Read</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(ROUTES.exploreCategory(selectedMood.id))}
              style={styles.featuredLink}
            >
              <Text style={{ color: colors.textMuted, fontWeight: "600" }}>See more</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
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
        <Text style={[styles.title, { color: colors.text }]}>Explore</Text>
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
        contentContainerStyle={[homeScreenStyles.scrollContainer, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
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
  tileGradient: {
    height: TILE_HEIGHT,
    padding: 12,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  tileWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  tileName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 18,
  },
  moodHeading: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  featuredBlock: {
    marginTop: 18,
    marginBottom: 4,
  },
  featuredLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  featuredRef: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    marginBottom: 6,
  },
  featuredPreview: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  featuredActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  featuredBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  featuredLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  topicsHeading: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    marginTop: 28,
    marginBottom: 14,
  },
});
