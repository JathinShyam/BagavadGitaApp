import { View, FlatList, Pressable, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { useAppTheme } from "@/hooks/useAppTheme";
import { CATEGORIES } from "@/data/explore-categories";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { savedScreenStyles } from "@/theme/screen-styles";
import { Radius, Spacing } from "@/theme/design-tokens";
import { ROUTES } from "@/constants/routes";
import { ALL_VERSES } from "@/lib/daily-verse";
import { getRouteParam } from "@/lib/route-params";

const CHAPTER_NAMES: Record<number, string> = {
  1: "అర్జున విషాద యోగము",
  2: "సాంఖ్య యోగము",
  3: "కర్మ యోగము",
  4: "జ్ఞాన, కర్మ, సన్న్యాస యోగము",
  5: "కర్మ సన్యాస యోగము",
  6: "ధ్యాన యోగము",
  7: "జ్ఞాన విజ్ఞాన యోగము",
  8: "అక్షర బ్రహ్మ యోగము",
  9: "రాజ విద్యా యోగము",
  10: "విభూతి యోగము",
  11: "విశ్వ రూప దర్శన యోగము",
  12: "భక్తి యోగము",
  13: "క్షేత్ర క్షేత్రజ్ఞ విభాగ యోగము",
  14: "గుణత్రయ విభాగ యోగము",
  15: "పురుషోత్తమ యోగము",
  16: "దైవాసుర సంపద్విభాగ యోగము",
  17: "శ్రద్ధా త్రయ విభాగ యోగము",
  18: "మోక్ష సన్యాస యోగము",
};

function formatVerseLabel(verseId: string): string {
  const parts = verseId.split("-");
  const chapter = Number(parts[0]);
  const verseNum = parts.slice(1).join("-");
  return `${CHAPTER_NAMES[chapter] ?? `Chapter ${chapter}`} • Verse ${verseNum}`;
}

export default function ExploreCategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { colors } = useAppTheme();
  const { isVerseRead } = useReadingProgress();

  const category = CATEGORIES.find((c) => c.id === getRouteParam(categoryId));
  const verseMap = ALL_VERSES.reduce<Record<string, (typeof ALL_VERSES)[number]>>(
    (acc, v) => {
      acc[v.id] = v;
      return acc;
    },
    {}
  );

  if (!category) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: "Category" }} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Text style={{ color: colors.text, fontSize: 16 }}>Category not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getChapterAndVerse = (verseId: string) => {
    const parts = verseId.split("-");
    return { chapter: parseInt(parts[0], 10), verseNumber: parts.slice(1).join("-") };
  };

  const renderVerse = ({ item: verseId }: { item: string }) => {
    const { chapter, verseNumber } = getChapterAndVerse(verseId);
    const read = isVerseRead(chapter, verseNumber);
    const verseData = verseMap[verseId];
    const verseText = verseData?.teluguSloka?.trim() ?? "";

    return (
      <View
        style={[
          styles.verseCard,
          { borderColor: colors.outline, backgroundColor: colors.surface },
        ]}
      >
        <Link href={ROUTES.verse(verseId)} asChild>
          <Pressable
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={[colors.surface, colors.surfaceElevated]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.verseGradient}
            >
              <View style={styles.rowTop}>
                <View style={styles.titleWrap}>
                  <Ionicons name="book-outline" size={16} color={colors.primary} />
                  <Text style={[styles.verseLabel, { color: colors.text }]} numberOfLines={2}>
                    {formatVerseLabel(verseId)}
                  </Text>
                </View>
                {read && (
                  <View
                    style={[
                      styles.readBadge,
                      { backgroundColor: colors.primary + "22", borderColor: colors.primary + "35" },
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
                    <Text style={[styles.readBadgeText, { color: colors.primary }]}>Read</Text>
                  </View>
                )}
              </View>

              {verseText ? (
                <Text style={[styles.exactVerseText, { color: colors.text }]}>{verseText}</Text>
              ) : null}
              <View style={styles.footerRow}>
                <Text style={[styles.openText, { color: colors.primary }]}>Open verse</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </View>
            </LinearGradient>
          </Pressable>
        </Link>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[savedScreenStyles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: category.name,
          headerBackTitle: "Back",
        }}
      />
      <FlatList
        data={category.verses}
        renderItem={renderVerse}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  verseCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  verseGradient: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  titleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verseLabel: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  readBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  readBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  footerRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  openText: {
    fontSize: 12,
    fontWeight: "700",
  },
  exactVerseText: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontStyle: "italic",
  },
});
