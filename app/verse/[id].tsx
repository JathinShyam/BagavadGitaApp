// app/verse/[id].tsx

import { View, ScrollView, StyleSheet, Pressable, Button } from "react-native";
import Slider from "@react-native-community/slider";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";
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
import { useAppTheme } from "../hooks/useAppTheme";

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

import { audioMappings } from "./audiomapper";

export const getAudioFile = (chapter: string, verseNumber: string): any => {
  try {
    const verseNumbers = verseNumber.split("-").map(Number);
    const audioFiles = verseNumbers
      .map((num) => {
        return audioMappings[chapter]?.[num.toString()] || null;
      })
      .filter(Boolean);

    return audioFiles.length > 0 ? audioFiles : null;
  } catch (error) {
    console.error("Error getting audio file:", error);
    return null;
  }
};

// Helper function to format time in MM:SS
const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

export default function VerseScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useAppTheme();
  const verse = getVerseData(id as string);
  const [isSaved, setIsSaved] = useState(false);
  const router = useRouter();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playPauseAudio = async (audioFiles: any[]) => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync(audioFiles[0], {
        shouldPlay: true,
      });
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 0);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0); // Reset position to 0 when audio finishes
          }
        }
      });
    }
  };

  const handleSliderValueChange = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
  };

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

  if (!verse) {
    return (
      <SafeAreaView style={versestyles.container}>
        <Text>Verse not found</Text>
      </SafeAreaView>
    );
  }

  const audioFiles = getAudioFile(verse.chapter.toString(), verse.verse_number);

  return (
    <SafeAreaView
      style={[versestyles.container, { backgroundColor: colors.background }]}
    >
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
                color={colors.primary}
              />
            </Pressable>
          ),
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
            fontSize: 18,
            fontWeight: "600",
          },
          headerShadowVisible: false,
        }}
      />

      {verse ? (
        <ScrollView style={versestyles.content}>
          <View
            style={[
              versestyles.verseContainer,
              { backgroundColor: colors.surface, borderColor: colors.outline },
            ]}
          >
            <Text style={[versestyles.sectionTitle, { color: colors.primary }]}>
              Sloka
            </Text>
            <Text style={[versestyles.teluguSlokaText, { color: colors.text }]}>
              {verse.teluguSloka}
            </Text>
            {audioFiles && (
              <View style={versestyles.audioContainer}>
                <Pressable onPress={() => playPauseAudio(audioFiles)}>
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={24}
                    color={colors.primary}
                  />
                </Pressable>
                <Slider
                  style={versestyles.slider}
                  minimumValue={0}
                  maximumValue={duration}
                  value={position}
                  onValueChange={handleSliderValueChange}
                />
                <Text
                  style={[versestyles.audioTime, { color: colors.textMuted }]}
                >
                  {formatTime(position)} / {formatTime(duration)}
                </Text>
              </View>
            )}
          </View>

          <View
            style={[
              versestyles.wordMeaningsContainer,
              { backgroundColor: colors.surface, borderColor: colors.outline },
            ]}
          >
            <Text style={[versestyles.sectionTitle, { color: colors.primary }]}>
              Word Meanings
            </Text>
            {verse.word_meanings.map((item, index) => (
              <View
                key={index}
                style={[
                  versestyles.wordMeaningRow,
                  { borderBottomColor: colors.outline },
                ]}
              >
                <Text style={[versestyles.word, { color: colors.text }]}>
                  {item.word}
                </Text>
                <Text
                  style={[versestyles.meaning, { color: colors.textMuted }]}
                >
                  {item.meaning}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={[
              versestyles.commentaryContainer,
              { backgroundColor: colors.surface, borderColor: colors.outline },
            ]}
          >
            <Text style={[versestyles.sectionTitle, { color: colors.primary }]}>
              Meaning
            </Text>
            <Text style={[versestyles.meaningStyle, { color: colors.text }]}>
              {verse.meaning}
            </Text>
          </View>

          <View
            style={[
              versestyles.commentaryContainer,
              { backgroundColor: colors.surface, borderColor: colors.outline },
            ]}
          >
            <Text style={[versestyles.sectionTitle, { color: colors.primary }]}>
              Commentary
            </Text>
            <Text style={[versestyles.commentaryText, { color: colors.text }]}>
              {verse.commentary}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <Text style={[versestyles.errorText, { color: colors.danger }]}>
          Verse not found
        </Text>
      )}

      <View style={[versestyles.navigationButtons, { backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => navigateToVerse(-1)}
          disabled={
            !getVerseData(
              `${verse?.chapter}-${
                parseInt(verse?.verse_number.split("-")[0] || "0") - 1
              }`
            )
          }
          style={[
            versestyles.navButton,
            { backgroundColor: colors.surface, borderColor: colors.outline },
            {
              opacity: !getVerseData(
                `${verse?.chapter}-${
                  parseInt(verse?.verse_number.split("-")[0] || "0") - 1
                }`
              )
                ? 0.3
                : 1,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={[versestyles.navButtonText, { color: colors.primary }]}>Previous</Text>
        </Pressable>
        <Pressable
          onPress={() => navigateToVerse(1)}
          disabled={
            !getVerseData(
              `${verse?.chapter}-${
                parseInt(verse?.verse_number.split("-").pop() || "0") + 1
              }`
            )
          }
          style={[
            versestyles.navButton,
            { backgroundColor: colors.surface, borderColor: colors.outline },
            {
              opacity: !getVerseData(
                `${verse?.chapter}-${
                  parseInt(verse?.verse_number.split("-").pop() || "0") + 1
                }`
              )
                ? 0.3
                : 1,
            },
          ]}
        >
          <Text style={[versestyles.navButtonText, { color: colors.primary }]}>Next</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
