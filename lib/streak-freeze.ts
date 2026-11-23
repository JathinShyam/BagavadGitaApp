/**
 * Streak freezes — "the lotus mark" (motion spec §2.6).
 *
 * One freeze is earned for every seven days of a live streak, capped at two,
 * and each one covers exactly one missed calendar day. Freezes are spent only
 * when they can save the whole gap: if the reader was away longer than their
 * balance can cover, the streak ends and the freezes stay in hand.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/constants/storage-keys";
import { addDaysToDateKey, daysBetweenDateKeys } from "@/lib/date-keys";
import type { ReadingStreak, StreakFreezeState } from "@/types";

export const FREEZE_EVERY_DAYS = 7;
export const FREEZE_CAP = 2;

export const EMPTY_FREEZES: StreakFreezeState = {
  balance: 0,
  awardedAt: 0,
  protectedDates: {},
};

/** Award a freeze each time the streak crosses another seven-day block. */
export function awardFreezeIfEarned(
  state: StreakFreezeState,
  currentStreak: number
): StreakFreezeState {
  // A streak that ended starts counting again from day one, so the threshold
  // resets with it. The freezes already in hand are untouched.
  if (currentStreak <= 0) {
    return state.awardedAt === 0 ? state : { ...state, awardedAt: 0 };
  }

  const blocks = Math.floor((currentStreak - state.awardedAt) / FREEZE_EVERY_DAYS);
  if (blocks <= 0) return state;

  return {
    ...state,
    awardedAt: state.awardedAt + blocks * FREEZE_EVERY_DAYS,
    balance: Math.min(FREEZE_CAP, state.balance + blocks),
  };
}

/**
 * Spend freezes to bridge a missed gap. Only commits when the balance can
 * cover every missed day, so a partial spend never wastes a freeze on a streak
 * that dies anyway.
 */
export function protectMissedDays(
  streak: ReadingStreak,
  todayKey: string,
  state: StreakFreezeState
): { streak: ReadingStreak; freezes: StreakFreezeState; protectedKeys: string[] } {
  if (!streak.lastReadDate || streak.currentStreak <= 0) {
    return { streak, freezes: state, protectedKeys: [] };
  }

  const gap = daysBetweenDateKeys(streak.lastReadDate, todayKey);
  if (gap <= 1) return { streak, freezes: state, protectedKeys: [] };

  const needed = gap - 1;
  if (needed > state.balance) return { streak, freezes: state, protectedKeys: [] };

  let cursor = streak.lastReadDate;
  const protectedKeys: string[] = [];
  for (let i = 0; i < needed; i++) {
    cursor = addDaysToDateKey(cursor, 1);
    protectedKeys.push(cursor);
  }

  const protectedDates = { ...state.protectedDates };
  for (const key of protectedKeys) protectedDates[key] = true;

  return {
    streak: { ...streak, lastReadDate: cursor },
    freezes: { ...state, balance: state.balance - needed, protectedDates },
    protectedKeys,
  };
}

export async function loadStreakFreezes(): Promise<StreakFreezeState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_FREEZES);
    if (!raw) return EMPTY_FREEZES;
    const parsed = JSON.parse(raw) as Partial<StreakFreezeState>;
    return {
      balance: Math.max(0, Math.min(FREEZE_CAP, Number(parsed.balance) || 0)),
      awardedAt: Math.max(0, Number(parsed.awardedAt) || 0),
      protectedDates: parsed.protectedDates ?? {},
    };
  } catch {
    return EMPTY_FREEZES;
  }
}

export async function saveStreakFreezes(state: StreakFreezeState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STREAK_FREEZES, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save streak freezes:", error);
  }
}
