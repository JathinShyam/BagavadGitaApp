import type { ContentLanguage } from "@/constants/languages";

export interface WordMeaning {
  word: string;
  meaning: string;
}

/** Localized body for one verse in one language. */
export interface VerseLocaleContent {
  /** Primary verse text (sloka / transliteration / translation script). */
  sloka?: string;
  meaning?: string;
  word_meanings?: WordMeaning[];
  commentary?: string;
}

/**
 * Scripture verse. Language-specific fields live under `content[lang]`.
 * Add new languages by filling another key (e.g. content.en) — IDs stay stable.
 */
export interface Verse {
  id: string;
  chapter: number;
  verse_number: string;
  content: Partial<Record<ContentLanguage, VerseLocaleContent>>;
}

/** Flattened snippet for notifications / widgets (already resolved for a language). */
export interface VerseForNotification {
  id: string;
  chapter: number;
  verse_number: string;
  meaning?: string;
  sloka?: string;
}
