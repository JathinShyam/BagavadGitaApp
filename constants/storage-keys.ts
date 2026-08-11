/**
 * AsyncStorage keys used across the app.
 */
export const STORAGE_KEYS = {
  AUTO_PLAY_AUDIO: "autoPlayAudio",
  SAVED_VERSES: "savedVerses",
  ONBOARDING: "hasCompletedOnboarding",
  THEME: "theme",
  /** Scripture content language (`te` | `en` | `hi`). */
  CONTENT_LANGUAGE: "contentLanguage",
  READING_PROGRESS: "readingProgress",
  READING_STREAK: "readingStreak",
  LAST_READ_VERSE: "lastReadVerse",
  READING_ACTIVITY: "readingActivity",
  VERSE_NOTES: "verseNotes",
  ACTIVE_PATH: "activeReadingPath",
  WIDGET_NUDGE_DISMISSED: "widgetNudgeDismissedUntil",
  MILESTONES_SEEN: "milestonesSeen",
  SAVED_REVIEW_CURSOR: "savedReviewCursor",
  /** Last notification response id already used for in-app navigation (dedupe cold starts). */
  LAST_HANDLED_NOTIFICATION: "lastHandledNotificationResponseId",
} as const;
