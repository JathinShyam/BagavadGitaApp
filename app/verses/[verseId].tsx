import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
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
import type { StreakMilestone } from "@/constants/milestones";
import CelebrationModal from "@/components/modals/CelebrationModal";
import MilestoneModal from "@/components/modals/MilestoneModal";
import { SkeletonVerseDetail } from "@/components/ui/SkeletonLoader";
import { VerseAudioPlayer } from "@/components/verse/VerseAudioPlayer";
import {
  ShareCardView,
  StreakShareCardView,
  captureShareCardRef,
  shareImage,
} from "@/services/verse-share";
import { getVerseNote, setVerseNote } from "@/lib/verse-notes";
import {
  getUnseenMilestoneReached,
  markMilestoneSeen,
} from "@/lib/milestones";
import { markPathProgressForVerse } from "@/lib/reading-paths";
import { getDailyVerseNotificationContent, getVerseForDate } from "@/lib/daily-verse";

import { ROUTES } from "@/constants/routes";
import { VERSE_SEQUENCES } from "@/constants/verse-sequences";
import { getRouteParam } from "@/lib/route-params";

const getAdjacentVerse = (
  chapterId: number,
  currentVerse: string,
  direction: 1 | -1
): string | null => {
  const sequence = VERSE_SEQUENCES[chapterId];
  if (!sequence) return null;

  const currentIndex = sequence.findIndex((v) => {
    if (v === currentVerse) return true;
    const parts = v.split("-").map(Number);
    const searchParts = currentVerse.split("-").map(Number);
    if (parts.length === 2) {
      return searchParts.some((sp) => sp >= parts[0] && sp <= parts[1]);
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
  const [noteText, setNoteText] = useState("");
  const [showNoteSheet, setShowNoteSheet] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [milestoneDays, setMilestoneDays] = useState<StreakMilestone | null>(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(false);
  const shareCardRef = useRef<View | null>(null);
  const streakShareRef = useRef<View | null>(null);
  const noteSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { showToast } = useToast();
  const {
    markVerseAsRead,
    isLastVerseInChapter,
    setLastReadVerse,
    streak,
  } = useReadingProgress();

  const translateX = useSharedValue(0);
  const bookmarkScale = useSharedValue(1);

  const verseAudioSource = verse
    ? getAudioFile(verse.chapter.toString(), verse.verse_number)?.[0] ?? null
    : null;

  const todayInsight = (() => {
    const v = getVerseForDate(new Date());
    return v ? getDailyVerseNotificationContent(v).body.slice(0, 120) : "";
  })();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 480);
    return () => clearTimeout(timer);
  }, [idStr]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.AUTO_PLAY_AUDIO)
      .then((value) => {
        setAutoPlayAudio(value === "true");
      })
      .catch(() => setAutoPlayAudio(false));
  }, []);

  useEffect(() => {
    if (!verse) return;
    getVerseNote(verse.id).then((note) => {
      setNoteText(note?.text ?? "");
    });
  }, [verse?.id]);

  useEffect(() => {
    if (verse && !isLoading) {
      const trackReading = async () => {
        const result = await markVerseAsRead(verse.chapter, verse.verse_number);
        if (result?.isNewCompletion && isLastVerseInChapter(verse.chapter, verse.verse_number)) {
          setTimeout(() => setShowCelebration(true), 500);
        }
        if (result?.wasNewlyRead) {
          const milestone = await getUnseenMilestoneReached(result.currentStreak);
          if (milestone) {
            setMilestoneDays(milestone);
            setShowMilestone(true);
            await markMilestoneSeen(milestone);
          }
          const pathResult = await markPathProgressForVerse(verse.id);
          if (pathResult.pathCompleted) {
            showToast("Reading path complete", "success", "trophy");
          } else if (pathResult.dayCompleted) {
            showToast("Path day complete", "success", "checkmark-circle");
          }
        }
      };
      trackReading();
    }
  }, [verse?.id, isLoading, markVerseAsRead, isLastVerseInChapter, showToast]);

  useEffect(() => {
    if (verse && !isLoading) {
      setLastReadVerse(verse.id);
    }
  }, [verse?.id, isLoading, setLastReadVerse]);

  const checkIfSaved = useCallback(async () => {
    if (!verse) return;
    try {
      const savedVerses = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_VERSES);
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

  const handleNoteChange = useCallback(
    (text: string) => {
      setNoteText(text);
      if (!verse) return;
      if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
      noteSaveTimer.current = setTimeout(() => {
        setVerseNote(verse.id, text).catch(() => {});
      }, 500);
    },
    [verse]
  );

  useEffect(() => {
    return () => {
      if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
    };
  }, []);

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

      const savedVerses = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_VERSES);
      let verses = savedVerses ? JSON.parse(savedVerses) : [];

      const wasAlreadySaved = isSaved;

      if (wasAlreadySaved) {
        verses = verses.filter((v: { id: string }) => v.id !== verse.id);
      } else {
        verses.push(verseToSave);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_VERSES, JSON.stringify(verses));
      setIsSaved(!isSaved);

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

  const handleShareStreak = useCallback(async () => {
    if (!streakShareRef.current) return;
    try {
      const uri = await captureShareCardRef(streakShareRef.current);
      await shareImage(uri);
    } catch (e) {
      console.error("Streak share failed:", e);
    } finally {
      setShowMilestone(false);
    }
  }, []);

  const copyToClipboard = useCallback(
    async (text: string | undefined, label: string) => {
      const value = text ?? "";
      if (!value) return;
      await Clipboard.setStringAsync(value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast(`${label} copied to clipboard`, "success", "copy");
    },
    [showToast]
  );

  const navigateToVerse = useCallback(
    (offset: number) => {
      if (!verse) return;

      const chapterId = verse.chapter;
      const currentVerseNum = verse.verse_number;

      const nextVerseNum = getAdjacentVerse(chapterId, currentVerseNum, offset as 1 | -1);

      if (nextVerseNum) {
        const newId = `${chapterId}-${nextVerseNum}`;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.replace(ROUTES.verse(newId));
      }
    },
    [verse, router]
  );

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-20, 20])
    .onUpdate((event) => {
      translateX.value = event.translationX * 0.4;
    })
    .onEnd((event) => {
      const shouldNavigate = Math.abs(event.translationX) > 80;

      if (shouldNavigate && event.translationX < -80) {
        translateX.value = withTiming(-50, { duration: 150 }, () => {
          translateX.value = withTiming(0, { duration: 200 });
        });
        runOnJS(navigateToVerse)(1);
      } else if (shouldNavigate && event.translationX > 80) {
        translateX.value = withTiming(50, { duration: 150 }, () => {
          translateX.value = withTiming(0, { duration: 200 });
        });
        runOnJS(navigateToVerse)(-1);
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(toggleSave)();
    });

  const createLongPressGesture = (text: string, label: string) =>
    Gesture.LongPress()
      .minDuration(500)
      .onEnd(() => {
        runOnJS(copyToClipboard)(text, label);
      });

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
            headerTintColor: colors.primary,
            headerTitleStyle: {
              color: colors.primary,
              fontSize: 18,
              fontFamily: "PlayfairDisplay_700Bold",
            },
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
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
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowOptionsMenu(true);
                }}
                style={verseScreenStyles.saveButton}
                accessibilityLabel="More options"
                accessibilityRole="button"
              >
                <Ionicons name="ellipsis-vertical" size={20} color={colors.primary} />
              </Pressable>
            </View>
          ),
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            color: colors.primary,
            fontSize: 18,
            fontFamily: "PlayfairDisplay_700Bold",
          },
          headerShadowVisible: false,
        }}
      />

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
      <View
        ref={streakShareRef}
        style={{ position: "absolute", left: -9999, top: -9999, opacity: 0 }}
        collapsable={false}
      >
        <StreakShareCardView
          streakDays={streak.currentStreak}
          longestStreak={streak.longestStreak}
          insight={todayInsight}
        />
      </View>

      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[{ flex: 1 }, animatedContentStyle]}>
          <ScrollView style={verseScreenStyles.content} showsVerticalScrollIndicator={false}>
            <GestureDetector
              gesture={Gesture.Exclusive(
                doubleTapGesture,
                createLongPressGesture(verse.teluguSloka ?? "", "Sloka")
              )}
            >
              <Animated.View
                entering={FadeIn.delay(100)}
                style={verseScreenStyles.verseContainer}
              >
                <Text style={[localStyles.slokaLabel, { color: colors.primary }]}>
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
                  Long press to copy · Double tap to bookmark
                </Text>
              </Animated.View>
            </GestureDetector>

            <View
              style={[localStyles.sectionRule, { borderBottomColor: colors.outline + "33" }]}
            />

            <Animated.View
              entering={FadeIn.delay(200)}
              style={verseScreenStyles.wordMeaningsContainer}
            >
              <Text style={[verseScreenStyles.sectionTitle, { color: colors.primary }]}>
                Word Meanings
              </Text>
              {(verse.word_meanings ?? []).map((item, index) => (
                <View
                  key={index}
                  style={[
                    verseScreenStyles.wordMeaningRow,
                    { borderBottomColor: colors.outline + "33" },
                  ]}
                >
                  <Text style={[verseScreenStyles.word, { color: colors.text }]}>
                    {item.word}
                  </Text>
                  <Text style={[verseScreenStyles.meaning, { color: colors.textMuted }]}>
                    {item.meaning}
                  </Text>
                </View>
              ))}
            </Animated.View>

            <GestureDetector gesture={createLongPressGesture(verse.meaning ?? "", "Meaning")}>
              <Animated.View
                entering={FadeIn.delay(300)}
                style={verseScreenStyles.commentaryContainer}
              >
                <Text style={[verseScreenStyles.sectionTitle, { color: colors.primary }]}>
                  Meaning
                </Text>
                <Text style={[verseScreenStyles.meaningStyle, { color: colors.text }]}>
                  {verse.meaning}
                </Text>
              </Animated.View>
            </GestureDetector>

            <Animated.View
              entering={FadeIn.delay(400)}
              style={verseScreenStyles.commentaryContainer}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsCommentaryExpanded((v) => !v);
                }}
                style={localStyles.commentaryHeader}
                accessibilityRole="button"
                accessibilityLabel={
                  isCommentaryExpanded ? "Collapse commentary" : "Expand commentary"
                }
              >
                <Text style={[verseScreenStyles.sectionTitle, { color: colors.primary, marginBottom: 0 }]}>
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
                <GestureDetector
                  gesture={createLongPressGesture(verse.commentary ?? "", "Commentary")}
                >
                  <View style={{ marginTop: 12 }}>
                    <Text style={[verseScreenStyles.commentaryText, { color: colors.text }]}>
                      {verse.commentary}
                    </Text>
                  </View>
                </GestureDetector>
              )}
            </Animated.View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      <View style={localStyles.swipeHint}>
        <Text style={[localStyles.swipeHintText, { color: colors.textMuted }]}>
          ← Swipe to navigate →
        </Text>
      </View>

      <View
        style={[
          verseScreenStyles.navigationButtons,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.outline + "33",
            borderTopWidth: StyleSheet.hairlineWidth,
          },
        ]}
      >
        <Pressable
          onPress={() => navigateToVerse(-1)}
          disabled={!getAdjacentVerse(verse.chapter, verse.verse_number, -1)}
          style={[
            verseScreenStyles.navButton,
            { borderColor: colors.outline + "55" },
            {
              opacity: !getAdjacentVerse(verse.chapter, verse.verse_number, -1) ? 0.3 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={[verseScreenStyles.navButtonText, { color: colors.primary }]}>
            Previous
          </Text>
        </Pressable>
        <Pressable
          onPress={() => navigateToVerse(1)}
          disabled={!getAdjacentVerse(verse.chapter, verse.verse_number, 1)}
          style={[
            verseScreenStyles.navButton,
            { borderColor: colors.outline + "55" },
            {
              opacity: !getAdjacentVerse(verse.chapter, verse.verse_number, 1) ? 0.3 : 1,
            },
          ]}
        >
          <Text style={[verseScreenStyles.navButtonText, { color: colors.primary }]}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <CelebrationModal
        visible={showCelebration}
        chapterNumber={verse.chapter}
        onClose={() => setShowCelebration(false)}
      />
      <MilestoneModal
        visible={showMilestone}
        days={milestoneDays}
        onClose={() => setShowMilestone(false)}
        onShare={handleShareStreak}
      />

      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <View style={localStyles.optionsBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowOptionsMenu(false)}
            accessibilityLabel="Dismiss options"
          />
          <View style={[localStyles.optionsSheet, { backgroundColor: colors.surface }]}>
            <Text style={[localStyles.optionsTitle, { color: colors.textMuted }]}>
              Options
            </Text>
            <Pressable
              style={localStyles.optionRow}
              onPress={() => {
                setShowOptionsMenu(false);
                handleShare();
              }}
              accessibilityRole="button"
              accessibilityLabel="Share verse"
            >
              <Ionicons name="share-social-outline" size={22} color={colors.primary} />
              <Text style={[localStyles.optionLabel, { color: colors.text }]}>Share</Text>
            </Pressable>
            <View style={[localStyles.optionDivider, { backgroundColor: colors.outline + "44" }]} />
            <Pressable
              style={localStyles.optionRow}
              onPress={() => {
                setShowOptionsMenu(false);
                setShowNoteSheet(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Your reflection"
            >
              <Ionicons
                name={noteText.trim() ? "create" : "create-outline"}
                size={22}
                color={colors.primary}
              />
              <Text style={[localStyles.optionLabel, { color: colors.text }]}>
                {noteText.trim() ? "Edit reflection" : "Add reflection"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showNoteSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNoteSheet(false)}
      >
        <View style={localStyles.noteBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowNoteSheet(false)}
            accessibilityLabel="Dismiss reflection"
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={localStyles.noteKeyboard}
          >
            <View style={[localStyles.noteSheet, { backgroundColor: colors.surface }]}>
              <View style={localStyles.noteHeader}>
                <Text style={[localStyles.noteTitle, { color: colors.primary }]}>
                  Your reflection
                </Text>
                <Pressable
                  onPress={() => setShowNoteSheet(false)}
                  hitSlop={12}
                  accessibilityLabel="Close reflection"
                >
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </View>
              <TextInput
                value={noteText}
                onChangeText={handleNoteChange}
                placeholder="A few words that stayed with you…"
                placeholderTextColor={colors.textMuted}
                multiline
                autoFocus
                style={[
                  localStyles.noteInput,
                  {
                    color: colors.text,
                    borderColor: colors.outline + "55",
                  },
                ]}
              />
              <Text style={[localStyles.noteHint, { color: colors.textMuted }]}>
                Saves as you type
              </Text>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  slokaLabel: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 14,
  },
  hintText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 14,
    letterSpacing: 0.2,
  },
  sectionRule: {
    marginHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  swipeHint: {
    position: "absolute",
    bottom: 78,
    alignSelf: "center",
    opacity: 0.45,
  },
  swipeHintText: {
    fontSize: 11,
    letterSpacing: 0.3,
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
  optionsBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  optionsSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 28,
  },
  optionsTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  noteBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  noteKeyboard: {
    width: "100%",
  },
  noteSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    minHeight: 280,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  noteTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    letterSpacing: 0.2,
  },
  noteInput: {
    minHeight: 140,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    lineHeight: 24,
    textAlignVertical: "top",
  },
  noteHint: {
    marginTop: 10,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
