/**
 * Typed route paths for Expo Router navigation.
 * Single source of truth — use these instead of hardcoded path strings.
 */
export const ROUTES = {
  home: "/",
  mainTabs: "/(main)",
  onboarding: "/onboarding",
  explore: "/explore",
  saved: "/saved",
  settings: "/settings",
  exploreCategory: (categoryId: string) => `/explore/${categoryId}` as const,
  chapter: (chapterId: number | string) => `/chapters/${chapterId}` as const,
  verse: (verseId: string) => `/verses/${verseId}` as const,
  verseFromChapter: (chapterId: number | string, verseNumber: string) =>
    `/verses/${chapterId}-${verseNumber}` as const,
  path: (pathId: string) => `/paths/${pathId}` as const,
} as const;

/** Deep-link URIs for native widgets (scheme: bagavadgita). */
export const DEEP_LINKS = {
  mainTabs: "bagavadgita://",
  verse: (verseId: string) => `bagavadgita://verses/${verseId}` as const,
} as const;
