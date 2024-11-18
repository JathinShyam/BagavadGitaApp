// app/chapter/[id].tsx

import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Link, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

// Chapters
import { chapter1 } from "../verse/chapter1";
import { chapter2 } from "../verse/chapter2";
import { chapter3 } from "../verse/chapter3";
import { chapter4 } from "../verse/chapter4";
import { chapter5 } from "../verse/chapter5";
import { chapter6 } from "../verse/chapter6";
import { chapter7 } from "../verse/chapter7";
import { chapter8 } from "../verse/chapter8";
import { chapter9 } from "../verse/chapter9";
import { chapter10 } from "../verse/chapter10";
import { chapter11 } from "../verse/chapter11";
import { chapter12 } from "../verse/chapter12";
import { chapter13 } from "../verse/chapter13";
import { chapter14 } from "../verse/chapter14";
import { chapter15 } from "../verse/chapter15";
import { chapter16 } from "../verse/chapter16";
import { chapter17 } from "../verse/chapter17";

// Styles
import { chapterstyles } from "../styles";

// This would eventually come from your data source
const getChapterData = (id: string) => {
  const chapters = [
    {
      id: 1,
      chapter_number: "1వ అధ్యాయము",
      yogam_name: "అర్జున విషాద యోగము",
      description:
        "The first chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter1,
    },
    {
      id: 2,
      chapter_number: "2వ అధ్యాయము",
      yogam_name: "సాంఖ్య యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter2,
    },
    {
      id: 3,
      chapter_number: "3వ అధ్యాయము",
      yogam_name: "కర్మ యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter3,
    },
    {
      id: 4,
      chapter_number: "4వ అధ్యాయము",
      yogam_name: "జ్ఞాన, కర్మ, సన్న్యాస యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter4,
    },
    {
      id: 5,
      chapter_number: "5వ అధ్యాయము",
      yogam_name: "కర్మ సన్యాస యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter5,
    },
    {
      id: 6,
      chapter_number: "6వ అధ్యాయము",
      yogam_name: "ధ్యాన యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter6,
    },
    {
      id: 7,
      chapter_number: "7వ అధ్యాయము",
      yogam_name: "జ్ఞాన విజ్ఞాన యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter7,
    },
    {
      id: 8,
      chapter_number: "8వ అధ్యాయము",
      yogam_name: "అక్షర బ్రహ్మ యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter8,
    },
    {
      id: 9,
      chapter_number: "9వ అధ్యాయము",
      yogam_name: "రాజ విద్యా యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter9,
    },
    {
      id: 10,
      chapter_number: "10వ అధ్యాయము",
      yogam_name: "విభూతి యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter10,
    },
    {
      id: 11,
      chapter_number: "11వ అధ్యాయము",
      yogam_name: "విశ్వ రూప దర్శన యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter11,
    },
    {
      id: 12,
      chapter_number: "12వ అధ్యాయము",
      yogam_name: "భక్తి యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter12,
    },
    {
      id: 13,
      chapter_number: "13వ అధ్యాయము",
      yogam_name: "క్షేత్ర క్షేత్రజ్ఞ విభాగ యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter13,
    },
    {
      id: 14,
      chapter_number: "14వ అధ్యాయము",
      yogam_name: "గుణత్రయ విభాగ యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter14,
    },
    {
      id: 15,
      chapter_number: "15వ అధ్యాయము",
      yogam_name: "పురుషోత్తమ యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter15,
    },
    {
      id: 16,
      chapter_number: "16వ అధ్యాయము",
      yogam_name: "దైవాసుర సంపద్విభాగ యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter16,
    },
    {
      id: 17,
      chapter_number: "17వ అధ్యాయము",
      yogam_name: "శ్రద్ధా త్రయ విభాగ యోగము",
      description:
        "The second chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
      verses: chapter17,
    },
  ];

  return chapters.find((chapter) => chapter.id === parseInt(id));
};

export default function ChapterScreen() {
  const { id } = useLocalSearchParams();
  const chapter = getChapterData(id as string);

  const renderVerse = ({
    item,
  }: {
    item: {
      id: string;
      chapter: number;
      verse_number: string;
      teluguSloka: string;
      meaning: string;
      word_meanings: { word: string; meaning: string }[];
      commentary: string;
    };
  }) => {
    if (!chapter) return null;
    return (
      <Link href={`/verse/${chapter.id}-${item.verse_number}`} asChild>
        <Pressable style={chapterstyles.verseCard}>
          <View style={chapterstyles.verseContent}>
            <Text style={chapterstyles.verseNumber}>
              Verse {item.verse_number}
            </Text>
            {/* <Text style={chapterstyles.sanskritText}>{item.sanskrit}</Text> */}
            <Text style={chapterstyles.teluguSloka}>{item.teluguSloka}</Text>
            {/* <Text style={chapterstyles.translation}>{item.translation}</Text> */}
          </View>
        </Pressable>
      </Link>
    );
  };

  if (!chapter) {
    return (
      <SafeAreaView style={chapterstyles.container}>
        <Text>Chapter not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={chapterstyles.container}>
      <Stack.Screen
        options={{
          headerTitle: `Chapter ${chapter.id}`,
          headerShown: true,
          headerStyle: {
            backgroundColor: "#FFF8E7",
          },
          headerShadowVisible: false,
        }}
      />

      <View style={chapterstyles.header}>
        <Text style={chapterstyles.chapterName}>{chapter.chapter_number}</Text>
        <Text style={chapterstyles.sanskritName}>{chapter.yogam_name}</Text>
        <Text style={chapterstyles.description}>{chapter.description}</Text>
      </View>

      <FlatList
        data={chapter.verses}
        renderItem={renderVerse}
        keyExtractor={(item) => item.verse_number.toString()}
        contentContainerStyle={chapterstyles.listContainer}
      />
    </SafeAreaView>
  );
}
