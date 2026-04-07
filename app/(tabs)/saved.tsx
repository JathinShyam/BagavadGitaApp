// app/(tabs)/saved.tsx

import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";

import { savedstyles } from "../styles";
import { useAppTheme } from "../hooks/useAppTheme";
import EmptyState from "../../components/EmptyState";
import { SkeletonVerseCard } from "../../components/SkeletonLoader";
import { Radius, Spacing } from "../theme";

interface SavedVerse {
  id: string;
  chapter: number;
  verse_number: string; // e.g. "1", "1-3", "13-14" for combined verses
  teluguSloka: string;
  meaning?: string;
  commentary?: string;
}

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

function formatVerseLabel(verse: SavedVerse): string {
  return `${CHAPTER_NAMES[verse.chapter] ?? `Chapter ${verse.chapter}`} • Verse ${verse.verse_number}`;
}

export default function SavedScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [savedVerses, setSavedVerses] = useState<SavedVerse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedVerses = useCallback(async () => {
    setLoading(true);
    try {
      const saved = await AsyncStorage.getItem("savedVerses");
      if (saved) {
        const verses = JSON.parse(saved);
        setSavedVerses(verses);
      } else {
        setSavedVerses([]);
      }
    } catch (error) {
      console.error("Error loading saved verses:", error);
      setSavedVerses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSavedVerses();
    }, [loadSavedVerses])
  );

  const renderVerse = useCallback(
    ({ item, index }: { item: SavedVerse; index: number }) => (
      <Animated.View entering={FadeInUp.delay(index * 50).springify()}>
        <View
          style={[
            savedstyles.verseCard,
            styles.savedVerseCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Link href={`/verse/${item.id}`} asChild>
            <Pressable
              style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.92 : 1 }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <View style={[styles.verseGradient, { backgroundColor: colors.surface }]}>
                <View style={styles.rowTop}>
                  <View style={styles.titleWrap}>
                    <Text style={[styles.verseLabel, { color: colors.text }]} numberOfLines={2}>
                      {formatVerseLabel(item)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      try {
                        const next = savedVerses.filter((v) => v.id !== item.id);
                        setSavedVerses(next);
                        await AsyncStorage.setItem("savedVerses", JSON.stringify(next));
                      } catch (error) {
                        console.error("Error removing saved verse:", error);
                        await loadSavedVerses();
                      }
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Remove from saved verses"
                  >
                    <Ionicons name="bookmark" size={18} color={colors.primary} />
                  </Pressable>
                </View>
                <Text style={[styles.exactVerseText, { color: colors.text }]}>
                  {item.teluguSloka}
                </Text>
                <View style={[styles.footerRow, { borderTopColor: colors.outline + "88" }]}>
                  <Text style={[styles.openText, { color: colors.primary }]}>Open verse</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </Pressable>
          </Link>
        </View>
      </Animated.View>
    ),
    [colors, savedVerses, loadSavedVerses]
  );

  const handleBrowseChapters = () => {
    router.push("/(tabs)");
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[savedstyles.container, { backgroundColor: colors.background }]}
      >
        <View style={savedstyles.header}>
          <Text style={[savedstyles.title, { color: colors.text }]}>
            Saved Verses
          </Text>
        </View>
        <View style={savedstyles.listContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonVerseCard key={i} style={{ marginBottom: 8 }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[savedstyles.container, { backgroundColor: colors.background }]}
    >
      <View style={savedstyles.header}>
        <Text style={[savedstyles.title, { color: colors.text }]}>
          Saved Verses
        </Text>
      </View>
      {savedVerses.length > 0 ? (
        <FlatList
          data={savedVerses}
          renderItem={renderVerse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={savedstyles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          icon="bookmark-outline"
          title="No saved verses yet"
          subtitle="Double-tap any verse or tap the bookmark icon to save your favorite verses for quick access"
          actionLabel="Browse Chapters"
          onAction={handleBrowseChapters}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  savedVerseCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
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
  exactVerseText: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontStyle: "italic",
  },
  footerRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  openText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
