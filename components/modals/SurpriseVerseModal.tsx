// components/SurpriseVerseModal.tsx

import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, StyleSheet, Dimensions, Pressable, Image } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInUp,
  ZoomIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/hooks/useAppTheme";
import { LinearGradient } from "expo-linear-gradient";
import { VERSE_SEQUENCES } from "@/constants/verse-sequences";
import { CHAPTER_IMAGES } from "@/constants/chapter-images";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SurpriseVerseModalProps {
  visible: boolean;
  onComplete: (chapterId: number, verseId: string) => void;
  onClose: () => void;
}

// Chapter data for shuffle
const chapters = [
  { id: 1, name: "అర్జున విషాద యోగము", englishName: "Arjuna Vishada Yoga", verses: 47 },
  { id: 2, name: "సాంఖ్య యోగము", englishName: "Sankhya Yoga", verses: 72 },
  { id: 3, name: "కర్మ యోగము", englishName: "Karma Yoga", verses: 43 },
  { id: 4, name: "జ్ఞాన కర్మ సన్న్యాస యోగము", englishName: "Jnana Karma Sanyasa Yoga", verses: 42 },
  { id: 5, name: "కర్మ సన్యాస యోగము", englishName: "Karma Sanyasa Yoga", verses: 29 },
  { id: 6, name: "ధ్యాన యోగము", englishName: "Dhyana Yoga", verses: 47 },
  { id: 7, name: "జ్ఞాన విజ్ఞాన యోగము", englishName: "Jnana Vijnana Yoga", verses: 30 },
  { id: 8, name: "అక్షర బ్రహ్మ యోగము", englishName: "Akshara Brahma Yoga", verses: 28 },
  { id: 9, name: "రాజ విద్యా యోగము", englishName: "Raja Vidya Yoga", verses: 34 },
  { id: 10, name: "విభూతి యోగము", englishName: "Vibhuti Yoga", verses: 42 },
  { id: 11, name: "విశ్వ రూప దర్శన యోగము", englishName: "Vishwarupa Darshana Yoga", verses: 55 },
  { id: 12, name: "భక్తి యోగము", englishName: "Bhakti Yoga", verses: 20 },
  { id: 13, name: "క్షేత్ర క్షేత్రజ్ఞ విభాగ యోగము", englishName: "Kshetra Kshetrajna Yoga", verses: 35 },
  { id: 14, name: "గుణత్రయ విభాగ యోగము", englishName: "Gunatraya Vibhaga Yoga", verses: 27 },
  { id: 15, name: "పురుషోత్తమ యోగము", englishName: "Purushottama Yoga", verses: 20 },
  { id: 16, name: "దైవాసుర సంపద్విభాగ యోగము", englishName: "Daivasura Sampad Yoga", verses: 24 },
  { id: 17, name: "శ్రద్ధా త్రయ విభాగ యోగము", englishName: "Shraddhatraya Vibhaga Yoga", verses: 28 },
  { id: 18, name: "మోక్ష సన్యాస యోగము", englishName: "Moksha Sanyasa Yoga", verses: 78 },
];

// Shuffling card component with chapter image
const ShuffleCard: React.FC<{
  chapter: number;
  verse: string;
  index: number;
  isActive: boolean;
  isFinal: boolean;
}> = ({ chapter, verse, index, isActive, isFinal }) => {
  const { colors, isDark } = useAppTheme();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const translateY = useSharedValue(50);
  const imageScale = useSharedValue(1);
  const borderGlow = useSharedValue(0);

  const chapterData = chapters[chapter - 1];

  useEffect(() => {
    if (isActive) {
      opacity.value = withTiming(1, { duration: 100 });
      scale.value = withSequence(
        withTiming(1.05, { duration: 60 }),
        withTiming(0.98, { duration: 60 }),
        withTiming(1, { duration: 60 })
      );
      rotateY.value = withSequence(
        withTiming(12, { duration: 40 }),
        withTiming(-12, { duration: 40 }),
        withTiming(0, { duration: 40 })
      );
      rotateZ.value = withSequence(
        withTiming(2, { duration: 40 }),
        withTiming(-2, { duration: 40 }),
        withTiming(0, { duration: 40 })
      );
      translateY.value = withSpring(0, { damping: 15 });
      imageScale.value = withSequence(
        withTiming(1.1, { duration: 60 }),
        withTiming(1, { duration: 60 })
      );
    } else if (isFinal) {
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 10, stiffness: 80 });
      translateY.value = withSpring(0, { damping: 12 });
      imageScale.value = withTiming(1.05, { duration: 600 });
      borderGlow.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.6, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
    } else {
      opacity.value = withTiming(0.3, { duration: 100 });
      scale.value = withTiming(0.85, { duration: 100 });
    }
  }, [isActive, isFinal]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { perspective: 1000 },
      { rotateY: `${rotateY.value}deg` },
      { rotateZ: `${rotateZ.value}deg` },
      { translateY: translateY.value },
    ],
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(borderGlow.value, [0, 1], [0.3, 0.8]),
    borderWidth: interpolate(borderGlow.value, [0, 1], [2, 3]),
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        {
          borderColor: isFinal ? colors.primary : colors.outline,
          shadowColor: isFinal ? colors.primary : "#000",
        },
        animatedStyle,
        isFinal && glowStyle,
      ]}
    >
      {/* Chapter Image */}
      <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
        <Image
          source={CHAPTER_IMAGES[chapter]}
          style={styles.chapterImage}
          resizeMode="cover"
        />
        {/* Gradient overlay */}
        <LinearGradient
          colors={[
            "transparent",
            isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
            isDark ? "rgba(0,0,0,0.95)" : "rgba(0,0,0,0.85)",
          ]}
          style={styles.imageGradient}
        />
      </Animated.View>

      {/* Content overlay */}
      <View style={styles.cardContent}>
        {/* Chapter badge */}
        <View style={[styles.chapterBadge, { backgroundColor: colors.primary + "E6" }]}>
          <Text style={[styles.chapterBadgeText, { color: colors.onPrimary }]}>
            Chapter {chapter}
          </Text>
        </View>

        {/* Verse number - prominent display */}
        <View style={styles.verseSection}>
          <Text style={styles.verseLabel}>Verse</Text>
          <Text style={styles.verseNumber}>{verse}</Text>
        </View>

        {/* Chapter name */}
        {isFinal && chapterData && (
          <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.chapterNameContainer}>
            <Text style={styles.chapterNameTelugu} numberOfLines={1}>
              {chapterData.name}
            </Text>
            <Text style={styles.chapterNameEnglish} numberOfLines={1}>
              {chapterData.englishName}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Decorative corner accents for final state */}
      {isFinal && (
        <>
          <Animated.View 
            entering={ZoomIn.delay(300)} 
            style={[styles.cornerAccent, styles.cornerTopLeft, { borderColor: colors.primary }]} 
          />
          <Animated.View 
            entering={ZoomIn.delay(350)} 
            style={[styles.cornerAccent, styles.cornerTopRight, { borderColor: colors.primary }]} 
          />
          <Animated.View 
            entering={ZoomIn.delay(400)} 
            style={[styles.cornerAccent, styles.cornerBottomLeft, { borderColor: colors.primary }]} 
          />
          <Animated.View 
            entering={ZoomIn.delay(450)} 
            style={[styles.cornerAccent, styles.cornerBottomRight, { borderColor: colors.primary }]} 
          />
        </>
      )}
    </Animated.View>
  );
};

// Sparkle particle component
const Sparkle: React.FC<{ delay: number; startX: number; startY: number }> = ({
  delay,
  startX,
  startY,
}) => {
  const { colors } = useAppTheme();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 80;

    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 400 })
      )
    );
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1, { damping: 8 }),
        withTiming(0, { duration: 300 })
      )
    );
    translateX.value = withDelay(
      delay,
      withTiming(Math.cos(angle) * distance, { duration: 600 })
    );
    translateY.value = withDelay(
      delay,
      withTiming(Math.sin(angle) * distance, { duration: 600 })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: startX + translateX.value },
      { translateY: startY + translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.sparkle, animatedStyle]}>
      <Ionicons name="sparkles" size={16} color={colors.primary} />
    </Animated.View>
  );
};

// Build a flat list of ALL valid verses for truly random selection
// This ensures every verse across all chapters has equal probability
const ALL_VERSES: { chapter: number; verse: string }[] = [];
Object.entries(VERSE_SEQUENCES).forEach(([chapterId, verses]) => {
  verses.forEach((verse) => {
    ALL_VERSES.push({ chapter: parseInt(chapterId), verse });
  });
});
// Total: ~574 verse entries across 18 chapters (some combined like 7-8 count as one entry)

const SurpriseVerseModal: React.FC<SurpriseVerseModalProps> = ({
  visible,
  onComplete,
  onClose,
}) => {
  const { colors, isDark } = useAppTheme();
  const [isShuffling, setIsShuffling] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState({ chapter: 1, verse: "1" });
  const [finalSelection, setFinalSelection] = useState<{
    chapter: number;
    verse: string;
  } | null>(null);
  const [showSparkles, setShowSparkles] = useState(false);
  const intervalIdsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const backdropOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0.8);
  const iconRotation = useSharedValue(0);

  // Generate a truly random verse - every verse has equal probability
  const generateRandomVerse = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * ALL_VERSES.length);
    return ALL_VERSES[randomIndex];
  }, []);

  const clearAllIntervals = useCallback(() => {
    intervalIdsRef.current.forEach((id) => clearInterval(id));
    intervalIdsRef.current = [];
  }, []);

  const startShuffle = useCallback(() => {
    clearAllIntervals();
    setIsShuffling(true);
    setFinalSelection(null);
    setShowSparkles(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Spin the icon
    iconRotation.value = withSequence(
      withTiming(360 * 3, { duration: 1500, easing: Easing.out(Easing.cubic) }),
      withTiming(360 * 3 + 360, { duration: 500 })
    );

    // Rapid shuffle through random verses
    let shuffleCount = 0;
    const maxShuffles = 15;
    const shuffleInterval = setInterval(() => {
      const random = generateRandomVerse();
      setCurrentDisplay(random);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      shuffleCount++;

      if (shuffleCount >= maxShuffles) {
        clearInterval(shuffleInterval);
        intervalIdsRef.current = intervalIdsRef.current.filter((id) => id !== shuffleInterval);

        // Slow down phase
        let slowCount = 0;
        const slowShuffles = 5;
        const slowInterval = setInterval(() => {
          const random = generateRandomVerse();
          setCurrentDisplay(random);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          slowCount++;

          if (slowCount >= slowShuffles) {
            clearInterval(slowInterval);
            intervalIdsRef.current = intervalIdsRef.current.filter((id) => id !== slowInterval);

            // Final selection - pick a valid verse
            const final = generateRandomVerse();
            setCurrentDisplay(final);
            setFinalSelection(final);
            setIsShuffling(false);
            setShowSparkles(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }, 200);
        intervalIdsRef.current.push(slowInterval);
      }
    }, 80);
    intervalIdsRef.current.push(shuffleInterval);
  }, [generateRandomVerse, clearAllIntervals]);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 300 });
      containerScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      const startTimer = setTimeout(startShuffle, 300);
      return () => {
        clearTimeout(startTimer);
        clearAllIntervals();
      };
    } else {
      clearAllIntervals();
      backdropOpacity.value = withTiming(0, { duration: 200 });
      containerScale.value = withTiming(0.8, { duration: 200 });
      setFinalSelection(null);
      setShowSparkles(false);
      iconRotation.value = 0;
    }
  }, [visible, startShuffle, clearAllIntervals]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.backdrop,
          { backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.75)" },
          backdropStyle,
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.container, containerStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={[styles.iconWrapper, iconStyle]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + "20" }]}>
              <Ionicons name="sparkles" size={32} color={colors.primary} />
            </View>
          </Animated.View>
          <Text style={[styles.title, { color: colors.text }]}>
            {isShuffling ? "Discovering..." : finalSelection ? "Divine Selection" : "Divine Shuffle"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {isShuffling ? "Let the universe guide you" : finalSelection ? "Your verse has been revealed" : ""}
          </Text>
        </View>

        {/* Shuffle Card Display */}
        <View style={styles.cardContainer}>
          <ShuffleCard
            chapter={currentDisplay.chapter}
            verse={currentDisplay.verse}
            index={0}
            isActive={isShuffling}
            isFinal={!!finalSelection}
          />

          {/* Sparkles around the card when final */}
          {showSparkles &&
            Array.from({ length: 16 }).map((_, i) => (
              <Sparkle
                key={i}
                delay={i * 40}
                startX={0}
                startY={0}
              />
            ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {finalSelection ? (
            <Animated.View entering={SlideInUp.delay(400).springify()}>
              <Pressable
                onPress={() => onComplete(finalSelection.chapter, finalSelection.verse)}
                style={[styles.goButton, { backgroundColor: colors.primary }]}
                accessibilityLabel="Open verse"
                accessibilityRole="button"
              >
                <Ionicons name="book-outline" size={20} color={colors.onPrimary} />
                <Text style={[styles.goButtonText, { color: colors.onPrimary }]}>
                  Open Verse
                </Text>
                <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
              </Pressable>
            </Animated.View>
          ) : (
            <View style={styles.shufflingIndicator}>
              {[0, 1, 2].map((i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    { 
                      backgroundColor: colors.primary,
                      opacity: 1 - (i * 0.25),
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Shuffle again button */}
        {finalSelection && (
          <Animated.View entering={FadeIn.delay(600)}>
            <Pressable
              onPress={startShuffle}
              style={[styles.shuffleAgain, { borderColor: colors.outline, backgroundColor: colors.surface }]}
              accessibilityLabel="Try another random verse"
              accessibilityRole="button"
            >
              <Ionicons name="shuffle" size={18} color={colors.primary} />
              <Text style={[styles.shuffleAgainText, { color: colors.text }]}>
                Try Another
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Close button */}
        <Pressable
          style={[styles.closeButton, { backgroundColor: colors.surface + "CC" }]}
          onPress={onClose}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 360,
    backgroundColor: "transparent",
    alignItems: "center",
    paddingVertical: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconWrapper: {
    marginBottom: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
    fontStyle: "italic",
  },
  cardContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 320,
    width: "100%",
    position: "relative",
  },
  card: {
    width: SCREEN_WIDTH * 0.75,
    maxWidth: 300,
    height: 280,
    borderRadius: 20,
    borderWidth: 2,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chapterImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  chapterBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chapterBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  verseSection: {
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 8,
  },
  verseLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  verseNumber: {
    fontSize: 56,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  chapterNameContainer: {
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  chapterNameTelugu: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  chapterNameEnglish: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
    textAlign: "center",
  },
  cornerAccent: {
    position: "absolute",
    width: 20,
    height: 20,
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: -4,
    left: -4,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: -4,
    right: -4,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: -4,
    left: -4,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: -4,
    right: -4,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  sparkle: {
    position: "absolute",
  },
  actions: {
    marginTop: 24,
    height: 56,
    justifyContent: "center",
  },
  goButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  goButtonText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  shufflingIndicator: {
    flexDirection: "row",
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  shuffleAgain: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  shuffleAgainText: {
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SurpriseVerseModal;
