import type { ContentLanguage } from "@/constants/languages";
import type { Verse } from "@/types/verse";
import { getVerseSloka } from "@/lib/verse-content";

/**
 * Plain-text payload for "Copy verse": the sloka followed by its reference.
 * Returns an empty string when the verse has no sloka in that language.
 */
export function buildVerseCopyText(verse: Verse, language?: ContentLanguage): string {
  const sloka = getVerseSloka(verse, language);
  if (!sloka) return "";
  return `${sloka}\n\n— Bhagavad Gita ${verse.chapter}.${verse.verse_number}`;
}
