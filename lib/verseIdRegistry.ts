/**
 * Single source of truth for valid verse route IDs (matches verse data `id` fields).
 * Used to validate Explore category links and catch bad mappings early.
 */

import { ALL_VERSES } from "./dailyVerse";

export const VERSE_ID_SET: ReadonlySet<string> = new Set(
  ALL_VERSES.map((v) => v.id)
);

/** Returns true if `/verse/{id}` will resolve to a verse in the app. */
export function isValidVerseId(id: string): boolean {
  return VERSE_ID_SET.has(id);
}

/** All valid IDs sorted (for tooling / tests). */
export function getAllVerseIds(): string[] {
  return [...VERSE_ID_SET].sort();
}
