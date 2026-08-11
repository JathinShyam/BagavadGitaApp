/**
 * How to add another scripture language
 * =====================================
 *
 * 1. Codes live in `constants/languages.ts` (`te`, `en`, `hi`, `ta`, …).
 * 2. For each verse in `data/verses/chapters/chapter-NN.ts`, add a sibling
 *    locale under `content`:
 *
 *    content: {
 *      te: { sloka, meaning, word_meanings, commentary },
 *      en: { sloka: "...", meaning: "...", word_meanings: [...], commentary: "..." },
 *    }
 *
 * 3. Chapter titles: `constants/chapter-summaries.ts` → `names.en` / `names.hi` / …
 * 4. Chapter intros: `data/chapters/chapter-descriptions-XX.ts` → wired in
 *    `chapter-details.ts` as `descriptions[lang]` (`getChapterDescription`).
 * 5. User preference is stored as `STORAGE_KEYS.CONTENT_LANGUAGE` and selected
 *    in Settings → Appearance → Content language.
 * 6. UI reads content via `lib/verse-content.ts` (`getVerseSloka`, …) which
 *    falls back to Telugu (then other locales) when a field is missing.
 */
export {};
