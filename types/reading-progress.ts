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

/** Map of YYYY-MM-DD → number of verses newly marked read that day. */
export type ReadingActivity = Record<string, number>;

export interface VerseNote {
  text: string;
  updatedAt: string;
}

export type VerseNotes = Record<string, VerseNote>;

export interface ActiveReadingPath {
  pathId: string;
  startedAt: string;
  completedDayIds: string[];
  lastCompletedDate: string | null;
}

export type MilestonesSeen = Partial<Record<"7" | "21" | "108", boolean>>;
