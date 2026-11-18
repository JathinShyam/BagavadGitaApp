import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  ReadingProgressProvider,
  useReadingProgress,
} from "@/context/reading-progress-context";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { addDaysToDateKey, getLocalDateKey } from "@/lib/date-keys";

// The provider cancels tonight's streak nudge on read; keep the native
// notification module out of the unit tests.
jest.mock("@/lib/notification-availability", () => ({
  shouldLoadExpoNotifications: () => false,
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
      removeItem: jest.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
      multiRemove: jest.fn((keys: string[]) => {
        keys.forEach((key) => store.delete(key));
        return Promise.resolve();
      }),
    },
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(ReadingProgressProvider, null, children);

async function renderProgress() {
  const rendered = renderHook(() => useReadingProgress(), { wrapper });
  await waitFor(() => expect(rendered.result.current.loading).toBe(false));
  return rendered;
}

describe("markVerseAsRead — daily credit (BUG-018)", () => {
  beforeEach(async () => {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  });
  it("counts the day when an already-read verse is re-read", async () => {
    const { result } = await renderProgress();
    const today = getLocalDateKey();

    await act(async () => {
      await result.current.markVerseAsRead(2, "47");
    });
    const streakAfterFirstRead = result.current.streak.currentStreak;

    // Home's "Continue reading" reopens this exact verse.
    await act(async () => {
      await result.current.markVerseAsRead(2, "47");
    });

    expect(result.current.isVerseRead(2, "47")).toBe(true);
    expect(result.current.isDailyGoalComplete()).toBe(true);
    expect(result.current.getVersesReadOnDate(today)).toBe(1);
    expect(result.current.streak.currentStreak).toBe(streakAfterFirstRead);
    expect(result.current.streak.lastReadDate).toBe(today);
  });

  it("counts a second, different verse without double-crediting the streak", async () => {
    const { result } = await renderProgress();
    const today = getLocalDateKey();

    await act(async () => {
      await result.current.markVerseAsRead(2, "47");
    });
    await act(async () => {
      await result.current.markVerseAsRead(2, "48");
    });

    expect(result.current.getVersesReadOnDate(today)).toBe(2);
    expect(result.current.streak.currentStreak).toBe(1);
  });
});

describe("reconciling a stored streak on load (BUG-019)", () => {
  beforeEach(async () => {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  });

  it("shows a reset streak when the last read was two days ago", async () => {
    const today = getLocalDateKey();
    await AsyncStorage.setItem(
      STORAGE_KEYS.READING_STREAK,
      JSON.stringify({
        currentStreak: 30,
        longestStreak: 30,
        lastReadDate: addDaysToDateKey(today, -2),
      })
    );

    const { result } = await renderProgress();

    expect(result.current.streak.currentStreak).toBe(0);
    expect(result.current.streak.longestStreak).toBe(30);
  });

  it("keeps a streak read yesterday", async () => {
    const today = getLocalDateKey();
    await AsyncStorage.setItem(
      STORAGE_KEYS.READING_STREAK,
      JSON.stringify({
        currentStreak: 12,
        longestStreak: 12,
        lastReadDate: addDaysToDateKey(today, -1),
      })
    );

    const { result } = await renderProgress();

    expect(result.current.streak.currentStreak).toBe(12);
  });
});

describe("lotus freeze (spec §2.6)", () => {
  beforeEach(async () => {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  });

  it("spends a freeze to save a one-day gap on load", async () => {
    const today = getLocalDateKey();
    const missed = addDaysToDateKey(today, -1);
    await AsyncStorage.setItem(
      STORAGE_KEYS.READING_STREAK,
      JSON.stringify({
        currentStreak: 12,
        longestStreak: 12,
        lastReadDate: addDaysToDateKey(today, -2),
      })
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.STREAK_FREEZES,
      JSON.stringify({ balance: 1, awardedAt: 7, protectedDates: {} })
    );

    const { result } = await renderProgress();

    expect(result.current.streak.currentStreak).toBe(12);
    expect(result.current.streak.lastReadDate).toBe(missed);
    expect(result.current.freezes.balance).toBe(0);
    expect(result.current.freezes.protectedDates[missed]).toBe(true);
  });

  it("lets the streak die when no freeze is in hand", async () => {
    const today = getLocalDateKey();
    await AsyncStorage.setItem(
      STORAGE_KEYS.READING_STREAK,
      JSON.stringify({
        currentStreak: 12,
        longestStreak: 12,
        lastReadDate: addDaysToDateKey(today, -2),
      })
    );

    const { result } = await renderProgress();

    expect(result.current.streak.currentStreak).toBe(0);
    expect(result.current.freezes.balance).toBe(0);
  });

  it("awards a freeze when the streak reaches seven days", async () => {
    const today = getLocalDateKey();
    await AsyncStorage.setItem(
      STORAGE_KEYS.READING_STREAK,
      JSON.stringify({
        currentStreak: 6,
        longestStreak: 6,
        lastReadDate: addDaysToDateKey(today, -1),
      })
    );

    const { result } = await renderProgress();
    await act(async () => {
      await result.current.markVerseAsRead(2, "47");
    });

    expect(result.current.streak.currentStreak).toBe(7);
    expect(result.current.freezes.balance).toBe(1);
  });
});
