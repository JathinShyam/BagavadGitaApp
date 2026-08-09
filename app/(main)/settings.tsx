import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
  Platform,
  Modal,
  Image,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import Constants from "expo-constants";

import { Spacing, Radius } from "@/theme/design-tokens";
import { useTheme } from "@/context/theme-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import {
  getStoredPreferences,
  setStoredPreferences,
  requestNotificationPermissions,
  scheduleNextDailyVerseNotification,
  cancelDailyVerseNotifications,
} from "@/lib/daily-verse-notifications";
import { APP_URLS } from "@/constants/app-urls";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { GoldCard } from "@/components/ui/GoldCard";
import { OrnamentalDivider, ORNAMENTS } from "@/components/ui/OrnamentalDivider";
import { IOSToggle } from "@/components/ui/IOSToggle";

const BRAND_ICON = require("../../assets/images/brand-lotus-book.png");

interface SettingItemProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  delay?: number;
  isLast?: boolean;
  colors: ReturnType<typeof useAppTheme>["colors"];
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  rightElement,
  delay = 0,
  isLast = false,
  colors,
}) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()}>
    <Pressable
      style={[
        styles.settingItem,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.outline + "40",
        },
      ]}
      onPress={() => {
        if (onPress) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
    >
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon} size={22} color={colors.primary} style={styles.settingIcon} />
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
  const { resetAllProgress } = useReadingProgress();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState("08:00");
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [draftTime, setDraftTime] = useState<Date>(new Date());

  const parseTimeToDate = useCallback((time: string) => {
    const [h, m] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(Number.isFinite(h) ? h : 8, Number.isFinite(m) ? m : 0, 0, 0);
    return d;
  }, []);

  const toTimeString = useCallback((d: Date) => {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }, []);

  const formatDisplayTime = useCallback((time: string) => {
    const d = parseTimeToDate(time);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }, [parseTimeToDate]);

  const loadNotificationPreference = useCallback(async () => {
    const { enabled, time } = await getStoredPreferences();
    setNotificationsEnabled(enabled);
    setNotificationTime(time);
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
      const next = !notificationsEnabled;
      setNotificationsEnabled(next);
      setStoredPreferences(next, notificationTime).catch(() => {});
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
        await setStoredPreferences(true, notificationTime);
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
        await setStoredPreferences(false, notificationTime);
        setNotificationsEnabled(false);
        await cancelDailyVerseNotifications();
      } catch {
        Alert.alert(
          "Could not disable",
          "Something went wrong. Please try again."
        );
      }
    }
  }, [notificationsEnabled, notificationTime]);

  const handleThemeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleTheme();
  };

  const handleTimePickerChange = useCallback((_event: any, selected?: Date) => {
    if (!selected) return;
    setDraftTime(selected);
  }, []);

  const openTimePicker = useCallback(() => {
    setDraftTime(parseTimeToDate(notificationTime));
    setShowTimePicker(true);
  }, [notificationTime, parseTimeToDate]);

  const saveNotificationTime = useCallback(async () => {
    const nextTime = toTimeString(draftTime);
    setNotificationTime(nextTime);
    setShowTimePicker(false);
    try {
      await setStoredPreferences(notificationsEnabled, nextTime);
      await scheduleNextDailyVerseNotification();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore — UI already updated
    }
  }, [draftTime, notificationsEnabled, toTimeString]);

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
            await resetAllProgress();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Done", "All reading progress has been reset.");
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => Linking.openURL(APP_URLS.privacyPolicy);
  const openTermsOfService = () => Linking.openURL(APP_URLS.termsOfService);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View
          entering={FadeInUp.delay(0).springify()}
          style={styles.brandHeader}
        >
          <View style={styles.brandRow}>
            <Image source={BRAND_ICON} style={styles.brandIcon} resizeMode="contain" />
            <Text style={[styles.brandTitle, { color: colors.primary }]}>
              Bhagavad Gita
            </Text>
          </View>
          <OrnamentalDivider source={ORNAMENTS.settingsDivider} height={22} />
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <OrnamentalDivider source={ORNAMENTS.settingsDivider} height={28} />
        </Animated.View>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Appearance
        </Text>
        <GoldCard style={styles.sectionCard}>
          <SettingItem
            title="Theme"
            icon="color-palette-outline"
            colors={colors}
            isLast
            rightElement={
              <IOSToggle
                value={theme === "dark"}
                onValueChange={handleThemeToggle}
                activeColor={colors.primary}
              />
            }
            delay={100}
          />
        </GoldCard>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Audio & Notifications
        </Text>
        <GoldCard style={styles.sectionCard}>
          <SettingItem
            title="Notifications"
            icon="notifications-outline"
            colors={colors}
            rightElement={
              <IOSToggle
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                disabled={notificationsLoading}
                activeColor={colors.primary}
              />
            }
            delay={200}
          />
          <SettingItem
            title="Notification time"
            icon="time-outline"
            colors={colors}
            onPress={openTimePicker}
            rightElement={
              <View style={styles.timeRow}>
                <Text style={[styles.timeValue, { color: colors.primary }]}>
                  {formatDisplayTime(notificationTime)}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            }
            delay={250}
          />
          <SettingItem
            title="Auto-play Audio"
            icon="volume-high-outline"
            colors={colors}
            isLast
            rightElement={
              <IOSToggle
                value={autoPlayAudio}
                onValueChange={handleAutoPlayToggle}
                activeColor={colors.primary}
              />
            }
            delay={300}
          />
        </GoldCard>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Data
        </Text>
        <GoldCard style={styles.sectionCard}>
          <SettingItem
            title="Reset Reading Progress"
            icon="refresh-circle"
            colors={colors}
            isLast
            onPress={handleResetProgress}
            rightElement={
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            }
            delay={350}
          />
        </GoldCard>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          About
        </Text>
        <GoldCard style={styles.sectionCard}>
          <SettingItem
            title="Version"
            icon="information-circle"
            colors={colors}
            rightElement={
              <Text style={[styles.timeValue, { color: colors.textMuted }]}>
                {Constants.expoConfig?.version ?? "1.0.0"}
              </Text>
            }
            delay={400}
          />
          <SettingItem
            title="Privacy Policy"
            icon="shield-checkmark-outline"
            colors={colors}
            onPress={openPrivacyPolicy}
            rightElement={
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.primary}
              />
            }
            delay={500}
          />
          <SettingItem
            title="Terms of Service"
            icon="document-text-outline"
            colors={colors}
            isLast
            onPress={openTermsOfService}
            rightElement={
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.primary}
              />
            }
            delay={600}
          />
        </GoldCard>

        <Animated.View
          entering={FadeInUp.delay(800).springify()}
          style={styles.aboutBlock}
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
            Made for spiritual seekers
          </Text>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Choose notification time
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Daily reminder at {draftTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </Text>

            {Platform.OS !== "web" && (
              <DateTimePicker
                mode="time"
                value={draftTime}
                is24Hour={false}
                display={Platform.OS === "ios" ? "spinner" : "clock"}
                onChange={handleTimePickerChange}
              />
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalButton}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.textMuted }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={saveNotificationTime}
              >
                <Text style={[styles.modalButtonText, { color: colors.onPrimary }]}>
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  brandHeader: {
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 2,
  },
  brandIcon: {
    width: 36,
    height: 36,
  },
  brandTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 34,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 2,
  },
  sectionCard: {
    marginBottom: Spacing.lg,
    paddingVertical: 2,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    letterSpacing: 0.2,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    minHeight: 52,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingItemRight: {
    marginLeft: Spacing.md,
  },
  settingIcon: {
    marginRight: 14,
    width: 24,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalCard: {
    width: "100%",
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  modalActions: {
    marginTop: Spacing.md,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
  },
  modalButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  modalButtonPrimary: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  aboutBlock: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  aboutTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    marginBottom: Spacing.md,
  },
  aboutDescription: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  aboutFooter: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: Spacing.sm,
  },
});
