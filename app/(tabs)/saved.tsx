// app/(tabs)/saved.tsx

import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useFocusEffect } from "expo-router";

import { savedstyles } from "../styles";

interface SavedVerse {
  id: string;
  chapter: number;
  verse_number: number;
  sanskrit: string;
  translation: string;
}

export default function SavedScreen() {
  const [savedVerses, setSavedVerses] = useState<SavedVerse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedVerses = useCallback(async () => {
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
    ({ item }: { item: SavedVerse }) => (
      <Link href={`/verse/${item.chapter}-${item.verse_number}`} asChild>
        <Pressable style={savedstyles.verseCard}>
          <View style={savedstyles.cardContent}>
            <Text style={savedstyles.verseLocation}>
              Chapter {item.chapter}, Verse {item.verse_number}
            </Text>
            <Text style={savedstyles.sanskritText}>{item.sanskrit}</Text>
            <Text style={savedstyles.translationText}>{item.translation}</Text>
          </View>
        </Pressable>
      </Link>
    ),
    []
  );

  if (loading) {
    return (
      <View style={savedstyles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={savedstyles.container}>
      <View style={savedstyles.header}>
        <Text style={savedstyles.title}>Saved Verses</Text>
      </View>
      {savedVerses.length > 0 ? (
        <FlatList
          data={savedVerses}
          renderItem={renderVerse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={savedstyles.listContainer}
        />
      ) : (
        <View style={savedstyles.centerContainer}>
          <Text style={savedstyles.emptyText}>No saved verses yet</Text>
          <Text style={savedstyles.emptySubtext}>
            Tap the bookmark icon on any verse to save it
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
