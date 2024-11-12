// app/verse/[id].tsx

import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { chapter1 } from "./chapter1";
import { chapter2 } from "./chapter2";
import { chapter3 } from "./chapter3";
import { versestyles } from "../styles";

const getVerseData = (id: string) => {
  const allVerses = [...chapter1, ...chapter2, ...chapter3];
  return allVerses.find((verse: { id: string }) => verse.id === id);
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
    <SafeAreaView style={versestyles.container}>
      <Stack.Screen
        options={{
          headerTitle: verse
            ? `Chapter ${verse.chapter}, Verse ${verse.verse_number}`
            : "Verse Not Found",
          headerRight: () => (
            <Pressable onPress={toggleSave} style={versestyles.saveButton}>
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
        <ScrollView style={versestyles.content}>
          <View style={versestyles.verseContainer}>
            <Text style={versestyles.sectionTitle}>Sloka</Text>
            <Text style={versestyles.teluguSlokaText}>{verse.teluguSloka}</Text>
          </View>

          <View style={versestyles.wordMeaningsContainer}>
            <Text style={versestyles.sectionTitle}>Word Meanings</Text>
            {verse.word_meanings.map((item, index) => (
              <View key={index} style={versestyles.wordMeaningRow}>
                <Text style={versestyles.word}>{item.word}</Text>
                <Text style={versestyles.meaning}>{item.meaning}</Text>
              </View>
            ))}
          </View>

          <View style={versestyles.commentaryContainer}>
            <Text style={versestyles.sectionTitle}>Meaning</Text>
            <Text style={versestyles.meaningStyle}>{verse.meaning}</Text>
          </View>

          <View style={versestyles.commentaryContainer}>
            <Text style={versestyles.sectionTitle}>Commentary</Text>
            <Text style={versestyles.commentaryText}>{verse.commentary}</Text>
          </View>
        </ScrollView>
      ) : (
        <Text style={versestyles.errorText}>Verse not found</Text>
      )}
    </SafeAreaView>
  );
}
