/**
 * Daily verse local notifications: permissions, scheduling, and persistence.
 *
 * Schedules a rolling window of one-shot DATE notifications (next 7 days) so each
 * day's tray text can include that day's verse preview. Re-call on foreground /
 * preference changes to refresh the window.
 *
 * Uses lazy require() only when {@link shouldLoadExpoNotifications} is true.
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getDailyVerseNotificationContent,
  getVerseForDate,
} from "./daily-verse";
import { shouldLoadExpoNotifications } from "./notification-availability";
import { getStoredContentLanguage } from "./chapter-content";

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
const DEFAULT_TIME = "08:00";
const ANDROID_CHANNEL_ID = "daily-verse";
const ROLLING_DAYS = 7;

let scheduleInFlight: Promise<void> | null = null;

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
    return {
      enabled: enabledRaw[1] === "true",
      time: time[1] ?? DEFAULT_TIME,
    };
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

function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.trim().split(":").map(Number);
  return {
    hour: Math.min(23, Math.max(0, Number.isFinite(h) ? h : 8)),
    minute: Math.min(59, Math.max(0, Number.isFinite(m) ? m : 0)),
  };
}

export async function cancelDailyVerseNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

function slotDate(base: Date, hour: number, minute: number, dayOffset: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return d;
}

/**
 * Schedule the next 7 days of one-shot notifications, each with that day's verse text.
 */
export async function scheduleNextDailyVerseNotification(): Promise<void> {
  if (Platform.OS === "web") return;

  if (scheduleInFlight) {
    return scheduleInFlight;
  }

  scheduleInFlight = (async () => {
    const { enabled, time } = await getStoredPreferences();
    if (!enabled) {
      await cancelDailyVerseNotifications();
      return;
    }

    const granted = await requestNotificationPermissions();
    if (!granted) {
      // Disable, but keep the user's chosen time for when they re-enable.
      await setStoredPreferences(false, time);
      await cancelDailyVerseNotifications();
      return;
    }

    await cancelDailyVerseNotifications();

    const Notifications = getNotifications();
    if (!Notifications) return;

    const language = await getStoredContentLanguage();
    const { hour, minute } = parseTime(time);
    const now = new Date();
    const todaySlot = slotDate(now, hour, minute, 0);
    const startOffset = todaySlot.getTime() > now.getTime() ? 0 : 1;

    for (let i = 0; i < ROLLING_DAYS; i++) {
      const triggerAt = slotDate(now, hour, minute, startOffset + i);
      const verse = getVerseForDate(triggerAt, language);
      if (!verse) continue;

      const { title, body, verseId } = getDailyVerseNotificationContent(verse);

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data: { ...DAILY_VERSE_NOTIFICATION_DATA, verseId },
          ...(Platform.OS === "android" && { channelId: ANDROID_CHANNEL_ID }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerAt,
          ...(Platform.OS === "android" && { channelId: ANDROID_CHANNEL_ID }),
        },
      });
    }
  })();

  try {
    await scheduleInFlight;
  } finally {
    scheduleInFlight = null;
  }
}
