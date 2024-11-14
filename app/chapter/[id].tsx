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
