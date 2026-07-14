import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Animated, {
  type SharedValue,
  FadeIn,
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useAppTheme } from "@/hooks/useAppTheme";
import { ROUTES } from "@/constants/routes";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import {
  requestNotificationPermissions,
  scheduleNextDailyVerseNotification,
  setStoredPreferences,
} from "@/lib/daily-verse-notifications";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const REMINDER_TIMES = ["07:00", "08:00", "09:00"] as const;

function PaginationDot({
  index,
  scrollX,
  color,
}: {
  index: number;
  scrollX: SharedValue<number>;
  color: string;
}) {
  const dotAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const width = interpolate(
      scrollX.value,
      inputRange,
      [6, 18, 6],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.35, 1, 0.35],
      Extrapolation.CLAMP
    );
    return { width, opacity };
  });

  return (
    <Animated.View
      style={[styles.paginationDot, { backgroundColor: color }, dotAnimatedStyle]}
    />
  );
}

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  description: string;
  kind?: "standard" | "reminder";
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    icon: "book",
    title: "Welcome to",
    subtitle: "భగవద్గీత",
    description:
      "Explore the timeless wisdom of the Bhagavad Gita, the sacred dialogue between Lord Krishna and Arjuna on the battlefield of Kurukshetra.",
  },
  {
    id: "2",
    icon: "library",
    title: "18 Chapters",
    subtitle: "700 Verses",
    description:
      "Browse through all 18 chapters with Telugu translations, word-by-word meanings, and detailed commentaries to deepen your understanding.",
  },
  {
    id: "3",
    icon: "bookmark",
    title: "Save & Bookmark",
    subtitle: "Your Favorites",
    description:
      "Double-tap any verse to bookmark it. Long-press to copy text. Swipe left or right to navigate between verses effortlessly.",
  },
  {
    id: "4",
    icon: "headset",
    title: "Listen & Learn",
    subtitle: "Audio Recitations",
    description:
      "Listen to authentic Sanskrit recitations of each verse. Follow along with the text and immerse yourself in the divine sounds.",
  },
  {
    id: "5",
    icon: "notifications",
    title: "Daily reminder?",
    subtitle: "A verse each morning",
    description:
      "Get today’s verse and a short preview at a time that works for you. You can change this anytime in Settings.",
    kind: "reminder",
  },
];

function formatChipLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reminderTime, setReminderTime] = useState<string>("08:00");
  const [enablingReminder, setEnablingReminder] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const goToNextSlide = () => {
    if (currentIndex < slides.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const completeOnboarding = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, "true");
      router.replace(ROUTES.mainTabs);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      router.replace(ROUTES.mainTabs);
    }
  };

  const enableReminderAndFinish = async () => {
    setEnablingReminder(true);
    try {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await setStoredPreferences(true, reminderTime);
        await scheduleNextDailyVerseNotification();
      } else {
        await setStoredPreferences(false, reminderTime);
      }
    } catch (error) {
      console.error("Failed to enable daily reminder:", error);
    } finally {
      setEnablingReminder(false);
      await completeOnboarding();
    }
  };

  const skipReminderAndFinish = async () => {
    try {
      await setStoredPreferences(false, reminderTime);
    } catch {}
    await completeOnboarding();
  };

  const skipOnboarding = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await completeOnboarding();
  };

  const isReminderSlide = slides[currentIndex]?.kind === "reminder";

  const renderSlide = ({ item }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={[
            styles.iconContainer,
            { backgroundColor: colors.primary + "14" },
          ]}
        >
          <Ionicons name={item.icon} size={40} color={colors.primary} />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={styles.textContainer}
        >
          <Text style={[styles.title, { color: colors.textMuted }]}>
            {item.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.primary }]}>
            {item.subtitle}
          </Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {item.description}
          </Text>

          {item.kind === "reminder" && (
            <View style={styles.timeChips}>
              {REMINDER_TIMES.map((t) => {
                const selected = reminderTime === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setReminderTime(t);
                    }}
                    style={[
                      styles.timeChip,
                      selected
                        ? { backgroundColor: colors.primary }
                        : {
                            backgroundColor: "transparent",
                            borderColor: colors.outline + "55",
                            borderWidth: 1,
                          },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        {
                          color: selected ? colors.onPrimary : colors.textMuted,
                        },
                      ]}
                    >
                      {formatChipLabel(t)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Animated.View>
      </View>
    );
  };

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      {slides.map((_, index) => (
        <PaginationDot
          key={index}
          index={index}
          scrollX={scrollX}
          color={colors.primary}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Animated.View entering={FadeIn.delay(600)} style={styles.skipContainer}>
        <Pressable onPress={skipOnboarding} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        </Pressable>
      </Animated.View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      <Animated.View
        entering={FadeInDown.delay(500).springify()}
        style={styles.bottomSection}
      >
        {renderPagination()}

        {isReminderSlide ? (
          <View style={styles.reminderActions}>
            <Pressable
              onPress={enableReminderAndFinish}
              disabled={enablingReminder}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.actionButtonText, { color: colors.onPrimary }]}>
                {enablingReminder ? "Enabling…" : "Enable reminders"}
              </Text>
              <Ionicons
                name="checkmark"
                size={18}
                color={colors.onPrimary}
                style={{ marginLeft: 8 }}
              />
            </Pressable>
            <Pressable onPress={skipReminderAndFinish} style={styles.secondaryAction}>
              <Text style={[styles.secondaryActionText, { color: colors.textMuted }]}>
                Not now
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={goToNextSlide}
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.actionButtonText, { color: colors.onPrimary }]}>
              Next
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.onPrimary}
              style={{ marginLeft: 8 }}
            />
          </Pressable>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "500",
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 36,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 36,
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.8,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
    marginBottom: 14,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 300,
  },
  timeChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 28,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bottomSection: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  reminderActions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryAction: {
    alignItems: "center",
    paddingVertical: 8,
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
