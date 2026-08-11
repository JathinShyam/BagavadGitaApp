import { View, FlatList, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useContentLanguage } from "@/context/language-context";
import { CATEGORIES } from "@/data/explore-categories";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { VerseListCard } from "@/components/verse/VerseListCard";
import { savedScreenStyles } from "@/theme/screen-styles";
import { Spacing } from "@/theme/design-tokens";
import { ROUTES } from "@/constants/routes";
import { ALL_VERSES } from "@/lib/daily-verse";
import { getRouteParam } from "@/lib/route-params";
import { getVerseSloka } from "@/lib/verse-content";

// Built once at module load — ALL_VERSES is static data.
const VERSE_MAP: Record<string, (typeof ALL_VERSES)[number]> = {};
for (const v of ALL_VERSES) VERSE_MAP[v.id] = v;

export default function ExploreCategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { colors } = useAppTheme();
  const { language } = useContentLanguage();
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
    const verseText = verseData ? getVerseSloka(verseData, language).trim() : "";

    return (
      <VerseListCard
        badge={verseNumber}
        title={`Ch. ${chapter} · Verse ${verseNumber}`}
        preview={verseText}
        read={read}
        onPress={() => router.push(ROUTES.verse(verseId))}
        accessibilityLabel={`Open chapter ${chapter} verse ${verseNumber}`}
      />
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
});