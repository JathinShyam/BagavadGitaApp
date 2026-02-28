import { View, FlatList, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useAppTheme } from "../hooks/useAppTheme";
import { CATEGORIES } from "@/data/categories";
import { useReadingProgress } from "../hooks/useReadingProgress";
import { savedstyles } from "../styles";

function formatVerseLabel(verseId: string): string {
  const parts = verseId.split("-");
  const chapter = parts[0];
  const verseNum = parts.slice(1).join("-");
  return verseNum.includes("-")
    ? `Chapter ${chapter}, Verses ${verseNum}`
    : `Chapter ${chapter}, Verse ${verseNum}`;
}

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { isVerseRead } = useReadingProgress();

  const category = CATEGORIES.find((c) => c.id === id);

  if (!category) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: "Category" }} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Text style={{ color: colors.text, fontSize: 16 }}>Category not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getChapterAndVerse = (verseId: string) => {
    const parts = verseId.split("-");
    return { chapter: parseInt(parts[0], 10), verseNumber: parts.slice(1).join("-") };
  };

  const renderVerse = ({ item: verseId }: { item: string }) => {
    const { chapter, verseNumber } = getChapterAndVerse(verseId);
    const read = isVerseRead(chapter, verseNumber);

    return (
      <View
          style={[
            savedstyles.verseCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Link href={`/verse/${verseId}`} asChild>
            <Pressable
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={{ flex: 1 }}
            >
              <View style={savedstyles.cardContent}>
                <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <Text
                    style={[savedstyles.verseLocation, { color: colors.textMuted }]}
                  >
                    {formatVerseLabel(verseId)}
                  </Text>
                  {read && (
                    <View
                      style={[
                        { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.primary + "22" },
                      ]}
                    >
                      <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                      <Text
                        style={[savedstyles.verseLocation, { color: colors.primary, fontSize: 12, marginLeft: 4 }]}
                      >
                        Read
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          </Link>
        </View>
    );
  };

  return (
    <SafeAreaView
      style={[savedstyles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: category.name,
          headerBackTitle: "Back",
        }}
      />
      <FlatList
        data={category.verses}
        renderItem={renderVerse}
        keyExtractor={(item) => item}
        contentContainerStyle={savedstyles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
