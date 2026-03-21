/**
 * Daily verse local notifications: permissions, scheduling, and persistence.
 *
 * Uses a single `SchedulableTriggerInputTypes.DAILY` trigger so the OS fires every day at
 * the chosen time with no day limit (unlike stacking DATE triggers). Notification copy is generic
 * because repeating locals cannot update body per day without the app; the tap handler resolves
 * today's verse with getVerseForDate(new Date()).
 *
 * Uses lazy require() only when {@link shouldLoadExpoNotifications} is true (Expo Go on Android
 * cannot load expo-notifications — use a development build).
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DAILY_VERSE_NOTIFICATION_TITLE,
  DAILY_VERSE_NOTIFICATION_BODY_GENERIC,
} from "./dailyVerse";
import { shouldLoadExpoNotifications } from "./notificationsAvailability";

/** Lazy-load expo-notifications; returns null in Expo Go (Android) or when require fails. */
function getNotifications(): typeof import("expo-notifications") | null {
  if (!shouldLoadExpoNotifications()) return null;
  try {
    return require("expo-notifications");
  } catch {
    return null;
  }
}

const STORAGE_KEY_ENABLED = "dailyVerseNotificationsEnabled";
const STORAGE_KEY_TIME = "dailyVerseNotificationTime";
const DEFAULT_TIME = "08:00"; // 8 AM
const ANDROID_CHANNEL_ID = "daily-verse";

/** Payload for repeating daily notification — verse is resolved on open, not in tray text. */
export const DAILY_VERSE_NOTIFICATION_DATA = {
  screen: "daily-verse" as const,
};

export async function getStoredPreferences(): Promise<{
  enabled: boolean;
  time: string;
}> {
  try {
    const [enabledRaw, time] = await AsyncStorage.multiGet([
      STORAGE_KEY_ENABLED,
      STORAGE_KEY_TIME,
    ]);
    const enabled = enabledRaw[1] === "true";
    const storedTime = time[1] ?? DEFAULT_TIME;
    return { enabled, time: storedTime };
  } catch {
    return { enabled: false, time: DEFAULT_TIME };
  }
}

export async function setStoredPreferences(
  enabled: boolean,
  time: string = DEFAULT_TIME
): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEY_ENABLED, enabled ? "true" : "false"],
      [STORAGE_KEY_TIME, time],
    ]);
  } catch (error) {
    console.error("Failed to save notification preferences:", error);
    throw error;
  }
}

/** Request notification permission and ensure Android channel exists. */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const Notifications = getNotifications();
  if (!Notifications) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Daily Verse",
      description: "Daily Bhagavad Gita verse reminder",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/** Parse "HH:mm" or "H:mm" into hour and minute. */
function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.trim().split(":").map(Number);
  const hour = Math.min(23, Math.max(0, Number.isFinite(h) ? h : 8));
  const minute = Math.min(59, Math.max(0, Number.isFinite(m) ? m : 0));
  return { hour, minute };
}

/**
 * Cancel all scheduled notifications (used when user turns daily verse off).
 */
export async function cancelDailyVerseNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Schedule one repeating daily notification at the user's local hour/minute.
 * Re-call on foreground / preference changes to refresh time (cancel + reschedule).
 */
export async function scheduleNextDailyVerseNotification(): Promise<void> {
  if (Platform.OS === "web") return;

  const { enabled, time } = await getStoredPreferences();
  if (!enabled) {
    await cancelDailyVerseNotifications();
    return;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) {
    await setStoredPreferences(false);
    return;
  }

  await cancelDailyVerseNotifications();

  const { hour, minute } = parseTime(time);

  const Notifications = getNotifications();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: DAILY_VERSE_NOTIFICATION_TITLE,
      body: DAILY_VERSE_NOTIFICATION_BODY_GENERIC,
      sound: true,
      data: { ...DAILY_VERSE_NOTIFICATION_DATA },
      ...(Platform.OS === "android" && { channelId: ANDROID_CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...(Platform.OS === "android" && { channelId: ANDROID_CHANNEL_ID }),
    },
  });
}
