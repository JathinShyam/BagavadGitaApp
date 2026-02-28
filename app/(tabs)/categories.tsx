import { View, FlatList, Pressable, Dimensions, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { useAppTheme } from "../hooks/useAppTheme";
import { CATEGORIES } from "@/data/categories";
import { indexstyles } from "../styles";
import { getVerseForDate, getDailyVerseNotificationContent } from "@/lib/dailyVerse";
import { Spacing, Radius } from "../theme";

// Match chapter tile arrangement: 2 per row, symmetrical with constant gap
// Same as index: 16 padding each side + 16 gap between tiles
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 16;
const TILE_HEIGHT = Math.floor(((SCREEN_WIDTH - 32 - GAP) / 2) * 0.56); // width > height
const TILE_BORDER_RADIUS = 14;

const PREVIEW_LENGTH = 80;

function truncatePreview(text: string, maxLen: number): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen - 3).trim() + "...";
}

export default function CategoriesScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const todaysVerse = getVerseForDate(new Date());

  const getPairs = () => {
    const pairs: (typeof CATEGORIES)[0][][] = [];
    for (let i = 0; i < CATEGORIES.length; i += 2) {
      pairs.push(CATEGORIES.slice(i, i + 2));
    }
    return pairs;
  };

  const categoryPairs = getPairs();

  const renderCategoryTile = (item: (typeof CATEGORIES)[0]) => (
    <View key={item.id} style={styles.tileContainer}>
      <Link href={`/category/${item.id}` as any} asChild>
        <Pressable
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          style={({ pressed }) => [
            styles.tileWrapper,
            {
              borderRadius: TILE_BORDER_RADIUS,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.tileGradient, { borderRadius: TILE_BORDER_RADIUS }]}
          >
            <Text style={styles.tileName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.iconRow}>
              <Ionicons name={item.icon as any} size={28} color="#fff" />
            </View>
          </LinearGradient>
        </Pressable>
      </Link>
    </View>
  );

  const renderRow = ({ item }: { item: (typeof CATEGORIES)[0][] }) => (
    <View style={[indexstyles.shelfRow, styles.shelfRow]}>
      {item.map((category) => renderCategoryTile(category))}
      {item.length === 1 && <View style={styles.emptySlot} />}
    </View>
  );

  const renderTodaysVerse = () => {
    if (!todaysVerse) return null;
    const { body, verseId } = getDailyVerseNotificationContent(todaysVerse);
    const preview = truncatePreview(body, PREVIEW_LENGTH);
    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/verse/${verseId}`);
        }}
        style={({ pressed }) => [
          styles.todaysVerseCard,
          {
            opacity: pressed ? 0.9 : 1,
            borderColor: colors.outline,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <LinearGradient
          colors={[colors.surface, colors.surfaceElevated]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.todaysVerseGradient, { borderRadius: Radius.md }]}
        >
          <View style={styles.todaysVerseHeader}>
            <Ionicons name="sunny" size={20} color={colors.primary} />
            <Text style={[styles.todaysVerseLabel, { color: colors.primary }]}>
              Today&apos;s Verse
            </Text>
          </View>
          <Text style={[styles.todaysVerseRef, { color: colors.text }]}>
            Bhagavad Gita {todaysVerse.chapter}.{todaysVerse.verse_number}
          </Text>
          <Text
            style={[styles.todaysVersePreview, { color: colors.textMuted }]}
            numberOfLines={2}
          >
            {preview}
          </Text>
          <View style={styles.todaysVerseFooter}>
            <Text style={[styles.todaysVerseLink, { color: colors.primary }]}>
              Read verse
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={[indexstyles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[indexstyles.title, { color: colors.text }]}>Explore</Text>
        <Text style={[indexstyles.subtitle, { color: colors.textMuted }]}>
          Find verses by topic or life situation
        </Text>
      </View>
      <FlatList
        data={categoryPairs}
        renderItem={renderRow}
        keyExtractor={(_, index) => index.toString()}
        ListHeaderComponent={renderTodaysVerse()}
        contentContainerStyle={[
          indexstyles.scrollContainer,
          { paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
  tileWrapper: {
    flex: 1,
    width: "100%" as const,
    height: TILE_HEIGHT,
    overflow: "hidden" as const,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tileGradient: {
    flex: 1,
    padding: 14,
    justifyContent: "space-between" as const,
  },
  tileName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#fff",
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  iconRow: {
    alignSelf: "flex-start" as const,
  },
  todaysVerseCard: {
    marginBottom: 20,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  todaysVerseGradient: {
    padding: Spacing.lg,
  },
  todaysVerseHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 8,
  },
  todaysVerseLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },
  todaysVerseRef: {
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 6,
  },
  todaysVersePreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  todaysVerseFooter: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  todaysVerseLink: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
