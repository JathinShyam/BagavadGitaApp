// app/verse/[id].tsx

import { View, ScrollView, StyleSheet, Pressable, Button } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { chapter1 } from "./chapter1";
import { chapter2 } from "./chapter2";
import { chapter3 } from "./chapter3";
import { chapter4 } from "./chapter4";
import { chapter5 } from "./chapter5";
import { chapter6 } from "./chapter6";
import { chapter7 } from "./chapter7";
import { chapter8 } from "./chapter8";
import { chapter9 } from "./chapter9";
import { chapter10 } from "./chapter10";
import { chapter11 } from "./chapter11";
import { chapter12 } from "./chapter12";
import { chapter13 } from "./chapter13";
import { chapter14 } from "./chapter14";
import { chapter15 } from "./chapter15";
import { chapter16 } from "./chapter16";
import { chapter17 } from "./chapter17";
import { chapter18 } from "./chapter18";

import { versestyles } from "../styles";

const getVerseData = (id: string) => {
  const allVerses = [
    ...chapter1,
    ...chapter2,
    ...chapter3,
    ...chapter4,
    ...chapter5,
    ...chapter6,
    ...chapter7,
    ...chapter8,
    ...chapter9,
    ...chapter10,
    ...chapter11,
    ...chapter12,
    ...chapter13,
    ...chapter14,
    ...chapter15,
    ...chapter16,
    ...chapter17,
    ...chapter18,
  ];
  return allVerses.find((verse: { id: string }) => verse.id === id);
};

export default function VerseScreen() {
  const { id } = useLocalSearchParams();
  const verse = getVerseData(id as string);
  const [isSaved, setIsSaved] = useState(false);
  const router = useRouter();

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

  const navigateToVerse = (offset: number) => {
    const [chapterId, verseRange] = (id as string).split("-");
    const verseNumbers = verseRange.split("-").map(Number);
    const currentVerseNumber =
      offset > 0 ? verseNumbers[verseNumbers.length - 1] : verseNumbers[0];
    let newVerseNumber = currentVerseNumber + offset;
    let newId = `${chapterId}-${newVerseNumber}`;

    // Check for combined verses
    while (!getVerseData(newId) && newVerseNumber > 0) {
      newVerseNumber += offset;
      newId = `${chapterId}-${newVerseNumber}`;
    }

    // Check if the new verse is part of a combined range
    const combinedVerse = getVerseData(newId);
    if (combinedVerse) {
      const combinedVerseRange = combinedVerse.verse_number
        .split("-")
        .map(Number);
      if (combinedVerseRange.length > 1) {
        newId = `${chapterId}-${combinedVerseRange.join("-")}`;
      }
    }

    const newVerse = getVerseData(newId);
    if (newVerse) {
      router.push(`/verse/${newId}`);
    }
  };

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

      <View style={versestyles.navigationButtons}>
        <Button
          title="Previous"
          onPress={() => navigateToVerse(-1)}
          disabled={
            !getVerseData(
              `${verse?.chapter}-${
                parseInt(verse?.verse_number.split("-")[0] || "0") - 1
              }`
            )
          }
        />
        <Button
          title="Next"
          onPress={() => navigateToVerse(1)}
          disabled={
            !getVerseData(
              `${verse?.chapter}-${
                parseInt(verse?.verse_number.split("-").pop() || "0") + 1
              }`
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}
