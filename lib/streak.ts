/**
 * Streak maths, kept out of the provider so it can be unit-tested.
 *
 * A streak is *live* while the last read was today or yesterday: today can
 * still extend it, yesterday can still be joined. Anything older is broken and
 * must not keep showing the old number (BUG-019).
 */

import { addDaysToDateKey, daysBetweenDateKeys, getLocalDateKey } from "@/lib/date-keys";
import type { ReadingActivity, ReadingStreak } from "@/types";

/**
 * Streak after reading on `todayKey`.
 *
 * A re-read on the same day is a no-op — the streak counts calendar days, not
 * verses (BUG-018: what matters is that the day counts, never twice).
 */
export function computeNextStreak(prev: ReadingStreak, todayKey: string): ReadingStreak {
  if (prev.lastReadDate === todayKey) return prev;

  let nextCount: number;
  if (!prev.lastReadDate) {
    nextCount = 1;
  } else {
    const gap = daysBetweenDateKeys(prev.lastReadDate, todayKey);
    if (gap === 1) {
      nextCount = prev.currentStreak + 1;
    } else if (gap > 1) {
      nextCount = 1;
    } else {
      // Clock moved backwards (or a timezone change): keep what was earned
      // rather than silently zeroing a live streak.
      nextCount = Math.max(prev.currentStreak, 1);
    }
  }

  return {
    currentStreak: nextCount,
    longestStreak: Math.max(prev.longestStreak, nextCount),
    lastReadDate: todayKey,
  };
}

/**
 * The streak as it should be displayed on `todayKey`.
 *
 * Only the *current* streak decays. `longestStreak` and `lastReadDate` are kept
 * so the UI can still say "your 12-day streak ended" instead of going silent.
 * Returns `prev` untouched when nothing changed, so callers can skip writes.
 */
export function reconcileStreak(streak: ReadingStreak, todayKey: string): ReadingStreak {
  if (!streak.lastReadDate || streak.currentStreak <= 0) return streak;

  const gap = daysBetweenDateKeys(streak.lastReadDate, todayKey);
  if (gap <= 1) return streak;

  return { ...streak, currentStreak: 0 };
}

/**
 * Credit a read toward the day.
 *
 * A new verse adds to the day's count. A re-read must make the day count when
 * it did not already (daily goal, calendar, streak) but must not inflate the
 * heatmap's "verses read today" (BUG-018).
 */
export function creditDayAsRead(
  activity: ReadingActivity,
  todayKey: string,
  isNewVerse: boolean
): ReadingActivity {
  const count = activity[todayKey] ?? 0;
  if (isNewVerse) return { ...activity, [todayKey]: count + 1 };
  if (count > 0) return activity;
  return { ...activity, [todayKey]: 1 };
}

export type WeekDay = { key: string; filled: boolean; today: boolean };

/** The current week, Sunday first — matching the calendar sheet and heatmap. */
export function getStreakWeek(
  activity: ReadingActivity,
  now: Date = new Date()
): WeekDay[] {
  const todayKey = getLocalDateKey(now);
  const startKey = addDaysToDateKey(todayKey, -now.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const key = addDaysToDateKey(startKey, i);
    return { key, filled: (activity[key] ?? 0) > 0, today: key === todayKey };
  });
}
