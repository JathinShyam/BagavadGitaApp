import { View, Pressable, StyleSheet, Text as RNText } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useAppTheme } from "@/hooks/useAppTheme";
import { Radius, Spacing } from "@/theme/design-tokens";

type VerseListCardProps = {
  /** Text inside the circular badge (e.g. "47" or "4-6"). */
  badge: string;
  /** Primary title (e.g. "Verse 47" or "Ch. 2 · Verse 47"). */
  title: string;
  /** Sloka / preview line under the title. */
  preview?: string;
  read?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Shared row card used on chapter + topic verse lists. */
export function VerseListCard({
  badge,
  title,
  preview,
  read = false,
  onPress,
  accessibilityLabel,
}: VerseListCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary + "70",
          opacity: pressed ? 0.82 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <View
        style={[
          styles.badge,
          {
            backgroundColor: colors.primary + "18",
            borderColor: colors.primary + "55",
          },
        ]}
      >
        <RNText
          style={[
            styles.badgeText,
            { color: colors.primary, fontSize: badge.length > 4 ? 11 : 14 },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {badge}
        </RNText>
      </View>

      <View style={styles.body}>
        <RNText style={[styles.title, { color: colors.primary }]} numberOfLines={1}>
          {title}
        </RNText>
        {!!preview && (
          <RNText style={[styles.preview, { color: colors.text }]} numberOfLines={2}>
            {preview}
          </RNText>
        )}
      </View>

      <View
        style={[
          styles.action,
          read && styles.actionRead,
          {
            backgroundColor: "transparent",
            borderColor: colors.primary + "99",
          },
        ]}
      >
        {read && <Ionicons name="checkmark" size={15} color={colors.success} />}
        <RNText style={[styles.actionText, { color: colors.primary }]}>
          {read ? "Read" : "Open"}
        </RNText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    gap: 12,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 14,
  },
  body: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 15,
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    lineHeight: 19,
  },
  action: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    alignSelf: "center",
  },
  actionRead: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
  },
  actionText: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 13,
  },
});
