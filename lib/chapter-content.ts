import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  CONTENT_LANGUAGE_FALLBACKS,
  DEFAULT_CONTENT_LANGUAGE,
  isContentLanguage,
  type ContentLanguage,
} from "@/constants/languages";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { CHAPTER_SUMMARIES, getChapterName } from "@/constants/chapter-summaries";
import type { ChapterDetail } from "@/data/chapters/chapter-details";

/** Read persisted content language (for non-React callers: notifications, widgets). */
export async function getStoredContentLanguage(): Promise<ContentLanguage> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.CONTENT_LANGUAGE);
    if (isContentLanguage(saved)) return saved;
  } catch {
    // ignore
  }
  return DEFAULT_CONTENT_LANGUAGE;
}

export function getChapterTitle(
  chapterId: number,
  language: ContentLanguage = DEFAULT_CONTENT_LANGUAGE
): string {
  const summary = CHAPTER_SUMMARIES.find((c) => c.id === chapterId);
  return summary ? getChapterName(summary, language) : `Chapter ${chapterId}`;
}

/**
 * Localized chapter introduction with fallbacks (requested → te/en/hi → description).
 */
export function getChapterDescription(
  chapter: ChapterDetail,
  language: ContentLanguage = DEFAULT_CONTENT_LANGUAGE
): string {
  const fromMap = (code: ContentLanguage) => chapter.descriptions?.[code]?.trim() ?? "";

  const preferred = fromMap(language);
  if (preferred) return preferred;

  for (const code of CONTENT_LANGUAGE_FALLBACKS) {
    if (code === language) continue;
    const candidate = fromMap(code);
    if (candidate) return candidate;
  }

  return chapter.description?.trim() ?? "";
}
