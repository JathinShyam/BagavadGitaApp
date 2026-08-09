import { View, FlatList, Pressable, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useAppTheme } from "@/hooks/useAppTheme";
import { CATEGORIES } from "@/data/explore-categories";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { savedScreenStyles } from "@/theme/screen-styles";
import { Spacing } from "@/theme/design-tokens";
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
  return `${CHAPTER_NAMES[chapter] ?? `Chapter ${chapter}`} · Verse ${verseNum}`;
}

// Built once at module load — ALL_VERSES is static data.
const VERSE_MAP: Record<string, (typeof ALL_VERSES)[number]> = {};
for (const v of ALL_VERSES) VERSE_MAP[v.id] = v;

export default function ExploreCategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { colors } = useAppTheme();
  const { isVerseRead } = useReadingProgress();
  const router = useRouter();

  const category = CATEGORIES.find((c) => c.id === getRouteParam(categoryId));

  if (!category) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: "Category", headerShown: true }} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Text style={{ color: colors.text, fontSize: 16 }}>Category not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderVerse = ({ item: verseId }: { item: string }) => {
    const parts = verseId.split("-");
    const chapter = parseInt(parts[0], 10);
    const verseNumber = parts.slice(1).join("-");
    const read = isVerseRead(chapter, verseNumber);
    const verseData = VERSE_MAP[verseId];
    const verseText = verseData?.teluguSloka?.trim() ?? "";

    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(ROUTES.verse(verseId));
        }}
        style={[styles.row, { borderBottomColor: colors.outline + "33" }]}
      >
        <View style={styles.rowTop}>
          <Text style={[styles.verseLabel, { color: colors.text }]} numberOfLines={2}>
            {formatVerseLabel(verseId)}
          </Text>
          {read && (
            <View style={styles.readMark}>
              <Ionicons name="checkmark" size={14} color={colors.primary} />
              <Text style={[styles.readText, { color: colors.primary }]}>Read</Text>
            </View>
          )}
        </View>
        {!!verseText && (
          <Text style={[styles.sloka, { color: colors.textMuted }]} numberOfLines={2}>
            {verseText}
          </Text>
        )}
      </Pressable>
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
          headerShown: true,
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text, fontFamily: "PlayfairDisplay_700Bold" },
          headerShadowVisible: false,
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  verseLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  readMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  readText: {
    fontSize: 11,
    fontWeight: "600",
  },
  sloka: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    fontStyle: "italic",
  },
});
