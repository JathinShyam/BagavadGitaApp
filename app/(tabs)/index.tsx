// app/(tabs)/index.tsx

import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { indexstyles } from "../styles";
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
    sanskrit_name: "అర్జున విషాద యోగము",
    telugu_name: "అర్జున విషాద యోగము",
    verses: 47,
  },
  {
    id: 2,
    name: "Transcendental Knowledge",
    sanskrit_name: "సాంఖ్య యోగము",
    verses: 72,
  },
  {
    id: 3,
    name: "",
    sanskrit_name: "కర్మ యోగము",
    verses: 43,
  },
  {
    id: 4,
    name: "",
    sanskrit_name: "జ్ఞాన, కర్మ, సన్న్యాస యోగము",
    verses: 42,
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
      <Pressable style={indexstyles.chapterCard}>
        <View style={indexstyles.cardContent}>
          <Text style={indexstyles.chapterNumber}>{item.id}వ అధ్యాయము</Text>
          <Text style={indexstyles.sanskritName}>{item.sanskrit_name}</Text>
          {/* <Text style={indexstyles.chapterName}>{item.name}</Text> */}
          <Text style={indexstyles.versesCount}>{item.verses} verses</Text>
        </View>
      </Pressable>
    </Link>
  );

  return (
    <SafeAreaView style={indexstyles.container}>
      <View style={indexstyles.header}>
        <Text style={indexstyles.title}>భగవద్గీత</Text>
        <Text style={indexstyles.subtitle}>Bhagavad Gita</Text>
      </View>
      <FlatList
        data={chapters}
        renderItem={renderChapter}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={indexstyles.listContainer}
      />
    </SafeAreaView>
  );
}
