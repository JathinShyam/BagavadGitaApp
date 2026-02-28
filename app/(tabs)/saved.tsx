// app/(tabs)/saved.tsx

import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useFocusEffect, useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";

import { savedstyles } from "../styles";
import { useAppTheme } from "../hooks/useAppTheme";
import EmptyState from "../../components/EmptyState";
import { SkeletonVerseCard } from "../../components/SkeletonLoader";

interface SavedVerse {
  id: string;
  chapter: number;
  verse_number: string; // e.g. "1", "1-3", "13-14" for combined verses
  teluguSloka: string;
  meaning?: string;
  commentary?: string;
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
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Link href={`/verse/${item.id}`} asChild>
            <Pressable style={{ flex: 1 }}>
              <View style={savedstyles.cardContent}>
                <Text
                  style={[savedstyles.verseLocation, { color: colors.textMuted }]}
                >
                  Chapter {item.chapter}, Verse {item.verse_number}
                </Text>
                <Text style={[savedstyles.sanskritText, { color: colors.text }]}>
                  {item.teluguSloka}
                </Text>
              </View>
            </Pressable>
          </Link>
        </View>
      </Animated.View>
    ),
    [colors]
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
