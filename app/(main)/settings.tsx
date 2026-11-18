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
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import Constants from "expo-constants";

import { haptics } from "@/lib/haptics";
import { Spacing, Radius } from "@/theme/design-tokens";
import { useTheme } from "@/context/theme-context";
import { useContentLanguage } from "@/context/language-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { getLanguageLabel, INTL_LOCALES, tracking } from "@/lib/i18n";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import {
  getStoredPreferences,
  setStoredPreferences,
  requestNotificationPermissions,
  scheduleNextDailyVerseNotification,
  cancelDailyVerseNotifications,
} from "@/lib/daily-verse-notifications";
import { syncDailyVerseWidget } from "@/lib/widget-data";
import { APP_URLS } from "@/constants/app-urls";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { CONTENT_LANGUAGES, type ContentLanguage } from "@/constants/languages";
import { GoldCard } from "@/components/ui/GoldCard";
import { Duration } from "@/theme/motion";
import { OrnamentalDivider, ORNAMENTS } from "@/components/ui/OrnamentalDivider";
import { IOSToggle } from "@/components/ui/IOSToggle";
import { FREEZE_CAP } from "@/lib/streak-freeze";


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
  <Animated.View entering={FadeInUp.delay(delay).duration(Duration.slow)}>
    <Pressable
      style={[
        styles.settingItem,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.outline + "40",
        },
      ]}
      onPressIn={() => {
        if (onPress) haptics.light();
      }}
      onPress={() => {
        onPress?.();
      }}
    >
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon} size={22} color={colors.brandText} style={styles.settingIcon} />
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
  const { language, languageOption, setLanguage } = useContentLanguage();
  const { t } = useTranslation();
  const { resetAllProgress, freezes } = useReadingProgress();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState("08:00");
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
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
    return d.toLocaleTimeString(INTL_LOCALES[language], {
      hour: "numeric",
      minute: "2-digit",
    });
  }, [parseTimeToDate, language]);

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
    const nextEnabled = !notificationsEnabled;
    if (nextEnabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          t("settings.notificationsDisabledTitle"),
          t("settings.notificationsDisabledBody")
        );
        return;
      }
      try {
        await setStoredPreferences(true, notificationTime);
        setNotificationsEnabled(true);
        await scheduleNextDailyVerseNotification();
        haptics.success();
      } catch {
        Alert.alert(
          t("settings.couldNotEnableTitle"),
          t("settings.couldNotEnableBody")
        );
      }
    } else {
      try {
        await setStoredPreferences(false, notificationTime);
        setNotificationsEnabled(false);
        await cancelDailyVerseNotifications();
      } catch {
        Alert.alert(
          t("settings.couldNotDisableTitle"),
          t("settings.couldNotDisableBody")
        );
      }
    }
  }, [notificationsEnabled, notificationTime, t]);

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleLanguageSelect = useCallback(
    async (code: ContentLanguage) => {
      if (code === language) {
        setShowLanguagePicker(false);
        return;
      }
      haptics.medium();
      await setLanguage(code);
      setShowLanguagePicker(false);
      try {
        await Promise.all([
          scheduleNextDailyVerseNotification(),
          syncDailyVerseWidget(),
        ]);
      } catch {
        // Preference is saved; sync can retry on next foreground.
      }
    },
    [language, setLanguage]
  );

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
    } catch {
      // ignore — UI already updated
    }
  }, [draftTime, notificationsEnabled, toTimeString]);

  const handleAutoPlayToggle = useCallback(async () => {
    const next = !autoPlayAudio;
    setAutoPlayAudio(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTO_PLAY_AUDIO, next ? "true" : "false");
    } catch {
      setAutoPlayAudio(!next);
    }
  }, [autoPlayAudio]);

  const handleResetProgress = () => {
    haptics.heavy();
    Alert.alert(
      t("settings.resetTitle"),
      t("settings.resetBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.resetConfirm"),
          style: "destructive",
          onPress: async () => {
            await resetAllProgress();
            haptics.success();
            Alert.alert(t("settings.resetDoneTitle"), t("settings.resetDoneBody"));
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
          <Text style={[styles.title, { color: colors.text, letterSpacing: tracking(language, 0.5) }]}>
            {t("settings.title")}
          </Text>
          <OrnamentalDivider source={ORNAMENTS.settingsDivider} height={28} />
        </Animated.View>

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.brandText, letterSpacing: tracking(language, 0.2) },
          ]}
        >
          {t("settings.appearance")}
        </Text>
        <GoldCard style={styles.sectionCard}>
          <SettingItem
            title={t("settings.darkMode")}
            icon="moon-outline"
            colors={colors}
            rightElement={
              <IOSToggle
                accessibilityLabel={t("settings.darkMode")}
                value={theme === "dark"}
                onValueChange={handleThemeToggle}
                activeColor={colors.brandText}
              />
            }
            delay={100}
          />
          <SettingItem
            title={t("settings.contentLanguage")}
            icon="language-outline"
            colors={colors}
            isLast
            onPress={() => setShowLanguagePicker(true)}
            rightElement={
              <View style={styles.timeRow}>
                <Text style={[styles.timeValue, { color: colors.brandText }]}>
                  {languageOption.nativeLabel}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            }
            delay={150}
          />
        </GoldCard>

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.brandText, letterSpacing: tracking(language, 0.2) },
          ]}
        >
          {Platform.OS === "web"
            ? t("settings.audio")
            : t("settings.audioNotifications")}
        </Text>
        <GoldCard style={styles.sectionCard}>
          {/* Daily reminders are device notifications — the web build can't
              schedule them, so the controls would do nothing there. */}
          {Platform.OS !== "web" && (
            <>
          <SettingItem
            title={t("settings.notifications")}
            icon="notifications-outline"
            colors={colors}
            rightElement={
              <IOSToggle
                accessibilityLabel={t("settings.notifications")}
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                disabled={notificationsLoading}
                activeColor={colors.brandText}
              />
            }
            delay={200}
          />
          <SettingItem
            title={t("settings.notificationTime")}
            icon="time-outline"
            colors={colors}
            onPress={openTimePicker}
            rightElement={
              <View style={styles.timeRow}>
                <Text style={[styles.timeValue, { color: colors.brandText }]}>
                  {formatDisplayTime(notificationTime)}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            }
            delay={250}
          />
            </>
          )}
          <SettingItem
            title={t("settings.autoPlayAudio")}
            icon="volume-high-outline"
            colors={colors}
            isLast
            rightElement={
              <IOSToggle
                accessibilityLabel={t("settings.autoPlayAudio")}
                value={autoPlayAudio}
                onValueChange={handleAutoPlayToggle}
                activeColor={colors.brandText}
              />
            }
            delay={300}
          />
        </GoldCard>

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.brandText, letterSpacing: tracking(language, 0.2) },
          ]}
        >
          {t("settings.practice")}
        </Text>
        <GoldCard style={styles.sectionCard}>
          <SettingItem
            title={t("settings.lotusFreezes")}
            subtitle={t("settings.lotusFreezesBody")}
            icon="flower-outline"
            colors={colors}
            isLast
            rightElement={
              <Text style={[styles.timeValue, { color: colors.streakFrozen }]}>
                {t("settings.lotusFreezesCount", {
                  count: freezes.balance,
                  cap: FREEZE_CAP,
                })}
              </Text>
            }
            delay={330}
          />
        </GoldCard>

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.brandText, letterSpacing: tracking(language, 0.2) },
          ]}
        >
          {t("settings.data")}
        </Text>
        <GoldCard style={styles.sectionCard}>
          <SettingItem
            title={t("settings.resetProgress")}
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

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.brandText, letterSpacing: tracking(language, 0.2) },
          ]}
        >
          {t("settings.about")}
        </Text>
        <GoldCard style={styles.sectionCard}>
          <SettingItem
            title={t("settings.version")}
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
            title={t("settings.privacy")}
            icon="shield-checkmark-outline"
            colors={colors}
            onPress={openPrivacyPolicy}
            rightElement={
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.brandText}
              />
            }
            delay={500}
          />
          <SettingItem
            title={t("settings.terms")}
            icon="document-text-outline"
            colors={colors}
            isLast
            onPress={openTermsOfService}
            rightElement={
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.brandText}
              />
            }
            delay={600}
          />
        </GoldCard>

        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.aboutBlock}
        >
          <Text style={[styles.aboutTitle, { color: colors.brandText }]}>
            Bhagavad Gita
          </Text>
          <Text style={[styles.aboutDescription, { color: colors.text }]}>
            {t("settings.aboutBody1")}
          </Text>
          <Text style={[styles.aboutDescription, { color: colors.text }]}>
            {t("settings.aboutBody2")}
          </Text>
          <Text style={[styles.aboutFooter, { color: colors.textMuted }]}>
            {t("settings.aboutFooter")}
          </Text>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("settings.languageModalTitle")}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              {t("settings.languageModalSubtitle")}
            </Text>
            {CONTENT_LANGUAGES.map((opt, idx) => {
              const selected = opt.code === language;
              const isLast = idx === CONTENT_LANGUAGES.length - 1;
              return (
                <Pressable
                  key={opt.code}
                  onPressIn={haptics.light}
                  onPress={() => handleLanguageSelect(opt.code)}
                  style={[
                    styles.languageRow,
                    !isLast && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.outline + "40",
                    },
                  ]}
                >
                  <View>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      {getLanguageLabel(opt.code, language)}
                    </Text>
                    <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                      {opt.nativeLabel}
                    </Text>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.brandText} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={22} color={colors.textMuted} />
                  )}
                </Pressable>
              );
            })}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.brandText }]}
                onPress={() => setShowLanguagePicker(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.onPrimary }]}>
                  {t("common.done")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
              {t("settings.chooseTime")}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              {t("settings.reminderAt", {
                time: draftTime.toLocaleTimeString(INTL_LOCALES[language], {
                  hour: "numeric",
                  minute: "2-digit",
                }),
              })}
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
                  {t("common.cancel")}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalButtonPrimary, { backgroundColor: colors.brandText }]}
                onPressIn={haptics.light}
                onPress={saveNotificationTime}
              >
                <Text style={[styles.modalButtonText, { color: colors.onPrimary }]}>
                  {t("common.save")}
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
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 34,
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
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
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
