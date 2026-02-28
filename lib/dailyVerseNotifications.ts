/**
 * Daily verse local notifications: permissions, scheduling, and persistence.
 * Schedules a single notification for the next occurrence of the user's chosen time,
 * with the verse for that day. Reschedule on app open so content stays correct.
 *
 * Uses lazy require() to avoid loading expo-notifications in Expo Go (unsupported on Android).
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getVerseForDate,
  getDailyVerseNotificationContent,
} from "./dailyVerse";

/** Lazy-load expo-notifications; returns null in Expo Go where it's unsupported. */
function getNotifications(): typeof import("expo-notifications") | null {
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

/** Get next Date for given local hour/minute (today or tomorrow). */
function getNextTriggerDate(hour: number, minute: number): Date {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
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
 * Schedule the next daily verse notification for the user's chosen time.
 * Uses one DATE trigger so the notification content can be the verse for that day.
 * Call when: user enables notifications, or app comes to foreground (to refresh the next one).
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
  const triggerDate = getNextTriggerDate(hour, minute);
  const verse = getVerseForDate(triggerDate);
  if (!verse) return;

  const { title, body, verseId } = getDailyVerseNotificationContent(verse);

  const Notifications = getNotifications();
  if (!Notifications) return;

  // Explicit trigger type required by expo-notifications.
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: { verseId, screen: "verse" },
    },
    trigger: {
      type: "date" as const,
      date: triggerDate,
      ...(Platform.OS === "android" && { channelId: ANDROID_CHANNEL_ID }),
    },
  });
}
