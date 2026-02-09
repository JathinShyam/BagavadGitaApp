import {
  View,
  Image,
  FlatList,
  StyleSheet,
  Pressable,
  Dimensions,
  RefreshControl,
} from "react-native";
import Animated, {
  FadeInUp,
  FadeIn,
  ZoomIn,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { Text } from "react-native-paper";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

import { indexstyles } from "../styles";
import { useAppTheme } from "../hooks/useAppTheme";
import ShuffleModal from "../../components/ShuffleModal";
/*
TODO:
  - Add read chapter button
  x Add chapter description
  x Add chapter image
  - Add chapter audio
  - Add chapter video
  - Add social sharing
  - Add social login and save activity
  - Add chapter progress
*/

// Chapter data with added image paths
const chapters = [
  {
    id: 1,
    telugu_name: "అర్జున విషాద యోగము",
    verses: 47,
    image: require("../../assets/images/chapter1.png"),
  },
  {
    id: 2,
    telugu_name: "సాంఖ్య యోగము",
    verses: 72,
    image: require("../../assets/images/chapter2.png"),
  },
  {
    id: 3,
    telugu_name: "కర్మ యోగము",
    verses: 43,
    image: require("../../assets/images/chapter3.png"),
  },
  {
    id: 4,
    telugu_name: "జ్ఞాన, కర్మ, సన్న్యాస యోగము",
    verses: 42,
    image: require("../../assets/images/chapter4.png"),
  },
  {
    id: 5,
    telugu_name: "కర్మ సన్యాస యోగము",
    verses: 29,
    image: require("../../assets/images/chapter5.png"),
  },
  {
    id: 6,
    telugu_name: "ధ్యాన యోగము",
    verses: 47,
    image: require("../../assets/images/chapter6.png"),
  },
  {
    id: 7,
    telugu_name: "జ్ఞాన విజ్ఞాన యోగము",
    verses: 30,
    image: require("../../assets/images/chapter7.png"),
  },
  {
    id: 8,
    telugu_name: "అక్షర బ్రహ్మ యోగము",
    verses: 28,
    image: require("../../assets/images/chapter8.png"),
  },
  {
    id: 9,
    telugu_name: "రాజ విద్యా యోగము",
    verses: 34,
    image: require("../../assets/images/chapter9.png"),
  },
  {
    id: 10,
    telugu_name: "విభూతి యోగము",
    verses: 42,
    image: require("../../assets/images/chapter10.png"),
  },
  {
    id: 11,
    telugu_name: "విశ్వ రూప దర్శన యోగము",
    verses: 55,
    image: require("../../assets/images/chapter11.png"),
  },
  {
    id: 12,
    telugu_name: "భక్తి యోగము",
    verses: 20,
    image: require("../../assets/images/chapter12.png"),
  },
  {
    id: 13,
    telugu_name: "క్షేత్ర క్షేత్రజ్ఞ విభాగ యోగము",
    verses: 35,
    image: require("../../assets/images/chapter13.png"),
  },
  {
    id: 14,
    telugu_name: "గుణత్రయ విభాగ యోగము",
    verses: 27,
    image: require("../../assets/images/chapter14.png"),
  },
  {
    id: 15,
    telugu_name: "పురుషోత్తమ యోగము",
    verses: 20,
    image: require("../../assets/images/chapter15.png"),
  },
  {
    id: 16,
    telugu_name: "దైవాసుర సంపద్విభాగ యోగము",
    verses: 24,
    image: require("../../assets/images/chapter16.png"),
  },
  {
    id: 17,
    telugu_name: "శ్రద్ధా త్రయ విభాగ యోగము",
    verses: 28,
    image: require("../../assets/images/chapter17.png"),
  },
  {
    id: 18,
    telugu_name: "మోక్ష సన్యాస యోగము",
    verses: 78,
    image: require("../../assets/images/chapter18.png"),
  },
];

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showShuffleModal, setShowShuffleModal] = useState(false);
  const fabScale = useSharedValue(1);
  const fabRotate = useSharedValue(0);
  const fabGlow = useSharedValue(0.3);

  // Subtle pulsing glow animation for FAB
  useEffect(() => {
    fabGlow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Simulate refresh - data is static but provides good UX feedback
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const openShuffleModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Animate FAB before opening modal
    fabScale.value = withSequence(
      withTiming(0.85, { duration: 100 }),
      withTiming(1.1, { duration: 150 }),
      withTiming(1, { duration: 100 })
    );
    fabRotate.value = withSequence(
      withTiming(180, { duration: 300 }),
      withTiming(360, { duration: 300 })
    );
    
    setTimeout(() => {
      setShowShuffleModal(true);
      fabRotate.value = 0;
    }, 200);
  }, []);

  const handleShuffleComplete = useCallback((chapterId: number, verseId: string) => {
    setShowShuffleModal(false);
    router.push(`/verse/${chapterId}-${verseId}`);
  }, [router]);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { rotate: `${fabRotate.value}deg` },
    ],
    shadowOpacity: fabGlow.value,
  }));

  const getPairs = () => {
    const pairs = [] as any[];
    for (let i = 0; i < chapters.length; i += 2) {
      if (i + 1 < chapters.length) {
        pairs.push([chapters[i], chapters[i + 1]]);
      } else {
        pairs.push([chapters[i]]);
      }
    }
    return pairs;
  };

  const chapterPairs = getPairs();

  const renderChapterCard = (
    chapter: { id: number; telugu_name: string; verses: number; image: any },
    idx?: number
  ) => (
    <Link href={`/chapter/${chapter.id}`} asChild key={chapter.id}>
      <Pressable
        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        style={{ flex: 1 }}
      >
        <Animated.View
          entering={FadeInUp.delay((idx ?? 0) * 60).springify()}
          style={[
            indexstyles.chapterCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Image source={chapter.image} style={indexstyles.chapterImage} />
          <View
            style={[
              indexstyles.cardContent,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[indexstyles.chapterNumber, { color: colors.textMuted }]}
            >
              {chapter.id}వ అధ్యాయము
            </Text>
            <Text
              style={[indexstyles.sanskritName, { color: colors.text }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {chapter.telugu_name}
            </Text>
            <Text style={[indexstyles.versesCount, { color: colors.primary }]}>
              {chapter.verses} verses
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Link>
  );

  const renderPair = ({ item, index }: { item: any[]; index: number }) => (
    <View style={indexstyles.shelfRow}>
      {item.map(
        (
          chapter: {
            id: number;
            telugu_name: string;
            verses: number;
            image: any;
          },
          i: number
        ) => renderChapterCard(chapter, index * 2 + i)
      )}
      {item.length === 1 && <View style={indexstyles.emptySlot} />}
    </View>
  );

  const ListHeader = () => (
    <View style={indexstyles.header}>
      <Text style={[indexstyles.title, { color: colors.primary }]}>
        భగవద్గీత
      </Text>
      <Text style={[indexstyles.subtitle, { color: colors.textMuted }]}>
        Bhagavad Gita
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[indexstyles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={chapterPairs}
        renderItem={renderPair}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={indexstyles.scrollContainer}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      {/* Divine Shuffle FAB */}
      <Animated.View style={[fabStyles.fabContainer, fabAnimatedStyle]}>
        <Pressable
          onPress={openShuffleModal}
          style={[fabStyles.fab, { backgroundColor: colors.primary }]}
        >
          <View style={fabStyles.fabContent}>
            <Ionicons name="sparkles" size={22} color={colors.onPrimary} />
            <Text style={[fabStyles.fabLabel, { color: colors.onPrimary }]}>
              Surprise
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      {/* Shuffle Modal */}
      <ShuffleModal
        visible={showShuffleModal}
        onComplete={handleShuffleComplete}
        onClose={() => setShowShuffleModal(false)}
      />
    </SafeAreaView>
  );
}

const fabStyles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    right: 16,
    bottom: 85,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 10,
  },
  fab: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  fabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
