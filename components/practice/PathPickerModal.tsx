import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

import { haptics } from "@/lib/haptics";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useContentLanguage } from "@/context/language-context";
import { useTranslation } from "@/hooks/useTranslation";
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
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t("pathPicker.dismissA11y")}
        />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("pathPicker.title")}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel={t("common.close")}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {READING_PATHS.map((path) => (
              <Pressable
                key={path.id}
                onPressIn={haptics.light}
                onPress={() => {
                  haptics.medium();
                  onSelect(path);
                }}
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.outline },
                ]}
              >
                <Text style={[styles.cardTitle, { color: colors.brandText }]}>
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
