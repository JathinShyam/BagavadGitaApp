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
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import * as Haptics from "expo-haptics";

import { getVerseById } from "@/data/verses/verse-catalog";
import { getAudioFile } from "@/data/verses/verse-audio";
import { useContentLanguage } from "@/context/language-context";
import {
  getVerseCommentary,
  getVerseLocaleContent,
  getVerseMeaning,
  getVerseSloka,
  getVerseWordMeanings,
} from "@/lib/verse-content";

import { verseScreenStyles } from "@/theme/screen-styles";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useToast } from "@/components/ui/Toast";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import type { StreakMilestone } from "@/constants/milestones";
import CelebrationModal from "@/components/modals/CelebrationModal";
import MilestoneModal from "@/components/modals/MilestoneModal";
import { SkeletonVerseDetail } from "@/components/ui/SkeletonLoader";
import { GoldCard } from "@/components/ui/GoldCard";
import { OrnamentalDivider, ORNAMENTS } from "@/components/ui/OrnamentalDivider";
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
import { Spacing } from "@/theme/design-tokens";

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
  const { language } = useContentLanguage();
  const idStr = getRouteParam(verseId);
  const verse = getVerseById(idStr);
  const locale = useMemo(
    () => (verse ? getVerseLocaleContent(verse, language) : null),
    [verse, language]
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [isCommentaryExpanded, setIsCommentaryExpanded] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [showNoteSheet, setShowNoteSheet] = useState(false);
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

  const todayInsight = useMemo(() => {
    const v = getVerseForDate(new Date(), language);
    return v ? getDailyVerseNotificationContent(v).body.slice(0, 120) : "";
  }, [language]);

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

  const pendingNoteRef = useRef<{ id: string; text: string } | null>(null);

  const flushPendingNote = useCallback(() => {
    if (noteSaveTimer.current) {
      clearTimeout(noteSaveTimer.current);
      noteSaveTimer.current = null;
    }
    const pending = pendingNoteRef.current;
    if (pending) {
      pendingNoteRef.current = null;
      setVerseNote(pending.id, pending.text).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!verse) return;
    // Clear immediately so the previous verse's note never flashes.
    setNoteText("");
    let cancelled = false;
    getVerseNote(verse.id).then((note) => {
      if (!cancelled) setNoteText(note?.text ?? "");
    });
    return () => {
      cancelled = true;
      // Persist any unsaved edits when leaving this verse (or unmounting).
      flushPendingNote();
    };
  }, [verse, flushPendingNote]);

  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
  }, []);

  useEffect(() => {
    if (verse && !isLoading) {
      const trackReading = async () => {
        const result = await markVerseAsRead(verse.chapter, verse.verse_number);
        if (result?.isNewCompletion && isLastVerseInChapter(verse.chapter, verse.verse_number)) {
          if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
          celebrationTimerRef.current = setTimeout(() => {
            celebrationTimerRef.current = null;
            setShowCelebration(true);
          }, 500);
        }
        if (result?.wasNewlyRead) {
          const milestone = await getUnseenMilestoneReached(result.currentStreak);
          if (milestone) {
            setMilestoneDays(milestone);
            setShowMilestone(true);
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
  }, [verse, isLoading, markVerseAsRead, isLastVerseInChapter, showToast]);

  useEffect(() => {
    if (verse && !isLoading) {
      setLastReadVerse(verse.id);
    }
  }, [verse, isLoading, setLastReadVerse]);

  const checkIfSaved = useCallback(async () => {
    if (!verse) return;
    try {
      const savedVerses = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_VERSES);
      const verses = savedVerses ? JSON.parse(savedVerses) : [];
      setIsSaved(verses.some((v: { id: string }) => v.id === verse.id));
    } catch (error) {
      console.error("Error checking saved verse:", error);
      setIsSaved(false);
    }
  }, [verse]);

  useEffect(() => {
    checkIfSaved();
  }, [checkIfSaved]);

  const handleNoteChange = useCallback(
    (text: string) => {
      setNoteText(text);
      if (!verse) return;
      pendingNoteRef.current = { id: verse.id, text };
      if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
      noteSaveTimer.current = setTimeout(() => {
        noteSaveTimer.current = null;
        pendingNoteRef.current = null;
        setVerseNote(verse.id, text).catch(() => {});
      }, 500);
    },
    [verse]
  );

  const toggleSave = useCallback(async () => {
    try {
      if (!verse) return;

      const verseToSave = {
        id: verse.id,
        chapter: verse.chapter,
        verse_number: verse.verse_number,
        sloka: getVerseSloka(verse, language),
        meaning: getVerseMeaning(verse, language),
        commentary: getVerseCommentary(verse, language),
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
  }, [verse, isSaved, showToast, bookmarkScale, language]);

  const handleShareStreak = useCallback(async () => {
    if (!streakShareRef.current) return;
    try {
      const uri = await captureShareCardRef(streakShareRef.current);
      await shareImage(uri);
    } catch (e) {
      console.error("Streak share failed:", e);
    } finally {
      if (milestoneDays) {
        markMilestoneSeen(milestoneDays).catch(() => {});
      }
      setShowMilestone(false);
    }
  }, [milestoneDays]);

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
        edges={["bottom"]}
      >
        <Stack.Screen
          options={{
            headerTitle: `Chapter ${verse.chapter} · Verse ${verse.verse_number}`,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.primary,
            headerTitleStyle: {
              color: colors.primary,
              fontSize: 15,
              fontFamily: "PlayfairDisplay_700Bold",
            },
            headerShadowVisible: false,
            headerTitleAlign: "center",
          }}
        />
        <SkeletonVerseDetail />
      </SafeAreaView>
    );
  }

  const headerTitle = `Chapter ${verse.chapter} · Verse ${verse.verse_number}`;
  const verseRef = `${verse.chapter}.${verse.verse_number}`;
  const wordMeanings = getVerseWordMeanings(verse, language);
  const slokaText = locale?.sloka ?? "";
  const meaningText = locale?.meaning ?? "";
  const commentaryText = locale?.commentary ?? "";

  return (
    <SafeAreaView
      style={[verseScreenStyles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          headerTitle,
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
                  setShowNoteSheet(true);
                }}
                style={verseScreenStyles.saveButton}
                accessibilityLabel={noteText.trim() ? "Edit reflection" : "Add reflection"}
                accessibilityRole="button"
              >
                <Ionicons
                  name={noteText.trim() ? "create" : "create-outline"}
                  size={22}
                  color={colors.primary}
                />
              </Pressable>
            </View>
          ),
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            color: colors.primary,
            fontSize: 15,
            fontFamily: "PlayfairDisplay_700Bold",
          },
          headerShadowVisible: false,
          headerTitleAlign: "center",
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
          sloka={slokaText}
          meaning={meaningText}
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
          <ScrollView
            style={verseScreenStyles.content}
            contentContainerStyle={localStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <GestureDetector gesture={doubleTapGesture}>
              <Animated.View
                entering={FadeIn.delay(100)}
                style={localStyles.slokaBlock}
              >
                <OrnamentalDivider
                  source={ORNAMENTS.lotusSimple}
                  height={32}
                  style={localStyles.slokaTopOrnament}
                />
                <Text
                  style={[
                    verseScreenStyles.teluguSlokaText,
                    localStyles.slokaText,
                    { color: colors.text },
                  ]}
                >
                  {slokaText}
                </Text>
                <Text style={[localStyles.verseRef, { color: colors.primary }]}>
                  || {verseRef} ||
                </Text>
                <OrnamentalDivider
                  source={ORNAMENTS.filigree}
                  height={26}
                  style={localStyles.slokaBottomOrnament}
                />
              </Animated.View>
            </GestureDetector>

            {wordMeanings.length > 0 && (
              <Animated.View entering={FadeIn.delay(200)}>
                <GoldCard style={localStyles.sectionCard}>
                  <View style={localStyles.sectionHeader}>
                    <Ionicons name="book-outline" size={18} color={colors.primary} />
                    <Text style={[localStyles.sectionTitle, { color: colors.primary }]}>
                      Word meanings
                    </Text>
                  </View>
                  <View style={localStyles.wordGrid}>
                    {wordMeanings.map((item, index) => {
                      const isLeft = index % 2 === 0;
                      const isLastRow =
                        index >= wordMeanings.length - (wordMeanings.length % 2 === 0 ? 2 : 1);
                      return (
                        <View
                          key={index}
                          style={[
                            localStyles.wordCell,
                            {
                              borderColor: colors.primary + "33",
                              borderRightWidth: isLeft ? StyleSheet.hairlineWidth : 0,
                              borderBottomWidth: isLastRow ? 0 : StyleSheet.hairlineWidth,
                            },
                          ]}
                        >
                          <Text style={[localStyles.wordCellWord, { color: colors.text }]}>
                            {item.word}
                          </Text>
                          <Text style={[localStyles.wordCellMeaning, { color: colors.textMuted }]}>
                            {item.meaning}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </GoldCard>
              </Animated.View>
            )}

            {meaningText ? (
            <Animated.View entering={FadeIn.delay(300)}>
              <GoldCard style={localStyles.sectionCard}>
                <View style={localStyles.sectionHeader}>
                  <Ionicons name="book" size={18} color={colors.primary} />
                  <Text style={[localStyles.sectionTitle, { color: colors.primary }]}>
                    Meaning
                  </Text>
                </View>
                <Text style={[verseScreenStyles.meaningStyle, { color: colors.text }]}>
                  {meaningText}
                </Text>
              </GoldCard>
            </Animated.View>
            ) : null}

            {commentaryText ? (
            <Animated.View entering={FadeIn.delay(400)}>
              <GoldCard style={localStyles.sectionCard}>
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
                  <View style={localStyles.sectionHeader}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
                    <Text style={[localStyles.sectionTitle, { color: colors.primary, marginBottom: 0 }]}>
                      Commentary
                    </Text>
                  </View>
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
                  <View style={{ marginTop: 12 }}>
                    <Text style={[verseScreenStyles.commentaryText, { color: colors.text }]}>
                      {commentaryText}
                    </Text>
                  </View>
                )}
              </GoldCard>
            </Animated.View>
            ) : null}

            <View style={{ height: 16 }} />
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      {verseAudioSource != null && (
        <View
          style={[
            localStyles.audioDock,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.primary + "33",
            },
          ]}
        >
          <VerseAudioPlayer
            audioSource={verseAudioSource}
            primaryColor={colors.primary}
            textMutedColor={colors.textMuted}
            outlineColor={colors.outline}
            autoPlay={autoPlayAudio}
          />
        </View>
      )}

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
            { borderColor: colors.primary + "88" },
            {
              opacity: !getAdjacentVerse(verse.chapter, verse.verse_number, -1) ? 0.3 : 1,
            },
          ]}
        >
          <Text style={{ fontSize: 16, color: colors.primary }}>◀</Text>
          <Text style={[verseScreenStyles.navButtonText, { color: colors.primary }]}>
            Previous
          </Text>
        </Pressable>
        <Pressable
          onPress={() => navigateToVerse(1)}
          disabled={!getAdjacentVerse(verse.chapter, verse.verse_number, 1)}
          style={[
            verseScreenStyles.navButton,
            { borderColor: colors.primary + "88" },
            {
              opacity: !getAdjacentVerse(verse.chapter, verse.verse_number, 1) ? 0.3 : 1,
            },
          ]}
        >
          <Text style={[verseScreenStyles.navButtonText, { color: colors.primary }]}>
            Next
          </Text>
          <Text style={{ fontSize: 16, color: colors.primary }}>▶</Text>
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
        onClose={() => {
          if (milestoneDays) {
            markMilestoneSeen(milestoneDays).catch(() => {});
          }
          setShowMilestone(false);
        }}
        onShare={handleShareStreak}
      />

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
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  slokaBlock: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    alignItems: "center",
  },
  slokaText: {
    marginBottom: 6,
    marginTop: 2,
  },
  verseRef: {
    alignSelf: "flex-end",
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 14,
    marginTop: 2,
    marginBottom: 2,
  },
  hintText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 0.2,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
  },
  wordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  wordCell: {
    width: "50%",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  wordCellWord: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
    textAlign: "center",
  },
  wordCellMeaning: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  slokaTopOrnament: {
    marginBottom: 4,
    marginTop: 0,
  },
  slokaBottomOrnament: {
    marginTop: 6,
    marginBottom: 0,
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
  audioDock: {
    paddingHorizontal: Spacing.md,
    paddingTop: 4,
    paddingBottom: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
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
