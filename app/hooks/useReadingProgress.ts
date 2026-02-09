import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const READING_PROGRESS_KEY = "readingProgress";

interface ReadingProgress {
  [chapterId: string]: {
    versesRead: string[];
    totalVerses: number;
    isComplete: boolean;
    completedAt?: string;
  };
}

// Total verses per chapter
const CHAPTER_VERSES: { [key: number]: number } = {
  1: 47,
  2: 72,
  3: 43,
  4: 42,
  5: 29,
  6: 47,
  7: 30,
  8: 28,
  9: 34,
  10: 42,
  11: 55,
  12: 20,
  13: 35,
  14: 27,
  15: 20,
  16: 24,
  17: 28,
  18: 78,
};

export const useReadingProgress = () => {
  const [progress, setProgress] = useState<ReadingProgress>({});
  const [loading, setLoading] = useState(true);

  // Load progress from storage
  const loadProgress = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(READING_PROGRESS_KEY);
      if (stored) {
        setProgress(JSON.parse(stored));
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

  // Save progress to storage
  const saveProgress = useCallback(async (newProgress: ReadingProgress) => {
    try {
      await AsyncStorage.setItem(
        READING_PROGRESS_KEY,
        JSON.stringify(newProgress)
      );
    } catch (error) {
      console.error("Error saving reading progress:", error);
    }
  }, []);

  // Mark a verse as read
  const markVerseAsRead = useCallback(
    async (chapterId: number, verseNumber: string) => {
      const chapterKey = chapterId.toString();
      const verseKey = `${chapterId}-${verseNumber}`;
      const totalVerses = CHAPTER_VERSES[chapterId] || 0;

      setProgress((prev) => {
        const chapterProgress = prev[chapterKey] || {
          versesRead: [],
          totalVerses,
          isComplete: false,
        };

        // If verse already read, return unchanged
        if (chapterProgress.versesRead.includes(verseKey)) {
          return prev;
        }

        const newVersesRead = [...chapterProgress.versesRead, verseKey];
        const isComplete = newVersesRead.length >= totalVerses;

        const newProgress: ReadingProgress = {
          ...prev,
          [chapterKey]: {
            versesRead: newVersesRead,
            totalVerses,
            isComplete,
            completedAt: isComplete ? new Date().toISOString() : undefined,
          },
        };

        saveProgress(newProgress);
        return newProgress;
      });

      // Check if this completes the chapter
      const chapterProgress = progress[chapterKey];
      const currentVersesRead = chapterProgress?.versesRead || [];
      const isNewCompletion =
        !currentVersesRead.includes(verseKey) &&
        currentVersesRead.length + 1 >= totalVerses &&
        !chapterProgress?.isComplete;

      return { isNewCompletion, totalVerses };
    },
    [progress, saveProgress]
  );

  // Check if a verse has been read
  const isVerseRead = useCallback(
    (chapterId: number, verseNumber: string) => {
      const chapterKey = chapterId.toString();
      const verseKey = `${chapterId}-${verseNumber}`;
      return progress[chapterKey]?.versesRead.includes(verseKey) || false;
    },
    [progress]
  );

  // Get chapter progress percentage
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

  // Check if chapter is complete
  const isChapterComplete = useCallback(
    (chapterId: number) => {
      const chapterKey = chapterId.toString();
      return progress[chapterKey]?.isComplete || false;
    },
    [progress]
  );

  // Check if a verse is the last in the chapter
  const isLastVerseInChapter = useCallback(
    (chapterId: number, verseNumber: string) => {
      const totalVerses = CHAPTER_VERSES[chapterId] || 0;
      // Handle combined verses like "1-2" or single verses
      const verseNumbers = verseNumber.split("-").map(Number);
      const lastVerseNum = Math.max(...verseNumbers);
      return lastVerseNum >= totalVerses;
    },
    []
  );

  // Get total progress across all chapters
  const getTotalProgress = useCallback(() => {
    const totalVerses = Object.values(CHAPTER_VERSES).reduce((a, b) => a + b, 0);
    const totalRead = Object.values(progress).reduce(
      (acc, chapter) => acc + chapter.versesRead.length,
      0
    );
    return Math.round((totalRead / totalVerses) * 100);
  }, [progress]);

  // Reset progress for a chapter
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

  return {
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
  };
};

export default useReadingProgress;
