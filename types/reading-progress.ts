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

/** Lotus freezes that can cover a missed day (spec §2.6). */
export interface StreakFreezeState {
  /** Freezes in hand, capped at two. */
  balance: number;
  /** Streak length at the last award; resets when a streak ends. */
  awardedAt: number;
  /** YYYY-MM-DD keys a freeze has already covered. */
  protectedDates: Record<string, true>;
}
