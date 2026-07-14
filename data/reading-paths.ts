/**
 * Curated multi-day reading paths (local only — no path builder).
 */

export interface PathDay {
  /** Stable id within the path, e.g. "day-1" */
  id: string;
  day: number;
  title: string;
  verseIds: string[];
}

export interface ReadingPath {
  id: string;
  title: string;
  description: string;
  days: PathDay[];
}

export const READING_PATHS: ReadingPath[] = [
  {
    id: "chapter-2-week",
    title: "Chapter 2 in 7 days",
    description: "Walk through Sankhya Yoga — the foundation of wisdom — one step a day.",
    days: [
      { id: "day-1", day: 1, title: "Arjuna’s despair", verseIds: ["2-1", "2-2", "2-3"] },
      { id: "day-2", day: 2, title: "The eternal self", verseIds: ["2-11", "2-12", "2-13"] },
      { id: "day-3", day: 3, title: "Duty without attachment", verseIds: ["2-47", "2-48"] },
      { id: "day-4", day: 4, title: "Steady wisdom", verseIds: ["2-54", "2-55", "2-56"] },
      { id: "day-5", day: 5, title: "Sense control", verseIds: ["2-58", "2-59", "2-62", "2-63"] },
      { id: "day-6", day: 6, title: "Peace of mind", verseIds: ["2-64", "2-65", "2-66"] },
      { id: "day-7", day: 7, title: "The established yogi", verseIds: ["2-70", "2-71", "2-72"] },
    ],
  },
  {
    id: "seeking-peace",
    title: "Seeking peace",
    description: "Seven days of verses for a quieter heart when the mind is restless.",
    days: [
      { id: "day-1", day: 1, title: "Stillness", verseIds: ["2-70"] },
      { id: "day-2", day: 2, title: "Equanimity", verseIds: ["2-56"] },
      { id: "day-3", day: 3, title: "Surrender the fruits", verseIds: ["2-47"] },
      { id: "day-4", day: 4, title: "Inner renunciation", verseIds: ["5-26"] },
      { id: "day-5", day: 5, title: "Devotion’s calm", verseIds: ["12-13-14"] },
      { id: "day-6", day: 6, title: "Trust", verseIds: ["18-66"] },
      { id: "day-7", day: 7, title: "Abiding peace", verseIds: ["6-26", "6-27"] },
    ],
  },
  {
    id: "foundations",
    title: "Foundational verses",
    description: "A gentle intro to the Gita’s most remembered teachings.",
    days: [
      { id: "day-1", day: 1, title: "You are not the body", verseIds: ["2-20"] },
      { id: "day-2", day: 2, title: "Act, don’t cling", verseIds: ["2-47"] },
      { id: "day-3", day: 3, title: "Yoga is skill in action", verseIds: ["2-50"] },
      { id: "day-4", day: 4, title: "See the divine in all", verseIds: ["6-29"] },
      { id: "day-5", day: 5, title: "Offer everything", verseIds: ["9-27"] },
      { id: "day-6", day: 6, title: "Love without hate", verseIds: ["12-13-14"] },
      { id: "day-7", day: 7, title: "Come to Me", verseIds: ["18-65", "18-66"] },
    ],
  },
];

export function getReadingPathById(pathId: string): ReadingPath | undefined {
  return READING_PATHS.find((p) => p.id === pathId);
}

export function getNextIncompleteDay(
  path: ReadingPath,
  completedDayIds: string[]
): PathDay | null {
  return path.days.find((d) => !completedDayIds.includes(d.id)) ?? null;
}

export function isPathComplete(path: ReadingPath, completedDayIds: string[]): boolean {
  return path.days.every((d) => completedDayIds.includes(d.id));
}
