export interface ReadingProgress {
  [chapterId: string]: {
    versesRead: string[];
    totalVerses: number;
    isComplete: boolean;
    completedAt?: string;
  };
}

export interface ReadingStreak {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string | null;
}

export interface LastReadVerse {
  verseId: string | null;
  updatedAt: string | null;
}
