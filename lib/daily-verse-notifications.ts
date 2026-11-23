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
import { addDaysToDateKey, getLocalDateKey } from "./date-keys";
import { getAtRiskMoment, parseReminderTime } from "./streak-at-risk";

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
/** Streak-at-risk nudges are their own family so reads can cancel them alone. */
const AT_RISK_PREFIX = "streak-at-risk";
const ANDROID_CHANNEL_ID = "daily-verse";
const ROLLING_DAYS = 30;
/** Every notification we own shares this prefix, so cancel can target only ours. */
const IDENTIFIER_PREFIX = "daily-verse-";
/** Bump when the identifier scheme changes; forces a one-time cleanup. */
const SCHEDULE_VERSION = "2";

/**
 * Runs are serialised, not coalesced. The permission dialog shown while
 * enabling notifications returns the app to the foreground, which fires the
 * AppState refresh. That refresh can read the old `enabled=false` and cancel
 * the schedule the toggle is about to create; coalescing let the toggle join
 * the stale run and drop the schedule entirely. A queue lets both run in
 * order, so the later call always reads the freshly written preference.
 */
let scheduleQueue: Promise<void> = Promise.resolve();

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

async function getStoredStreakSnapshot(): Promise<{
  currentStreak: number;
  readToday: boolean;
  liveYesterday: boolean;
} | null> {
  try {
    const [streakRaw, activityRaw] = await AsyncStorage.multiGet([
      STORAGE_KEYS.READING_STREAK,
      STORAGE_KEYS.READING_ACTIVITY,
    ]);
    if (!streakRaw[1]) return null;
    const streak = JSON.parse(streakRaw[1]) as {
      currentStreak?: number;
      lastReadDate?: string | null;
    };
    const activity = activityRaw[1]
      ? (JSON.parse(activityRaw[1]) as Record<string, number>)
      : {};
    const todayKey = getLocalDateKey();
    return {
      currentStreak: Number(streak.currentStreak) || 0,
      readToday: (activity[todayKey] ?? 0) > 0,
      // Only a streak read yesterday can be extended tonight. A stored value
      // that has not been reconciled yet must not produce a nudge.
      liveYesterday: streak.lastReadDate === addDaysToDateKey(todayKey, -1),
    };
  } catch {
    return null;
  }
}

/** Remove at-risk nudges. Pass a date key to remove only that night's. */
export async function cancelStreakAtRiskNotification(dateKey?: string): Promise<void> {
  if (Platform.OS === "web") return;
  const Notifications = getNotifications();
  if (!Notifications) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const target = dateKey ? `${AT_RISK_PREFIX}${dateKey}` : AT_RISK_PREFIX;
  await Promise.all(
    scheduled
      .filter((request) => request.identifier.startsWith(target))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier))
  );
}

/**
 * Schedule the streak nudge.
 *
 * Two nights can still be true when the app is closed: tonight (if a live
 * streak has not been read today) and tomorrow (if today is already read, so
 * the streak survives into tomorrow). Scheduling only tonight meant the
 * scenario the feature exists for — the reader does not open the app — never
 * produced a nudge (review finding P1).
 *
 * Reading calls this again, which rebuilds the window and moves the nudge to
 * tomorrow. A nudge further out would be a lie: one missed day without a read
 * already ends the streak.
 */
export async function scheduleStreakAtRiskNotification(
  now: Date = new Date()
): Promise<void> {
  if (Platform.OS === "web") return;

  const Notifications = getNotifications();
  if (!Notifications) return;

  const { enabled, time } = await getStoredPreferences();
  if (!enabled) {
    await cancelStreakAtRiskNotification();
    return;
  }

  const snapshot = await getStoredStreakSnapshot();
  if (!snapshot || snapshot.currentStreak <= 0) {
    await cancelStreakAtRiskNotification();
    return;
  }

  // Rebuild the whole window so a stale night never survives a reschedule.
  await cancelStreakAtRiskNotification();

  const { hour, minute } = getAtRiskMoment(time);
  const language = await getStoredContentLanguage();

  const scheduleNight = async (dayOffset: number, streakCount: number) => {
    const triggerAt = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    triggerAt.setDate(triggerAt.getDate() + dayOffset);
    triggerAt.setHours(hour, minute, 0, 0);
    if (triggerAt.getTime() <= now.getTime()) return;

    const verseId = getVerseForDate(triggerAt)?.id;
    await Notifications.scheduleNotificationAsync({
      identifier: `${AT_RISK_PREFIX}${getLocalDateKey(triggerAt)}`,
      content: {
        title: translate(language, "notifications.atRiskTitle", {
          count: streakCount,
        }),
        body: translate(language, "notifications.atRiskBody"),
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
  };

  // Tonight: the streak is still live and today has not been read yet.
  if (!snapshot.readToday && snapshot.liveYesterday) {
    await scheduleNight(0, snapshot.currentStreak);
  }

  // Tomorrow: today is read, so the streak will still be live tomorrow. The
  // count is today's — if tomorrow goes unread, that is what the reader loses.
  if (snapshot.readToday) {
    await scheduleNight(1, snapshot.currentStreak);
  }
}

/**
 * Schedule the next 30 days of one-shot notifications, each with that day's verse text.
 */
export function scheduleNextDailyVerseNotification(): Promise<void> {
  if (Platform.OS === "web") return Promise.resolve();

  const run = scheduleQueue.then(scheduleDailyVerseNotificationsOnce);
  // Keep the queue alive even when a run rejects; the caller still sees it.
  scheduleQueue = run.catch((error) => {
    console.error("Failed to schedule daily verse notifications:", error);
  });
  return run;
}

async function scheduleDailyVerseNotificationsOnce(): Promise<void> {
  const { enabled, time } = await getStoredPreferences();
  if (!enabled) {
    await cancelDailyVerseNotifications();
    await cancelStreakAtRiskNotification();
    return;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) {
    // Disable, but keep the user's chosen time for when they re-enable.
    await setStoredPreferences(false, time);
    await cancelDailyVerseNotifications();
    await cancelStreakAtRiskNotification();
    return;
  }

  const Notifications = getNotifications();
  if (!Notifications) return;

  await clearLegacySchedule(Notifications);
  await cancelDailyVerseNotifications();

  const language = await getStoredContentLanguage();
  const { hour, minute } = parseReminderTime(time);
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

  // One nudge for tonight, refreshed on every foreground and on read.
  await scheduleStreakAtRiskNotification();
}
