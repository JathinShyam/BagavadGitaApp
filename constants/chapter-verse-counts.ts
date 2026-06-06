/** Verse counts per chapter — single source of truth for progress tracking. */
export const CHAPTER_VERSE_COUNTS: Readonly<Record<number, number>> = {
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
} as const;

export const TOTAL_VERSE_COUNT = Object.values(CHAPTER_VERSE_COUNTS).reduce(
  (sum, count) => sum + count,
  0
);
