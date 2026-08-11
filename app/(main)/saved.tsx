import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { savedScreenStyles } from "@/theme/screen-styles";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useContentLanguage } from "@/context/language-context";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonVerseCard } from "@/components/ui/SkeletonLoader";
import { GoldCard } from "@/components/ui/GoldCard";
import { ScreenCornerArt, CORNER_ART } from "@/components/ui/ScreenCornerArt";
import { ROUTES } from "@/constants/routes";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { useToast } from "@/components/ui/Toast";
import { getLocalDateKey, addDaysToDateKey } from "@/lib/date-keys";
import { Spacing } from "@/theme/design-tokens";
import { getVerseById } from "@/data/verses/verse-catalog";
import { getVerseMeaning, getVerseSloka } from "@/lib/verse-content";

interface SavedVerse {
  id: string;
  chapter: number;
  verse_number: string;
  /** Snapshot at save time (preferred). */
  sloka?: string;
  /** Legacy field from older saves. */
  teluguSloka?: string;
  meaning?: string;
  commentary?: string;
  lastOpenedAt?: string | null;
}

function formatVerseRef(verse: SavedVerse): string {
  return `Chapter ${verse.chapter} · Verse ${verse.verse_number}`;
}

function savedVerseSloka(item: SavedVerse, language: Parameters<typeof getVerseSloka>[1]): string {
  const live = getVerseById(item.id);
  if (live) return getVerseSloka(live, language);
  return (item.sloka ?? item.teluguSloka ?? "").trim();
}

function savedVerseMeaning(item: SavedVerse, language: Parameters<typeof getVerseMeaning>[1]): string {
  const live = getVerseById(item.id);
  if (live) return getVerseMeaning(live, language);
  return (item.meaning ?? "").trim();
}

export default function SavedVersesScreen() {
  const { colors, isDark } = useAppTheme();
  const { language } = useContentLanguage();
  const router = useRouter();
  const { showToast } = useToast();
  const [savedVerses, setSavedVerses] = useState<SavedVerse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedVerses = useCallback(async () => {
    setLoading(true);
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_VERSES);
      if (saved) {
        setSavedVerses(JSON.parse(saved));
      } else {
        setSavedVerses([]);
      }

      const cursor = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_REVIEW_CURSOR);
      const today = getLocalDateKey();
      const due = !cursor || today >= addDaysToDateKey(cursor, 7);
      const parsed: SavedVerse[] = saved ? JSON.parse(saved) : [];
      if (due && parsed.length > 0) {
        showToast("Revisit a verse you saved", "info", "bookmark");
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_REVIEW_CURSOR, today);
      }
    } catch (error) {
      console.error("Error loading saved verses:", error);
      setSavedVerses([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      loadSavedVerses();
    }, [loadSavedVerses])
  );

  const openSavedVerse = useCallback(
    async (item: SavedVerse) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        const next = savedVerses.map((v) =>
          v.id === item.id ? { ...v, lastOpenedAt: new Date().toISOString() } : v
        );
        setSavedVerses(next);
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_VERSES, JSON.stringify(next));
      } catch {}
      router.push(ROUTES.verse(item.id));
    },
    [savedVerses, router]
  );

  const removeVerse = useCallback(
    async (item: SavedVerse) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        const next = savedVerses.filter((v) => v.id !== item.id);
        setSavedVerses(next);
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_VERSES, JSON.stringify(next));
      } catch {
        await loadSavedVerses();
      }
    },
    [savedVerses, loadSavedVerses]
  );

  const renderVerse = useCallback(
    ({ item }: { item: SavedVerse }) => (
      <Pressable
        onPress={() => openSavedVerse(item)}
        style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={`Open ${formatVerseRef(item)}`}
      >
        <GoldCard compact style={styles.card}>
          <View style={styles.cardTop}>
            <View
              style={[
                styles.bookBadge,
                {
                  backgroundColor: colors.primary + "18",
                  borderColor: colors.primary + "44",
                },
              ]}
            >
              <Ionicons name="book-outline" size={14} color={colors.primary} />
            </View>
            <Text style={[styles.verseRef, { color: colors.text }]} numberOfLines={1}>
              {formatVerseRef(item)}
            </Text>
            <Ionicons name="bookmark" size={18} color={colors.primary} />
          </View>

          <Text style={[styles.sloka, { color: colors.text }]} numberOfLines={2}>
            {savedVerseSloka(item, language)}
          </Text>

          {savedVerseMeaning(item, language) ? (
            <Text style={[styles.meaning, { color: colors.textMuted }]} numberOfLines={2}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>Meaning: </Text>
              {savedVerseMeaning(item, language)}
            </Text>
          ) : null}

          <View style={[styles.cardFooter, { borderTopColor: colors.primary + "33" }]}>
            <Pressable
              onPress={(e) => {
                e?.stopPropagation?.();
                removeVerse(item);
              }}
              hitSlop={8}
              style={styles.footerAction}
              accessibilityLabel="Remove from saved"
            >
              <Ionicons name="heart-outline" size={16} color={colors.primary} />
              <Text style={[styles.footerActionText, { color: colors.primary }]}>Unsave</Text>
            </Pressable>
            <View style={styles.footerAction}>
              <Text style={[styles.footerActionText, { color: colors.primary }]}>View Verse</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </View>
        </GoldCard>
      </Pressable>
    ),
    [colors, openSavedVerse, removeVerse, language]
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[savedScreenStyles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>Saved</Text>
        </View>
        <View style={savedScreenStyles.listContainer}>
          {[1, 2, 3].map((i) => (
            <SkeletonVerseCard key={i} style={{ marginBottom: 8 }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[savedScreenStyles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <ScreenCornerArt
          source={CORNER_ART.chariotLine}
          style={styles.headerArt}
          opacity={isDark ? 0.5 : 0.62}
        />
        <Text style={[styles.title, { color: colors.primary }]}>Saved</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Verses you want to return to
        </Text>
      </View>
      {savedVerses.length > 0 ? (
        <FlatList
          data={savedVerses}
          renderItem={renderVerse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          icon="bookmark-outline"
          title="No saved verses yet"
          subtitle="Double-tap any verse or tap the bookmark icon to save verses for later"
          actionLabel="Browse chapters"
          onAction={() => router.push(ROUTES.mainTabs)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    overflow: "hidden",
    minHeight: 100,
  },
  headerArt: {
    width: 176,
    height: 136,
    top: -6,
    right: -14,
    transform: [{ scaleX: -1 }],
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  bookBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  verseRef: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  sloka: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
    marginBottom: 8,
  },
  meaning: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerActionText: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
    opacity: 0.92,
  },
});
