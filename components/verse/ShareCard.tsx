import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";

import { useTranslation } from "@/hooks/useTranslation";
import { getAppTitle } from "@/constants/languages";

type Props = {
  title: string;
  subtitle: string;
  sloka?: string;
  meaning?: string;
  /** Deep link printed on the card so a screenshot still leads back to the verse. */
  link?: string;
};

export function ShareCard({ title, subtitle, sloka, meaning, link }: Props) {
  const { t, language } = useTranslation();

  return (
    <LinearGradient colors={["#1B5E20", "#0D1B2A"]} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.appName}>{getAppTitle(language)}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {!!sloka && (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>{t("shareCard.sloka")}</Text>
          <Text style={styles.blockBody}>{sloka}</Text>
        </View>
      )}

      {!!meaning && (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>{t("shareCard.meaning")}</Text>
          <Text style={styles.blockBody}>{meaning}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t("shareCard.readMore")}</Text>
        {!!link && <Text style={styles.footerLink}>{link}</Text>}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 1080,
    height: 1920,
    padding: 80,
    justifyContent: "space-between",
    borderRadius: 48,
  },
  header: {},
  appName: { color: "rgba(255,255,255,0.85)", fontSize: 28, marginBottom: 16 },
  title: { color: "white", fontSize: 54, fontWeight: "700", marginBottom: 12 },
  subtitle: { color: "rgba(255,255,255,0.9)", fontSize: 30 },
  block: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 28,
    padding: 36,
    marginTop: 28,
  },
  blockTitle: { color: "rgba(255,255,255,0.85)", fontSize: 26, marginBottom: 12 },
  blockBody: { color: "white", fontSize: 30, lineHeight: 44 },
  footer: { alignItems: "center", marginTop: 40 },
  footerText: { color: "rgba(255,255,255,0.85)", fontSize: 26 },
  footerLink: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 22,
    marginTop: 10,
    letterSpacing: 0.5,
  },
});

