// app/chapter/[id].tsx

import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Link, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { chapter1 } from "../verse/chapter1";

// This would eventually come from your data source
const getChapterData = (id: string) => ({
  id: parseInt(id),
  name: "Arjuna's Dilemma",
  sanskrit_name: "अर्जुनविषादयोग",
  description:
    "The first chapter of the Bhagavad Gita introduces the setting of the epic dialogue...",
  verses: chapter1,
});

export default function ChapterScreen() {
  const { id } = useLocalSearchParams();
  const chapter = getChapterData(id as string);

  const renderVerse = ({
    item,
  }: {
    item: {
      id: number;
      chapter: number;
      verse_number: number;
      teluguSloka: string;
      meaning: string;
      word_meanings: string;
      commentary: string;
    };
  }) => (
    <Link href={`/verse/${chapter.id}-${item.verse_number}`} asChild>
      <Pressable style={styles.verseCard}>
        <View style={styles.verseContent}>
          <Text style={styles.verseNumber}>Verse {item.verse_number}</Text>
          {/* <Text style={styles.sanskritText}>{item.sanskrit}</Text> */}
          <Text style={styles.teluguSloka}>{item.teluguSloka}</Text>
          {/* <Text style={styles.translation}>{item.translation}</Text> */}
        </View>
      </Pressable>
    </Link>
  );

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.header}>
        <Text style={styles.sanskritName}>{chapter.sanskrit_name}</Text>
        <Text style={styles.chapterName}>{chapter.name}</Text>
        <Text style={styles.description}>{chapter.description}</Text>
      </View>

      <FlatList
        data={chapter.verses}
        renderItem={renderVerse}
        keyExtractor={(item) => item.verse_number.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8E7",
  },
  header: {
    padding: 20,
    backgroundColor: "#FFF8E7",
  },
  sanskritName: {
    fontSize: 24,
    color: "#4A3200",
    marginBottom: 8,
    textAlign: "center",
  },
  chapterName: {
    fontSize: 18,
    color: "#4A3200",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    textAlign: "justify",
  },
  listContainer: {
    padding: 16,
  },
  verseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  verseContent: {
    padding: 16,
  },
  verseNumber: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 8,
  },
  //   sanskritText: {
  //     fontSize: 18,
  //     color: "#4A3200",
  //     marginBottom: 8,
  //   },
  teluguSloka: {
    fontSize: 14,
    color: "#666666",
    fontStyle: "italic",
    marginBottom: 8,
  },
  translation: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 24,
  },
});
