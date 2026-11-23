import React, { useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Animated, {
  type SharedValue,
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

import { haptics } from "@/lib/haptics";
import { SelectableChip } from "@/components/ui/SelectableChip";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ROUTES } from "@/constants/routes";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { CONTENT_LANGUAGES, getAppTitle } from "@/constants/languages";
import { useContentLanguage } from "@/context/language-context";
import { useTranslation } from "@/hooks/useTranslation";
import { getLanguageLabel, INTL_LOCALES, tracking, type Translator } from "@/lib/i18n";
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
    const scaleX = interpolate(
      scrollX.value,
      inputRange,
      [1, 3, 1],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.35, 1, 0.35],
      Extrapolation.CLAMP
    );
    return { transform: [{ scaleX }], opacity };
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
  kind?: "standard" | "language" | "reminder";
}

function getSlides(t: Translator): OnboardingSlide[] {
  return [
    {
      id: "1",
      icon: "book",
      title: t("onboarding.welcomeTitle"),
      subtitle: t("onboarding.welcomeSubtitle"),
      description: t("onboarding.welcomeBody"),
      kind: "language",
    },
    {
      id: "2",
      icon: "library",
      title: t("onboarding.chaptersTitle"),
      subtitle: t("onboarding.chaptersSubtitle"),
      description: t("onboarding.chaptersBody"),
    },
    {
      id: "3",
      icon: "bookmark",
      title: t("onboarding.saveTitle"),
      subtitle: t("onboarding.saveSubtitle"),
      description: t("onboarding.saveBody"),
    },
    {
      id: "4",
      icon: "headset",
      title: t("onboarding.listenTitle"),
      subtitle: t("onboarding.listenSubtitle"),
      description: t("onboarding.listenBody"),
    },
    {
      id: "5",
      icon: "notifications",
      title: t("onboarding.reminderTitle"),
      subtitle: t("onboarding.reminderSubtitle"),
      description: t("onboarding.reminderBody"),
      kind: "reminder",
    },
  ];
}

function formatChipLabel(time: string, locale: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  // Locale-aware so the first screen doesn't read "8:00 AM" in Telugu.
  return d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
}

export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const { language, setLanguage } = useContentLanguage();
  const { t } = useTranslation();
  const slides = useMemo(() => getSlides(t), [t]);
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  // Horizontal lists don't stretch items to full height on web; size slides
  // from the list's measured height so content stays vertically centred.
  const [listHeight, setListHeight] = useState<number | undefined>(undefined);
  const [reminderTime, setReminderTime] = useState<string>("08:00");
  const [enablingReminder, setEnablingReminder] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const goToNextSlide = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const completeOnboarding = async () => {
    try {
      haptics.success();
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
        // Settings explains a denial; the first-run ask must too (review
        // finding P1), otherwise the tap appears to do nothing.
        Alert.alert(
          t("settings.notificationsDisabledTitle"),
          t("settings.notificationsDisabledBody")
        );
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
    await completeOnboarding();
  };

  const isReminderSlide = slides[currentIndex]?.kind === "reminder";

  const renderSlide = ({ item }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH, height: listHeight }]}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.primary + "14" },
          ]}
        >
          <Ionicons name={item.icon} size={40} color={colors.brandText} />
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: colors.textMuted, letterSpacing: tracking(language, 0.8) },
            ]}
          >
            {item.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.brandText }]}>
            {item.kind === "language" ? getAppTitle(language) : item.subtitle}
          </Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {item.description}
          </Text>

          {item.kind === "language" && (
            <View style={styles.timeChips}>
              {CONTENT_LANGUAGES.map((opt) => (
                <SelectableChip
                  key={opt.code}
                  label={opt.nativeLabel}
                  selected={language === opt.code}
                  onPressIn={haptics.light}
                  onPress={() => {
                    haptics.selection();
                    setLanguage(opt.code);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={getLanguageLabel(opt.code, language)}
                  containerStyle={styles.timeChip}
                  labelStyle={styles.timeChipText}
                  palette={{
                    idleBackground: colors.background,
                    activeBackground: colors.brandText,
                    idleBorder: colors.outline + "55",
                    activeBorder: colors.brandText,
                    idleText: colors.textMuted,
                    activeText: colors.onPrimary,
                  }}
                />
              ))}
            </View>
          )}

          {item.kind === "reminder" && (
            <View style={styles.timeChips}>
              {REMINDER_TIMES.map((time) => (
                <SelectableChip
                  key={time}
                  label={formatChipLabel(time, INTL_LOCALES[language])}
                  selected={reminderTime === time}
                  onPressIn={haptics.light}
                  onPress={() => {
                    haptics.selection();
                    setReminderTime(time);
                  }}
                  accessibilityRole="radio"
                  containerStyle={styles.timeChip}
                  labelStyle={styles.timeChipText}
                  palette={{
                    idleBackground: colors.background,
                    activeBackground: colors.brandText,
                    idleBorder: colors.outline + "55",
                    activeBorder: colors.brandText,
                    idleText: colors.textMuted,
                    activeText: colors.onPrimary,
                  }}
                />
              ))}
            </View>
          )}
        </View>
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
          color={colors.brandText}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Animated.View
        entering={FadeIn.delay(600)}
        style={[styles.skipContainer, { top: Math.max(insets.top, 12) + 8 }]}
      >
        <Pressable onPressIn={haptics.light} onPress={skipOnboarding} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>
            {t("onboarding.skip")}
          </Text>
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
        onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
      />

      <Animated.View
        entering={FadeInDown.delay(500).springify()}
        style={styles.bottomSection}
      >
        {renderPagination()}

        {isReminderSlide ? (
          <View style={styles.reminderActions}>
            <Pressable
              onPressIn={haptics.light}
              onPress={enableReminderAndFinish}
              disabled={enablingReminder}
              style={[styles.actionButton, { backgroundColor: colors.brandText }]}
            >
              <Text style={[styles.actionButtonText, { color: colors.onPrimary }]}>
                {enablingReminder
                  ? t("onboarding.enabling")
                  : t("onboarding.enableReminders")}
              </Text>
              <Ionicons
                name="checkmark"
                size={18}
                color={colors.onPrimary}
                style={{ marginLeft: 8 }}
              />
            </Pressable>
            <Pressable onPressIn={haptics.light} onPress={skipReminderAndFinish} style={styles.secondaryAction}>
              <Text style={[styles.secondaryActionText, { color: colors.textMuted }]}>
                {t("onboarding.notNow")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPressIn={haptics.light}
            onPress={goToNextSlide}
            style={[styles.actionButton, { backgroundColor: colors.brandText }]}
          >
            <Text style={[styles.actionButtonText, { color: colors.onPrimary }]}>
              {t("onboarding.next")}
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
    borderWidth: 1,
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
    width: 6,
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
