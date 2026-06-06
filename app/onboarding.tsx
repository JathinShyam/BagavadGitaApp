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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
      [8, 24, 8],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
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
];

export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
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

  const skipOnboarding = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await completeOnboarding();
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {/* Icon Container */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.iconWrapper}
        >
          <View
            style={[
              styles.iconCircleLarge,
              { backgroundColor: colors.primary + "10" },
            ]}
          />
          <View
            style={[
              styles.iconCircleMedium,
              { backgroundColor: colors.primary + "20" },
            ]}
          />
          <View
            style={[styles.iconContainer, { backgroundColor: colors.primary + "30" }]}
          >
            <Ionicons name={item.icon} size={72} color={colors.primary} />
          </View>
        </Animated.View>

        {/* Text Content */}
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
          <Text style={[styles.description, { color: colors.text }]}>
            {item.description}
          </Text>
        </Animated.View>
      </View>
    );
  };

  // Pagination dots
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
      {/* Skip Button */}
      <Animated.View
        entering={FadeIn.delay(600)}
        style={styles.skipContainer}
      >
        <Pressable onPress={skipOnboarding} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>
            Skip
          </Text>
        </Pressable>
      </Animated.View>

      {/* Slides */}
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

      {/* Bottom Section */}
      <Animated.View
        entering={FadeInDown.delay(500).springify()}
        style={styles.bottomSection}
      >
        {renderPagination()}

        {/* Action Button */}
        <Pressable
          onPress={
            currentIndex === slides.length - 1 ? completeOnboarding : goToNextSlide
          }
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.actionButtonText, { color: colors.onPrimary }]}>
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
          <Ionicons
            name={
              currentIndex === slides.length - 1
                ? "checkmark"
                : "arrow-forward"
            }
            size={20}
            color={colors.onPrimary}
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </Animated.View>

      {/* Decorative elements */}
      <View style={styles.decorations}>
        <View
          style={[
            styles.decorCircle,
            styles.decorCircle1,
            { backgroundColor: colors.primary + "08" },
          ]}
        />
        <View
          style={[
            styles.decorCircle,
            styles.decorCircle2,
            { backgroundColor: colors.primary + "05" },
          ]}
        />
      </View>
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
    fontSize: 16,
    fontWeight: "500",
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
  },
  iconCircleLarge: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  iconCircleMedium: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
    maxWidth: 320,
  },
  bottomSection: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  decorations: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  decorCircle: {
    position: "absolute",
    borderRadius: 999,
  },
  decorCircle1: {
    width: 300,
    height: 300,
    top: -100,
    left: -100,
  },
  decorCircle2: {
    width: 250,
    height: 250,
    bottom: 100,
    right: -80,
  },
});
