import React from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "@/hooks/useAppTheme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function WidgetNudgeModal({ visible, onClose }: Props) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Ionicons name="phone-portrait-outline" size={36} color={colors.primary} />
          <Text style={[styles.title, { color: colors.primary }]}>Daily verse on your home screen</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Long-press your home screen → Widgets → Bhagavad Gita → Daily Verse. It shows today’s
            verse and updates each day — tap to open and read.
          </Text>
          <Pressable
            onPress={onClose}
            style={[styles.btn, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: colors.onPrimary, fontWeight: "700" }}>Got it</Text>
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
