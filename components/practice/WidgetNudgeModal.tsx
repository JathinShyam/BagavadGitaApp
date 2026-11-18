import React from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function WidgetNudgeModal({ visible, onClose }: Props) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Ionicons name="phone-portrait-outline" size={36} color={colors.brandText} />
          <Text style={[styles.title, { color: colors.brandText }]}>
            {t("widgetNudge.title")}
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Long-press your home screen → Widgets → Bhagavad Gita → Daily Verse. Open the app once
            so it can sync, then the widget shows today’s verse and updates each day — tap to read.
          </Text>
          <Pressable
            onPress={onClose}
            style={[styles.btn, { backgroundColor: colors.brandText }]}
          >
            <Text style={{ color: colors.onPrimary, fontWeight: "700" }}>
              {t("widgetNudge.gotIt")}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 18,
    padding: 22,
    gap: 12,
    alignItems: "center",
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  btn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
