import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/constants/storage-keys";
import { addDaysToDateKey, getLocalDateKey } from "@/lib/date-keys";

const mockScheduled: { identifier?: string; content: unknown }[] = [];
const mockCancelled: string[] = [];

jest.mock("@/lib/notification-availability", () => ({
  shouldLoadExpoNotifications: () => true,
}));

jest.mock("@/lib/chapter-content", () => ({
  getStoredContentLanguage: async () => "en",
}));

jest.mock("expo-notifications", () => ({
  SchedulableTriggerInputTypes: { DATE: "date" },
  AndroidImportance: { DEFAULT: 3 },
  getPermissionsAsync: async () => ({ status: "granted" }),
  requestPermissionsAsync: async () => ({ status: "granted" }),
  setNotificationChannelAsync: async () => {},
  scheduleNotificationAsync: async (request: { identifier?: string; content: unknown }) => {
    mockScheduled.push(request);
    return request.identifier ?? "generated";
  },
  getAllScheduledNotificationsAsync: jest.fn(async () => [
    { identifier: "daily-verse-2026-11-16" },
    { identifier: "daily-verse-2026-11-17" },
    { identifier: "streak-at-risk" },
  ]),
  cancelScheduledNotificationAsync: jest.fn(async (identifier: string) => {
    mockCancelled.push(identifier);
  }),
  cancelAllScheduledNotificationsAsync: async () => {},
}));

jest.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      multiGet: jest.fn((keys: string[]) =>
        Promise.resolve(keys.map((key) => [key, store.get(key) ?? null]))
      ),
      multiSet: jest.fn((pairs: [string, string][]) => {
        pairs.forEach(([key, value]) => store.set(key, value));
        return Promise.resolve();
      }),
      multiRemove: jest.fn((keys: string[]) => {
        keys.forEach((key) => store.delete(key));
        return Promise.resolve();
      }),
    },
  };
});

// Imported after the mocks so the module picks them up.
// eslint-disable-next-line import/first -- the mocks above must exist first
import {
  cancelDailyVerseNotifications,
  scheduleNextDailyVerseNotification,
  scheduleStreakAtRiskNotification,
  setStoredPreferences,
} from "@/lib/daily-verse-notifications";

describe("daily verse notification schedule (BUG-020)", () => {
  beforeEach(async () => {
    mockScheduled.length = 0;
    mockCancelled.length = 0;
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  });

  it("schedules 30 identified notifications so it survives 14+ days offline", async () => {
    await setStoredPreferences(true, "08:00");
    await scheduleNextDailyVerseNotification();

    expect(mockScheduled).toHaveLength(30);
    const identifiers = mockScheduled.map((request) => request.identifier ?? "");
    expect(identifiers.every((id) => id.startsWith("daily-verse-"))).toBe(true);
    expect(new Set(identifiers).size).toBe(30);
  });

  it("cancels only its own notifications, never another feature's", async () => {
    await cancelDailyVerseNotifications();

    expect(mockCancelled).toContain("daily-verse-2026-11-16");
    expect(mockCancelled).not.toContain("streak-at-risk");
  });

  it("schedules nothing when the reminder is off", async () => {
    await setStoredPreferences(false, "08:00");
    await scheduleNextDailyVerseNotification();

    expect(mockScheduled).toHaveLength(0);
  });

  it("keeps the schedule when enabling races a stale foreground run", async () => {
    // The permission dialog backgrounds the app; the AppState refresh can
    // start a run that reads `enabled=false` just before the toggle writes
    // `true`. Coalescing let the toggle join that stale run and cancel the
    // schedule instead of creating it.
    await setStoredPreferences(false, "08:00");

    const Notifications = jest.requireMock("expo-notifications") as {
      getAllScheduledNotificationsAsync: jest.Mock;
    };
    let enterCancel!: () => void;
    const enteredCancel = new Promise<void>((resolve) => {
      enterCancel = resolve;
    });
    let releaseCancel!: () => void;
    const cancelGate = new Promise<void>((resolve) => {
      releaseCancel = resolve;
    });
    Notifications.getAllScheduledNotificationsAsync.mockImplementationOnce(
      async () => {
        enterCancel();
        await cancelGate;
        return [];
      }
    );

    const staleRun = scheduleNextDailyVerseNotification();
    await enteredCancel;

    await setStoredPreferences(true, "08:00");
    const enableRun = scheduleNextDailyVerseNotification();
    releaseCancel();
    await Promise.all([staleRun, enableRun]);

    expect(mockScheduled).toHaveLength(30);
  });
});

describe("streak-at-risk nudge (spec §2.7)", () => {
  const yesterday = () => addDaysToDateKey(getLocalDateKey(), -1);
  const atRiskRequests = () =>
    mockScheduled.filter((request) =>
      (request.identifier ?? "").startsWith("streak-at-risk")
    );

  beforeEach(async () => {
    mockScheduled.length = 0;
    mockCancelled.length = 0;
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    await setStoredPreferences(true, "08:00");
  });

  it("schedules tonight's nudge for a live streak that has not read", async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.READING_STREAK,
      JSON.stringify({
        currentStreak: 12,
        longestStreak: 12,
        lastReadDate: yesterday(),
      })
    );

    const atNine = new Date();
    atNine.setHours(9, 0, 0, 0);
    await scheduleStreakAtRiskNotification(atNine);

    const [request] = atRiskRequests();
    expect(request).toBeDefined();
    expect((request.content as { title: string }).title).toBe(
      "Your 12-day streak ends at midnight"
    );
  });

  it("schedules tomorrow's nudge once the day is read", async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.READING_STREAK,
      JSON.stringify({
        currentStreak: 12,
        longestStreak: 12,
        lastReadDate: getLocalDateKey(),
      })
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.READING_ACTIVITY,
      JSON.stringify({ [getLocalDateKey()]: 1 })
    );

    const atNine = new Date();
    atNine.setHours(9, 0, 0, 0);
    await scheduleStreakAtRiskNotification(atNine);

    // Tonight is already earned, but the streak is live tomorrow — that is the
    // night the reader can still lose it without opening the app.
    const [request] = atRiskRequests();
    expect(request).toBeDefined();
    expect(request.identifier).toBe(
      `streak-at-risk${addDaysToDateKey(getLocalDateKey(), 1)}`
    );
    expect((request.content as { title: string }).title).toBe(
      "Your 12-day streak ends at midnight"
    );
  });

  it("never nudges a streak that was last read before yesterday", async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.READING_STREAK,
      JSON.stringify({
        currentStreak: 12,
        longestStreak: 12,
        lastReadDate: addDaysToDateKey(getLocalDateKey(), -2),
      })
    );

    const atNine = new Date();
    atNine.setHours(9, 0, 0, 0);
    await scheduleStreakAtRiskNotification(atNine);

    expect(atRiskRequests()).toHaveLength(0);
  });

  it("does not schedule a moment that has already passed", async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.READING_STREAK,
      JSON.stringify({
        currentStreak: 12,
        longestStreak: 12,
        lastReadDate: yesterday(),
      })
    );

    const lateEvening = new Date();
    lateEvening.setHours(22, 0, 0, 0);
    await scheduleStreakAtRiskNotification(lateEvening);

    expect(atRiskRequests()).toHaveLength(0);
  });
});
