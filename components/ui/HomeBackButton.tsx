import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ROUTES } from "@/constants/routes";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Back control for a pushed screen opened with no history behind it — a
 * shared web link or a cold deep link. Goes to Home instead of nowhere.
 */
export function HomeBackButton() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={() => router.replace(ROUTES.home)}
      hitSlop={12}
      style={{ paddingHorizontal: 8, paddingVertical: 4 }}
      accessibilityLabel={t("homeBack.a11y")}
      accessibilityRole="button"
    >
      <Ionicons name="arrow-back" size={24} color={colors.brandText} />
    </Pressable>
  );
}
