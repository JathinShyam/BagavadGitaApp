import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import Animated, {
  FadeInUp,
  FadeIn,
  ZoomIn,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Text } from "react-native-paper";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { indexstyles } from "../styles";
import { useAppTheme } from "../hooks/useAppTheme";
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

  return (
    <SafeAreaView
      style={[indexstyles.container, { backgroundColor: colors.background }]}
    >
      <View style={indexstyles.header}>
        <Text style={[indexstyles.title, { color: colors.primary }]}>
          భగవద్గీత
        </Text>
        <Text style={[indexstyles.subtitle, { color: colors.textMuted }]}>
          Bhagavad Gita
        </Text>
      </View>

      <ScrollView contentContainerStyle={indexstyles.scrollContainer}>
        <View style={indexstyles.bookshelfContainer}>
          {chapterPairs.map((pair, index) => (
            <View key={index} style={indexstyles.shelfRow}>
              {pair.map(
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
              {pair.length === 1 && <View style={indexstyles.emptySlot} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
