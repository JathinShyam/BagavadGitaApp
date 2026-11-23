import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";

import { useTranslation } from "@/hooks/useTranslation";
import { getAppTitle } from "@/constants/languages";

type Props = {
  streakDays: number;
  longestStreak: number;
  insight?: string;
};

export function StreakShareCard({ streakDays, longestStreak, insight }: Props) {
  const { t, language } = useTranslation();

  return (
    <LinearGradient colors={["#1B1302", "#3D2E0A", "#0D1B2A"]} style={styles.card}>
      <Text style={styles.appName}>{getAppTitle(language)}</Text>
      <Text style={styles.eyebrow}>{t("streakShare.eyebrow")}</Text>
      <Text style={styles.streak}>{streakDays}</Text>
      <Text style={styles.streakLabel}>{t("streakShare.dayStreak")}</Text>
      <Text style={styles.best}>
        {t("streakShare.best", { count: longestStreak })}
      </Text>
      {!!insight && (
        <View style={styles.insightBox}>
          <Text style={styles.insightTitle}>{t("streakShare.insightTitle")}</Text>
          <Text style={styles.insightBody}>{insight}</Text>
        </View>
      )}
      <Text style={styles.footer}>{t("streakShare.footer")}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 1080,
    height: 1920,
    padding: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 48,
  },
  appName: { color: "rgba(255,255,255,0.7)", fontSize: 28, marginBottom: 40 },
  eyebrow: { color: "#E6B74A", fontSize: 32, fontWeight: "600", marginBottom: 12 },
  streak: { color: "white", fontSize: 160, fontWeight: "800", lineHeight: 170 },
  streakLabel: { color: "rgba(255,255,255,0.9)", fontSize: 36, marginBottom: 24 },
  best: { color: "rgba(255,255,255,0.75)", fontSize: 28, marginBottom: 48 },
  insightBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 28,
    padding: 36,
    width: "100%",
    marginBottom: 48,
  },
  insightTitle: { color: "rgba(255,255,255,0.7)", fontSize: 24, marginBottom: 12 },
  insightBody: { color: "white", fontSize: 30, lineHeight: 44, textAlign: "center" },
  footer: { color: "rgba(255,255,255,0.7)", fontSize: 26 },
});
