// app/verse/[id].tsx

import { View, ScrollView, StyleSheet, Pressable, Button } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  FadeIn,
} from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

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
import { useReadingProgress } from "../hooks/useReadingProgress";
import { useToast } from "../../components/Toast";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import CelebrationModal from "../../components/CelebrationModal";
import { SkeletonVerseDetail } from "../../components/SkeletonLoader";
import { VerseAudioPlayer } from "../../components/VerseAudioPlayer";

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
import { VERSE_SEQUENCES } from "@/constants/verseSequences";

// Helper function to find the next/previous verse in sequence
const getAdjacentVerse = (chapterId: number, currentVerse: string, direction: 1 | -1): string | null => {
  const sequence = VERSE_SEQUENCES[chapterId];
  if (!sequence) return null;
  
  // Find current verse in sequence - handle both "7" and "7-8" formats
  const currentIndex = sequence.findIndex(v => {
    // Exact match
    if (v === currentVerse) return true;
    // Check if current verse is part of a range (e.g., searching for "7" finds "7-8")
    const parts = v.split("-").map(Number);
    const searchParts = currentVerse.split("-").map(Number);
    if (parts.length === 2) {
      // It's a range like "7-8"
      return searchParts.some(sp => sp >= parts[0] && sp <= parts[1]);
    }
    return false;
  });
  
  if (currentIndex === -1) return null;
  
  const newIndex = currentIndex + direction;
  if (newIndex < 0 || newIndex >= sequence.length) return null;
  
  return sequence[newIndex];
};

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

export default function VerseScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useAppTheme();
  const idStr = Array.isArray(id) ? id[0] : id;
  const verse = getVerseData(idStr ?? "");
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(false);
  
  const { showToast } = useToast();
  const {
    markVerseAsRead,
    isLastVerseInChapter,
    isChapterComplete,
    setLastReadVerse,
  } = useReadingProgress();
  
  // Animation values
  const translateX = useSharedValue(0);
  const bookmarkScale = useSharedValue(1);

  // Audio source for current verse — computed once per verse so only VerseAudioPlayer re-renders on status
  const verseAudioSource = verse
    ? getAudioFile(verse.chapter.toString(), verse.verse_number)?.[0] ?? null
    : null;

  // Simulate loading for skeleton
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [idStr]);

  // Load auto-play preference
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.AUTO_PLAY_AUDIO).then((value) => {
      setAutoPlayAudio(value === "true");
    }).catch(() => setAutoPlayAudio(false));
  }, []);

  // Mark verse as read when viewed
  useEffect(() => {
    if (verse && !isLoading) {
      const trackReading = async () => {
        const result = await markVerseAsRead(verse.chapter, verse.verse_number);
        if (result?.isNewCompletion && isLastVerseInChapter(verse.chapter, verse.verse_number)) {
          setTimeout(() => setShowCelebration(true), 500);
        }
      };
      trackReading();
    }
  }, [verse?.id, isLoading, markVerseAsRead, isLastVerseInChapter]);

  // Track \"last read\" location for resume feature
  useEffect(() => {
    if (verse && !isLoading) {
      setLastReadVerse(verse.id);
    }
  }, [verse?.id, isLoading, setLastReadVerse]);

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

      const wasAlreadySaved = isSaved;
      
      if (wasAlreadySaved) {
        verses = verses.filter((v: { id: string }) => v.id !== verse.id);
      } else {
        verses.push(verseToSave);
      }

      await AsyncStorage.setItem("savedVerses", JSON.stringify(verses));
      setIsSaved(!isSaved);
      
      // Show feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      bookmarkScale.value = withSequence(
        withTiming(1.3, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
      showToast(
        wasAlreadySaved ? "Removed from saved verses" : "Saved to bookmarks",
        "success",
        wasAlreadySaved ? "bookmark-outline" : "bookmark"
      );
    } catch (error) {
      console.error("Error toggling verse save:", error);
    }
  }, [verse, isSaved, showToast]);

  const copyToClipboard = useCallback(async (text: string | undefined, label: string) => {
    const value = text ?? "";
    if (!value) return;
    await Clipboard.setStringAsync(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast(`${label} copied to clipboard`, "success", "copy");
  }, [showToast]);

  const navigateToVerse = useCallback((offset: number) => {
    if (!verse) return;
    
    const chapterId = verse.chapter;
    const currentVerseNum = verse.verse_number;
    
    // Use the verse sequence map to find the adjacent verse
    const nextVerseNum = getAdjacentVerse(chapterId, currentVerseNum, offset as 1 | -1);
    
    if (nextVerseNum) {
      const newId = `${chapterId}-${nextVerseNum}`;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Use replace instead of push so back button goes to chapter, not previous verse
      router.replace(`/verse/${newId}`);
    }
  }, [verse, router]);

  // Swipe gesture for navigation - only triggers on horizontal swipes
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-20, 20])
    .onUpdate((event) => {
      // Smooth follow with damping
      translateX.value = event.translationX * 0.4;
    })
    .onEnd((event) => {
      const shouldNavigate = Math.abs(event.translationX) > 80;
      
      if (shouldNavigate && event.translationX < -80) {
        // Swipe left - go to next verse
        translateX.value = withTiming(-50, { duration: 150 }, () => {
          translateX.value = withTiming(0, { duration: 200 });
        });
        runOnJS(navigateToVerse)(1);
      } else if (shouldNavigate && event.translationX > 80) {
        // Swipe right - go to previous verse  
        translateX.value = withTiming(50, { duration: 150 }, () => {
          translateX.value = withTiming(0, { duration: 200 });
        });
        runOnJS(navigateToVerse)(-1);
      } else {
        // Snap back smoothly
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  // Double-tap gesture for bookmark - separate from swipe
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(toggleSave)();
    });

  // Long press gesture for copy
  const createLongPressGesture = (text: string, label: string) =>
    Gesture.LongPress()
      .minDuration(500)
      .onEnd(() => {
        runOnJS(copyToClipboard)(text, label);
      });

  // Only use swipe gesture on the main container - double tap is per section
  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const bookmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  if (!verse) {
    return (
      <SafeAreaView style={[versestyles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Verse not found</Text>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView
        style={[versestyles.container, { backgroundColor: colors.background }]}
      >
        <Stack.Screen
          options={{
            headerTitle: `Chapter ${verse.chapter}, Verse ${verse.verse_number}`,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <SkeletonVerseDetail />
      </SafeAreaView>
    );
  }

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
            <Pressable
              onPress={toggleSave}
              style={versestyles.saveButton}
              accessibilityLabel={isSaved ? "Remove from saved" : "Save verse"}
              accessibilityRole="button"
            >
              <Animated.View style={bookmarkAnimatedStyle}>
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={24}
                  color={colors.primary}
                />
              </Animated.View>
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

      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[{ flex: 1 }, animatedContentStyle]}>
          <ScrollView style={versestyles.content} showsVerticalScrollIndicator={false}>
            {/* Sloka Section with double-tap to bookmark and long press to copy */}
            <GestureDetector gesture={Gesture.Exclusive(doubleTapGesture, createLongPressGesture(verse.teluguSloka, "Sloka"))}>
              <Animated.View
                entering={FadeIn.delay(100)}
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
                {verseAudioSource != null && (
                  <VerseAudioPlayer
                    audioSource={verseAudioSource}
                    primaryColor={colors.primary}
                    textMutedColor={colors.textMuted}
                    outlineColor={colors.outline}
                    autoPlay={autoPlayAudio}
                  />
                )}
                <Text style={[localStyles.hintText, { color: colors.textMuted }]}>
                  Long press to copy • Double tap to bookmark
                </Text>
              </Animated.View>
            </GestureDetector>

            {/* Word Meanings Section */}
            <Animated.View
              entering={FadeIn.delay(200)}
              style={[
                versestyles.wordMeaningsContainer,
                { backgroundColor: colors.surface, borderColor: colors.outline },
              ]}
            >
              <Text style={[versestyles.sectionTitle, { color: colors.primary }]}>
                Word Meanings
              </Text>
              {(verse.word_meanings ?? []).map((item, index) => (
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
            </Animated.View>

            {/* Meaning Section with long press to copy */}
            <GestureDetector gesture={createLongPressGesture(verse.meaning ?? "", "Meaning")}>
              <Animated.View
                entering={FadeIn.delay(300)}
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
              </Animated.View>
            </GestureDetector>

            {/* Commentary Section with long press to copy */}
            <GestureDetector gesture={createLongPressGesture(verse.commentary ?? "", "Commentary")}>
              <Animated.View
                entering={FadeIn.delay(400)}
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
              </Animated.View>
            </GestureDetector>

            {/* Bottom spacing for navigation buttons */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      {/* Swipe hint indicator */}
      <View style={[localStyles.swipeHint, { backgroundColor: colors.surface }]}>
        <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
        <Text style={[localStyles.swipeHintText, { color: colors.textMuted }]}>
          Swipe to navigate
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>

      <View style={[versestyles.navigationButtons, { backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => navigateToVerse(-1)}
          disabled={!getAdjacentVerse(verse.chapter, verse.verse_number, -1)}
          style={[
            versestyles.navButton,
            { backgroundColor: colors.surface, borderColor: colors.outline },
            {
              opacity: !getAdjacentVerse(verse.chapter, verse.verse_number, -1) ? 0.3 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={[versestyles.navButtonText, { color: colors.primary }]}>Previous</Text>
        </Pressable>
        <Pressable
          onPress={() => navigateToVerse(1)}
          disabled={!getAdjacentVerse(verse.chapter, verse.verse_number, 1)}
          style={[
            versestyles.navButton,
            { backgroundColor: colors.surface, borderColor: colors.outline },
            {
              opacity: !getAdjacentVerse(verse.chapter, verse.verse_number, 1) ? 0.3 : 1,
            },
          ]}
        >
          <Text style={[versestyles.navButtonText, { color: colors.primary }]}>Next</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Celebration Modal */}
      <CelebrationModal
        visible={showCelebration}
        chapterNumber={verse.chapter}
        onClose={() => setShowCelebration(false)}
      />
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  hintText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  swipeHint: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    opacity: 0.8,
  },
  swipeHintText: {
    fontSize: 12,
    marginHorizontal: 4,
  },
});
