import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Linking,
  Alert,
  Platform,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Spacing, Radius, Palette } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useAppTheme } from "../hooks/useAppTheme";
import { useReadingProgress } from "../hooks/useReadingProgress";
import {
  getStoredPreferences,
  setStoredPreferences,
  requestNotificationPermissions,
  scheduleNextDailyVerseNotification,
  cancelDailyVerseNotifications,
} from "@/lib/dailyVerseNotifications";
import { APP_URLS } from "@/constants/appUrls";
import { STORAGE_KEYS } from "@/constants/storageKeys";

interface SettingItemProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  delay?: number;
}

type ThemeColors = typeof Palette.light;
const SettingItem: React.FC<SettingItemProps & { colors: ThemeColors }> = ({
  title,
  subtitle,
  icon,
  onPress,
  rightElement,
  delay = 0,
  colors,
}) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()}>
    <Pressable
      style={[styles.settingItem, { borderBottomColor: colors.outline }]}
      onPress={() => {
        if (onPress) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
    >
      <View style={styles.settingItemLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement && (
        <View style={styles.settingItemRight}>{rightElement}</View>
      )}
    </Pressable>
  </Animated.View>
);

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const { colors } = useAppTheme();
  const { CHAPTER_VERSES, resetChapterProgress, getTotalProgress } = useReadingProgress();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const loadNotificationPreference = useCallback(async () => {
    const { enabled } = await getStoredPreferences();
    setNotificationsEnabled(enabled);
    setNotificationsLoading(false);
  }, []);

  useEffect(() => {
    loadNotificationPreference();
  }, [loadNotificationPreference]);

  useFocusEffect(
    useCallback(() => {
      loadNotificationPreference();
    }, [loadNotificationPreference])
  );

  const loadAutoPlayPreference = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.AUTO_PLAY_AUDIO);
      setAutoPlayAudio(value === "true");
    } catch {
      setAutoPlayAudio(false);
    }
  }, []);

  useEffect(() => {
    loadAutoPlayPreference();
  }, [loadAutoPlayPreference]);

  const handleNotificationsToggle = useCallback(async () => {
    if (Platform.OS === "web") {
      setNotificationsEnabled((v) => !v);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextEnabled = !notificationsEnabled;
    if (nextEnabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          "Notifications disabled",
          "Enable notifications in system settings to receive daily verse reminders."
        );
        return;
      }
      try {
        await setStoredPreferences(true);
        setNotificationsEnabled(true);
        await scheduleNextDailyVerseNotification();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        Alert.alert(
          "Could not enable",
          "Something went wrong. Please try again."
        );
      }
    } else {
      try {
        await setStoredPreferences(false);
        setNotificationsEnabled(false);
        await cancelDailyVerseNotifications();
      } catch {
        Alert.alert(
          "Could not disable",
          "Something went wrong. Please try again."
        );
      }
    }
  }, [notificationsEnabled]);

  const handleThemeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleTheme();
  };

  const handleAutoPlayToggle = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !autoPlayAudio;
    setAutoPlayAudio(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTO_PLAY_AUDIO, next ? "true" : "false");
    } catch {
      setAutoPlayAudio(!next);
    }
  }, [autoPlayAudio]);

  const handleResetProgress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Reset Reading Progress",
      "This will reset all chapter progress, reading streak, and last read position to zero. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            for (const chId of Object.keys(CHAPTER_VERSES)) {
              await resetChapterProgress(parseInt(chId));
            }
            await AsyncStorage.multiRemove([
              "readingStreak",
              "lastReadVerse",
            ]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Done", "All reading progress has been reset.");
          },
        },
      ]
    );
  };

  const openGitHub = () => Linking.openURL(APP_URLS.github);
  const openPrivacyPolicy = () => Linking.openURL(APP_URLS.privacyPolicy);
  const openTermsOfService = () => Linking.openURL(APP_URLS.termsOfService);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <Animated.View
          entering={FadeInUp.delay(0).springify()}
          style={styles.header}
        >
          <Text style={[styles.title, { color: colors.primary }]}>
            Settings
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Customize your experience
          </Text>
        </Animated.View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Appearance
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.surface, borderColor: colors.outline },
            ]}
          >
            <SettingItem
              title="Dark Mode"
              subtitle="Switch between light and dark themes"
              icon="moon"
              colors={colors}
              rightElement={
                <Switch
                  value={theme === "dark"}
                  onValueChange={handleThemeToggle}
                  trackColor={{
                    false: colors.outline,
                    true: colors.primary,
                  }}
                  thumbColor={
                    theme === "dark" ? colors.onPrimary : colors.textMuted
                  }
                />
              }
              delay={100}
            />
          </View>
        </View>

        {/* Audio & Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Audio & Notifications
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.surface, borderColor: colors.outline },
            ]}
          >
            <SettingItem
              title="Notifications"
              subtitle="Get daily verse notifications"
              icon="notifications"
              colors={colors}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationsToggle}
                  disabled={notificationsLoading}
                  trackColor={{
                    false: colors.outline,
                    true: colors.primary,
                  }}
                  thumbColor={
                    notificationsEnabled ? colors.onPrimary : colors.textMuted
                  }
                />
              }
              delay={200}
            />
            <SettingItem
              title="Auto-play Audio"
              subtitle="Automatically play verse audio"
              icon="play-circle"
              colors={colors}
              rightElement={
                <Switch
                  value={autoPlayAudio}
                  onValueChange={handleAutoPlayToggle}
                  trackColor={{
                    false: colors.outline,
                    true: colors.primary,
                  }}
                  thumbColor={
                    autoPlayAudio ? colors.onPrimary : colors.textMuted
                  }
                />
              }
              delay={300}
            />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Data
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.surface, borderColor: colors.outline },
            ]}
          >
            <SettingItem
              title="Reset Reading Progress"
              subtitle={`Currently ${getTotalProgress()}% complete`}
              icon="refresh-circle"
              colors={colors}
              onPress={handleResetProgress}
              rightElement={
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textMuted}
                />
              }
              delay={350}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.surface, borderColor: colors.outline },
            ]}
          >
            <SettingItem
              title="Version"
              subtitle="1.0.0"
              icon="information-circle"
              colors={colors}
              delay={400}
            />
            <SettingItem
              title="Source Code"
              subtitle="View on GitHub"
              icon="logo-github"
              colors={colors}
              onPress={openGitHub}
              rightElement={
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textMuted}
                />
              }
              delay={500}
            />
            <SettingItem
              title="Privacy Policy"
              subtitle="Read our privacy policy"
              icon="shield-checkmark"
              colors={colors}
              onPress={openPrivacyPolicy}
              rightElement={
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textMuted}
                />
              }
              delay={600}
            />
            <SettingItem
              title="Terms of Service"
              subtitle="Read our terms of service"
              icon="document-text"
              colors={colors}
              onPress={openTermsOfService}
              rightElement={
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textMuted}
                />
              }
              delay={700}
            />
          </View>
        </View>

        {/* App Description */}
        <Animated.View
          entering={FadeInUp.delay(800).springify()}
          style={[
            styles.aboutCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Text style={[styles.aboutTitle, { color: colors.primary }]}>
            Bhagavad Gita
          </Text>
          <Text style={[styles.aboutDescription, { color: colors.text }]}>
            The Bhagavad Gita is a 700-verse Hindu scripture that is part of the
            epic Mahabharata. It is a sacred text of the Hindu religion and is
            considered one of the most important philosophical classics of the
            world.
          </Text>
          <Text style={[styles.aboutDescription, { color: colors.text }]}>
            This app provides the complete text of the Bhagavad Gita in Telugu
            with English translations, word meanings, and detailed commentaries.
            It&apos;s designed to help you study and understand this ancient wisdom
            in a modern, accessible format.
          </Text>
          <Text style={[styles.aboutFooter, { color: colors.textMuted }]}>
            Made with ❤️ for spiritual seekers
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor will be set dynamically
  },
  scrollContainer: {
    padding: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    // color will be set dynamically
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    // color will be set dynamically
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    // color will be set dynamically
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },
  sectionContent: {
    // backgroundColor and borderColor will be set dynamically
    borderRadius: Radius.md,
    overflow: "hidden",
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    // borderBottomColor will be set dynamically
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingItemRight: {
    marginLeft: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    // backgroundColor will be set dynamically
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    // color will be set dynamically
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    // color will be set dynamically
  },
  aboutCard: {
    // backgroundColor and borderColor will be set dynamically
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: "bold",
    // color will be set dynamically
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  aboutDescription: {
    fontSize: 16,
    // color will be set dynamically
    lineHeight: 24,
    marginBottom: Spacing.md,
    textAlign: "justify",
  },
  aboutFooter: {
    fontSize: 14,
    // color will be set dynamically
    textAlign: "center",
    fontStyle: "italic",
    marginTop: Spacing.md,
  },
});
