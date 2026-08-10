import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useContentLanguage } from "@/context/language-context";
import {
  READING_PATHS,
  getPathDescription,
  getPathTitle,
  type ReadingPath,
} from "@/data/reading-paths";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (path: ReadingPath) => void;
};

export function PathPickerModal({ visible, onClose, onSelect }: Props) {
  const { colors } = useAppTheme();
  const { language } = useContentLanguage();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Dismiss path picker"
        />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Start a reading path</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {READING_PATHS.map((path) => (
              <Pressable
                key={path.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onSelect(path);
                }}
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.outline },
                ]}
              >
                <Text style={[styles.cardTitle, { color: colors.primary }]}>
                  {getPathTitle(path, language)}
                </Text>
                <Text style={[styles.cardBody, { color: colors.textMuted }]}>
                  {getPathDescription(path, language)}
                </Text>
                <Text style={[styles.meta, { color: colors.text }]}>
                  {path.days.length} days
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "80%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  meta: {
    fontSize: 12,
    fontWeight: "600",
  },
});
