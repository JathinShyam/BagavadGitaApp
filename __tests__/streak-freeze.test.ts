import {
  EMPTY_FREEZES,
  FREEZE_CAP,
  awardFreezeIfEarned,
  protectMissedDays,
} from "@/lib/streak-freeze";
import type { ReadingStreak, StreakFreezeState } from "@/types";

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
    },
  };
});

const TODAY = "2026-11-18";

function streak(partial: Partial<ReadingStreak>): ReadingStreak {
  return { currentStreak: 0, longestStreak: 0, lastReadDate: null, ...partial };
}

function freezes(partial: Partial<StreakFreezeState>): StreakFreezeState {
  return { ...EMPTY_FREEZES, ...partial };
}

describe("awardFreezeIfEarned", () => {
  it("awards the first freeze on day seven", () => {
    expect(awardFreezeIfEarned(EMPTY_FREEZES, 6).balance).toBe(0);
    expect(awardFreezeIfEarned(EMPTY_FREEZES, 7).balance).toBe(1);
  });

  it("awards once per seven-day block, not on every read", () => {
    const day7 = awardFreezeIfEarned(EMPTY_FREEZES, 7);
    expect(awardFreezeIfEarned(day7, 8)).toBe(day7);
    const day14 = awardFreezeIfEarned(day7, 14);
    expect(day14.balance).toBe(2);
    expect(day14.awardedAt).toBe(14);
  });

  it("never banks more than the cap", () => {
    let state = EMPTY_FREEZES;
    for (let day = 7; day <= 70; day += 7) {
      state = awardFreezeIfEarned(state, day);
    }
    expect(state.balance).toBe(FREEZE_CAP);
  });

  it("resets the threshold when the streak ends, keeping the balance", () => {
    const withOne = awardFreezeIfEarned(EMPTY_FREEZES, 7);
    const broken = awardFreezeIfEarned(withOne, 0);
    expect(broken).toEqual({ ...withOne, awardedAt: 0 });
    // A fresh run earns again at its own day seven.
    expect(awardFreezeIfEarned(broken, 7).balance).toBe(2);
  });
});

describe("protectMissedDays", () => {
  const live = streak({ currentStreak: 12, longestStreak: 12, lastReadDate: "2026-11-16" });

  it("leaves a live streak alone", () => {
    const result = protectMissedDays(
      streak({ currentStreak: 12, longestStreak: 12, lastReadDate: "2026-11-17" }),
      TODAY,
      freezes({ balance: 1 })
    );
    expect(result.protectedKeys).toEqual([]);
    expect(result.freezes.balance).toBe(1);
  });

  it("spends one freeze on one missed day and keeps the streak live", () => {
    const result = protectMissedDays(live, TODAY, freezes({ balance: 1 }));
    expect(result.streak.currentStreak).toBe(12);
    expect(result.streak.lastReadDate).toBe("2026-11-17");
    expect(result.freezes.balance).toBe(0);
    expect(result.freezes.protectedDates["2026-11-17"]).toBe(true);
  });

  it("spends two freezes on two missed days", () => {
    const result = protectMissedDays(
      streak({ currentStreak: 5, longestStreak: 5, lastReadDate: "2026-11-15" }),
      TODAY,
      freezes({ balance: 2 })
    );
    expect(result.streak.lastReadDate).toBe("2026-11-17");
    expect(result.freezes.balance).toBe(0);
    expect(result.protectedKeys).toEqual(["2026-11-16", "2026-11-17"]);
  });

  it("does not spend a freeze when the gap is longer than the balance", () => {
    const result = protectMissedDays(live, TODAY, freezes({ balance: 0 }));
    expect(result.streak).toEqual(live);
    expect(result.freezes.balance).toBe(0);
    expect(result.freezes.protectedDates).toEqual({});
  });

  it("does not resurrect a streak that was already reset", () => {
    const result = protectMissedDays(
      streak({ currentStreak: 0, longestStreak: 12, lastReadDate: "2026-11-10" }),
      TODAY,
      freezes({ balance: 2 })
    );
    expect(result.freezes.balance).toBe(2);
    expect(result.streak.currentStreak).toBe(0);
  });
});
