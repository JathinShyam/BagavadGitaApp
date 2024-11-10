// app/(tabs)/saved.tsx

import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useFocusEffect } from "expo-router";

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
        <Pressable style={styles.verseCard}>
          <View style={styles.cardContent}>
            <Text style={styles.verseLocation}>
              Chapter {item.chapter}, Verse {item.verse_number}
            </Text>
            <Text style={styles.sanskritText}>{item.sanskrit}</Text>
            <Text style={styles.translationText}>{item.translation}</Text>
          </View>
        </Pressable>
      </Link>
    ),
    []
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Verses</Text>
      </View>
      {savedVerses.length > 0 ? (
        <FlatList
          data={savedVerses}
          renderItem={renderVerse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No saved verses yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the bookmark icon on any verse to save it
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8E7",
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4A3200",
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContainer: {
    padding: 16,
  },
  verseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
  },
  verseLocation: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 8,
  },
  sanskritText: {
    fontSize: 18,
    color: "#4A3200",
    marginBottom: 8,
  },
  translationText: {
    fontSize: 16,
    color: "#333333",
  },
  emptyText: {
    fontSize: 18,
    color: "#4A3200",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
});
