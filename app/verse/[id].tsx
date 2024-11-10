// app/verse/[id].tsx

import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { chapter1 } from "./chapter1";

const getVerseData = (id: string) => {
  return chapter1.find((verse: { id: string }) => verse.id === id);
};

export default function VerseScreen() {
  const { id } = useLocalSearchParams();
  const verse = getVerseData(id as string);
  const [isSaved, setIsSaved] = useState(false);

  const checkIfSaved = useCallback(async () => {
    if (!verse) return;
    try {
      const savedVerses = await AsyncStorage.getItem("savedVerses");
      if (savedVerses) {
        const verses = JSON.parse(savedVerses);
        setIsSaved(verses.some((v: { id: string }) => v.id === verse.id));
      }
    } catch (error) {
      console.error("Error checking saved verse:", error);
    }
  }, [verse?.id]);

  useEffect(() => {
    checkIfSaved();
  }, [checkIfSaved]);

  const toggleSave = useCallback(async () => {
    try {
      if (!verse) return;

      const verseToSave = {
        id: verse.id,
        chapter: verse.chapter,
        verse_number: verse.verse_number,
        teluguSloka: verse.teluguSloka,
        meaning: verse.meaning,
        commentary: verse.commentary,
      };

      const savedVerses = await AsyncStorage.getItem("savedVerses");
      let verses = savedVerses ? JSON.parse(savedVerses) : [];

      if (isSaved) {
        verses = verses.filter((v: { id: string }) => v.id !== verse.id);
      } else {
        verses.push(verseToSave);
      }

      await AsyncStorage.setItem("savedVerses", JSON.stringify(verses));
      setIsSaved(!isSaved);
    } catch (error) {
      console.error("Error toggling verse save:", error);
    }
  }, [verse, isSaved]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: verse
            ? `Chapter ${verse.chapter}, Verse ${verse.verse_number}`
            : "Verse Not Found",
          headerRight: () => (
            <Pressable onPress={toggleSave} style={styles.saveButton}>
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={24}
                color="#4A3200"
              />
            </Pressable>
          ),
          headerStyle: {
            backgroundColor: "#FFF8E7",
          },
          headerShadowVisible: false,
        }}
      />

      {verse ? (
        <ScrollView style={styles.content}>
          <View style={styles.verseContainer}>
            <Text style={styles.sectionTitle}>Sloka</Text>
            <Text style={styles.teluguSlokaText}>{verse.teluguSloka}</Text>
          </View>

          <View style={styles.wordMeaningsContainer}>
            <Text style={styles.sectionTitle}>Word Meanings</Text>
            {verse.word_meanings.map((item, index) => (
              <View key={index} style={styles.wordMeaningRow}>
                <Text style={styles.word}>{item.word}</Text>
                <Text style={styles.meaning}>{item.meaning}</Text>
              </View>
            ))}
          </View>

          <View style={styles.commentaryContainer}>
            <Text style={styles.sectionTitle}>Meaning</Text>
            <Text style={styles.meaningStyle}>{verse.meaning}</Text>
          </View>

          <View style={styles.commentaryContainer}>
            <Text style={styles.sectionTitle}>Commentary</Text>
            <Text style={styles.commentaryText}>{verse.commentary}</Text>
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.errorText}>Verse not found</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8E7",
  },
  content: {
    flex: 1,
  },
  saveButton: {
    padding: 8,
  },
  verseContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  teluguSlokaText: {
    fontSize: 18,
    color: "#4A3200",
    marginBottom: 12,
    textAlign: "center",
  },
  transliteration: {
    fontSize: 16,
    color: "#666666",
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  meaningStyle: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 26,
    textAlign: "justify",
  },
  wordMeaningsContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#4A3200",
    marginBottom: 16,
    fontWeight: "bold",
  },
  wordMeaningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  word: {
    fontSize: 16,
    color: "#4A3200",
    flex: 1,
  },
  meaning: {
    fontSize: 14,
    color: "#666666",
    flex: 2,
    textAlign: "right",
  },
  commentaryContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  commentaryText: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 24,
    textAlign: "justify",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});
