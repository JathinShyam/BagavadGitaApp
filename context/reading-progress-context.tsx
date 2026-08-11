import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { CHAPTER_VERSE_COUNTS } from "@/constants/chapter-verse-counts";
import { DAILY_VERSE_GOAL } from "@/constants/milestones";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import {
  addDaysToDateKey,
  daysBetweenDateKeys,
  getLocalDateKey,
} from "@/lib/date-keys";
import type {
  LastReadVerse,
  ReadingActivity,
  ReadingProgress,
  ReadingStreak,
} from "@/types";

/**
 * Converts stored verse keys (e.g. "12-13-14", "3-1-2", "2-47") into unique covered verse
 * numbers for a chapter, so progress reflects actual verse coverage even with combined entries.
 */
function getCoveredVerseCount(chapterId: number, verseKeys: string[], chapterTotal: number): number {
  const covered = new Set<number>();
  const prefix = `${chapterId}-`;

  for (const key of verseKeys) {
    if (!key.startsWith(prefix)) continue;
    const suffix = key.slice(prefix.length);
    if (!suffix) continue;
    const parts = suffix.split("-").map((n) => Number(n)).filter(Number.isFinite);
    if (parts.length === 0) continue;

    if (parts.length === 1) {
      const n = parts[0];
      if (n >= 1 && n <= chapterTotal) covered.add(n);
      continue;
    }

    const start = Math.min(parts[0], parts[parts.length - 1]);
    const end = Math.max(parts[0], parts[parts.length - 1]);
    for (let n = start; n <= end; n++) {
      if (n >= 1 && n <= chapterTotal) covered.add(n);
    }
  }

  return covered.size;
}

export const CHAPTER_VERSES = CHAPTER_VERSE_COUNTS;

export type MarkVerseAsReadResult = {
  isNewCompletion: boolean;
  totalVerses: number;
  wasNewlyRead: boolean;
  currentStreak: number;
  dailyGoalJustCompleted: boolean;
};

interface ReadingProgressContextValue {
  progress: ReadingProgress;
  loading: boolean;
  activity: ReadingActivity;
  markVerseAsRead: (
    chapterId: number,
    verseNumber: string
  ) => Promise<MarkVerseAsReadResult>;
  isVerseRead: (chapterId: number, verseNumber: string) => boolean;
  getChapterProgress: (chapterId: number) => number;
  isChapterComplete: (chapterId: number) => boolean;
  isLastVerseInChapter: (chapterId: number, verseNumber: string) => boolean;
  getTotalProgress: () => number;
  resetChapterProgress: (chapterId: number) => Promise<void>;
  resetAllProgress: () => Promise<void>;
  CHAPTER_VERSES: { [key: number]: number };
  streak: ReadingStreak;
  lastReadVerseId: string | null;
  setLastReadVerse: (verseId: string) => Promise<void>;
  getVersesReadOnDate: (dateKey: string) => number;
  getActivityMap: () => ReadingActivity;
  isDailyGoalComplete: (dateKey?: string) => boolean;
  isStreakAtRisk: () => boolean;
}

const ReadingProgressContext = createContext<ReadingProgressContextValue | null>(null);

export function ReadingProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<ReadingProgress>({});
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ReadingActivity>({});
  const [streak, setStreak] = useState<ReadingStreak>({
    currentStreak: 0,
    longestStreak: 0,
    lastReadDate: null,
  });
  const [lastReadVerse, setLastReadVerseState] = useState<LastReadVerse>({
    verseId: null,
    updatedAt: null,
  });

  // Keep latest snapshots for serialized markVerseAsRead writes.
  const progressRef = useRef(progress);
  const activityRef = useRef(activity);
  const streakRef = useRef(streak);
  progressRef.current = progress;
  activityRef.current = activity;
  streakRef.current = streak;

  const loadProgress = useCallback(async () => {
    try {
      const [storedProgress, storedStreak, storedLastRead, storedActivity] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.READING_PROGRESS),
          AsyncStorage.getItem(STORAGE_KEYS.READING_STREAK),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_READ_VERSE),
          AsyncStorage.getItem(STORAGE_KEYS.READING_ACTIVITY),
        ]);

      if (storedProgress) {
        setProgress(JSON.parse(storedProgress));
      }
      if (storedStreak) {
        try {
          const parsed = JSON.parse(storedStreak);
          setStreak({
            currentStreak: parsed.currentStreak ?? 0,
            longestStreak: parsed.longestStreak ?? 0,
            lastReadDate: parsed.lastReadDate ?? null,
          });
        } catch {}
      }
      if (storedLastRead) {
        try {
          const parsed = JSON.parse(storedLastRead);
          setLastReadVerseState({
            verseId: parsed.verseId ?? null,
            updatedAt: parsed.updatedAt ?? null,
          });
        } catch {}
      }
      if (storedActivity) {
        try {
          setActivity(JSON.parse(storedActivity));
        } catch {}
      }
    } catch (error) {
      console.error("Error loading reading progress:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const saveProgress = useCallback(async (newProgress: ReadingProgress) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify(newProgress));
    } catch (error) {
      console.error("Error saving reading progress:", error);
    }
  }, []);

  const saveStreak = useCallback(async (data: ReadingStreak) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.READING_STREAK, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving reading streak:", error);
    }
  }, []);

  const saveActivity = useCallback(async (data: ReadingActivity) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.READING_ACTIVITY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving reading activity:", error);
    }
  }, []);

  const saveLastReadVerse = useCallback(async (data: LastReadVerse) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_READ_VERSE, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving last read verse:", error);
    }
  }, []);

  const markVerseAsRead = useCallback(
    async (chapterId: number, verseNumber: string): Promise<MarkVerseAsReadResult> => {
      const chapterKey = chapterId.toString();
      const verseKey = `${chapterId}-${verseNumber}`;
      const totalVerses = CHAPTER_VERSES[chapterId] || 0;
      const todayKey = getLocalDateKey();

      const currentProgress = progressRef.current;
      const currentActivity = activityRef.current;
      const currentStreak = streakRef.current;

      const chapterProgress = currentProgress[chapterKey] || {
        versesRead: [] as string[],
        totalVerses,
        isComplete: false,
      };

      const alreadyRead = chapterProgress.versesRead.includes(verseKey);
      if (alreadyRead) {
        return {
          isNewCompletion: false,
          totalVerses,
          wasNewlyRead: false,
          currentStreak: currentStreak.currentStreak,
          dailyGoalJustCompleted: false,
        };
      }

      const newVersesRead = [...chapterProgress.versesRead, verseKey];
      const coveredCount = getCoveredVerseCount(chapterId, newVersesRead, totalVerses);
      const chapterIsComplete = coveredCount >= totalVerses;
      const wasComplete = chapterProgress.isComplete;
      const isNewCompletion = !wasComplete && chapterIsComplete;

      const newProgress: ReadingProgress = {
        ...currentProgress,
        [chapterKey]: {
          versesRead: newVersesRead,
          totalVerses,
          isComplete: chapterIsComplete,
          completedAt: chapterIsComplete ? new Date().toISOString() : undefined,
        },
      };
      progressRef.current = newProgress;
      setProgress(newProgress);
      await saveProgress(newProgress);

      const prevCount = currentActivity[todayKey] ?? 0;
      const nextActivity: ReadingActivity = {
        ...currentActivity,
        [todayKey]: prevCount + 1,
      };
      activityRef.current = nextActivity;
      setActivity(nextActivity);
      await saveActivity(nextActivity);
      const dailyGoalJustCompleted =
        prevCount < DAILY_VERSE_GOAL && nextActivity[todayKey] >= DAILY_VERSE_GOAL;

      let nextStreak = currentStreak;
      if (currentStreak.lastReadDate !== todayKey) {
        let streakCount: number;
        if (!currentStreak.lastReadDate) {
          streakCount = 1;
        } else {
          const diffDays = daysBetweenDateKeys(currentStreak.lastReadDate, todayKey);
          if (diffDays === 1) {
            streakCount = currentStreak.currentStreak + 1;
          } else if (diffDays > 1) {
            streakCount = 1;
          } else {
            streakCount = currentStreak.currentStreak || 1;
          }
        }
        nextStreak = {
          currentStreak: streakCount,
          longestStreak: Math.max(currentStreak.longestStreak, streakCount),
          lastReadDate: todayKey,
        };
        streakRef.current = nextStreak;
        setStreak(nextStreak);
        await saveStreak(nextStreak);
      }

      return {
        isNewCompletion,
        totalVerses,
        wasNewlyRead: true,
        currentStreak: nextStreak.currentStreak,
        dailyGoalJustCompleted,
      };
    },
    [saveProgress, saveActivity, saveStreak]
  );

  const isVerseRead = useCallback(
    (chapterId: number, verseNumber: string) => {
      const chapterKey = chapterId.toString();
      const verseKey = `${chapterId}-${verseNumber}`;
      return progress[chapterKey]?.versesRead.includes(verseKey) || false;
    },
    [progress]
  );

  const getChapterProgress = useCallback(
    (chapterId: number) => {
      const chapterKey = chapterId.toString();
      const chapterProgress = progress[chapterKey];
      if (!chapterProgress || chapterProgress.totalVerses <= 0) return 0;
      const coveredCount = getCoveredVerseCount(
        chapterId,
        chapterProgress.versesRead,
        chapterProgress.totalVerses
      );
      return Math.round((coveredCount / chapterProgress.totalVerses) * 100);
    },
    [progress]
  );

  const isChapterComplete = useCallback(
    (chapterId: number) => {
      const chapterKey = chapterId.toString();
      const chapterProgress = progress[chapterKey];
      if (!chapterProgress) return false;
      const coveredCount = getCoveredVerseCount(
        chapterId,
        chapterProgress.versesRead,
        chapterProgress.totalVerses
      );
      return coveredCount >= chapterProgress.totalVerses;
    },
    [progress]
  );

  const isLastVerseInChapter = useCallback((chapterId: number, verseNumber: string) => {
    const totalVerses = CHAPTER_VERSES[chapterId] || 0;
    const verseNumbers = verseNumber.split("-").map(Number);
    const lastVerseNum = Math.max(...verseNumbers);
    return lastVerseNum >= totalVerses;
  }, []);

  const getTotalProgress = useCallback(() => {
    const totalVerses = Object.values(CHAPTER_VERSES).reduce((a, b) => a + b, 0);
    if (totalVerses <= 0) return 0;
    const totalRead = Object.entries(progress).reduce((acc, [chapterKey, chapter]) => {
      const chapterId = Number(chapterKey);
      if (!Number.isFinite(chapterId)) return acc;
      const coveredCount = getCoveredVerseCount(chapterId, chapter.versesRead, chapter.totalVerses);
      return acc + coveredCount;
    }, 0);
    return Math.round((totalRead / totalVerses) * 100);
  }, [progress]);

  const resetChapterProgress = useCallback(
    async (chapterId: number) => {
      const chapterKey = chapterId.toString();
      setProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[chapterKey];
        saveProgress(newProgress);
        return newProgress;
      });
    },
    [saveProgress]
  );

  /** Wipes chapter progress, streak, activity, and last-read — state and storage. */
  const resetAllProgress = useCallback(async () => {
    const emptyStreak = { currentStreak: 0, longestStreak: 0, lastReadDate: null };
    const emptyLastRead = { verseId: null, updatedAt: null };
    progressRef.current = {};
    activityRef.current = {};
    streakRef.current = emptyStreak;
    setProgress({});
    setActivity({});
    setStreak(emptyStreak);
    setLastReadVerseState(emptyLastRead);
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.READING_PROGRESS,
        STORAGE_KEYS.READING_STREAK,
        STORAGE_KEYS.READING_ACTIVITY,
        STORAGE_KEYS.LAST_READ_VERSE,
      ]);
    } catch (error) {
      console.error("Error resetting reading progress:", error);
    }
  }, []);

  const setLastReadVerse = useCallback(
    async (verseId: string) => {
      const payload: LastReadVerse = {
        verseId,
        updatedAt: new Date().toISOString(),
      };
      setLastReadVerseState(payload);
      await saveLastReadVerse(payload);
    },
    [saveLastReadVerse]
  );

  const getVersesReadOnDate = useCallback(
    (dateKey: string) => activity[dateKey] ?? 0,
    [activity]
  );

  const getActivityMap = useCallback(() => activity, [activity]);

  const isDailyGoalComplete = useCallback(
    (dateKey?: string) => {
      const key = dateKey ?? getLocalDateKey();
      return (activity[key] ?? 0) >= DAILY_VERSE_GOAL;
    },
    [activity]
  );

  const isStreakAtRisk = useCallback(() => {
    const today = getLocalDateKey();
    if ((activity[today] ?? 0) > 0) return false;
    if (!streak.lastReadDate || streak.currentStreak <= 0) return false;
    const yesterday = addDaysToDateKey(today, -1);
    if (streak.lastReadDate !== yesterday) return false;
    return new Date().getHours() >= 18;
  }, [activity, streak]);

  const value: ReadingProgressContextValue = {
    progress,
    loading,
    activity,
    markVerseAsRead,
    isVerseRead,
    getChapterProgress,
    isChapterComplete,
    isLastVerseInChapter,
    getTotalProgress,
    resetChapterProgress,
    resetAllProgress,
    CHAPTER_VERSES,
    streak,
    lastReadVerseId: lastReadVerse.verseId,
    setLastReadVerse,
    getVersesReadOnDate,
    getActivityMap,
    isDailyGoalComplete,
    isStreakAtRisk,
  };

  return React.createElement(ReadingProgressContext.Provider, { value }, children);
}

export const useReadingProgress = (): ReadingProgressContextValue => {
  const context = useContext(ReadingProgressContext);
  if (!context) {
    throw new Error("useReadingProgress must be used within a ReadingProgressProvider");
  }
  return context;
};
