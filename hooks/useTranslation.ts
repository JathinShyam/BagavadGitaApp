import { useMemo } from "react";

import { useContentLanguage } from "@/context/language-context";
import type { ContentLanguage } from "@/constants/languages";
import { createTranslator, type Translator } from "@/lib/i18n";

/**
 * UI translator bound to the reader's content language.
 * `t("home.today")` / `t("common.chapterVerseN", { chapter: 2, verse: 47 })`.
 */
export function useTranslation(): { t: Translator; language: ContentLanguage } {
  const { language } = useContentLanguage();
  const t = useMemo(() => createTranslator(language), [language]);
  return { t, language };
}
