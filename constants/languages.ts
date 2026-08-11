/**
 * Content languages for scripture text (sloka, meaning, commentary)
 * and a few branded labels (e.g. home title). Most UI chrome stays English.
 */
export const CONTENT_LANGUAGE_CODES = ["te", "en", "hi", "ta"] as const;

export type ContentLanguage = (typeof CONTENT_LANGUAGE_CODES)[number];

export type ContentLanguageOption = {
  code: ContentLanguage;
  /** English label for settings list */
  label: string;
  /** Native / endonym shown as subtitle */
  nativeLabel: string;
};

export const CONTENT_LANGUAGES: ContentLanguageOption[] = [
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
];

/** Home brand bar / product name in each content language. */
export const APP_TITLES: Record<ContentLanguage, string> = {
  te: "భగవద్గీత",
  en: "Bhagavad Gita",
  hi: "भगवद्गीता",
  ta: "பகவத் கீதை",
};

/** Default when nothing is stored (existing Telugu corpus). */
export const DEFAULT_CONTENT_LANGUAGE: ContentLanguage = "te";

/** Fallback order when a locale is missing fields. */
export const CONTENT_LANGUAGE_FALLBACKS: ContentLanguage[] = ["te", "en", "hi", "ta"];

export function isContentLanguage(value: string | null | undefined): value is ContentLanguage {
  return !!value && (CONTENT_LANGUAGE_CODES as readonly string[]).includes(value);
}

export function getLanguageOption(code: ContentLanguage): ContentLanguageOption {
  return CONTENT_LANGUAGES.find((l) => l.code === code) ?? CONTENT_LANGUAGES[0];
}

export function getAppTitle(language: ContentLanguage = DEFAULT_CONTENT_LANGUAGE): string {
  return APP_TITLES[language] ?? APP_TITLES[DEFAULT_CONTENT_LANGUAGE];
}
