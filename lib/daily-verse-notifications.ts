/**
 * Daily verse local notifications: permissions, scheduling, and persistence.
 *
 * Schedules a rolling window of one-shot DATE notifications (next 30 days) so
 * each day's tray text can include that day's verse preview. Re-call on
 * foreground / preference changes to refresh the window.
 *
 * Why 30 one-shots instead of a repeating trigger: a DAILY trigger cannot start
 * on a future date, so pairing it with the rich window would fire two
 * notifications at the same minute every day. Thirty days of specific verses
 * covers the "user does not open the app" case without duplicates and stays
 * well under iOS's 64-pending-notification limit.
 *
 * Uses lazy require() only when {@link shouldLoadExpoNotifications} is true.
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/constants/storage-keys";
import { translate } from "@/lib/i18n";

import {
  getDailyVerseNotificationContent,
  getVerseForDate,
} from "./daily-verse";
import { shouldLoadExpoNotifications } from "./notification-availability";
import { getStoredContentLanguage } from "./chapter-content";
import { getLocalDateKey } from "./date-keys";

function getNotifications(): typeof import("expo-notifications") | null {
  if (!shouldLoadExpoNotifications()) return null;
  try {
    // Loaded lazily so Expo Go (which has no expo-notifications native module)
    // does not crash at import time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-notifications");
  } catch {
    return null;
  }
}

const DEFAULT_TIME = "08:00";
const ANDROID_CHANNEL_ID = "daily-verse";
const ROLLING_DAYS = 30;
/** Every notification we own shares this prefix, so cancel can target only ours. */
const IDENTIFIER_PREFIX = "daily-verse-";
/** Bump when the identifier scheme changes; forces a one-time cleanup. */
const SCHEDULE_VERSION = "2";

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
      STORAGE_KEYS.DAILY_VERSE_NOTIFICATIONS_ENABLED,
      STORAGE_KEYS.DAILY_VERSE_NOTIFICATION_TIME,
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
      [STORAGE_KEYS.DAILY_VERSE_NOTIFICATIONS_ENABLED, enabled ? "true" : "false"],
      [STORAGE_KEYS.DAILY_VERSE_NOTIFICATION_TIME, time],
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
    const channelLanguage = await getStoredContentLanguage();
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: translate(channelLanguage, "notifications.channelName"),
      description: translate(channelLanguage, "notifications.channelDescription"),
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

/**
 * Cancel only this feature's notifications. The app may schedule other types in
 * future (streak-at-risk, milestones) and `cancelAllScheduled…` would silently
 * kill them too.
 */
export async function cancelDailyVerseNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  const Notifications = getNotifications();
  if (!Notifications) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.identifier.startsWith(IDENTIFIER_PREFIX))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier))
  );
}

/**
 * Builds before this version scheduled notifications with generated ids, which
 * the scoped cancel above cannot recognise. Clear them once so the upgrade does
 * not leave a second reminder firing alongside the new one.
 */
async function clearLegacySchedule(
  Notifications: typeof import("expo-notifications")
): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SCHEDULE_VERSION);
  if (stored === SCHEDULE_VERSION) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SCHEDULE_VERSION, SCHEDULE_VERSION);
}

function slotDate(base: Date, hour: number, minute: number, dayOffset: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return d;
}

/**
 * Schedule the next 30 days of one-shot notifications, each with that day's verse text.
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

    const Notifications = getNotifications();
    if (!Notifications) return;

    await clearLegacySchedule(Notifications);
    await cancelDailyVerseNotifications();

    const language = await getStoredContentLanguage();
    const { hour, minute } = parseTime(time);
    const now = new Date();
    const todaySlot = slotDate(now, hour, minute, 0);
    const startOffset = todaySlot.getTime() > now.getTime() ? 0 : 1;

    for (let i = 0; i < ROLLING_DAYS; i++) {
      const triggerAt = slotDate(now, hour, minute, startOffset + i);
      const verse = getVerseForDate(triggerAt, language);
      if (!verse) continue;

      const { title, body, verseId } = getDailyVerseNotificationContent(
        verse,
        language
      );

      await Notifications.scheduleNotificationAsync({
        identifier: `${IDENTIFIER_PREFIX}${getLocalDateKey(triggerAt)}`,
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
