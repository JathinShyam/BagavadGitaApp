import {
  CONTENT_LANGUAGE_FALLBACKS,
  DEFAULT_CONTENT_LANGUAGE,
  type ContentLanguage,
} from "@/constants/languages";
import type { Verse, VerseLocaleContent, VerseForNotification } from "@/types/verse";

function isEmptyContent(c: VerseLocaleContent | undefined): boolean {
  if (!c) return true;
  return !(c.sloka || c.meaning || c.commentary || (c.word_meanings && c.word_meanings.length > 0));
}

/**
 * Resolve localized verse fields for a language with fallbacks.
 * Prefer requested lang → configured fallbacks → first non-empty locale on the verse.
 */
export function getVerseLocaleContent(
  verse: Verse,
  language: ContentLanguage = DEFAULT_CONTENT_LANGUAGE
): VerseLocaleContent {
  const preferred = verse.content?.[language];
  if (!isEmptyContent(preferred)) return preferred!;

  for (const code of CONTENT_LANGUAGE_FALLBACKS) {
    if (code === language) continue;
    const candidate = verse.content?.[code];
    if (!isEmptyContent(candidate)) return candidate!;
  }

  const first = Object.values(verse.content ?? {}).find((c) => !isEmptyContent(c));
  return first ?? {};
}

export function getVerseSloka(verse: Verse, language?: ContentLanguage): string {
  return getVerseLocaleContent(verse, language).sloka?.trim() ?? "";
}

export function getVerseMeaning(verse: Verse, language?: ContentLanguage): string {
  return getVerseLocaleContent(verse, language).meaning?.trim() ?? "";
}

export function getVerseCommentary(verse: Verse, language?: ContentLanguage): string {
  return getVerseLocaleContent(verse, language).commentary?.trim() ?? "";
}

export function getVerseWordMeanings(verse: Verse, language?: ContentLanguage) {
  return getVerseLocaleContent(verse, language).word_meanings ?? [];
}

/** Preview line for lists / cards (sloka first, else meaning). */
export function getVersePreview(
  verse: Verse,
  language?: ContentLanguage,
  maxLen = 120
): string {
  const text = getVerseSloka(verse, language) || getVerseMeaning(verse, language);
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLen) return compact;
  return compact.slice(0, maxLen - 1).trimEnd() + "…";
}

export function toNotificationVerse(
  verse: Verse,
  language?: ContentLanguage
): VerseForNotification {
  const locale = getVerseLocaleContent(verse, language);
  return {
    id: verse.id,
    chapter: verse.chapter,
    verse_number: verse.verse_number,
    meaning: locale.meaning,
    sloka: locale.sloka,
  };
}

/** Whether this verse has any non-empty content for a language (no fallback). */
export function verseHasLanguage(verse: Verse, language: ContentLanguage): boolean {
  return !isEmptyContent(verse.content?.[language]);
}
