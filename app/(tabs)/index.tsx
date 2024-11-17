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
    sanskrit_name: "అర్జున విషాద యోగము",
    verses: 47,
  },
  {
    id: 2,
    sanskrit_name: "సాంఖ్య యోగము",
    verses: 72,
  },
  {
    id: 3,
    sanskrit_name: "కర్మ యోగము",
    verses: 43,
  },
  {
    id: 4,
    sanskrit_name: "జ్ఞాన, కర్మ, సన్న్యాస యోగము",
    verses: 42,
  },
  {
    id: 5,
    sanskrit_name: "కర్మ సన్యాస యోగము",
    verses: 29,
  },
  {
    id: 6,
    sanskrit_name: "ధ్యాన యోగము",
    verses: 47,
  },
  {
    id: 7,
    sanskrit_name: "జ్ఞాన విజ్ఞాన యోగము",
    verses: 30,
  },
  {
    id: 8,
    sanskrit_name: "అక్షర బ్రహ్మ యోగము",
    verses: 28,
  },
  {
    id: 9,
    sanskrit_name: "రాజ విద్యా యోగము",
    verses: 34,
  },
  {
    id: 10,
    sanskrit_name: "విభూతి యోగము",
    verses: 42,
  },
  {
    id: 11,
    sanskrit_name: "విశ్వ రూప దర్శన యోగము",
    verses: 55,
  },
  {
    id: 12,
    sanskrit_name: "భక్తి యోగము",
    verses: 20,
  },
  {
    id: 13,
    sanskrit_name: "క్షేత్ర క్షేత్రజ్ఞ విభాగ యోగము",
    verses: 35,
  },
  {
    id: 14,
    sanskrit_name: "గుణత్రయ విభాగ యోగము",
    verses: 27,
  },

  // Add more chapters...
];

export default function HomeScreen() {
  const renderChapter = ({
    item,
  }: {
    item: { id: number; sanskrit_name: string; verses: number };
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
