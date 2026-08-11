/** Streak lengths that unlock a one-time celebration. */
export const STREAK_MILESTONES = [7, 21, 108] as const;

export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

export const DAILY_VERSE_GOAL = 1;
