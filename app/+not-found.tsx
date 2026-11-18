import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { ROUTES } from "@/constants/routes";

export default function NotFoundScreen() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("notFound.title") }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text variant="headlineMedium" style={{ color: colors.text }}>
          {t("notFound.body")}
        </Text>
        <Link href={ROUTES.home} style={styles.link}>
          <Text variant="bodyLarge" style={{ color: colors.brandText }}>
            {t("notFound.goHome")}
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
