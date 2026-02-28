import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const READING_PROGRESS_KEY = "readingProgress";
const READING_STREAK_KEY = "readingStreak";
const LAST_READ_VERSE_KEY = "lastReadVerse";

interface ReadingProgress {
  [chapterId: string]: {
    versesRead: string[];
    totalVerses: number;
    isComplete: boolean;
    completedAt?: string;
  };
}

interface ReadingStreak {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string | null;
}

interface LastReadVerse {
  verseId: string | null;
  updatedAt: string | null;
}

const getDateKey = (d: Date) => d.toISOString().slice(0, 10);

export const CHAPTER_VERSES: { [key: number]: number } = {
  1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34,
  10: 42, 11: 55, 12: 20, 13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
};

interface ReadingProgressContextValue {
  progress: ReadingProgress;
  loading: boolean;
  markVerseAsRead: (chapterId: number, verseNumber: string) => Promise<{ isNewCompletion: boolean; totalVerses: number }>;
  isVerseRead: (chapterId: number, verseNumber: string) => boolean;
  getChapterProgress: (chapterId: number) => number;
  isChapterComplete: (chapterId: number) => boolean;
  isLastVerseInChapter: (chapterId: number, verseNumber: string) => boolean;
  getTotalProgress: () => number;
  resetChapterProgress: (chapterId: number) => Promise<void>;
  CHAPTER_VERSES: { [key: number]: number };
  streak: ReadingStreak;
  lastReadVerseId: string | null;
  setLastReadVerse: (verseId: string) => Promise<void>;
}

const ReadingProgressContext = createContext<ReadingProgressContextValue | null>(null);

export function ReadingProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<ReadingProgress>({});
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<ReadingStreak>({
    currentStreak: 0,
    longestStreak: 0,
    lastReadDate: null,
  });
  const [lastReadVerse, setLastReadVerseState] = useState<LastReadVerse>({
    verseId: null,
    updatedAt: null,
  });

  const loadProgress = useCallback(async () => {
    try {
      const [storedProgress, storedStreak, storedLastRead] = await Promise.all([
        AsyncStorage.getItem(READING_PROGRESS_KEY),
        AsyncStorage.getItem(READING_STREAK_KEY),
        AsyncStorage.getItem(LAST_READ_VERSE_KEY),
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
      await AsyncStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(newProgress));
    } catch (error) {
      console.error("Error saving reading progress:", error);
    }
  }, []);

  const saveStreak = useCallback(async (data: ReadingStreak) => {
    try {
      await AsyncStorage.setItem(READING_STREAK_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving reading streak:", error);
    }
  }, []);

  const saveLastReadVerse = useCallback(async (data: LastReadVerse) => {
    try {
      await AsyncStorage.setItem(LAST_READ_VERSE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving last read verse:", error);
    }
  }, []);

  const markVerseAsRead = useCallback(
    async (chapterId: number, verseNumber: string) => {
      const chapterKey = chapterId.toString();
      const verseKey = `${chapterId}-${verseNumber}`;
      const totalVerses = CHAPTER_VERSES[chapterId] || 0;

      let isNewCompletion = false;

      setProgress((prev) => {
        const chapterProgress = prev[chapterKey] || {
          versesRead: [],
          totalVerses,
          isComplete: false,
        };

        if (chapterProgress.versesRead.includes(verseKey)) {
          return prev;
        }

        const newVersesRead = [...chapterProgress.versesRead, verseKey];
        const chapterIsComplete = newVersesRead.length >= totalVerses;

        const newProgress: ReadingProgress = {
          ...prev,
          [chapterKey]: {
            versesRead: newVersesRead,
            totalVerses,
            isComplete: chapterIsComplete,
            completedAt: chapterIsComplete ? new Date().toISOString() : undefined,
          },
        };

        saveProgress(newProgress);
        const wasComplete = chapterProgress.isComplete;
        isNewCompletion = !wasComplete && chapterIsComplete;
        return newProgress;
      });

      const todayKey = getDateKey(new Date());
      setStreak((prev) => {
        if (prev.lastReadDate === todayKey) return prev;

        let currentStreak: number;
        if (!prev.lastReadDate) {
          currentStreak = 1;
        } else {
          const last = new Date(prev.lastReadDate + "T00:00:00Z");
          const today = new Date(todayKey + "T00:00:00Z");
          const diffDays = (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays === 1) {
            currentStreak = prev.currentStreak + 1;
          } else if (diffDays > 1) {
            currentStreak = 1;
          } else {
            currentStreak = prev.currentStreak || 1;
          }
        }

        const longestStreak = Math.max(prev.longestStreak, currentStreak);
        const next: ReadingStreak = { currentStreak, longestStreak, lastReadDate: todayKey };
        saveStreak(next);
        return next;
      });

      return { isNewCompletion, totalVerses };
    },
    [saveProgress, saveStreak]
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
      if (!chapterProgress) return 0;
      return Math.round(
        (chapterProgress.versesRead.length / chapterProgress.totalVerses) * 100
      );
    },
    [progress]
  );

  const isChapterComplete = useCallback(
    (chapterId: number) => {
      const chapterKey = chapterId.toString();
      return progress[chapterKey]?.isComplete || false;
    },
    [progress]
  );

  const isLastVerseInChapter = useCallback(
    (chapterId: number, verseNumber: string) => {
      const totalVerses = CHAPTER_VERSES[chapterId] || 0;
      const verseNumbers = verseNumber.split("-").map(Number);
      const lastVerseNum = Math.max(...verseNumbers);
      return lastVerseNum >= totalVerses;
    },
    []
  );

  const getTotalProgress = useCallback(() => {
    const totalVerses = Object.values(CHAPTER_VERSES).reduce((a, b) => a + b, 0);
    const totalRead = Object.values(progress).reduce(
      (acc, chapter) => acc + chapter.versesRead.length,
      0
    );
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

  const value: ReadingProgressContextValue = {
    progress,
    loading,
    markVerseAsRead,
    isVerseRead,
    getChapterProgress,
    isChapterComplete,
    isLastVerseInChapter,
    getTotalProgress,
    resetChapterProgress,
    CHAPTER_VERSES,
    streak,
    lastReadVerseId: lastReadVerse.verseId,
    setLastReadVerse,
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

export default useReadingProgress;
