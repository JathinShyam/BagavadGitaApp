// app/(tabs)/index.tsx

import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

/*
TODO:
  - Add read chaper button
  - Add chapter description
  - Add chapter image
  - Add chapter audio
  - Add chapter video
  - Add social sharing
  - Add social login and save activity
  - Add chapter progress


*/

// Chapter data
const chapters = [
  {
    id: 1,
    name: "Arjuna's Dilemma",
    sanskrit_name: "अर्जुनविषादयोग",
    verses: 47,
  },
  {
    id: 2,
    name: "Transcendental Knowledge",
    sanskrit_name: "सांख्ययोग",
    verses: 72,
  },
  // Add more chapters...
];

export default function HomeScreen() {
  const renderChapter = ({
    item,
  }: {
    item: { id: number; name: string; sanskrit_name: string; verses: number };
  }) => (
    <Link href={`/chapter/${item.id}`} asChild>
      <Pressable style={styles.chapterCard}>
        <View style={styles.cardContent}>
          <Text style={styles.chapterNumber}>Chapter {item.id}</Text>
          <Text style={styles.sanskritName}>{item.sanskrit_name}</Text>
          <Text style={styles.chapterName}>{item.name}</Text>
          <Text style={styles.versesCount}>{item.verses} verses</Text>
        </View>
      </Pressable>
    </Link>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>श्रीमद्भगवद्गीता</Text>
        <Text style={styles.subtitle}>Bhagavad Gita</Text>
      </View>
      <FlatList
        data={chapters}
        renderItem={renderChapter}
        keyExtractor={(item) => item.id.toString()}
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
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4A3200",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#4A3200",
    marginBottom: 16,
  },
  listContainer: {
    padding: 16,
  },
  chapterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
  },
  chapterNumber: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 4,
  },
  sanskritName: {
    fontSize: 20,
    color: "#4A3200",
    marginBottom: 4,
  },
  chapterName: {
    fontSize: 18,
    color: "#4A3200",
    marginBottom: 8,
  },
  versesCount: {
    fontSize: 14,
    color: "#666666",
  },
});
