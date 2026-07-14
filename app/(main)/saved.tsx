import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { savedScreenStyles } from "@/theme/screen-styles";
import { useAppTheme } from "@/hooks/useAppTheme";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonVerseCard } from "@/components/ui/SkeletonLoader";
import { ROUTES } from "@/constants/routes";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { useToast } from "@/components/ui/Toast";
import { getLocalDateKey, addDaysToDateKey } from "@/lib/date-keys";

interface SavedVerse {
  id: string;
  chapter: number;
  verse_number: string;
  teluguSloka: string;
  meaning?: string;
  commentary?: string;
  lastOpenedAt?: string | null;
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
  return `${CHAPTER_NAMES[verse.chapter] ?? `Chapter ${verse.chapter}`} · Verse ${verse.verse_number}`;
}

function pickRevisitVerse(verses: SavedVerse[]): SavedVerse | null {
  if (verses.length === 0) return null;
  return [...verses].sort((a, b) => {
    const aT = a.lastOpenedAt ? Date.parse(a.lastOpenedAt) : 0;
    const bT = b.lastOpenedAt ? Date.parse(b.lastOpenedAt) : 0;
    return aT - bT;
  })[0];
}

export default function SavedVersesScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const [savedVerses, setSavedVerses] = useState<SavedVerse[]>([]);
  const [loading, setLoading] = useState(true);

  const revisit = useMemo(() => pickRevisitVerse(savedVerses), [savedVerses]);

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
        style={[styles.row, { borderBottomColor: colors.outline + "33" }]}
      >
        <View style={styles.rowTop}>
          <Text style={[styles.verseLabel, { color: colors.text }]} numberOfLines={2}>
            {formatVerseLabel(item)}
          </Text>
          <Pressable
            onPress={() => removeVerse(item)}
            hitSlop={8}
            accessibilityLabel="Remove from saved"
          >
            <Ionicons name="bookmark" size={18} color={colors.primary} />
          </Pressable>
        </View>
        <Text style={[styles.sloka, { color: colors.textMuted }]} numberOfLines={2}>
          {item.teluguSloka}
        </Text>
      </Pressable>
    ),
    [colors, openSavedVerse, removeVerse]
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[savedScreenStyles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={savedScreenStyles.header}>
          <Text style={[savedScreenStyles.title, { color: colors.text }]}>Saved</Text>
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
      <View style={savedScreenStyles.header}>
        <Text style={[savedScreenStyles.title, { color: colors.text }]}>Saved</Text>
      </View>
      {savedVerses.length > 0 ? (
        <FlatList
          data={savedVerses}
          renderItem={renderVerse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={savedScreenStyles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            revisit ? (
              <Pressable onPress={() => openSavedVerse(revisit)} style={styles.revisit}>
                <Text style={[styles.revisitLabel, { color: colors.primary }]}>Revisit</Text>
                <View style={styles.revisitRow}>
                  <Text
                    style={[styles.revisitTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {formatVerseLabel(revisit)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              </Pressable>
            ) : null
          }
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
  sloka: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    fontStyle: "italic",
  },
  revisit: {
    marginBottom: 16,
    paddingBottom: 12,
  },
  revisitLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  revisitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  revisitTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
});
