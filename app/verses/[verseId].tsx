import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback, useRef } from "react";
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

import { getVerseById } from "@/data/verses/verse-catalog";
import { getAudioFile } from "@/data/verses/verse-audio";


import { verseScreenStyles } from "@/theme/screen-styles";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useToast } from "@/components/ui/Toast";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import CelebrationModal from "@/components/modals/CelebrationModal";
import { SkeletonVerseDetail } from "@/components/ui/SkeletonLoader";
import { VerseAudioPlayer } from "@/components/verse/VerseAudioPlayer";
import { ShareCardView, captureShareCardRef, shareImage } from "@/services/verse-share";


import { ROUTES } from "@/constants/routes";
import { VERSE_SEQUENCES } from "@/constants/verse-sequences";
import { getRouteParam } from "@/lib/route-params";

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


export default function VerseDetailScreen() {
  const { verseId } = useLocalSearchParams<{ verseId: string }>();
  const { colors } = useAppTheme();
  const idStr = getRouteParam(verseId);
  const verse = getVerseById(idStr);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [isCommentaryExpanded, setIsCommentaryExpanded] = useState(true);
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(false);
  const shareCardRef = useRef<View | null>(null);
  
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

  const handleShare = useCallback(async () => {
    if (!verse) return;
    if (!shareCardRef.current) return;
    try {
      const uri = await captureShareCardRef(shareCardRef.current);
      await shareImage(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error("Share failed:", e);
      showToast("Could not share right now", "error", "alert-circle");
    }
  }, [verse?.id, showToast]);

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
      router.replace(ROUTES.verse(newId));
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
      <SafeAreaView style={[verseScreenStyles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Verse not found</Text>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView
        style={[verseScreenStyles.container, { backgroundColor: colors.background }]}
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
      style={[verseScreenStyles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen
        options={{
          headerTitle: verse
            ? `Chapter ${verse.chapter}, Verse ${verse.verse_number}`
            : "Verse Not Found",
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Pressable
                onPress={handleShare}
                style={verseScreenStyles.saveButton}
                accessibilityLabel="Share verse"
                accessibilityRole="button"
              >
                <Ionicons name="share-social-outline" size={22} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={toggleSave}
                style={verseScreenStyles.saveButton}
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
            </View>
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

      {/* Offscreen share card renderer (captured as image) */}
      <View
        ref={shareCardRef}
        style={{ position: "absolute", left: -9999, top: -9999, opacity: 0 }}
        collapsable={false}
      >
        <ShareCardView
          title={`Chapter ${verse.chapter}`}
          subtitle={`Verse ${verse.verse_number}`}
          sloka={verse.teluguSloka}
          meaning={verse.meaning}
        />
      </View>

      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[{ flex: 1 }, animatedContentStyle]}>
          <ScrollView style={verseScreenStyles.content} showsVerticalScrollIndicator={false}>
            {/* Sloka Section with double-tap to bookmark and long press to copy */}
            <GestureDetector gesture={Gesture.Exclusive(doubleTapGesture, createLongPressGesture(verse.teluguSloka ?? "", "Sloka"))}>
              <Animated.View
                entering={FadeIn.delay(100)}
                style={[
                  verseScreenStyles.verseContainer,
                  { backgroundColor: colors.surface, borderColor: colors.outline },
                ]}
              >
                <Text style={[verseScreenStyles.sectionTitle, { color: colors.primary }]}>
                  Sloka
                </Text>
                <Text style={[verseScreenStyles.teluguSlokaText, { color: colors.text }]}>
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
                verseScreenStyles.wordMeaningsContainer,
                { backgroundColor: colors.surface, borderColor: colors.outline },
              ]}
            >
              <Text style={[verseScreenStyles.sectionTitle, { color: colors.primary }]}>
                Word Meanings
              </Text>
              {(verse.word_meanings ?? []).map((item, index) => (
                <View
                  key={index}
                  style={[
                    verseScreenStyles.wordMeaningRow,
                    { borderBottomColor: colors.outline },
                  ]}
                >
                  <Text style={[verseScreenStyles.word, { color: colors.text }]}>
                    {item.word}
                  </Text>
                  <Text
                    style={[verseScreenStyles.meaning, { color: colors.textMuted }]}
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
                  verseScreenStyles.commentaryContainer,
                  { backgroundColor: colors.surface, borderColor: colors.outline },
                ]}
              >
                <Text style={[verseScreenStyles.sectionTitle, { color: colors.primary }]}>
                  Meaning
                </Text>
                <Text style={[verseScreenStyles.meaningStyle, { color: colors.text }]}>
                  {verse.meaning}
                </Text>
              </Animated.View>
            </GestureDetector>

            {/* Commentary Section with progressive disclosure */}
            <Animated.View
              entering={FadeIn.delay(400)}
              style={[
                verseScreenStyles.commentaryContainer,
                { backgroundColor: colors.surface, borderColor: colors.outline },
              ]}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsCommentaryExpanded((v) => !v);
                }}
                style={localStyles.commentaryHeader}
                accessibilityRole="button"
                accessibilityLabel={isCommentaryExpanded ? "Collapse commentary" : "Expand commentary"}
              >
                <Text style={[verseScreenStyles.sectionTitle, { color: colors.primary }]}>
                  Commentary
                </Text>
                <View style={localStyles.commentaryToggle}>
                  <Text style={[localStyles.commentaryToggleText, { color: colors.textMuted }]}>
                    {isCommentaryExpanded ? "Hide" : "Read"}
                  </Text>
                  <Ionicons
                    name={isCommentaryExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.textMuted}
                  />
                </View>
              </Pressable>
              {isCommentaryExpanded && (
                <GestureDetector gesture={createLongPressGesture(verse.commentary ?? "", "Commentary")}>
                  <View>
                    <Text style={[verseScreenStyles.commentaryText, { color: colors.text }]}>
                      {verse.commentary}
                    </Text>
                  </View>
                </GestureDetector>
              )}
            </Animated.View>

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

      <View style={[verseScreenStyles.navigationButtons, { backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => navigateToVerse(-1)}
          disabled={!getAdjacentVerse(verse.chapter, verse.verse_number, -1)}
          style={[
            verseScreenStyles.navButton,
            { backgroundColor: colors.surface, borderColor: colors.outline },
            {
              opacity: !getAdjacentVerse(verse.chapter, verse.verse_number, -1) ? 0.3 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={[verseScreenStyles.navButtonText, { color: colors.primary }]}>Previous</Text>
        </Pressable>
        <Pressable
          onPress={() => navigateToVerse(1)}
          disabled={!getAdjacentVerse(verse.chapter, verse.verse_number, 1)}
          style={[
            verseScreenStyles.navButton,
            { backgroundColor: colors.surface, borderColor: colors.outline },
            {
              opacity: !getAdjacentVerse(verse.chapter, verse.verse_number, 1) ? 0.3 : 1,
            },
          ]}
        >
          <Text style={[verseScreenStyles.navButtonText, { color: colors.primary }]}>Next</Text>
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
  commentaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commentaryToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentaryToggleText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
