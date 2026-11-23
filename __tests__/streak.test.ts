import { computeNextStreak, creditDayAsRead, reconcileStreak } from "@/lib/streak";
import type { ReadingStreak } from "@/types";

const streak = (
  currentStreak: number,
  longestStreak: number,
  lastReadDate: string | null
): ReadingStreak => ({ currentStreak, longestStreak, lastReadDate });

describe("computeNextStreak (BUG-018)", () => {
  it("starts a streak at 1 on the first read", () => {
    expect(computeNextStreak(streak(0, 0, null), "2026-11-16")).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastReadDate: "2026-11-16",
    });
  });

  it("extends a streak read the day before", () => {
    expect(computeNextStreak(streak(4, 9, "2026-11-15"), "2026-11-16")).toEqual({
      currentStreak: 5,
      longestStreak: 9,
      lastReadDate: "2026-11-16",
    });
  });

  it("does not credit the same day twice, even after many reads", () => {
    const today = streak(1, 1, "2026-11-16");
    expect(computeNextStreak(today, "2026-11-16")).toBe(today);
  });

  it("restarts at 1 after a missed day but keeps the best streak", () => {
    expect(computeNextStreak(streak(12, 30, "2026-11-14"), "2026-11-16")).toEqual({
      currentStreak: 1,
      longestStreak: 30,
      lastReadDate: "2026-11-16",
    });
  });

  it("keeps the earned streak when the clock moves backwards", () => {
    expect(computeNextStreak(streak(6, 6, "2026-11-20"), "2026-11-16")).toEqual({
      currentStreak: 6,
      longestStreak: 6,
      lastReadDate: "2026-11-16",
    });
  });
});

describe("reconcileStreak (BUG-019)", () => {
  it("keeps a streak read today", () => {
    const live = streak(3, 3, "2026-11-16");
    expect(reconcileStreak(live, "2026-11-16")).toBe(live);
  });

  it("keeps a streak read yesterday, which can still be joined", () => {
    const live = streak(3, 5, "2026-11-15");
    expect(reconcileStreak(live, "2026-11-16")).toBe(live);
  });

  it("resets the current streak after a missed day, keeping the best and the date", () => {
    expect(reconcileStreak(streak(30, 30, "2026-11-14"), "2026-11-16")).toEqual({
      currentStreak: 0,
      longestStreak: 30,
      lastReadDate: "2026-11-14",
    });
  });

  it("leaves an empty streak alone", () => {
    const empty = streak(0, 0, null);
    expect(reconcileStreak(empty, "2026-11-16")).toBe(empty);
  });
});

describe("creditDayAsRead (BUG-018)", () => {
  it("counts a new verse on a day with no reads yet", () => {
    expect(creditDayAsRead({}, "2026-11-16", true)).toEqual({ "2026-11-16": 1 });
  });

  it("counts each new verse", () => {
    expect(creditDayAsRead({ "2026-11-16": 1 }, "2026-11-16", true)).toEqual({
      "2026-11-16": 2,
    });
  });

  it("marks a re-read day as read without inflating the count", () => {
    expect(creditDayAsRead({}, "2026-11-16", false)).toEqual({ "2026-11-16": 1 });
    const activity = { "2026-11-16": 3 };
    expect(creditDayAsRead(activity, "2026-11-16", false)).toBe(activity);
  });
});
